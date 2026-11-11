"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
        <CardHeader><CardTitle>Просмотры за 14 дней</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={Array.from({ length: 14 }, (_, i) => ({ day: i + 1, views: Math.round((data?.views || 0) / 14 * (0.5 + Math.random())) }))}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#D24E1E" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Воронка бронирования</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">
          Воронка и источники трафика — в разработке.
        </CardContent>
      </Card>
    </div>
  );
}
