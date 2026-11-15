"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  venueStatusLabels,
  moderationStatusLabels,
  videoStatusLabels,
  bookingStatusLabels,
  reviewStatusLabels,
  label,
  formatDate,
  formatDateTime,
  formatRubles,
} from "@/shared/lib/labels";

export default function AdminVenueDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/v1/admin/venues/${id}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json?.data ?? null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const moderate = async (action: "approve" | "reject") => {
    setBusy(true);
    try {
      await fetch(`/api/v1/admin/venues/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!data) return <div>Объект не найден</div>;

  const v = data.venue;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{v.title}</h1>
          <div className="text-sm text-muted-foreground">
            {v.city?.name || "—"} · {v.address} ·{" "}
            {label(venueStatusLabels, v.status)} · {label(moderationStatusLabels, v.moderationStatus)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {v.status === "PUBLISHED" && (
            <Link href={`/catalog/${v.slug}`}>
              <Button variant="outline">Открыть на сайте</Button>
            </Link>
          )}
          <Link href="/admin/venues">
            <Button variant="outline">← К списку</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => moderate("approve")}>
          Одобрить
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => moderate("reject")}>
          Отклонить
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Цена от</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatRubles(v.priceFrom)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Бронирований</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{v._count?.bookings ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Отзывов</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{v._count?.reviews ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">В избранном</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{v._count?.favorites ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Информация об объекте</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <div>Тип: <span className="font-medium">{v.type === "sauna" ? "Сауна" : v.type === "bath" ? "Баня" : v.type}</span></div>
          <div>Вместимость: <span className="font-medium">{v.minGuests}–{v.maxGuests} чел.</span></div>
          <div>Минимальная длительность: <span className="font-medium">{v.minDuration} мин</span></div>
          <div>Партнёр:{" "}
            {v.partner ? (
              <Link href={`/admin/partners/${v.partner.id}`} className="font-medium hover:underline">
                {v.partner.companyName || v.partner.user?.email}
              </Link>
            ) : (
              <span className="font-medium">—</span>
            )}
          </div>
          <div>Телефон: <span className="font-medium">{v.phone || "—"}</span></div>
          <div>Сайт: <span className="font-medium">{v.website || "—"}</span></div>
          <div>Создан: <span className="font-medium">{formatDateTime(v.createdAt)}</span></div>
          <div>Опубликован: <span className="font-medium">{v.publishedAt ? formatDate(v.publishedAt) : "—"}</span></div>
          {v.amenities?.length > 0 && (
            <div className="md:col-span-2">
              Удобства:{" "}
              <span className="font-medium">
                {v.amenities.map((a: any) => a.amenity?.name).filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          <div className="md:col-span-2 whitespace-pre-line text-muted-foreground">{v.description}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Фотографии ({v.photos?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {!v.photos || v.photos.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">Фотографий нет</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {v.photos.map((p: any) => (
                <figure key={p.id} className="overflow-hidden rounded-lg border">
                  <div className="aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={v.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <figcaption className="space-y-1 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{p.category || "Без категории"}</span>
                      {p.isCover && (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Обложка</span>
                      )}
                    </div>
                    <div className="text-muted-foreground">{formatDate(p.createdAt)}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Видео ({v.videos?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {!v.videos || v.videos.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">Видео нет</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {v.videos.map((video: any) => (
                <figure key={video.id} className="overflow-hidden rounded-lg border">
                  <div className="aspect-video bg-black">
                    <video src={video.url} controls preload="metadata" className="h-full w-full object-contain" />
                  </div>
                  <figcaption className="space-y-1 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{video.isCover ? "Обложка" : "Видео"}</span>
                      <span className="text-xs text-muted-foreground">{label(videoStatusLabels, video.status)}</span>
                    </div>
                    <div className="text-muted-foreground">{formatDate(video.createdAt)}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Последние бронирования</CardTitle></CardHeader>
          <CardContent>
            {data.bookings.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">Нет бронирований</div>
            ) : (
              <div className="space-y-2 text-sm">
                {data.bookings.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-medium">{b.user?.email || "—"}</div>
                      <div className="text-muted-foreground">{formatDateTime(b.startsAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {b.payment?.amount != null
                          ? formatRubles(Math.round(b.payment.amount / 100))
                          : formatRubles(b.totalPrice ?? 0)}
                      </div>
                      <div className="text-muted-foreground">{label(bookingStatusLabels, b.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Последние отзывы</CardTitle></CardHeader>
          <CardContent>
            {data.reviews.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">Отзывов нет</div>
            ) : (
              <div className="space-y-2 text-sm">
                {data.reviews.map((r: any) => (
                  <div key={r.id} className="border-b pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">★ {r.rating}/5 · {r.user?.email || "—"}</span>
                      <span className="text-muted-foreground">{label(reviewStatusLabels, r.status)}</span>
                    </div>
                    <div className="text-muted-foreground line-clamp-2">{r.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
