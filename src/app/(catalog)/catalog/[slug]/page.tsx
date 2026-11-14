import { notFound } from "next/navigation";
import Link from "next/link";
import { getVenueBySlug } from "@/modules/catalog/catalog.service";
import { NotFound } from "@/shared/lib/errors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookingWidget } from "@/components/catalog/booking-widget";
import { VenueContacts } from "@/components/catalog/venue-contacts";
import { WaitlistButton } from "@/components/catalog/waitlist-button";
import { CompareToggle } from "@/components/catalog/compare-toggle";
import { PackageList } from "@/components/catalog/package-list";
import { PhotoGallery } from "@/components/catalog/photo-gallery";

function typeLabel(type: string): string {
  if (type === "sauna") return "Сауна";
  if (type === "bath") return "Баня";
  return type;
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let venue;
  try {
    venue = await getVenueBySlug(slug);
  } catch (err) {
    if (err instanceof NotFound) {
      notFound();
    }
    throw err;
  }

  const descriptionParagraphs = venue.description
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const orderedPhotos = [...venue.photos].sort((a, b) => {
    if (a.isCover === b.isCover) return a.sortOrder - b.sortOrder;
    return a.isCover ? -1 : 1;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
              {typeLabel(venue.type)}
            </span>
            {venue.city?.name ? (
              <span className="text-sm text-muted-foreground">
                {venue.city.name}
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{venue.title}</h1>
          <p className="text-muted-foreground">{venue.address}</p>
          {venue.lat && venue.lng ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline"
            >
              Построить маршрут
            </a>
          ) : null}
        </div>
        <Link
          href={`/catalog?cityId=${venue.cityId}`}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          ← К каталогу
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Фотографии</h2>
        <PhotoGallery photos={orderedPhotos} title={venue.title} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Описание</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              {descriptionParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Удобства</CardTitle>
              <CardDescription>Что есть на объекте</CardDescription>
            </CardHeader>
            <CardContent>
              {venue.amenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Список удобств не указан
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {venue.amenities.map((va) => (
                    <li
                      key={`${va.venueId}-${va.amenityId}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs">
                        {va.amenity.icon
                          ? va.amenity.icon.slice(0, 1).toUpperCase()
                          : "•"}
                      </span>
                      {va.amenity.name}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {venue.rules ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Правила</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-line text-sm leading-relaxed">
                {venue.rules}
              </CardContent>
            </Card>
          ) : null}
          <PackageList venueId={venue.id} />
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Стоимость</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-2xl font-bold">
                от {venue.priceFrom.toLocaleString("ru-RU")} ₽
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Вместимость: до {venue.maxGuests} чел.</li>
                <li>Мин. длительность: {venue.minDuration} мин.</li>
                <li>Тип: {typeLabel(venue.type)}</li>
              </ul>
              {venue.partner?.companyName ? (
                <p className="border-t pt-3 text-muted-foreground">
                  Партнёр:{" "}
                  <span className="font-medium text-foreground">
                    {venue.partner.companyName}
                  </span>
                </p>
              ) : null}
              <BookingWidget
                venueId={venue.id}
                slug={venue.slug}
                priceFrom={venue.priceFrom}
                minDuration={venue.minDuration}
                maxGuests={venue.maxGuests}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Лист ожидания</CardTitle></CardHeader>
            <CardContent>
              <WaitlistButton venueId={venue.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Сравнение</CardTitle></CardHeader>
            <CardContent>
              <CompareToggle slug={venue.slug} />
            </CardContent>
          </Card>
          <VenueContacts
            venueId={venue.id}
            showContactsBeforeBooking={venue.showContactsBeforeBooking}
            phone={venue.phone}
            email={venue.email}
            website={venue.website}
          />
        </aside>
      </div>
    </div>
  );
}
