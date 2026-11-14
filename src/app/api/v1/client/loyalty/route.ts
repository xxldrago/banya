import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({ where: { userId: user.sub } });
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;
  const points = completed * 100;
  const level = completed >= 20 ? "Эксперт пара" : completed >= 5 ? "Постоянный гость" : "Новичок";

  const referrals = await prisma.user.findMany({ where: { referredById: user.sub } });
  const referralBonus = referrals.length * 500;

  const reviews = await prisma.review.findMany({ where: { userId: user.sub, status: "APPROVED" } });
  const reviewBonus = reviews.length * 50;
  const referralLink = `/register?ref=${user.sub}`;

  return NextResponse.json({
    data: {
      points: points + referralBonus + reviewBonus,
      level,
      visits: completed,
      referrals: referrals.length,
      referralBonus,
      reviewBonus,
      referralLink,
      progress: Math.min(100, Math.round(((points + referralBonus + reviewBonus) / 2000) * 100)),
    },
  });
}
