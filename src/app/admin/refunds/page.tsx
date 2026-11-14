"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminRefundsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/v1/admin/refunds${qs}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setItems(d.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const process = async (refundId: string, action: "approve" | "reject") => {
    const reason = action === "reject" ? prompt("Причина отказа:") : undefined;
    if (action === "reject" && reason === null) return;
    if (action === "approve" && !confirm(`Подтвердить возврат по заявке ${refundId}?`)) return;
    const res = await fetch("/api/v1/admin/refunds", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refundId, action, reason }),
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Возвраты</h1>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидают</option>
          <option value="completed">Выполнены</option>
          <option value="rejected">Отклонены</option>
        </select>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Возвратов нет</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const booking = r.payment?.booking;
            return (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {(r.amount / 100).toLocaleString("ru-RU")} ₽ · {r.status}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {booking?.venue?.title ?? "—"} · {booking?.user?.email ?? "—"} · бронирование {booking?.id?.slice(0, 8) ?? "—"}
                    </div>
                    {r.reason ? <div className="text-xs text-muted-foreground">Причина: {r.reason}</div> : null}
                    <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("ru-RU")}</div>
                  </div>
                  {r.status === "pending" ? (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" onClick={() => process(r.id, "approve")}>Одобрить</Button>
                      <Button size="sm" variant="outline" onClick={() => process(r.id, "reject")}>Отклонить</Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
