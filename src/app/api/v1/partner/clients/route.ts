import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const bookings = await prisma.booking.findMany({
    where: { venue: { partnerId: partner.id } },
    include: { user: { select: { id: true, email: true, phone: true } } },
  });

  const map = new Map<string, { id: string; email: string; phone: string | null; visits: number }>();
  for (const b of bookings) {
    const u = b.user;
    if (!u) continue;
    const existing = map.get(u.id);
    if (existing) existing.visits += 1;
    else map.set(u.id, { id: u.id, email: u.email, phone: u.phone, visits: 1 });
  }

  return NextResponse.json({ data: Array.from(map.values()) });
}
