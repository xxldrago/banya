"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { venueStatusLabels, moderationStatusLabels, label, formatRubles } from "@/shared/lib/labels";

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/venues", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setVenues(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const moderate = async (id: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/v1/admin/venues/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setMsg(action === "approve" ? "Объект одобрен и опубликован" : "Объект отклонён и скрыт");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error?.message || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Модерация объектов</h1>
      {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
      <Card>
        <CardHeader>
          <CardTitle>Список объектов ({venues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {venues.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Нет данных</div>
          ) : (
            <div className="space-y-2">
              {venues.map((venue) => (
                <div key={venue.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div>
                    <div className="font-medium">{venue.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {venue.city?.name} • {label(venueStatusLabels, venue.status)} •{" "}
                      {label(moderationStatusLabels, venue.moderationStatus)} • от {formatRubles(venue.priceFrom)}
                      {venue.partnerEmail ? ` • партнёр: ${venue.partnerEmail}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => moderate(venue.id, "approve")}>Одобрить</Button>
                    <Button variant="outline" size="sm" onClick={() => moderate(venue.id, "reject")}>Отклонить</Button>
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
