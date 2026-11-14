"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminGiftCertificatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "1000", recipientEmail: "", expiresAt: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/gift-certificates", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/gift-certificates", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(form.amount), recipientEmail: form.recipientEmail || undefined, expiresAt: form.expiresAt || undefined }),
    });
    if (res.ok) { setForm({ amount: "1000", recipientEmail: "", expiresAt: "" }); load(); }
    else { const err = await res.json().catch(() => ({})); alert(err.error?.message || "Ошибка"); }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Подарочные сертификаты</h1>
      <Card>
        <CardHeader><CardTitle>Создать сертификат</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-3 md:grid-cols-3">
            <Input type="number" placeholder="Сумма" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Input placeholder="Email получателя (опц.)" value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} />
            <Input type="date" placeholder="Действует до" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            <div className="md:col-span-3"><Button type="submit">Создать</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Список</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <p className="text-muted-foreground">Сертификатов пока нет</p> : items.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div>
                <b>{c.code}</b> — {c.amount} ₽ · {c.status}
                {c.recipientEmail ? <span className="text-muted-foreground"> · {c.recipientEmail}</span> : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
