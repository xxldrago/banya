
import { createHash } from "crypto";
import { redis } from "@/shared/lib/redis";
import { getSession } from "@/shared/middlewares/get-session";
import { NextRequest } from "next/server";

export interface FraudCheckResult {
  allowed: boolean;
  riskScore: number;
  reasons: string[];
  requiresReview?: boolean;
  action?: "allow" | "deny" | "require_mfa" | "challenge";
}

export interface FraudRule {
  name: string;
  weight: number;
  enabled: boolean;
  check: (context: FraudContext) => Promise<FraudCheckResult>;
}

export interface FraudContext {
  request: NextRequest;
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export class AntiFraudModule {
  private rules: FraudRule[] = [
    // Rate limiting rule
    {
      name: "rate_limit",
      weight: 30,
      enabled: true,
      check: this.checkRateLimit.bind(this),
    },
    // IP blocking rule
    {
      name: "ip_blocking",
      weight: 40,
      enabled: true,
      check: this.checkIPBlocking.bind(this),
    },
    // Bot detection rule
    {
      name: "bot_detection",
      weight: 25,
      enabled: true,
      check: this.checkBotDetection.bind(this),
    },
    // Account age rule
    {
      name: "account_age",
      weight: 15,
      enabled: true,
      check: this.checkAccountAge.bind(this),
    },
    // Payment fraud rule
    {
      name: "payment_fraud",
      weight: 50,
      enabled: true,
      check: this.checkPaymentFraud.bind(this),
    },
    // Geolocation rule
    {
      name: "geolocation",
      weight: 20,
      enabled: true,
      check: this.checkGeolocation.bind(this),
    },
    // Device fingerprint rule
    {
      name: "device_fingerprint",
      weight: 20,
      enabled: true,
      check: this.checkDeviceFingerprint.bind(this),
    },
    // Behavioral analysis rule
    {
      name: "behavioral_analysis",
      weight: 30,
      enabled: true,
      check: this.checkBehavioralAnalysis.bind(this),
    },
  ];

  async checkFraud(
    context: FraudContext,
    customRules?: FraudRule[],
    opts?: { skip?: string[] }
  ): Promise<FraudCheckResult> {
    const skip = new Set(opts?.skip || []);
    const allRules = [...this.rules, ...(customRules || [])].filter(
      (rule) => !skip.has(rule.name),
    );
    const enabledRules = allRules.filter(rule => rule.enabled);

    const results: FraudCheckResult[] = [];
    let weightedScore = 0;
    // Denominator = total weight of ALL enabled rules, so a single risky rule
    // cannot dominate the average (e.g. bot UA alone must not deny a request).
    const totalWeight = enabledRules.reduce((sum, rule) => sum + rule.weight, 0);

    for (const rule of enabledRules) {
      try {
        const result = await rule.check(context);
        results.push(result);

        if (result.action === "deny") {
          return {
            allowed: false,
            riskScore: 100,
            reasons: [result.reasons?.[0] || "Security check failed"],
            action: "deny",
          };
        }

        // Accumulate weighted risk
        if (result.riskScore > 0) {
          weightedScore += result.riskScore * rule.weight;
        }
      } catch (error) {
        console.error(`Fraud check failed for rule ${rule.name}:`, error);
        // Continue with other checks even if one fails
      }
    }

    // Calculate final risk score: weighted average of per-rule risks (0-100 scale)
    const riskScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

    // Determine action based on risk score
    let action: "allow" | "deny" | "require_mfa" | "challenge" = "allow";
    if (riskScore >= 65) {
      action = "deny";
    } else if (riskScore >= 40) {
      action = "require_mfa";
    } else if (riskScore >= 20) {
      action = "challenge";
    }

    const allReasons = results.flatMap(r => r.reasons || []);

    return {
      allowed: action === "allow",
      riskScore,
      reasons: allReasons,
      requiresReview: riskScore >= 40,
      action,
    };
  }

  private async checkRateLimit(context: FraudContext): Promise<FraudCheckResult> {
    const key = `fraud_rate_limit:${context.ip}`;
    const redisKey = await redis.get(key);

    if (!redisKey) {
      // First request
      await redis.set(key, "1", 60); // 1 minute window
      return {
        allowed: true,
        riskScore: 0,
        reasons: [],
      };
    }

    const count = parseInt(redisKey);
    const maxRequests = 100; // 100 requests per minute

    if (count >= maxRequests) {
      await this.logFraudEvent(
        context,
        "RATE_LIMIT_EXCEEDED",
        { ip: context.ip, count }
      );
      return {
        allowed: false,
        riskScore: 80,
        reasons: [
          "Rate limit exceeded",
          `Requests per minute: ${count}/${maxRequests}`,
        ],
        action: "deny",
      };
    }

    await redis.incr(key);
    return {
      allowed: true,
      riskScore: Math.min(count / 20, 30), // Risk increases with request rate
      reasons: count > 50 ? ["High request rate"] : [],
    };
  }

  private async checkIPBlocking(context: FraudContext): Promise<FraudCheckResult> {
    const key = `fraud_blocked_ips`;
    const blockedIPs = await redis.smembers(key);

    if (blockedIPs.includes(context.ip)) {
      await this.logFraudEvent(
        context,
        "IP_BLOCKED",
        { ip: context.ip }
      );
      return {
        allowed: false,
        riskScore: 90,
        reasons: ["IP address is blocked"],
        action: "deny",
      };
    }

    return {
      allowed: true,
      riskScore: 0,
      reasons: [],
    };
  }

  private async checkBotDetection(context: FraudContext): Promise<FraudCheckResult> {
    const userAgent = context.userAgent.toLowerCase();
    const suspiciousPatterns = [
      "bot", "crawler", "spider", "scraper", "automated",
      "curl", "wget", "python-requests", "node-fetch",
    ];

    const isBot = suspiciousPatterns.some(pattern => userAgent.includes(pattern));
    const hasNoSession = !context.userId;

    if (isBot || hasNoSession) {
      await this.logFraudEvent(
        context,
        "SUSPICIOUS_BOT_ACTIVITY",
        { userAgent, hasSession: !!context.userId }
      );
      // Score the risk instead of hard-denying: pre-auth endpoints (login)
      // legitimately have no session, and API clients may use non-browser UAs.
      return {
        allowed: true,
        riskScore: isBot ? 70 : 30,
        reasons: isBot ? ["Bot-like user agent detected"] : [],
      };
    }

    return {
      allowed: true,
      riskScore: 10,
      reasons: [],
    };
  }

  private async checkAccountAge(context: FraudContext): Promise<FraudCheckResult> {
    if (!context.userId) {
      return {
        allowed: true,
        riskScore: 0,
        reasons: [],
      };
    }

    // Get user account creation date
    const user = await this.getUserById(context.userId);
    if (!user || !user.createdAt) {
      return {
        allowed: true,
        riskScore: 0,
        reasons: [],
      };
    }

    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const accountAgeDays = accountAge / (24 * 60 * 60 * 1000);

    if (accountAgeDays < 1) {
      // Account less than 1 day old
      await this.logFraudEvent(
        context,
        "NEW_ACCOUNT_RISK",
        { accountAgeDays }
      );
      return {
        allowed: false,
        riskScore: 60,
        reasons: [
          "New account detected",
          `Account age: ${Math.floor(accountAgeDays)} days`,
        ],
        action: "require_mfa",
      };
    }

    if (accountAgeDays < 7) {
      // Account less than 1 week old
      return {
        allowed: true,
        riskScore: 20,
        reasons: ["New account activity"],
      };
    }

    return {
      allowed: true,
      riskScore: 0,
      reasons: [],
    };
  }

  private async checkPaymentFraud(context: FraudContext): Promise<FraudCheckResult> {
    if (context.action !== "payment" && context.resourceType !== "payment") {
      return {
        allowed: true,
        riskScore: 0,
        reasons: [],
      };
    }

    // Check for high-value transactions
    const metadata = context.metadata || {};
    const amount = metadata.amount || 0;

    if (amount > 100000) {
      // Very high amount (100,000+)
      await this.logFraudEvent(
        context,
        "HIGH_VALUE_TRANSACTION",
        { amount }
      );
      return {
        allowed: false,
        riskScore: 85,
        reasons: [
          "High-value transaction detected",
          `Amount: ${amount.toLocaleString()} RUB`,
        ],
        action: "deny",
      };
    }

    // Check for rapid successive payments
    const rapidPaymentsKey = `fraud_rapid_payments:${context.userId}`;
    const paymentCount = await redis.incr(rapidPaymentsKey);
    
    if (paymentCount > 5) {
      await redis.expire(rapidPaymentsKey, 3600); // 1 hour
      
      if (paymentCount > 10) {
        await this.logFraudEvent(
          context,
          "RAPID_PAYMENTS",
          { paymentCount }
        );
        return {
          allowed: false,
          riskScore: 75,
          reasons: [
            "Multiple rapid payments detected",
            `Payment count: ${paymentCount}`,
          ],
          action: "deny",
        };
      }
    }

    return {
      allowed: true,
      riskScore: amount > 50000 ? 30 : 0, // Risk increases with amount
      reasons: amount > 50000 ? ["High-value payment"] : [],
    };
  }

  private async checkGeolocation(context: FraudContext): Promise<FraudCheckResult> {
    const ip = context.ip;
    
    // Check if IP is in high-risk countries
    const highRiskCountries = await redis.smembers("fraud:high_risk_countries");
    
    // This would typically require a geo-IP lookup service
    // For now, we'll use a placeholder implementation
    const country = await this.getCountryFromIP(ip);
    
    if (country && highRiskCountries.includes(country)) {
      await this.logFraudEvent(
        context,
        "HIGH_RISK_GEOLOCATION",
        { ip, country }
      );
      return {
        allowed: false,
        riskScore: 80,
        reasons: [
          "Request from high-risk country",
          `Country: ${country}`,
        ],
        action: "deny",
      };
    }

    return {
      allowed: true,
      riskScore: 0,
      reasons: [],
    };
  }

  private async checkDeviceFingerprint(context: FraudContext): Promise<FraudCheckResult> {
    if (!context.userId) {
      return {
        allowed: true,
        riskScore: 0,
        reasons: [],
      };
    }

    const fingerprint = this.generateDeviceFingerprint(context);
    const key = `fraud_device_fingerprint:${context.userId}`;
    const storedFingerprint = await redis.get(key);

    if (storedFingerprint && storedFingerprint !== fingerprint) {
      await this.logFraudEvent(
        context,
        "DEVICE_FINGERPRINT_MISMATCH",
        { storedFingerprint, newFingerprint: fingerprint }
      );
      return {
        allowed: false,
        riskScore: 90,
        reasons: [
          "Device fingerprint mismatch",
          "New device detected",
        ],
        action: "deny",
      };
    }

    // Store fingerprint for future comparison
    if (!storedFingerprint) {
      await redis.set(key, fingerprint, 30 * 24 * 60 * 60); // 30 days
    }

    return {
      allowed: true,
      riskScore: 10,
      reasons: [],
    };
  }

  private async checkBehavioralAnalysis(context: FraudContext): Promise<FraudCheckResult> {
    if (!context.userId) {
      return {
        allowed: true,
        riskScore: 0,
        reasons: [],
      };
    }

    // Analyze user behavior patterns
    const patterns = await this.analyzeUserBehavior(context.userId);
    let riskScore = 0;
    const reasons: string[] = [];

    if (patterns.rapidNavigation) {
      riskScore += 20;
      reasons.push("Rapid navigation detected");
    }

    if (patterns.multipleFailedAttempts) {
      riskScore += 25;
      reasons.push("Multiple failed authentication attempts");
    }

    if (patterns.unusualTiming) {
      riskScore += 15;
      reasons.push("Unusual timing pattern");
    }

    if (patterns.unnormalIPTransitions) {
      riskScore += 30;
      reasons.push("Unusual IP transitions");
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    if (riskScore >= 60) {
      await this.logFraudEvent(
        context,
        "SUSPICIOUS_BEHAVIOR",
        patterns
      );
    }

    return {
      allowed: riskScore < 60,
      riskScore,
      reasons,
      action: riskScore >= 80 ? "deny" : riskScore >= 60 ? "challenge" : "allow",
    };
  }

  private async logFraudEvent(
    context: FraudContext,
    eventType: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const fraudEvent = {
      timestamp: new Date(),
      eventType,
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      action: context.action,
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      metadata,
    };

    // Store in Redis for real-time monitoring
    await redis.lpush(
      "fraud:events",
      JSON.stringify(fraudEvent)
    );

    // Keep events for 7 days
    await redis.expire("fraud:events", 7 * 24 * 60 * 60);

    // Log to audit system
    await this.logToAuditSystem(fraudEvent);
  }

  private async logToAuditSystem(event: any): Promise<void> {
    // This would integrate with your audit logging system
    // For now, we'll just log to console
    console.log("[FRAUD]", event);
  }

  private generateDeviceFingerprint(context: FraudContext): string {
    const components = [
      context.ip,
      context.userAgent,
      // Add other device-specific identifiers
    ];
    
    const hash = createHash("sha256");
    components.forEach(comp => hash.update(comp));
    
    return hash.digest("hex");
  }

  private async getUserById(userId: string): Promise<any> {
    // This would be implemented using your database ORM
    // For example with Prisma:
    // return await prisma.user.findUnique({ where: { id: userId } });
    return null;
  }

  private async getCountryFromIP(ip: string): Promise<string> {
    // This would be implemented using a geo-IP lookup service
    // For now, this is a placeholder
    return "RU"; // Default to Russia for testing
  }

  private async analyzeUserBehavior(userId: string): Promise<any> {
    // This would analyze user behavior patterns
    // For now, this is a placeholder implementation
    return {
      rapidNavigation: false,
      multipleFailedAttempts: false,
      unusualTiming: false,
      unnomalIPTransitions: false,
    };
  }

  // Static method to create an instance
  static create(): AntiFraudModule {
    return new AntiFraudModule();
  }
}

// Export default instance
export const antiFraudModule = new AntiFraudModule();