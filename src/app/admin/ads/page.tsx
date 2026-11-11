"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAdsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/ads", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setCampaigns(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Реклама</h1>
      {campaigns.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Кампаний нет</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.title}</div>
                  <span className="text-sm text-muted-foreground">{c.status}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {c.partner?.companyName} · бюджет {c.budget} ₽ · потрачено {c.spent} ₽
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
