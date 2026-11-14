import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const venueId = searchParams.get("venueId");
  if (!venueId) return apiSuccess([]);
  const items = await prisma.package.findMany({ where: { venueId, isActive: true }, orderBy: { createdAt: "desc" } });
  return apiSuccess(items);
}
