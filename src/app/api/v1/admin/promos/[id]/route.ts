import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth(req);
  if (!user || !isAllowedAdminRole(user.adminRole, ["superadmin", "marketing"])) return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const body = await req.json();
  const { active } = body;

  const promo = await prisma.promoCode.update({
    where: { code: id },
    data: { active },
  });

  return NextResponse.json({ data: promo });
}