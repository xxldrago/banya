"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ContentItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: string;
  locale: string;
  updatedAt: string;
};

const EMPTY_FORM = { slug: "", title: "", body: "", status: "draft", locale: "ru" };

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/v1/admin/content", { credentials: "include" });
    const data = res.ok ? await res.json() : { data: [] };
    setItems(data.data || []);
  }

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(
        editingId
          ? `/api/v1/admin/content/${editingId}`
          : "/api/v1/admin/content",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Ошибка сохранения");
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/v1/admin/content/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка удаления");
      await load();
    } catch (err) {
      // noop
    }
  }

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Контент</h1>
      <Card>
        <CardHeader><CardTitle>Новый контент-элемент</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <input
              className="h-10 rounded-md border border-input bg-background px-3"
              placeholder="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <input
              className="h-10 rounded-md border border-input bg-background px-3"
              placeholder="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="min-h-[120px] rounded-md border border-input bg-background px-3 py-2"
              placeholder="body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
            <div className="flex items-end gap-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
              <Button type="submit">{editingId ? "Сохранить" : "Создать"}</Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>
                  Отмена
                </Button>
              ) : null}
            </div>
          </form>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Список</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-muted-foreground">Контент пока пуст.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
                <div>
                  <b>{item.title}</b> <span className="text-muted-foreground">/{item.slug}</span>
                  <div className="text-sm text-muted-foreground">{item.status} · {item.locale}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({ slug: item.slug, title: item.title, body: item.body, status: item.status, locale: item.locale });
                    }}
                  >
                    Изменить
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void remove(item.id)}>
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
