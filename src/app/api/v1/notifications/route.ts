import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

/** Список уведомлений текущего пользователя (для клиентского кабинета). */
export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.sub },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    data: notifications.map((n) => ({
      id: n.id,
      title: n.subject,
      body: n.body,
      type: n.type,
      channel: n.channel,
      status: n.status,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  });
}
