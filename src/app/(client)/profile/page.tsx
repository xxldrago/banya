"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.data) setUser(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (!user) return <div>Не авторизован</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Профиль</h1>
      <Card>
        <CardHeader>
          <CardTitle>Личная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Имя</div>
            <div className="font-medium">{user.firstName} {user.lastName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Телефон</div>
            <div className="font-medium">{user.phone || "Не указан"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Роль</div>
            <div className="font-medium">{user.role}</div>
          </div>
          <Button variant="outline">Редактировать профиль</Button>
        </CardContent>
      </Card>
    </div>
  );
}
