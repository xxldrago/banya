"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reviewStatusLabels, label, formatDate } from "@/shared/lib/labels";

export default function ClientReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [activeBooking, setActiveBooking] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/v1/client/reviews", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: { reviews: [], pendingBookings: [] } }))
      .then((data) => {
        setReviews(data.data?.reviews || []);
        setPending(data.data?.pendingBookings || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (bookingId: string) => {
    const res = await fetch(`/api/v1/bookings/${bookingId}/review`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    if (res.ok) {
      setActiveBooking(null);
      setRating(5);
      setComment("");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || err.message || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои отзывы</h1>

      {pending.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Оставить отзыв за завершённый визит</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pending.map((b) => (
              <div key={b.id} className="rounded border p-3">
                <div className="font-medium">{b.venue?.title}</div>
                <div className="text-sm text-muted-foreground">{formatDate(b.startsAt)}</div>
                {activeBooking === b.id ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} className={`text-xl ${n <= rating ? "text-[#C9A227]" : "text-[#D9CBBB]"}`} onClick={() => setRating(n)}>★</button>
                      ))}
                    </div>
                    <textarea className="w-full rounded border px-2 py-1" placeholder="Комментарий (мин. 10 символов)" value={comment} onChange={(e) => setComment(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => submit(b.id)}>Отправить</Button>
                      <Button size="sm" variant="outline" onClick={() => setActiveBooking(null)}>Отмена</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" className="mt-2" onClick={() => setActiveBooking(b.id)}>Написать отзыв</Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Отзывов пока нет</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{r.venue?.title}</CardTitle>
                  <span className="text-sm">{"★".repeat(r.rating || 0)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">{r.comment}</div>
                {r.criteria ? (
                  <div className="text-xs text-muted-foreground">
                    Чистота {r.criteria.cleanliness ?? "—"} · Парная {r.criteria.sauna ?? "—"} · Сервис {r.criteria.service ?? "—"} · Соответствие {r.criteria.accuracy ?? "—"} · Цена/качество {r.criteria.value ?? "—"}
                  </div>
                ) : null}
                {r.photos && r.photos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {r.photos.map((p: any) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={p.url} alt="фото отзыва" className="h-16 w-16 rounded object-cover" />
                    ))}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground">
                  {label(reviewStatusLabels, r.status)} · {formatDate(r.createdAt)}
                </div>
                {r.response && (
                  <div className="rounded bg-muted p-2 text-sm">
                    <b>Ответ владельца:</b> {r.response}
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={async () => {
                  const reason = prompt("Причина жалобы:");
                  if (!reason) return;
                  const res = await fetch(`/api/v1/reviews/${r.id}/complaint`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
                  if (res.ok) alert("Жалоба отправлена");
                  else alert("Ошибка");
                }}>Пожаловаться</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
