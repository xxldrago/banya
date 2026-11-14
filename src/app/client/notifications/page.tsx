"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/shared/lib/labels";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/notifications", { credentials: "include" })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((data) => setNotifications(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/v1/notifications/${id}`, {
      method: "PATCH",
      credentials: "include",
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Уведомления</h1>
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет уведомлений
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <Card key={n.id} className={n.readAt ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">{n.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{n.body}</p>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(n.createdAt)}
                </div>
                {!n.readAt && (
                  <Button variant="outline" size="sm" onClick={() => markRead(n.id)}>
                    Отметить прочитанным
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
