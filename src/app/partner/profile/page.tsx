"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setUser(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (!user) return <div>Не авторизован</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Профиль партнёра</h1>
      <Card>
        <CardHeader>
          <CardTitle>Информация о компании</CardTitle>
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
            <div className="text-sm text-muted-foreground">Статус верификации</div>
            <div className="font-medium">Не верифицирован</div>
          </div>
          <Button variant="outline">Редактировать профиль</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Реквизиты для выплат</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Укажите данные для перечисления средств
          </div>
          <Button variant="outline">Заполнить реквизиты</Button>
        </CardContent>
      </Card>
    </div>
  );
}
