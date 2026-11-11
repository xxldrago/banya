"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
                <div className="text-sm text-muted-foreground">{new Date(b.startsAt).toLocaleDateString("ru-RU")}</div>
                {activeBooking === b.id ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} className={`text-xl ${n <= rating ? "text-yellow-500" : "text-gray-300"}`} onClick={() => setRating(n)}>★</button>
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
                <div className="text-xs text-muted-foreground">
                  {r.status} · {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                </div>
                {r.response && (
                  <div className="rounded bg-muted p-2 text-sm">
                    <b>Ответ владельца:</b> {r.response}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
