"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/venues", { credentials: "include" })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((data) => setVenues(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои объекты</h1>
        <Button>Добавить объект</Button>
      </div>
      {venues.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            У вас пока нет объектов
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {venues.map((venue) => (
            <Card key={venue.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <Link href={`/catalog/${venue.slug}`} className="hover:underline">
                      {venue.title}
                    </Link>
                  </CardTitle>
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    venue.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {venue.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {venue.city?.name} • {venue.address}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Редактировать</Button>
                  <Button variant="outline" size="sm">Календарь</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
