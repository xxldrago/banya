"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/clients", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setClients(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Клиенты</h1>
      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            База клиентов пуста
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3">
                <div className="font-medium">{c.name || c.email}</div>
                <div className="text-sm text-muted-foreground">
                  {c.email} · визитов: {c.visits ?? 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
