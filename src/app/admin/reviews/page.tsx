"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reviewStatusLabels, label, formatDate } from "@/shared/lib/labels";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/reviews", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setReviews(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const moderate = async (id: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/v1/admin/reviews/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setMsg(action === "approve" ? "Отзыв одобрен" : "Отзыв отклонён");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error?.message || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Модерация отзывов</h1>
      {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
      <Card>
        <CardHeader>
          <CardTitle>Список отзывов ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Нет данных</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {review.venueTitle || "Объект"} · {review.userEmail || "—"} · Оценка: {review.rating}/5
                    </div>
                    <span className="text-sm">{label(reviewStatusLabels, review.status)}</span>
                  </div>
                  <p className="text-sm mb-2">{review.comment}</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => moderate(review.id, "approve")}>Одобрить</Button>
                    <Button variant="outline" size="sm" onClick={() => moderate(review.id, "reject")}>Отклонить</Button>
                    <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
