
import crypto from "crypto";
import QRCode from "qrcode";
import { User } from "@prisma/client";
import { redis } from "@/shared/lib/redis";
import { prisma } from "@/lib/prisma";

export interface TOTPConfig {
  issuer: string;
  period: number;
  digits: number;
  algorithm: string;
  window: number;
}

export interface TOTPSetupResult {
  secret: string;
  uri: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TOTPVerificationResult {
  success: boolean;
  remainingAttempts?: number;
  isLocked?: boolean;
  error?: string;
}

export class TOTPService {
  private config: TOTPConfig;

  constructor(config?: Partial<TOTPConfig>) {
    this.config = {
      issuer: config?.issuer || "Banya.Sauna",
      period: config?.period || 30,
      digits: config?.digits || 6,
      algorithm: config?.algorithm || "SHA1",
      window: config?.window || 1,
    };
  }

  async generateSecret(): Promise<string> {
    return crypto.randomBytes(32).toString("hex");
  }

  generateTOTP(secret: string, timestamp?: number): string {
    const time = Math.floor((timestamp || Date.now()) / (this.config.period * 1000));
    const hmac = crypto.createHmac(this.config.algorithm, Buffer.from(secret, "hex"));
    hmac.update(Buffer.from(time.toString()));
    
    const digest = hmac.digest();
    let offset = digest[digest.length - 1] & 0x0f;
    let code = (
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)
    ) % Math.pow(10, this.config.digits);
    
    return code.toString().padStart(this.config.digits, "0");
  }

  async verifyTOTP(
    secret: string,
    token: string,
    userId: string,
    isAdmin: boolean = false
  ): Promise<TOTPVerificationResult> {
    // Check if user is locked out
    const lockKey = `2fa_lock:${userId}`;
    const lockData = await redis.get(lockKey);
    
    if (lockData) {
      const { until, attempts } = JSON.parse(lockData);
      if (new Date() < new Date(until)) {
        return {
          success: false,
          isLocked: true,
          error: `Account temporarily locked. Try again after ${new Date(until).toLocaleString()}.`,
        };
      } else {
        // Lock expired, clear it
        await redis.del(lockKey);
      }
    }

    // Generate token for current time and neighboring windows
    const now = Date.now();
    const tokens = [
      this.generateTOTP(secret, now),
      this.generateTOTP(secret, now - this.config.period * 1000),
      this.generateTOTP(secret, now + this.config.period * 1000),
    ];

    const isValid = tokens.includes(token);
    
    if (isValid) {
      // Successful verification - reset attempts
      await redis.del(`2fa_attempts:${userId}`);
      await redis.del(`2fa_lock:${userId}`);
      return { success: true };
    }

    // Record failed attempt
    const attemptsKey = `2fa_attempts:${userId}`;
    const attemptsData = await redis.get(attemptsKey);
    let attempts = 0;
    let lockUntil = null;

    if (attemptsData) {
      const data = JSON.parse(attemptsData);
      attempts = data.attempts + 1;
      lockUntil = data.lockUntil;
    } else {
      attempts = 1;
    }

    // Lock account after 5 failed attempts
    if (attempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }

    await redis.set(
      attemptsKey,
      JSON.stringify({ attempts, lockUntil }),
      30 * 60 // 30 minutes expiry
    );

    const response: TOTPVerificationResult = {
      success: false,
      error: "Invalid 2FA code",
    };

    if (lockUntil) {
      response.isLocked = true;
      response.error = `Account locked for 15 minutes due to too many failed attempts.`;
    } else {
      response.remainingAttempts = 5 - attempts;
    }

    return response;
  }

  generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(32).toString("hex").substring(0, 8));
    }
    return codes;
  }

  generateSetupURI(secret: string, email: string): string {
    const label = `${this.config.issuer}:${email}`;
    const params = new URLSearchParams({
      secret: secret,
      issuer: this.config.issuer,
      algorithm: this.config.algorithm,
      digits: this.config.digits.toString(),
      period: this.config.period.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  async generateQRCode(uri: string): Promise<string> {
    return await QRCode.toDataURL(uri);
  }

  async setup2FA(userId: string, email: string): Promise<TOTPSetupResult> {
    const secret = await this.generateSecret();
    const uri = this.generateSetupURI(secret, email);
    const qrCodeUrl = await this.generateQRCode(uri);
    const backupCodes = this.generateBackupCodes();

    // Store secret in database
    await this.storeTOTPSecret(userId, secret, backupCodes);

    return {
      secret,
      uri,
      qrCodeUrl,
      backupCodes,
    };
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.backupCodes) {
      return false;
    }

    const codeIndex = user.backupCodes.indexOf(code);
    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    const updatedCodes = [...user.backupCodes];
    updatedCodes.splice(codeIndex, 1);
    await this.updateBackupCodes(userId, updatedCodes);

    return true;
  }

  async storeTOTPSecret(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<void> {
    await this.updateUserField(userId, "twoFASecret", secret);
    await this.updateUserField(userId, "backupCodes", backupCodes);
    await this.updateUserField(userId, "twoFAEnabled", true);
  }

  async activate2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.twoFASecret) {
      return false;
    }

    const isValid = this.generateTOTP(user.twoFASecret) === token;
    if (isValid) {
      await this.updateUserField(userId, "twoFAActivatedAt", new Date());
    }

    return isValid;
  }

  async deactivate2FA(userId: string): Promise<void> {
    await this.updateUserField(userId, "twoFASecret", null);
    await this.updateUserField(userId, "backupCodes", []);
    await this.updateUserField(userId, "twoFAEnabled", false);
    await this.updateUserField(userId, "twoFAActivatedAt", null);
    
    // Clear any 2FA attempts
    await redis.del(`2fa_attempts:${userId}`);
    await redis.del(`2fa_lock:${userId}`);
  }

  private async getUser(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    // backupCodes is stored as a JSON string in the DB; expose as array.
    let backupCodes: unknown = user.backupCodes;
    if (typeof backupCodes === "string") {
      try {
        backupCodes = JSON.parse(backupCodes);
      } catch {
        backupCodes = [];
      }
    }
    return { ...user, backupCodes } as unknown as User;
  }

  private async updateUserField(userId: string, field: string, value: any): Promise<void> {
    const data: Record<string, unknown> = { [field]: value };
    if (field === "backupCodes" && Array.isArray(value)) {
      data[field] = JSON.stringify(value);
    }
    await prisma.user.update({ where: { id: userId }, data });
  }

  private async updateBackupCodes(userId: string, codes: string[]): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { backupCodes: JSON.stringify(codes) } });
  }

  // Static method to create a service instance with default config
  static create(config?: Partial<TOTPConfig>): TOTPService {
    return new TOTPService(config);
  }
}

// Export default instance
export const totpService = new TOTPService({
  issuer: "Banya.Sauna",
  period: 30,
  digits: 6,
  algorithm: "SHA1",
  window: 1,
});
