"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerVerifyPage() {
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        // fetch partner info via payouts endpoint's partner lookup indirectly; use a direct fetch
      })
      .finally(() => setLoading(false));
    // fetch partner status
    fetch("/api/v1/partner/verify", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((data) => setPartner(data.data));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Верификация</h1>
      <Card>
        <CardHeader><CardTitle>Статус верификации</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            Статус: <span className="font-medium">{partner?.status || "pending"}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Компания: {partner?.companyName || "—"} · ИНН: {partner?.inn || "—"}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Документы</CardTitle></CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Загрузка документов — в разработке
        </CardContent>
      </Card>
    </div>
  );
}
