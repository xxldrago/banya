"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Платежи</h1>
      <Card>
        <CardHeader>
          <CardTitle>Список платежей</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Управление платежами и возвратами будет реализовано в следующей версии
        </CardContent>
      </Card>
    </div>
  );
}
