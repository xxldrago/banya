"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Textarea is native for now

export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Отзывы</h1>
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Отзывов пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <CardTitle className="text-lg">{review.venue?.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm font-medium">Оценка: {review.rating}/5</div>
                <p className="text-sm">{review.comment}</p>
                <div className="space-y-2">
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Ваш ответ..."
                  />
                  <Button size="sm">Ответить</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
