import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const staff = await prisma.staffMember.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: staff });
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { name, email, role } = body;
  if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 });

  const member = await prisma.staffMember.create({
    data: { partnerId: partner.id, name, email, role: role || "manager" },
  });

  return NextResponse.json({ data: member }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const member = await prisma.staffMember.findUnique({ where: { id } });
  if (!member || member.partnerId !== partner.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.staffMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
