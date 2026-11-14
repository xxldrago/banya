import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user || !isAllowedAdminRole(user.adminRole, ["superadmin", "moderator", "content"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const photos = await prisma.venuePhoto.findMany({ include: { venue: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  const videos = await prisma.venueVideo.findMany({ include: { venue: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 100 });

  return NextResponse.json({ data: { photos, videos } });
}
