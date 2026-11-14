"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { label, staffRoleLabels } from "@/shared/lib/labels";

export default function PartnerStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("manager");
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/v1/partner/staff", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setStaff(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/v1/partner/staff", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    if (res.ok) {
      setName(""); setEmail(""); setRole("manager");
      setMsg("Сотрудник добавлен");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error?.message || "Ошибка добавления");
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/v1/partner/staff?id=${id}`, { method: "DELETE", credentials: "include" });
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Сотрудники</h1>

      <Card>
        <CardHeader><CardTitle>Команда ({staff.length})</CardTitle></CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">Сотрудники не добавлены</div>
          ) : (
            <div className="space-y-2">
              {staff.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{s.email} · {label(staffRoleLabels, s.role)}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => remove(s.id)}>Удалить</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Добавить сотрудника</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} required className="w-48" />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-56" />
            <select className="rounded border px-2 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="manager">Менеджер</option>
              <option value="operator">Оператор</option>
              <option value="admin">Администратор</option>
            </select>
            <Button type="submit">Добавить</Button>
            {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
