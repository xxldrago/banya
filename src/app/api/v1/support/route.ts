import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { autoAssignTicket, slaDueDate } from "@/modules/support/sla.service";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await prisma.supportTicket.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.sub },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: tickets });
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { subject, body: ticketBody, priority } = body;

  const slaHours: Record<string, number> = { urgent: 4, high: 24, medium: 48, low: 72 };
  void slaHours;
  const slaDueAt = slaDueDate(priority);

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

  // Auto-assign to the least-loaded support admin (best-effort).
  await autoAssignTicket(ticket.id);
  const assigned = await prisma.supportTicket.findUnique({
    where: { id: ticket.id },
    include: { assigned: { select: { id: true, email: true } } },
  });

  return NextResponse.json({ data: assigned ?? ticket });
}
