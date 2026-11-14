"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRubles } from "@/shared/lib/labels";

export default function PartnerCertificatesPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/certificates", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setCerts(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Сертификаты</h1>
        <Button>Выпустить сертификат</Button>
      </div>
      {certs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Сертификатов пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {certs.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3">
                <div className="font-medium">{c.code}</div>
                <div className="text-sm text-muted-foreground">
                  {formatRubles(c.amount)} · до {new Date(c.expiresAt).toLocaleDateString("ru-RU")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
