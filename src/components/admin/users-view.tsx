"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_ROLES = ["", "superadmin", "moderator", "support", "finance", "marketing", "content"];

/**
 * Shared users list for /admin/users (all users) and /admin/staff
 * (admins only — staff management with adminRole editing).
 */
export function UsersView({ roleFilter }: { roleFilter?: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (q) params.set("q", q);
    const qs = params.toString();
    const url = qs ? `/api/v1/admin/users?${qs}` : "/api/v1/admin/users";
    fetch(url, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setUsers(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any) => {
    const res = await fetch(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) load();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error?.message || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{roleFilter === "ADMIN" ? "Сотрудники" : "Пользователи"}</h1>
      <Card>
        <CardHeader><CardTitle>Поиск и фильтрация</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Поиск по email или имени..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Button onClick={load}>Найти</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Список пользователей</CardTitle></CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Нет данных</div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div>
                    <div className="font-medium">{user.email}</div>
                    <div className="text-sm text-muted-foreground">{user.role} · {user.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="rounded border px-2 py-1 text-sm" value={user.role} onChange={(e) => update(user.id, { role: e.target.value })}>
                      <option value="CLIENT">CLIENT</option>
                      <option value="PARTNER">PARTNER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    {user.role === "ADMIN" && (
                      <select className="rounded border px-2 py-1 text-sm" value={user.adminRole || ""} onChange={(e) => update(user.id, { adminRole: e.target.value || null })}>
                        {ADMIN_ROLES.map((r) => <option key={r} value={r}>{r || "—"}</option>)}
                      </select>
                    )}
                    <select className="rounded border px-2 py-1 text-sm" value={user.status} onChange={(e) => update(user.id, { status: e.target.value })}>
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
