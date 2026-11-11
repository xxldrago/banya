"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerWaitlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/waitlist", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Лист ожидания</h1>
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Лист ожидания пуст
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((w) => (
            <Card key={w.id}>
              <CardContent className="py-3">
                <div className="font-medium">{w.venue?.title}</div>
                <div className="text-sm text-muted-foreground">
                  {w.user?.email} · {new Date(w.desiredDate).toLocaleDateString("ru-RU")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
