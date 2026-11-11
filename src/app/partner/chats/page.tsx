"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerChatsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/chat/conversations", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setConversations(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Чаты с гостями</h1>
      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет активных диалогов
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3">
                <div className="font-medium">{c.venue?.title || "Объект"}</div>
                <div className="text-sm text-muted-foreground">{c.lastMessage?.body || "—"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
