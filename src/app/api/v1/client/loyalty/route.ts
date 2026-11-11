import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({ where: { userId: user.sub } });
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;
  const points = completed * 100; // 100 points per completed visit
  const level = completed >= 20 ? "Эксперт пара" : completed >= 5 ? "Постоянный гость" : "Новичок";

  return NextResponse.json({
    data: {
      points,
      level,
      visits: completed,
      referrals: 0,
      referralBonus: 0,
      progress: Math.min(100, Math.round((points / 2000) * 100)),
    },
  });
}
