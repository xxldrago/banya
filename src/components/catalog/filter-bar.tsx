"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [minGuests, setMinGuests] = useState(searchParams.get("minGuests") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [district, setDistrict] = useState(searchParams.get("district") ?? "");
  const [metroStation, setMetroStation] = useState(searchParams.get("metroStation") ?? "");
  const [objectType, setObjectType] = useState(searchParams.get("objectType") ?? "");
  const [objectTypes, setObjectTypes] = useState<Array<{ slug: string; name: string }>>([]);
  const [amenityIds, setAmenityIds] = useState<Set<string>>(
    new Set(searchParams.getAll("amenityId")),
  );

  useEffect(() => {
    fetch("/api/v1/object-types")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setObjectTypes(d.data ?? []))
      .catch(() => setObjectTypes([]));
  }, []);

  // Sync local state when URL changes
  useEffect(() => {
    setType(searchParams.get("type") ?? "");
    setMinGuests(searchParams.get("minGuests") ?? "");
    setMinPrice(searchParams.get("minPrice") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
    setDistrict(searchParams.get("district") ?? "");
    setMetroStation(searchParams.get("metroStation") ?? "");
    setObjectType(searchParams.get("objectType") ?? "");
    setAmenityIds(new Set(searchParams.getAll("amenityId")));
  }, [searchParams]);

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    // Keep cityId if present
    if (type) params.set("type", type);
    else params.delete("type");
    if (minGuests) params.set("minGuests", minGuests);
    else params.delete("minGuests");
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    if (district) params.set("district", district);
    else params.delete("district");
    if (metroStation) params.set("metroStation", metroStation);
    else params.delete("metroStation");
    if (objectType) params.set("objectType", objectType);
    else params.delete("objectType");
    params.delete("amenityId");
    for (const id of amenityIds) params.append("amenityId", id);
    params.delete("offset"); // reset pagination on filter change
    router.replace(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("type");
    params.delete("minGuests");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("district");
    params.delete("metroStation");
    params.delete("objectType");
    params.delete("amenityId");
    params.delete("offset");
    setType("");
    setMinGuests("");
    setMinPrice("");
    setMaxPrice("");
    setDistrict("");
    setMetroStation("");
    setObjectType("");
    setAmenityIds(new Set());
    router.replace(`${pathname}?${params.toString()}`);
  }

  const hasFilters = useMemo(
    () => type || minGuests || minPrice || maxPrice || district || metroStation || objectType || amenityIds.size > 0,
    [type, minGuests, minPrice, maxPrice, district, metroStation, objectType, amenityIds],
  );

  function toggleAmenity(id: string) {
    setAmenityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Тип</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Все</option>
            <option value="bath">Баня</option>
            <option value="sauna">Сауна</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Тип объекта</label>
          <select
            value={objectType}
            onChange={(e) => setObjectType(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Все</option>
            {objectTypes.map((ot) => (
              <option key={ot.slug} value={ot.slug}>
                {ot.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Гостей от</label>
          <input
            type="number"
            min={1}
            value={minGuests}
            onChange={(e) => setMinGuests(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Любое"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Цена от</label>
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="0"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Цена до</label>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Любая"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Район или адрес</label>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Напр. центр"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Метро</label>
          <input
            type="text"
            value={metroStation}
            onChange={(e) => setMetroStation(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Напр. Арбатская"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={applyFilters}>
          Применить
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("nearMe", "1");
              params.set("userLat", String(pos.coords.latitude));
              params.set("userLng", String(pos.coords.longitude));
              router.replace(`${pathname}?${params.toString()}`);
            });
          }}
        >
          Рядом со мной
        </Button>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Очистить
          </Button>
        )}
      </div>
    </div>
  );
}
