"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerVerifyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Верификация</h1>
      <Card>
        <CardHeader><CardTitle>Статус верификации</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">Статус: <span className="font-medium">На проверке</span></div>
          <Button variant="outline">Загрузить документы</Button>
        </CardContent>
      </Card>
    </div>
  );
}
