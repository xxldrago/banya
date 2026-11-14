"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSeoPagesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ slug: "", title: "", description: "", content: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/seo-pages", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/seo-pages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ slug: "", title: "", description: "", content: "" }); load(); }
    else { const err = await res.json().catch(() => ({})); alert(err.error?.message || "Ошибка"); }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/admin/seo-pages/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SEO-страницы</h1>
      <Card>
        <CardHeader><CardTitle>Новая SEO-страница</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
            <Input placeholder="slug (напр. moscow)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            <Input placeholder="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <textarea className="min-h-[80px] rounded border px-2 py-1" placeholder="content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <div className="md:col-span-2"><Button type="submit">Создать</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Список</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <p className="text-muted-foreground">Пусто</p> : items.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div><b>{it.title}</b> <span className="text-muted-foreground">/{it.slug}</span></div>
              <Button size="sm" variant="outline" onClick={() => void remove(it.id)}>Удалить</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
