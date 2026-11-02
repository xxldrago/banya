"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/chat/conversations", { credentials: "include" })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((data) => setConversations(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои чаты</h1>
      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            У вас пока нет чатов
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <Card key={conv.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  <Link href={`/chat/${conv.id}`} className="hover:underline">
                    Чат по бронированию {conv.bookingId?.slice(0, 8)}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Обновлён: {new Date(conv.updatedAt).toLocaleString("ru-RU")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
