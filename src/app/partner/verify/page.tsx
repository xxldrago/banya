"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { label, partnerStatusLabels, documentTypeLabels, documentStatusLabels, formatDate } from "@/shared/lib/labels";

export default function PartnerVerifyPage() {
  const [partner, setPartner] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/verify", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: null }))
      .then((data) => setPartner(data.data));
    fetch("/api/v1/partner/documents", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setDocuments(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Верификация</h1>
      <Card>
        <CardHeader><CardTitle>Статус верификации</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            Статус: <span className="font-medium">{label(partnerStatusLabels, partner?.status || "pending")}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Компания: {partner?.companyName || "—"} · ИНН: {partner?.inn || "—"}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Документы</CardTitle>
          <Link href="/partner/documents">
            <Button variant="outline" size="sm">Управление документами</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              Документы не загружены. Загрузите ИНН, ОГРН и паспорт в разделе «Документы».
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b pb-2 text-sm">
                  <div>
                    {label(documentTypeLabels, d.type)} ·{" "}
                    <span className="text-muted-foreground">{label(documentStatusLabels, d.status)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
