"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRubles } from "@/shared/lib/labels";

type FavoriteItem = {
  id: string;
  venueId: string;
  venue: {
    id: string;
    title: string;
    slug: string;
    address: string;
    priceFrom: number;
    type: string;
    city?: { name: string } | null;
    photos?: { url: string; isCover: boolean }[];
  };
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/v1/favorites", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setFavorites(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (venueId: string) => {
    await fetch("/api/v1/favorites", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId }),
    });
    setFavorites((prev) => prev.filter((f) => f.venueId !== venueId));
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Избранное</h1>
      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            В избранном пока пусто. Добавляйте объекты кнопкой «В избранное» на карточке объекта.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => {
            const cover = f.venue.photos?.find((p) => p.isCover) || f.venue.photos?.[0];
            return (
              <Card key={f.id} className="overflow-hidden">
                <Link href={`/catalog/${f.venue.slug}`}>
                  <div className="h-40 w-full bg-muted">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover.url} alt={f.venue.title} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center text-muted-foreground">Нет фото</div>
                    )}
                  </div>
                </Link>
                <CardContent className="space-y-2 p-4">
                  <Link href={`/catalog/${f.venue.slug}`} className="font-medium hover:underline">
                    {f.venue.title}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {f.venue.city?.name ? `${f.venue.city.name} · ` : ""}{f.venue.address}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">от {formatRubles(f.venue.priceFrom)}</div>
                    <Button variant="outline" size="sm" onClick={() => remove(f.venueId)}>
                      Убрать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
