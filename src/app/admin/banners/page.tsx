"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminBannersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", position: "home", label: "Реклама" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/banners", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/banners", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ title: "", imageUrl: "", linkUrl: "", position: "home", label: "Реклама" }); load(); }
    else { const err = await res.json().catch(() => ({})); alert(err.error?.message || "Ошибка"); }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/admin/banners/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Баннеры</h1>
      <Card>
        <CardHeader><CardTitle>Новый баннер</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Заголовок" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input placeholder="URL картинки" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required />
            <Input placeholder="Ссылка (опц.)" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
            <Input placeholder="Метка (Реклама/Рекомендуем)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
              <option value="home">Главная</option>
              <option value="catalog">Каталог</option>
              <option value="sidebar">Сайдбар</option>
            </select>
            <div className="md:col-span-2"><Button type="submit">Создать</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Список</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <p className="text-muted-foreground">Баннеров пока нет</p> : items.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div><b>{b.title}</b> <span className="text-muted-foreground">· {b.position} · {b.label || "Реклама"}</span></div>
              <Button size="sm" variant="outline" onClick={() => void remove(b.id)}>Удалить</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
