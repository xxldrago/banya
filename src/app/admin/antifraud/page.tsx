"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAntifraudPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/antifraud", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((d) => setData(d.data || d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Антифрод</h1>

      <Card>
        <CardHeader><CardTitle>Массовые отмены</CardTitle></CardHeader>
        <CardContent>
          {(data?.massCancellations?.length || 0) === 0 ? (
            <p className="text-muted-foreground">Нет подозрительных пользователей</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.massCancellations.map((c: any) => (
                <li key={c.userId}>{c.userId} — {c.count} отмен</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Жалобы на отзывы</CardTitle></CardHeader>
        <CardContent>
          {(data?.complainedReviews?.length || 0) === 0 ? (
            <p className="text-muted-foreground">Жалоб нет</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.complainedReviews.map((r: any) => (
                <li key={r.id}>{r.venue?.title} — {r.complaintReason} ({r.user?.email})</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Дубли объектов</CardTitle></CardHeader>
        <CardContent>
          {(data?.duplicateVenues?.length || 0) === 0 ? (
            <p className="text-muted-foreground">Дублей не найдено</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.duplicateVenues.map((d: any) => (
                <li key={d.title}>{d.title} — {d.count} шт.</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>No-show</CardTitle></CardHeader>
        <CardContent>
          {(data?.noShows?.length || 0) === 0 ? (
            <p className="text-muted-foreground">Нет no-show</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.noShows.map((c: any) => (
                <li key={c.userId}>{c.userId} — {c.count} no-show</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
