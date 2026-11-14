"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bookingStatusLabels, label, formatDateTime } from "@/shared/lib/labels";

export default function ClientDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/client/dashboard", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: null })),
      fetch("/api/v1/bookings?limit=20", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([s, b]) => {
        setStats(s.data || null);
        const bs = b.data || [];
        setUpcoming(bs.filter((x: any) => new Date(x.startsAt) >= new Date() && x.status !== "CANCELLED"));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Здравствуйте! 👋</h1>
        <Link href="/catalog">
          <Button>＋ Забронировать баню</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Визитов</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.visits ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Бронирований</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.bookings ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Потрачено</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.spent ?? 0} ₽</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Бонусные баллы</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.points ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ближайшее бронирование</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">Нет предстоящих бронирований</div>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-center justify-between border-b py-2 text-sm">
                  <span>{b.venue?.title}</span>
                  <span>{formatDateTime(b.startsAt)}</span>
                  <span className="text-muted-foreground">{label(bookingStatusLabels, b.status)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Что требует внимания</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>• Проверьте статусы ваших бронирований</div>
          <div>• Оставьте отзыв после завершённого визита</div>
          <div>• Примените активные промокоды</div>
        </CardContent>
      </Card>
    </div>
  );
}
