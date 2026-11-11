"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerStaffPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Сотрудники</h1>
      <Card>
        <CardHeader><CardTitle>Команда</CardTitle></CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Управление сотрудниками и матрица прав — в разработке
        </CardContent>
      </Card>
    </div>
  );
}
