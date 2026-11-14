"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerPayoutDetailsPage() {
  const [form, setForm] = useState({ bankName: "", accountNumber: "", bik: "", recipientName: "" });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/partner/payout-details", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((data) => {
        const d = data.data;
        if (d) setForm({ bankName: d.bankName || "", accountNumber: d.accountNumber || "", bik: d.bik || "", recipientName: d.recipientName || "" });
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/partner/payout-details", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMsg(res.ok ? "Сохранено" : "Ошибка");
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Реквизиты для выплат</h1>
      <Card>
        <CardHeader><CardTitle>Банковские реквизиты</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-3">
            <Input placeholder="Название банка" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
            <Input placeholder="Номер счёта" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
            <Input placeholder="БИК" value={form.bik} onChange={(e) => setForm({ ...form, bik: e.target.value })} />
            <Input placeholder="Получатель" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
            <div className="flex items-center gap-3">
              <Button type="submit">Сохранить</Button>
              {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
