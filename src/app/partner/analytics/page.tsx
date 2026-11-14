"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

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

  const views = data?.views ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Аналитика</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Просмотры</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{views}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Уникальные</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.unique ?? "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Конверсия</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.conversion ?? "—"}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Выручка</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.revenue ?? 0} ₽</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Просмотры за 14 дней (оценка)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={Array.from({ length: 14 }, (_, i) => ({ day: i + 1, views: Math.round((views || 0) / 14 * (0.5 + Math.random())) }))}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#D24E1E" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Популярные дни недели</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data?.dayCounts || []).map((d: any) => ({ name: DAY_NAMES[d.day], count: d.count }))}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#D24E1E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Популярные часы бронирования</CardTitle></CardHeader>
        <CardContent>
          {data?.popularHours?.length ? (
            <div className="flex flex-wrap gap-2">
              {data.popularHours.map((h: any) => (
                <span key={h.hour} className="rounded-full bg-muted px-3 py-1 text-sm">
                  {String(h.hour).padStart(2, "0")}:00 — {h.count} броней
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Данных пока нет</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>По объектам</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(data?.perVenue || []).length === 0 ? (
            <p className="text-muted-foreground">Объектов пока нет</p>
          ) : (
            (data.perVenue || []).map((v: any) => (
              <div key={v.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <b>{v.title}</b>
                  <span className="text-muted-foreground">Качество: {v.qualityScore}/100</span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2 text-muted-foreground md:grid-cols-4">
                  <span>Броней: {v.bookings}</span>
                  <span>Завершено: {v.completed}</span>
                  <span>Выручка: {v.revenue} ₽</span>
                  <span>Рейтинг: {v.rating || "—"}</span>
                  <span>Отзывов: {v.reviews}</span>
                  <span>Фото: {v.photos}</span>
                  <span>Удобства: {v.amenities}</span>
                  <span>Услуги: {v.services}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
