import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { totpService } from "@/modules/2fa/2fa.service";

/** POST /api/v1/auth/2fa/activate — confirm setup with the first TOTP code. */
export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { token } = body as { token?: string };
  if (!token) return apiError("VALIDATION_ERROR", "token required", 400);

  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!dbUser?.twoFASecret) return apiError("INVALID", "Run setup first", 400);

  const result = await totpService.verifyTOTP(dbUser.twoFASecret, token, user.sub, dbUser.role === "ADMIN");
  if (!result.success) {
    return apiError(result.isLocked ? "TOTP_LOCKED" : "TOTP_INVALID", result.error || "Invalid code", 400);
  }

  await prisma.user.update({ where: { id: user.sub }, data: { twoFAActivatedAt: new Date() } });
  return apiSuccess({ success: true });
}
