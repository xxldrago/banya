import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code } = body;
  if (!code) return apiError("VALIDATION_ERROR", "code required", 400);

  const cert = await prisma.giftCertificate.findUnique({ where: { code } });
  if (!cert) return apiError("NOT_FOUND", "Certificate not found", 404);
  if (cert.status !== "active") return apiError("INVALID", "Certificate already redeemed or expired", 400);
  if (cert.expiresAt && cert.expiresAt < new Date()) {
    await prisma.giftCertificate.update({ where: { id: cert.id }, data: { status: "expired" } });
    return apiError("EXPIRED", "Certificate expired", 400);
  }

  const updated = await prisma.giftCertificate.update({
    where: { id: cert.id },
    data: { status: "redeemed", redeemedById: user.sub, redeemedAt: new Date() },
  });
  return apiSuccess({ code: updated.code, amount: updated.amount, message: `Сертификат на ${updated.amount} ₽ активирован` });
}
