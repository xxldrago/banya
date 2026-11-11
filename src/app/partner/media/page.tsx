"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ venueId: "", type: "photo", url: "", file: null as File | null });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/v1/partner/media", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/v1/partner/venues", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([m, v]) => {
        setMedia(m.data || []);
        setVenues(v.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    let res: Response;
    if (form.file) {
      const fd = new FormData();
      fd.append("venueId", form.venueId);
      fd.append("type", form.type);
      fd.append("file", form.file);
      res = await fetch("/api/v1/partner/media", { method: "POST", credentials: "include", body: fd });
    } else {
      res = await fetch("/api/v1/partner/media", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: form.venueId, type: form.type, url: form.url }),
      });
    }
    if (res.ok) {
      setShowForm(false);
      setForm({ venueId: "", type: "photo", url: "", file: null });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка");
    }
  };

  const remove = async (id: string, type: string) => {
    const res = await fetch(`/api/v1/partner/media?id=${id}&type=${type}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Медиа</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Отмена" : "Добавить"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Новое медиа</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select className="w-full rounded border px-2 py-1" value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
              <option value="">Выберите объект</option>
              {venues.map((v: any) => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
            <select className="w-full rounded border px-2 py-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="photo">Фото</option>
              <option value="video">Видео</option>
            </select>
            <Input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
            <div className="text-xs text-muted-foreground">или URL:</div>
            <Input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <Button onClick={add}>Добавить</Button>
          </CardContent>
        </Card>
      )}

      {media.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Медиафайлов пока нет</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {media.map((m) => (
            <Card key={m.id}>
              <CardContent className="py-3 space-y-2">
                <div className="text-sm font-medium">{m.type === "photo" ? "Фото" : "Видео"}</div>
                {m.type === "photo" && <img src={m.url} alt="" className="h-32 w-full object-cover rounded" />}
                <div className="text-xs text-muted-foreground truncate">{m.url}</div>
                <div className="text-xs text-muted-foreground">{m.venue?.title}</div>
                <Button size="sm" variant="outline" onClick={() => remove(m.id, m.type)}>Удалить</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
