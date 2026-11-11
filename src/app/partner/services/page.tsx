"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ venueId: "", name: "", defaultPrice: 0 });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/v1/partner/services", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/v1/partner/venues", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([s, v]) => {
        setServices(s.data || []);
        setVenues(v.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await fetch("/api/v1/partner/services", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ venueId: "", name: "", defaultPrice: 0 });
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
        <h1 className="text-2xl font-bold">Услуги</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Отмена" : "Добавить"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Новая услуга</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select className="w-full rounded border px-2 py-1" value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
              <option value="">Выберите объект</option>
              {venues.map((v: any) => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
            <Input placeholder="Название услуги" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input type="number" placeholder="Цена" value={form.defaultPrice} onChange={(e) => setForm({ ...form, defaultPrice: Number(e.target.value) })} />
            <Button onClick={create}>Создать</Button>
          </CardContent>
        </Card>
      )}

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Услуг пока нет</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {services.map((s) => (
            <Card key={s.id}>
              <CardContent className="py-3">
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">
                  {s.venue?.title} · {s.defaultPrice} ₽
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
