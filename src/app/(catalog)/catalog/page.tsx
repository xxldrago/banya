import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { getVenuesByCity } from "@/modules/catalog/catalog.service";
import { FilterBar } from "@/components/catalog/filter-bar";
import { SortDropdown } from "@/components/catalog/sort-dropdown";
import { VenueList } from "@/components/venue-list";
import { VenueMap } from "@/components/catalog/venue-map";
import { ViewToggle } from "@/components/catalog/view-toggle";
import type { VenueCardData } from "@/components/venue-card";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cityId = (params.cityId as string) ?? cookieStore.get("cityId")?.value;

  if (!cityId) {
    redirect("/");
  }

  const type = params.type as string | undefined;
  const minGuests = params.minGuests as string | undefined;
  const minPrice = params.minPrice as string | undefined;
  const maxPrice = params.maxPrice as string | undefined;
  const district = params.district as string | undefined;
  const amenityIdsRaw = params.amenityId;
  const amenityIds = Array.isArray(amenityIdsRaw)
    ? amenityIdsRaw
    : amenityIdsRaw
      ? [amenityIdsRaw]
      : [];
  const sort = (params.sort as string | undefined) ?? "newest";
  const view = (params.view as string | undefined) ?? "list";

  const { venues, total } = await getVenuesByCity(cityId, {
    limit: 50,
    offset: 0,
    type: type as "bath" | "sauna" | undefined,
    minGuests: minGuests ? Number(minGuests) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    amenityIds,
    district,
    sort: sort as "price_asc" | "price_desc" | "newest",
  });

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Объекты</h1>
          <p className="mt-1 text-sm text-muted-foreground">Найдено: {total}</p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <SortDropdown />
          </Suspense>
          <Suspense>
            <ViewToggle current={view} />
          </Suspense>
        </div>
      </div>

      <Suspense>
        <FilterBar />
      </Suspense>

      {view === "map" ? (
        <VenueMap cityId={cityId} />
      ) : (
        <VenueList venues={cards} />
      )}
    </div>
  );
}
