"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PackageList({ venueId }: { venueId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/packages?venueId=${venueId}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setItems(d.data || []))
      .finally(() => setLoading(false));
  }, [venueId]);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle className="text-xl">Пакетные предложения</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <b>{p.name}</b>
              <span className="font-semibold">{p.price} ₽</span>
            </div>
            {p.description ? <p className="text-sm text-muted-foreground">{p.description}</p> : null}
            {Array.isArray(p.includes) && p.includes.length ? (
              <p className="text-xs text-muted-foreground">Включает: {p.includes.join(", ")}</p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
