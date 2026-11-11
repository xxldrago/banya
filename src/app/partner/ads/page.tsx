"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerAdsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", type: "BANNER", budget: 0, startsAt: "", endsAt: "", imageUrl: "", targetUrl: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/partner/ads", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setCampaigns(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await fetch("/api/v1/partner/ads", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ title: "", type: "BANNER", budget: 0, startsAt: "", endsAt: "", imageUrl: "", targetUrl: "" });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Реклама</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Отмена" : "Создать кампанию"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Новая кампания</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="w-full rounded border px-2 py-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="BANNER">Баннер</option>
              <option value="SEARCH_BOOST">Выше в поиске</option>
            </select>
            <Input type="number" placeholder="Бюджет" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
            <Input type="date" placeholder="Начало" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            <Input type="date" placeholder="Конец" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
            <Input placeholder="URL картинки" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <Input placeholder="Целевой URL" value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} />
            <Button onClick={create}>Создать</Button>
          </CardContent>
        </Card>
      )}

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Кампаний пока нет</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.title}</div>
                  <span className="text-sm text-muted-foreground">{c.status}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {c.type} · бюджет {c.budget} ₽ · потрачено {c.spent} ₽
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
