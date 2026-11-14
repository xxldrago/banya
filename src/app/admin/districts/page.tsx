"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminDistrictsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", cityId: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/v1/admin/districts", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/v1/cities", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([d, c]) => { setItems(d.data || []); setCities(c.data || []); if (c.data?.length && !form.cityId) setForm((f) => ({ ...f, cityId: c.data[0].id })); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/districts", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ ...form, name: "" }); load(); }
    else { const err = await res.json().catch(() => ({})); alert(err.error?.message || "Ошибка"); }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/admin/districts/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Районы</h1>
      <Card>
        <CardHeader><CardTitle>Новый район</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="flex gap-2">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input placeholder="Название района" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Button type="submit">Добавить</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Список</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <p className="text-muted-foreground">Районов пока нет</p> : items.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div><b>{d.name}</b> <span className="text-muted-foreground">· {d.city?.name}</span></div>
              <Button size="sm" variant="outline" onClick={() => void remove(d.id)}>Удалить</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
