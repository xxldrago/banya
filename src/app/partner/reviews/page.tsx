"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/v1/partner/reviews", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setReviews(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submitReply = async (id: string) => {
    const res = await fetch(`/api/v1/reviews/${id}/respond`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: replyText }),
    });
    if (res.ok) {
      setReplying(null);
      setReplyText("");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

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
                {r.response ? (
                  <div className="rounded bg-muted p-2 text-sm">
                    <b>Ваш ответ:</b> {r.response}
                  </div>
                ) : replying === r.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded border px-2 py-1"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Ваш ответ..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => submitReply(r.id)}>Отправить</Button>
                      <Button size="sm" variant="outline" onClick={() => setReplying(null)}>Отмена</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setReplying(r.id)}>
                    Ответить
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
