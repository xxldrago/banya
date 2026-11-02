"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Настройки</h1>
      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span>Email-уведомления</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span>SMS-уведомления</span>
          </label>
          <Button>Сохранить</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Безопасность</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Сменить пароль</Button>
          <Button variant="outline">Включить 2FA</Button>
        </CardContent>
      </Card>
    </div>
  );
}
