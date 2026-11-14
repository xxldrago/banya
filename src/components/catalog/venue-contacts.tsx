"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  venueId: string;
  showContactsBeforeBooking: boolean;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
};

export function VenueContacts({ venueId, showContactsBeforeBooking, phone, email, website }: Props) {
  const [hasBooking, setHasBooking] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (showContactsBeforeBooking) {
      setChecked(true);
      return;
    }
    fetch("/api/v1/bookings?limit=50", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => {
        const bookings = d.data || [];
        setHasBooking(bookings.some((b: any) => b.venueId === venueId || b.venue?.id === venueId));
      })
      .finally(() => setChecked(true));
  }, [venueId, showContactsBeforeBooking]);

  if (!checked) return null;

  const visible = showContactsBeforeBooking || hasBooking;

  if (!visible) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-xl">Контакты</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Телефон и контакты владельца скрыты до бронирования — так мы защищаем заявки от увода мимо платформы.</p>
          <p className="font-medium text-foreground">Забронируйте объект, чтобы увидеть контакты.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-xl">Контакты</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {phone ? <div><span className="text-muted-foreground">Телефон:</span> {phone}</div> : null}
        {email ? <div><span className="text-muted-foreground">Email:</span> {email}</div> : null}
        {website ? <div><span className="text-muted-foreground">Сайт:</span> <a href={website} className="underline" target="_blank" rel="noreferrer">{website}</a></div> : null}
        {!phone && !email && !website ? <p className="text-muted-foreground">Контакты не указаны</p> : null}
      </CardContent>
    </Card>
  );
}
