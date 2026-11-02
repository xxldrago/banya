"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Настройки платформы</h1>
      <Card>
        <CardHeader>
          <CardTitle>Общие настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">Название платформы</div>
            <input
              className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue="Баня.Сауна"
            />
          </div>
          <Button>Сохранить</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Лог аудита</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Журнал аудита будет реализован в следующей версии
        </CardContent>
      </Card>
    </div>
  );
}
