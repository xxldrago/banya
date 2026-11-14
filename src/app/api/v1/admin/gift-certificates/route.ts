import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const items = await prisma.giftCertificate.findMany({ orderBy: { createdAt: "desc" } });
  return apiSuccess(items);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const body = await req.json();
  const { amount, recipientEmail, expiresAt } = body;
  if (!amount) return apiError("VALIDATION_ERROR", "amount required", 400);

  const code = "GIFT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const item = await prisma.giftCertificate.create({
    data: { code, amount, recipientEmail: recipientEmail || null, expiresAt: expiresAt ? new Date(expiresAt) : null, purchaserId: user.sub },
  });
  return apiSuccess(item, undefined, 201);
}
