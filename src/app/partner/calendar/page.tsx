"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerCalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Календарь</h1>
      <Card>
        <CardHeader>
          <CardTitle>Расписание</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Календарь доступности и бронирований будет реализован в следующей версии
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button variant="outline">Блокировать слот</Button>
        <Button variant="outline">Разблокировать</Button>
      </div>
    </div>
  );
}
