"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/partner/media", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setMedia(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Медиа</h1>
        <Button>Загрузить фото/видео</Button>
      </div>
      {media.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Медиафайлов пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {media.map((m) => (
            <Card key={m.id}>
              <CardContent className="py-3">
                <div className="text-sm font-medium">{m.type}</div>
                <div className="text-xs text-muted-foreground truncate">{m.url}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
