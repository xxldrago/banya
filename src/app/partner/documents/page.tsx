"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerDocumentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "inn", url: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/partner/documents", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/documents", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({ type: "inn", url: "" }); load(); }
    else { const err = await res.json().catch(() => ({})); alert(err.error?.message || "Ошибка"); }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Документы партнёра</h1>
      <Card>
        <CardHeader><CardTitle>Загрузить документ</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="flex gap-2">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="inn">ИНН</option>
              <option value="ogrn">ОГРН/ОГРНИП</option>
              <option value="passport">Паспорт</option>
              <option value="other">Другое</option>
            </select>
            <Input placeholder="URL документа" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            <Button type="submit">Добавить</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Список</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? <p className="text-muted-foreground">Документов пока нет</p> : items.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div><b>{d.type}</b> <span className="text-muted-foreground">· {d.status}</span></div>
              <a href={d.url} target="_blank" rel="noreferrer" className="text-primary underline">Открыть</a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
