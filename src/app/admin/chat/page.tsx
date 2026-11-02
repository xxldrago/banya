"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminChatPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Чаты</h1>
      <Card>
        <CardHeader>
          <CardTitle>Все диалоги</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Просмотр всех чатов будет реализован в следующей версии
        </CardContent>
      </Card>
    </div>
  );
}
