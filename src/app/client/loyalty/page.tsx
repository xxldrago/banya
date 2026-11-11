"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClientLoyaltyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/client/loyalty", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((d) => setData(d.data || d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Бонусная программа</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Бонусные баллы</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.points ?? 0}</div><div className="text-xs text-muted-foreground">= {data?.points ?? 0} ₽ на следующую бронь</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Уровень</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.level ?? "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Визитов</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.visits ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Прогресс до следующего уровня</CardTitle></CardHeader>
        <CardContent>
          <div className="h-3 w-full overflow-hidden rounded bg-muted">
            <div className="h-full bg-primary" style={{ width: `${data?.progress ?? 0}%` }} />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">До уровня «Эксперт пара» осталось {Math.max(0, 2000 - (data?.points ?? 0))} баллов</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Пригласить друга</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">За каждого приглашённого друга, который сделает бронь, вы получите 500 баллов.</div>
          <Button>Скопировать ссылку-приглашение</Button>
        </CardContent>
      </Card>
    </div>
  );
}
