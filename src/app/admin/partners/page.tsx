"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { partnerStatusLabels, label } from "@/shared/lib/labels";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/partners", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setPartners(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Партнёры</h1>
      {partners.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Партнёров нет</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {partners.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link href={`/admin/partners/${p.id}`} className="font-medium hover:underline">
                    {p.companyName || p.user?.email}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {p.user?.email} · статус: {label(partnerStatusLabels, p.status)} · объектов: {p.venues?.length ?? 0}
                  </div>
                </div>
                <Link href={`/admin/partners/${p.id}`}>
                  <Button variant="outline" size="sm">Подробнее</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
