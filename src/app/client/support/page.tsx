"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ticketStatusLabels, priorityLabels, label, formatDate } from "@/shared/lib/labels";

export default function ClientSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", priority: "medium" });

  const load = () => {
    setLoading(true);
    fetch("/api/v1/support", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setTickets(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await fetch("/api/v1/support", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ subject: "", body: "", priority: "medium" });
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
        <h1 className="text-2xl font-bold">Поддержка</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Отмена" : "Создать обращение"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Новое обращение</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Тема" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className="w-full rounded border px-2 py-1" placeholder="Описание" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <select className="w-full rounded border px-2 py-1" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
            <Button onClick={create}>Отправить</Button>
          </CardContent>
        </Card>
      )}

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Обращений нет</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-3">
                <div className="font-medium">{t.subject}</div>
                <div className="text-sm text-muted-foreground">
                  {label(ticketStatusLabels, t.status)} · {label(priorityLabels, t.priority)} · {formatDate(t.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
