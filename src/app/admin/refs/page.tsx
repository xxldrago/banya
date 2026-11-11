"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminRefsPage() {
  const [data, setData] = useState<any>({ cities: [], amenities: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/refs", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: { cities: [], amenities: [] } }))
      .then((d) => setData(d.data || { cities: [], amenities: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Справочники</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Города ({data.cities?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {(data.cities || []).map((c: any) => (
              <div key={c.id} className="text-sm">{c.name} ({c.slug})</div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Удобства ({data.amenities?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {(data.amenities || []).map((a: any) => (
              <div key={a.id} className="text-sm">{a.name} ({a.slug})</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
