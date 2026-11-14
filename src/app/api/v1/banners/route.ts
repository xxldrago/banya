import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached } from "@/shared/lib/cache";

/**
 * Public banner feed. Only APPROVED + active banners within their display
 * window are returned. The `label` field carries the ad marking («Реклама»).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const position = searchParams.get("position") || "home";
  const now = new Date();

  const banners = await cached(`banners:public:${position}`, 60, async () => {
    const items = await prisma.banner.findMany({
      where: {
        position,
        isActive: true,
        moderationStatus: "APPROVED",
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: "asc" },
      take: 10,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        label: true,
        position: true,
      },
    });
    return items;
  });

  return NextResponse.json({ data: banners });
}
