"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/dashboard", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((data) => setStats(data.data || data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Выручка за месяц</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.revenue ?? "—"} ₽</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Бронирования</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.bookings ?? "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Загрузка</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.occupancy ?? "—"}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Рейтинг</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.rating ?? "—"}</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Ближайшие бронирования</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">
          Список ближайших броней появится после загрузки данных.
        </CardContent>
      </Card>
    </div>
  );
}
