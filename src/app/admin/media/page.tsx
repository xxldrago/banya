"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminMediaPage() {
  const [media, setMedia] = useState<any>({ photos: [], videos: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/media", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: { photos: [], videos: [] } }))
      .then((data) => setMedia(data.data || { photos: [], videos: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Медиа (модерация)</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Фото ({media.photos?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(media.photos || []).slice(0, 20).map((p: any) => (
              <div key={p.id} className="text-sm">
                <span className="text-muted-foreground">{p.venue?.title}</span> — {p.url}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Видео ({media.videos?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(media.videos || []).slice(0, 20).map((v: any) => (
              <div key={v.id} className="text-sm">
                <span className="text-muted-foreground">{v.venue?.title}</span> — {v.url}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
