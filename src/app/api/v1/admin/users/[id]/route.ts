import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  const _ar = user.adminRole ?? "superadmin";
  if (!["superadmin"].includes(_ar)) return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });

  const body = await req.json();
  const { role, adminRole, status } = body;

  const data: any = {};
  if (role) data.role = role;
  if (adminRole !== undefined) data.adminRole = adminRole;
  if (status) data.status = status;

  const updated = await prisma.user.update({ where: { id }, data });
  return apiSuccess(updated);
}

/** Подробная карточка пользователя: профиль, партнёр, активность. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      adminRole: true,
      status: true,
      createdAt: true,
      profile: true,
      partner: {
        select: {
          id: true,
          companyName: true,
          inn: true,
          status: true,
          _count: { select: { venues: true } },
        },
      },
      _count: {
        select: { bookings: true, reviews: true, supportTickets: true, notifications: true },
      },
    },
  });
  if (!u) return apiError("NOT_FOUND", "Пользователь не найден", 404);

  const [bookings, payments, reviews, tickets, audit] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { venue: { select: { title: true, slug: true } }, payment: { select: { amount: true, status: true } } },
    }),
    prisma.payment.findMany({
      where: { booking: { userId: id } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.review.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { venue: { select: { title: true } } },
    }),
    prisma.supportTicket.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.adminAuditLog.findMany({
      where: { adminId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return apiSuccess({
    user: u,
    bookings,
    payments,
    reviews,
    tickets,
    audit,
  });
}
