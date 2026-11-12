"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClientLoyaltyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/v1/client/loyalty", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((d) => setData(d.data || d))
      .finally(() => setLoading(false));
  }, []);

  async function copyLink() {
    if (!data?.referralLink) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${data.referralLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

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
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">За каждого приглашённого друга, который сделает бронь, вы получите 500 баллов. Приглашено: {data?.referrals ?? 0}, начислено: {data?.referralBonus ?? 0} баллов.</div>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
              readOnly
              value={data?.referralLink ? `${window.location.origin}${data.referralLink}` : ""}
            />
            <Button onClick={() => void copyLink()}>{copied ? "Скопировано" : "Скопировать ссылку-приглашение"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
