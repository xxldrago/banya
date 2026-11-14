"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerPackagesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ venueId: "", name: "", description: "", price: "", includes: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/v1/partner/packages", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/v1/partner/venues", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([p, v]) => {
        setItems(p.data || []);
        setVenues(v.data || []);
        if (v.data?.length && !form.venueId) setForm((f) => ({ ...f, venueId: v.data[0].id }));
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const includes = form.includes.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/v1/partner/packages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId: form.venueId, name: form.name, description: form.description, price: Number(form.price), includes }),
    });
    if (res.ok) { setForm({ ...form, name: "", description: "", price: "", includes: "" }); setShowForm(false); load(); }
    else { const err = await res.json().catch(() => ({})); alert(err.error?.message || "Ошибка"); }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/partner/packages/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Пакетные предложения</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Отмена" : "Новый пакет"}</Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Новый пакет</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
                {venues.map((v: any) => <option key={v.id} value={v.id}>{v.title}</option>)}
              </select>
              <Input placeholder="Название (напр. День рождения)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input placeholder="Цена" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <Input placeholder="Включает (через запятую)" value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} />
              <textarea className="min-h-[60px] rounded border px-2 py-1 md:col-span-2" placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="md:col-span-2"><Button type="submit">Создать</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Пакетов пока нет</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <b>{p.name}</b> — {p.price} ₽
                  {p.description ? <div className="text-sm text-muted-foreground">{p.description}</div> : null}
                  {Array.isArray(p.includes) && p.includes.length ? <div className="text-xs text-muted-foreground">Включает: {p.includes.join(", ")}</div> : null}
                </div>
                <Button size="sm" variant="outline" onClick={async () => { const r = await fetch(`/api/v1/partner/packages/${p.id}`, { method: "DELETE", credentials: "include" }); if (r.ok) load(); }}>Удалить</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
