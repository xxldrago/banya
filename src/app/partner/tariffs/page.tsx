"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerTariffsPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/venues", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setVenues(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Тарифы</h1>
      {venues.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Объектов пока нет</CardContent>
        </Card>
      ) : (
        venues.map((v) => (
          <Card key={v.id}>
            <CardHeader><CardTitle className="text-base">{v.title}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Цена от:</span> {v.priceFrom} ₽
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Мин. гостей:</span> {v.minGuests} · <span className="text-muted-foreground">Макс:</span> {v.maxGuests}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Мин. длительность:</span> {v.minDuration} мин
              </div>
              {v.services?.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">Услуги:</div>
                  {v.services.map((s: any) => (
                    <div key={s.id} className="text-sm text-muted-foreground">
                      {s.name} — {s.defaultPrice} ₽
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
