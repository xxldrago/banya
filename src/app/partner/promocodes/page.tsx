"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerPromoCodesPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discountType: "PERCENTAGE", discountValue: 10, validUntil: "", maxUses: "", maxUsesPerUser: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/partner/promocodes", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setPromos(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await fetch("/api/v1/partner/promocodes", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ code: "", discountType: "PERCENTAGE", discountValue: 10, validUntil: "", maxUses: "", maxUsesPerUser: "" });
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
        <h1 className="text-2xl font-bold">Промокоды</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Отмена" : "Создать"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Новый промокод</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Код" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="rounded border px-2 py-1" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="PERCENTAGE">Процент</option>
                <option value="FIXED">Фиксированная сумма</option>
              </select>
              <Input type="number" placeholder="Значение" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
            </div>
            <Input type="date" placeholder="Действует до" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Лимит использований" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
              <Input type="number" placeholder="Лимит на пользователя" value={form.maxUsesPerUser} onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })} />
            </div>
            <Button onClick={create}>Создать</Button>
          </CardContent>
        </Card>
      )}

      {promos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Промокодов пока нет</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3">
                <div className="font-medium">{p.code}</div>
                <div className="text-sm text-muted-foreground">
                  {p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : `${p.discountValue} ₽`} · до {new Date(p.validUntil).toLocaleDateString("ru-RU")} · {p.active ? "активен" : "выключен"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
