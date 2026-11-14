import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user || !isAllowedAdminRole(user.adminRole, ["superadmin", "marketing"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const campaigns = await prisma.adCampaign.findMany({
    include: { partner: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: campaigns });
}
