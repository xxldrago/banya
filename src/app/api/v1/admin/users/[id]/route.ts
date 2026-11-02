import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const body = await req.json();
  const { role, isBlocked } = body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(role && { role }),
      ...(isBlocked !== undefined && { isBlocked }),
    },
  });

  return NextResponse.json({ data: updated });
}