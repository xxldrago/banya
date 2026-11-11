"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerVenueEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/partner/venues/${id}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          setVenue(data.data);
          setForm(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/v1/partner/venues/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setVenue(data.data);
      alert("Сохранено");
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка");
    }
    setSaving(false);
  };

  if (loading) return <div>Загрузка...</div>;
  if (!venue) return <div>Объект не найден</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Редактирование: {venue.title}</h1>
        <Button variant="outline" onClick={() => router.back()}>Назад</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Название" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Адрес" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <textarea className="w-full rounded border px-2 py-1" placeholder="Описание" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <textarea className="w-full rounded border px-2 py-1" placeholder="Правила" value={form.rules || ""} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" placeholder="Макс гостей" value={form.maxGuests || 0} onChange={(e) => setForm({ ...form, maxGuests: Number(e.target.value) })} />
            <Input type="number" placeholder="Цена от" value={form.priceFrom || 0} onChange={(e) => setForm({ ...form, priceFrom: Number(e.target.value) })} />
            <Input type="number" placeholder="Мин. длительность" value={form.minDuration || 0} onChange={(e) => setForm({ ...form, minDuration: Number(e.target.value) })} />
          </div>
          <select className="w-full rounded border px-2 py-1" value={form.status || "DRAFT"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликован</option>
            <option value="HIDDEN">Скрыт</option>
          </select>
          <Button onClick={save} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
