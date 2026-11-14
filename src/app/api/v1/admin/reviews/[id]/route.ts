import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";

/** Модерация отзыва: одобрить или отклонить. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: user ? 403 : 401 });
  }
  const ar = user.adminRole ?? "superadmin";
  if (!isAllowedAdminRole(ar, ["moderator", "superadmin"])) {
    return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action; // approve | reject

  const status = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : null;
  if (!status) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const review = await prisma.review.update({
    where: { id },
    data: { status: status as any },
  });
  return NextResponse.json({ data: { id: review.id, status: review.status } });
}
