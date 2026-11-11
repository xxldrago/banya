"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/promos", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setPromos(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Промокоды</h1>
      {promos.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Промокодов нет</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3">
                <div className="font-medium">{p.code}</div>
                <div className="text-sm text-muted-foreground">
                  {p.discountType} {p.discountValue} · {p.active ? "активен" : "выключен"} · использований: {p._count?.usages ?? 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
