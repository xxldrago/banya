"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { paymentStatusLabels, label, formatMoney } from "@/shared/lib/labels";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all payments via bookings' payments is not direct; use admin stats endpoint fallback
    fetch("/api/v1/admin/stats", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then(() => setLoading(false))
      .finally(() => setLoading(false));
    // Try direct payments list if available
    fetch("/api/v1/payments", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setPayments(data.data || []));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Платежи</h1>
      {payments.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Платежей нет или список недоступен</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.venueTitle || p.bookingId || p.id}</div>
                  <span className="text-sm text-muted-foreground">{label(paymentStatusLabels, p.status)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {p.userEmail ? `${p.userEmail} · ` : ""}{formatMoney(p.amount)} · {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
