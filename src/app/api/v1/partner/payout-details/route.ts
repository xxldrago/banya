import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const details = await prisma.partnerPayoutDetails.findUnique({ where: { partnerId: partner.id } });
  return apiSuccess(details);
}

export async function PUT(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { bankName, accountNumber, bik, recipientName } = body;

  const details = await prisma.partnerPayoutDetails.upsert({
    where: { partnerId: partner.id },
    update: { bankName, accountNumber, bik, recipientName },
    create: { partnerId: partner.id, bankName, accountNumber, bik, recipientName },
  });
  return apiSuccess(details);
}
