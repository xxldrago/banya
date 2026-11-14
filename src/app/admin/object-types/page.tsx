"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminObjectTypesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/object-types", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/object-types", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ name: "", slug: "" }); load(); }
    else { const err = await res.json().catch(() => ({})); alert(err.error?.message || "Ошибка"); }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/admin/object-types?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Типы объектов</h1>
      <Card>
        <CardHeader><CardTitle>Новый тип</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="flex gap-2">
            <Input placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="slug (bath, sauna, ...)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            <Button type="submit">Добавить</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Список</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <p className="text-muted-foreground">Типов пока нет</p> : items.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div><b>{t.name}</b> <span className="text-muted-foreground">· {t.slug}</span></div>
              <Button size="sm" variant="outline" onClick={() => void remove(t.id)}>Удалить</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
