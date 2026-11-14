import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  const { id } = await params;
  const pkg = await prisma.package.findUnique({ where: { id }, include: { venue: true } });
  if (!pkg || pkg.venue?.partnerId !== partner.id) return apiError("NOT_FOUND", "Not found", 404);
  await prisma.package.delete({ where: { id } });
  return apiSuccess({ success: true });
}
