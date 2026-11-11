"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerTariffsPage() {
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/tariffs", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setTariffs(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Тарифы</h1>
        <Button>Добавить тариф</Button>
      </div>
      {tariffs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Тарифов пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tariffs.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-3">
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.price} ₽ / {t.duration} мин</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
