"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusLabels: Record<string, string> = {
  PENDING: "На модерации",
  APPROVED: "Опубликован",
  REJECTED: "Отклонён",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.data?.id) {
          // Fetch reviews for this user via bookings
          fetch(`/api/v1/bookings`, { credentials: "include" })
            .then((res) => res.ok ? res.json() : { data: [] })
            .then((d) => setReviews([]))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои отзывы</h1>
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Вы ещё не оставляли отзывов
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {review.venue?.title || "Объект"}
                  </CardTitle>
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColors[review.status]}`}>
                    {statusLabels[review.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">Оценка: {review.rating}/5</div>
                <p className="mt-2 text-sm">{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
