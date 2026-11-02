"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/venues", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setVenues(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Модерация объектов</h1>
      <Card>
        <CardHeader>
          <CardTitle>Список объектов</CardTitle>
        </CardHeader>
        <CardContent>
          {venues.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Нет данных</div>
          ) : (
            <div className="space-y-2">
              {venues.map((venue) => (
                <div key={venue.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{venue.title}</div>
                    <div className="text-sm text-muted-foreground">{venue.city?.name} • {venue.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Одобрить</Button>
                    <Button variant="outline" size="sm">Отклонить</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
