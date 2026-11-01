import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getVenuesByCity } from "@/modules/catalog/catalog.service";
import { VenueList } from "@/components/venue-list";
import type { VenueCardData } from "@/components/venue-card";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ cityId?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cityId = params.cityId ?? cookieStore.get("cityId")?.value;

  if (!cityId) {
    redirect("/");
  }

  const { venues } = await getVenuesByCity(cityId, { limit: 50, offset: 0 });

  const cards: VenueCardData[] = venues.map((v) => ({
    id: v.id,
    slug: v.slug,
    title: v.title,
    priceFrom: v.priceFrom,
    maxGuests: v.maxGuests,
    type: v.type,
    coverUrl: v.photos[0]?.url ?? null,
    cityName: v.city?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Объекты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Найдено: {cards.length}
        </p>
      </div>
      <VenueList venues={cards} />
    </div>
  );
}
