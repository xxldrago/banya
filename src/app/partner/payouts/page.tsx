"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: 0, method: "bank", details: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/payouts", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setPayouts(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const request = async () => {
    const res = await fetch("/api/v1/payouts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ amount: 0, method: "bank", details: "" });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Выплаты</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Отмена" : "Запросить выплату"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Запрос выплаты</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input type="number" placeholder="Сумма" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            <select className="w-full rounded border px-2 py-1" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="bank">Банковский перевод</option>
              <option value="card">На карту</option>
            </select>
            <Input placeholder="Реквизиты" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            <Button onClick={request}>Отправить запрос</Button>
          </CardContent>
        </Card>
      )}

      {payouts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Выплат пока нет</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payouts.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.amount} ₽</div>
                  <span className="text-sm text-muted-foreground">{p.status}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString("ru-RU")} · {p.method}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
