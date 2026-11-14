"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<"templates" | "logs">("templates");
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ subject: "", body: "" });
  const [form, setForm] = useState({ code: "", channel: "email", subject: "", body: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/v1/admin/notifications", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/v1/admin/notifications?view=logs&limit=50", { credentials: "include" }).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([t, l]) => {
        setTemplates(t.data || []);
        setLogs(l.data || []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startEdit = (t: any) => {
    setEditing(t.id);
    setDraft({ subject: t.subject, body: t.body });
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/v1/admin/notifications/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) { setEditing(null); load(); }
  };

  const toggleActive = async (t: any) => {
    await fetch(`/api/v1/admin/notifications/${t.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    load();
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({ code: "", channel: "email", subject: "", body: "" }); load(); }
    else { const err = await res.json().catch(() => ({})); alert(err.error?.message || "Ошибка"); }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Уведомления</h1>
      <div className="flex gap-2">
        <Button variant={tab === "templates" ? "default" : "outline"} size="sm" onClick={() => setTab("templates")}>Шаблоны</Button>
        <Button variant={tab === "logs" ? "default" : "outline"} size="sm" onClick={() => setTab("logs")}>Лог доставки</Button>
      </div>

      {tab === "templates" && (
        <>
          <Card>
            <CardHeader><CardTitle>Новый шаблон</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Код (напр. booking_confirmed)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="telegram">Telegram</option>
                </select>
                <Input placeholder="Тема" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                <Input placeholder="Текст (поддерживает {{переменные}})" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
                <div className="md:col-span-2"><Button type="submit">Создать</Button></div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Шаблоны ({templates.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {templates.length === 0 ? <p className="text-muted-foreground">Шаблонов нет</p> : templates.map((t) => (
                <div key={t.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <b>{t.code}</b> <span className="text-muted-foreground">· {t.channel}</span>
                      {!t.isActive && <span className="ml-2 text-xs text-red-500">выкл</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(t)}>Изменить</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(t)}>{t.isActive ? "Выключить" : "Включить"}</Button>
                    </div>
                  </div>
                  {editing === t.id ? (
                    <div className="mt-2 space-y-2">
                      <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Тема" />
                      <textarea className="min-h-[60px] w-full rounded border px-2 py-1" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(t.id)}>Сохранить</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-muted-foreground">
                      <div>{t.subject}</div>
                      <div className="whitespace-pre-line text-xs">{t.body}</div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {tab === "logs" && (
        <Card>
          <CardHeader><CardTitle>Последние отправки</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {logs.length === 0 ? <p className="text-muted-foreground">Лог пуст</p> : logs.map((l) => (
              <div key={l.id} className="rounded border p-2">
                <div className="flex items-center justify-between">
                  <span><b>{l.type}</b> · {l.channel}</span>
                  <span className={l.status === "sent" ? "text-green-600" : l.status === "failed" ? "text-red-600" : "text-muted-foreground"}>{l.status}</span>
                </div>
                <div className="text-muted-foreground">{l.subject}</div>
                {l.error ? <div className="text-xs text-red-500">{l.error}</div> : null}
                <div className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString("ru-RU")}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
