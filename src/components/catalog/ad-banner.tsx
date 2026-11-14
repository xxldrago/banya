import { prisma } from "@/lib/prisma";

/**
 * Ad banner strip rendered server-side from approved, active banners.
 * The label field carries the ad marking (default «Реклама») required
 * by the ad-labeling requirement.
 */
export async function AdBanners({ position }: { position: string }) {
  const now = new Date();
  const banners = await prisma.banner.findMany({
    where: {
      position,
      isActive: true,
      moderationStatus: "APPROVED",
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });

  if (banners.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {banners.map((b) => (
        <a
          key={b.id}
          href={b.linkUrl || "#"}
          target={b.linkUrl?.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer nofollow"
          className="relative block overflow-hidden rounded-lg border bg-card"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.imageUrl} alt={b.title} className="h-28 w-full object-cover" />
          <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">
            {b.label || "Реклама"}
          </span>
          <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
            {b.title}
          </span>
        </a>
      ))}
    </div>
  );
}
