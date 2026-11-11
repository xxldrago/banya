"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerAdsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/ads", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setCampaigns(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Реклама</h1>
        <Button>Создать кампанию</Button>
      </div>
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Кампаний пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground">
                  {c.status} · бюджет {c.budget} ₽
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
