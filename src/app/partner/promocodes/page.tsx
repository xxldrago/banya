"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerPromoCodesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Промокоды</h1>
        <Button>Создать промокод</Button>
      </div>
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Управление промокодами партнёра будет реализовано в следующей версии
        </CardContent>
      </Card>
    </div>
  );
}
