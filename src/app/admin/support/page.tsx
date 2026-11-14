"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/v1/support", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setTickets(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any) => {
    const res = await fetch(`/api/v1/support/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) load();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error?.message || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Поддержка</h1>
      {tickets.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Обращений нет</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-3 space-y-2">
                <div className="font-medium">{t.subject}</div>
                <div className="text-sm text-muted-foreground">{t.body}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <select className="rounded border px-2 py-1 text-sm" value={t.status} onChange={(e) => update(t.id, { status: e.target.value })}>
                    <option value="open">Открыт</option>
                    <option value="in_progress">В работе</option>
                    <option value="resolved">Решён</option>
                    <option value="closed">Закрыт</option>
                  </select>
                  <select className="rounded border px-2 py-1 text-sm" value={t.priority} onChange={(e) => update(t.id, { priority: e.target.value })}>
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочный</option>
                  </select>
                  {t.slaDueAt && (
                    <span className={`text-xs ${new Date(t.slaDueAt) < new Date() ? "text-red-600" : "text-muted-foreground"}`}>
                      SLA: {new Date(t.slaDueAt).toLocaleString("ru-RU")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
