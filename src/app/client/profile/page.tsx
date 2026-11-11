"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"data" | "privacy" | "security" | "city">("data");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", birthDate: "" });

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          setUser(data.data);
          setForm({
            firstName: data.data.firstName || "",
            lastName: data.data.lastName || "",
            phone: data.data.phone || "",
            email: data.data.email || "",
            birthDate: data.data.birthDate || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const res = await fetch("/api/v1/client/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data) setUser(data.data);
      alert("Сохранено");
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Профиль и настройки</h1>
        <Button onClick={save}>Сохранить изменения</Button>
      </div>

      <div className="flex gap-2 border-b">
        {(["data", "privacy", "security", "city"] as const).map((t) => (
          <button
            key={t}
            className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
            onClick={() => setTab(t)}
          >
            {t === "data" ? "Личные данные" : t === "privacy" ? "Приватность" : t === "security" ? "Безопасность" : "Город"}
          </button>
        ))}
      </div>

      {tab === "data" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Личные данные</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Имя" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <Input placeholder="Фамилия" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <Input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input type="date" placeholder="Дата рождения" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Удаление аккаунта</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Удаление аккаунта необратимо. История бронирований и платежей сохраняется.
              </div>
              <Button variant="outline" className="mt-3 text-red-600">Запросить удаление аккаунта</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "privacy" && (
        <Card>
          <CardHeader><CardTitle>Настройки приватности</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Показывать моё имя в отзывах", "Разрешить владельцу видеть телефон после брони", "Персональные подборки", "Маркетинговые рассылки"].map((label) => (
              <label key={label} className="flex items-center justify-between rounded border p-3">
                <span className="text-sm">{label}</span>
                <input type="checkbox" defaultChecked />
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "security" && (
        <Card>
          <CardHeader><CardTitle>Безопасность</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded border p-3">
              <span className="text-sm">Двухфакторная аутентификация</span>
              <Button variant="outline" size="sm">Включить 2FA</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Сменить пароль</Button>
              <Button variant="outline" size="sm">Активные сессии</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "city" && (
        <Card>
          <CardHeader><CardTitle>Город и предпочтения</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm">Город по умолчанию</label>
              <select className="w-full rounded border px-2 py-1">
                <option>Москва</option>
                <option>Санкт-Петербург</option>
                <option>Казань</option>
                <option>Сочи</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Обычное количество гостей</label>
              <select className="w-full rounded border px-2 py-1">
                <option>2</option><option>4</option><option>6</option><option>10</option><option>12+</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Комфортная цена, ₽/час</label>
              <select className="w-full rounded border px-2 py-1">
                <option>до 2 000</option><option>до 4 000</option><option>до 6 000</option><option>любая</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
