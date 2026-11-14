"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCollectionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ slug: "", title: "", description: "", itemIds: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/collections", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = form.itemIds.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/v1/admin/collections", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: form.slug, title: form.title, description: form.description, itemIds: ids }) });
    if (res.ok) { setForm({ slug: "", title: "", description: "", itemIds: "" }); load(); }
    else { const err = await res.json().catch(() => ({})); alert(err.error?.message || "Ошибка"); }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/admin/collections/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Подборки</h1>
      <Card>
        <CardHeader><CardTitle>Новая подборка</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
            <Input placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            <Input placeholder="Заголовок" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="ID объектов через запятую" value={form.itemIds} onChange={(e) => setForm({ ...form, itemIds: e.target.value })} />
            <div className="md:col-span-2"><Button type="submit">Создать</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Список</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <p className="text-muted-foreground">Подборок пока нет</p> : items.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div><b>{c.title}</b> <span className="text-muted-foreground">/{c.slug}</span></div>
              <Button size="sm" variant="outline" onClick={() => void remove(c.id)}>Удалить</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
