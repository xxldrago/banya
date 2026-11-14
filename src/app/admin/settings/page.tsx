"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ key: "", value: "", description: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/settings", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ key: "", value: "", description: "" });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error?.message || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Настройки платформы</h1>
      <Card>
        <CardHeader><CardTitle>Добавить/изменить параметр</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Ключ (например min_booking_duration)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required />
            <Input placeholder="Значение" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            <Input placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="md:col-span-3">
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Список параметров</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="text-muted-foreground">Параметров пока нет.</p>
          ) : (
            items.map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded border p-3 text-sm">
                <div>
                  <b>{s.key}</b> = {s.value}
                  {s.description ? <div className="text-muted-foreground">{s.description}</div> : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
