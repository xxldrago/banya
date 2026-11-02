"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerPayoutsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Выплаты</h1>
      <Card>
        <CardHeader>
          <CardTitle>Баланс</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">0 ₽</div>
          <div className="text-sm text-muted-foreground">Доступно к выводу</div>
          <Button className="mt-4">Запросить выплату</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>История выплат</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          История выплат пуста
        </CardContent>
      </Card>
    </div>
  );
}
