import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { totpService } from "@/modules/2fa/2fa.service";

/** GET /api/v1/auth/2fa — current 2FA status for the logged-in user. */
export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { twoFAEnabled: true, twoFAActivatedAt: true },
  });
  return apiSuccess({
    enabled: dbUser?.twoFAEnabled ?? false,
    activated: Boolean(dbUser?.twoFAActivatedAt),
  });
}

/** POST /api/v1/auth/2fa — start setup: returns secret + QR + backup codes. */
export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!dbUser) return apiError("NOT_FOUND", "User not found", 404);

  const setup = await totpService.setup2FA(user.sub, dbUser.email);
  return apiSuccess(setup, undefined, 201);
}

/** DELETE /api/v1/auth/2fa — deactivate 2FA for the logged-in user. */
export async function DELETE(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await totpService.deactivate2FA(user.sub);
  return apiSuccess({ success: true });
}
