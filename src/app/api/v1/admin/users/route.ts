import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  const _ar = user.adminRole ?? "superadmin";
  if (!["superadmin"].includes(_ar)) return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const role = searchParams.get("role");
  const status = searchParams.get("status");

  const where: any = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { profile: { firstName: { contains: q, mode: "insensitive" } } },
      { profile: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      role: true,
      adminRole: true,
      status: true,
      createdAt: true,
      profile: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess(users.map((u) => ({
    ...u,
    firstName: u.profile?.firstName ?? null,
    lastName: u.profile?.lastName ?? null,
    profile: undefined,
  })));
}
