"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/shared/lib/labels";

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
                    {conv.booking?.venue?.title || "Чат по бронированию"}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {conv.booking?.venue && (
                    <>Бронирование: {formatDateTime(conv.booking.startsAt)} · </>
                  )}
                  Обновлён: {formatDateTime(conv.updatedAt)}
                </div>
                {conv.messages?.[0]?.body && (
                  <div className="text-sm mt-1 truncate">
                    Последнее сообщение: {conv.messages[0].body}
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
