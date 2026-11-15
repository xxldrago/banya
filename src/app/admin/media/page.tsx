"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { videoStatusLabels, label, formatDate } from "@/shared/lib/labels";

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
      <h1 className="text-2xl font-bold">Медиа</h1>

      <Card>
        <CardHeader>
          <CardTitle>Фотографии объектов ({media.photos?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!media.photos || media.photos.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">Фотографий нет</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {media.photos.map((p: any) => (
                <figure key={p.id} className="overflow-hidden rounded-lg border">
                  <div className="aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={`${p.venue?.title || "Объект"}${p.category ? ` — ${p.category}` : ""}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="space-y-1 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {p.venue?.title || "Объект"}
                      </span>
                      {p.isCover && (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Обложка</span>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {p.category ? `${p.category} · ` : ""}
                      {formatDate(p.createdAt)}
                    </div>
                    <div className="truncate text-xs text-muted-foreground" title={p.url}>
                      {p.url}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Видео объектов ({media.videos?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!media.videos || media.videos.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">Видео нет</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {media.videos.map((v: any) => (
                <figure key={v.id} className="overflow-hidden rounded-lg border">
                  <div className="aspect-video bg-black">
                    <video src={v.url} controls preload="metadata" className="h-full w-full object-contain" />
                  </div>
                  <figcaption className="space-y-1 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{v.venue?.title || "Объект"}</span>
                      <span className="text-xs text-muted-foreground">{label(videoStatusLabels, v.status)}</span>
                    </div>
                    <div className="text-muted-foreground">{formatDate(v.createdAt)}</div>
                    <div className="truncate text-xs text-muted-foreground" title={v.url}>
                      {v.url}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Управление медиа объекта доступно в{" "}
        <Link href="/admin/venues" className="hover:underline">карточке объекта</Link>.
      </div>
    </div>
  );
}
