"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/shared/lib/labels";

export default function PartnerFinancePage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/payouts", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setPayouts(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Финансы</h1>
      <Card>
        <CardHeader><CardTitle>История выплат</CardTitle></CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">Выплат пока нет</div>
          ) : (
            <div className="space-y-2">
              {payouts.map((p) => (
                <div key={p.id} className="flex justify-between border-b py-2 text-sm">
                  <span>{new Date(p.createdAt).toLocaleDateString("ru-RU")}</span>
                  <span className="font-medium">{formatMoney(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Button variant="outline">Запросить выплату</Button>
    </div>
  );
}
