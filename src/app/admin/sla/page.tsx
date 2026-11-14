"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSlaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/sla", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((d) => setData(d.data || d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  const renderList = (title: string, items: any[]) => (
    <Card>
      <CardHeader><CardTitle>{title} ({items?.length || 0})</CardTitle></CardHeader>
      <CardContent>
        {(items?.length || 0) === 0 ? (
          <p className="text-muted-foreground">Нет тикетов</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((t: any) => (
              <li key={t.id} className="rounded border p-2">
                <b>{t.subject}</b> · {t.priority} · SLA: {t.slaDueAt ? new Date(t.slaDueAt).toLocaleString("ru-RU") : "—"}
                <div className="text-muted-foreground">{t.body?.slice(0, 80)}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SLA поддержки</h1>
      {renderList("Просроченные", data?.overdue || [])}
      {renderList("Скоро (24ч)", data?.dueSoon || [])}
    </div>
  );
}
