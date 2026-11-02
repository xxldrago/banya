"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

type VenueCoordinate = {
  id: string;
  title: string;
  slug: string;
  lat: number;
  lng: number;
  priceFrom: number;
  type: string;
};

const MapInner = dynamic(
  () => import("./venue-map-inner").then((mod) => ({ default: mod.VenueMapInner })),
  { ssr: false },
);

export function VenueMap({ cityId }: { cityId: string }) {
  const [venues, setVenues] = useState<VenueCoordinate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/v1/catalog/venues/map?cityId=${encodeURIComponent(cityId)}`)
      .then((res) => res.json())
      .then((body) => {
        if (body.error) {
          setError(body.error.message);
          setVenues([]);
        } else {
          setVenues(body.data ?? []);
        }
      })
      .catch(() => setError("Не удалось загрузить карту"))
      .finally(() => setLoading(false));
  }, [cityId]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        Загрузка карты…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border bg-muted/40 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (venues.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        Нет объектов на карте
      </div>
    );
  }

  return <MapInner venues={venues} />;
}
