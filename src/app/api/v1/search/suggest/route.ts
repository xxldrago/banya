import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return apiSuccess({ cities: [], venues: [], districts: [] });
  }

  const [cities, venues, districts] = await Promise.all([
    prisma.city.findMany({
      where: { isActive: true, name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 5,
    }),
    prisma.venue.findMany({
      where: {
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
        title: { contains: q, mode: "insensitive" },
      },
      select: { id: true, title: true, slug: true, city: { select: { name: true } } },
      take: 8,
    }),
    prisma.venue.findMany({
      where: {
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
        district: { contains: q, mode: "insensitive" },
      },
      select: { district: true },
      distinct: ["district"],
      take: 5,
    }),
  ]);

  return apiSuccess({
    cities,
    venues,
    districts: districts.map((d) => d.district).filter(Boolean),
  });
}
