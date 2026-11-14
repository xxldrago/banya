import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/shared/lib/api-response";
import { cached } from "@/shared/lib/cache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId");
  const districts = await cached(`ref:districts:${cityId || "all"}`, 300, () =>
    prisma.district.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: { name: "asc" },
      include: { city: { select: { name: true } } },
    }),
  );
  return apiSuccess(districts);
}
