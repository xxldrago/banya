import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";

/** Модерация объекта: одобрить (публикация) или отклонить. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: user ? 403 : 401 });
  }
  const ar = user.adminRole ?? "superadmin";
  if (!isAllowedAdminRole(ar, ["moderator", "content", "superadmin"])) {
    return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action; // approve | reject

  if (action === "approve") {
    const venue = await prisma.venue.update({
      where: { id },
      data: { moderationStatus: "APPROVED", status: "PUBLISHED", publishedAt: new Date() },
    });
    return NextResponse.json({ data: { id: venue.id, moderationStatus: venue.moderationStatus, status: venue.status } });
  }
  if (action === "reject") {
    const venue = await prisma.venue.update({
      where: { id },
      data: { moderationStatus: "REJECTED", status: "HIDDEN" },
    });
    return NextResponse.json({ data: { id: venue.id, moderationStatus: venue.moderationStatus, status: venue.status } });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
