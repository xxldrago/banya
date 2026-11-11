"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cityId: "", title: "", description: "", address: "", type: "bath", maxGuests: 10, priceFrom: 0 });
  const [cities, setCities] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    fetch("/api/v1/partner/venues", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setVenues(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/v1/cities", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setCities(data.data || data || []));
  }, []);

  const create = async () => {
    const res = await fetch("/api/v1/partner/venues", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ cityId: "", title: "", description: "", address: "", type: "bath", maxGuests: 10, priceFrom: 0 });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка создания");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои объекты</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Отмена" : "Добавить объект"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Новый объект</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm">Город</label>
              <select
                className="w-full rounded border px-2 py-1"
                value={form.cityId}
                onChange={(e) => setForm({ ...form, cityId: e.target.value })}
              >
                <option value="">Выберите город</option>
                {cities.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <input
              className="w-full rounded border px-2 py-1"
              placeholder="Название"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="w-full rounded border px-2 py-1"
              placeholder="Адрес"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <textarea
              className="w-full rounded border px-2 py-1"
              placeholder="Описание"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                className="rounded border px-2 py-1"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="bath">Баня</option>
                <option value="sauna">Сауна</option>
              </select>
              <input
                type="number"
                className="rounded border px-2 py-1"
                placeholder="Макс гостей"
                value={form.maxGuests}
                onChange={(e) => setForm({ ...form, maxGuests: Number(e.target.value) })}
              />
              <input
                type="number"
                className="rounded border px-2 py-1"
                placeholder="Цена от"
                value={form.priceFrom}
                onChange={(e) => setForm({ ...form, priceFrom: Number(e.target.value) })}
              />
            </div>
            <Button onClick={create}>Создать</Button>
          </CardContent>
        </Card>
      )}

      {venues.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Объектов пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {venues.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{v.title}</CardTitle>
                  <span className="text-sm text-muted-foreground">{v.status} · {v.moderationStatus}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Город:</span> {v.city?.name}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Адрес:</span> {v.address}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Цена от:</span> {v.priceFrom} ₽
                </div>
                <div className="flex gap-2">
                  <Link href={`/catalog/${v.slug}`}>
                    <Button variant="outline" size="sm">Просмотр</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
