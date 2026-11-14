import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await prisma.supportTicket.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.sub },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: tickets });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { subject, body: ticketBody, priority } = body;

  const slaHours: Record<string, number> = { urgent: 4, high: 24, medium: 48, low: 72 };
  const slaDueAt = new Date(Date.now() + (slaHours[priority || "medium"] || 48) * 3600000);

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.sub,
      subject,
      body: ticketBody,
      priority: priority || "medium",
      status: "open",
      slaDueAt,
    },
  });

  return NextResponse.json({ data: ticket });
}
