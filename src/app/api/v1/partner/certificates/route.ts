import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const certs = await prisma.certificate.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: certs });
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { amount, expiresAt } = body;
  if (!amount || !expiresAt) return NextResponse.json({ error: "amount and expiresAt required" }, { status: 400 });

  const code = "CERT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const cert = await prisma.certificate.create({
    data: { partnerId: partner.id, code, amount, expiresAt: new Date(expiresAt) },
  });

  return NextResponse.json({ data: cert }, { status: 201 });
}
