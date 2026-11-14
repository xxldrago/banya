import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";

/** Список всех платежей платформы (админ). */
export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: user ? 403 : 401 });
  }
  const ar = user.adminRole ?? "superadmin";
  if (!isAllowedAdminRole(ar, ["finance", "support", "superadmin"])) {
    return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });
  }

  const payments = await prisma.payment.findMany({
    include: {
      booking: {
        include: {
          venue: { select: { title: true } },
          user: { select: { email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    data: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      provider: p.provider,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
      venueTitle: p.booking?.venue?.title ?? null,
      userEmail: p.booking?.user?.email ?? null,
      bookingId: p.bookingId,
    })),
  });
}
