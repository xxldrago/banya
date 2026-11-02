"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerServicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Услуги</h1>
        <Button>Добавить услугу</Button>
      </div>
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Управление дополнительными услугами (венник, чай, полотенца и др.) будет реализовано в следующей версии
        </CardContent>
      </Card>
    </div>
  );
}
