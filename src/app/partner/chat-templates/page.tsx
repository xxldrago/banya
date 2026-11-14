"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerChatTemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", body: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/partner/chat-templates", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/chat-templates", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", body: "" });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error?.message || err.error || "Ошибка");
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/partner/chat-templates/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Шаблоны быстрых ответов</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Отмена" : "Новый шаблон"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Новый шаблон</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <Input placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <textarea className="w-full rounded border px-2 py-1" rows={4} placeholder="Текст сообщения" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
              <Button type="submit">Создать</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Шаблонов пока нет</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <b>{t.name}</b>
                  <div className="text-sm text-muted-foreground">{t.body}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => void remove(t.id)}>Удалить</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
