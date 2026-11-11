"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/analytics", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((d) => setData(d.data || d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Аналитика</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Просмотры</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.views ?? "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Уникальные</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.unique ?? "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Конверсия</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.conversion ?? "—"}%</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Воронка бронирования</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">
          Воронка и источники трафика — в разработке.
        </CardContent>
      </Card>
    </div>
  );
}
