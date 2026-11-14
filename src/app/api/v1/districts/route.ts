import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId");
  const districts = await prisma.district.findMany({
    where: cityId ? { cityId } : undefined,
    orderBy: { name: "asc" },
    include: { city: { select: { name: true } } },
  });
  return apiSuccess(districts);
}
