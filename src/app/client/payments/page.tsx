"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/client/payments", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setPayments(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Платежи</h1>
      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Платежей пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.booking?.venue?.title}</div>
                  <span className="text-sm text-muted-foreground">{p.status}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {p.amount} ₽ · {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
