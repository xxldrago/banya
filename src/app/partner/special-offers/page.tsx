"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerSpecialOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    venueId: "",
    name: "",
    discountType: "percent",
    discountValue: "10",
    validFrom: "",
    validTo: "",
    daysOfWeek: "",
    timeFrom: "",
    timeTo: "",
    minHours: "1",
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/v1/partner/special-offers", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/v1/partner/venues", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([o, v]) => {
        setOffers(o.data || []);
        setVenues(v.data || []);
        if (v.data?.length && !form.venueId) setForm((f) => ({ ...f, venueId: v.data[0].id }));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/special-offers", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: form.venueId,
        name: form.name,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
        daysOfWeek: form.daysOfWeek || undefined,
        timeFrom: form.timeFrom || undefined,
        timeTo: form.timeTo || undefined,
        minHours: Number(form.minHours) || 1,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ ...form, name: "" });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error?.message || err.error || "Ошибка");
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/partner/special-offers/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Специальные предложения</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Отмена" : "Новое предложение"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Новое предложение</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })} required>
                {venues.map((v: any) => <option key={v.id} value={v.id}>{v.title}</option>)}
              </select>
              <Input placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="percent">Процент</option>
                <option value="fixed">Фиксированная сумма</option>
              </select>
              <Input type="number" placeholder="Значение" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required />
              <Input type="date" placeholder="Действует с" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              <Input type="date" placeholder="Действует до" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
              <Input placeholder="Дни недели (0-6 через запятую)" value={form.daysOfWeek} onChange={(e) => setForm({ ...form, daysOfWeek: e.target.value })} />
              <Input placeholder="Время с (HH:MM)" value={form.timeFrom} onChange={(e) => setForm({ ...form, timeFrom: e.target.value })} />
              <Input placeholder="Время по (HH:MM)" value={form.timeTo} onChange={(e) => setForm({ ...form, timeTo: e.target.value })} />
              <Input type="number" placeholder="Мин. часов" value={form.minHours} onChange={(e) => setForm({ ...form, minHours: e.target.value })} />
              <div className="md:col-span-2">
                <Button type="submit">Создать</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {offers.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Предложений пока нет</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <b>{o.name}</b> — {o.discountType === "percent" ? `${o.discountValue}%` : `${o.discountValue} ₽`} · {o.venue?.title}
                  <div className="text-xs text-muted-foreground">
                    {o.validFrom ? new Date(o.validFrom).toLocaleDateString("ru-RU") : "—"} — {o.validTo ? new Date(o.validTo).toLocaleDateString("ru-RU") : "бессрочно"}
                    {o.daysOfWeek ? ` · дни: ${o.daysOfWeek}` : ""}
                    {o.timeFrom ? ` · ${o.timeFrom}–${o.timeTo}` : ""}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => void remove(o.id)}>Удалить</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
