import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type VenueCardData = {
  id: string;
  slug: string;
  title: string;
  priceFrom: number;
  maxGuests: number;
  type: string;
  coverUrl?: string | null;
  cityName?: string | null;
};

function typeLabel(type: string): string {
  if (type === "sauna") return "Сауна";
  if (type === "bath") return "Баня";
  return type;
}

function formatPrice(priceFrom: number): string {
  return `от ${priceFrom.toLocaleString("ru-RU")} ₽/час`;
}

export function VenueCard({ venue }: { venue: VenueCardData }) {
  return (
    <Link href={`/catalog/${venue.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {venue.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={venue.coverUrl}
              alt={venue.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Нет фото
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-medium shadow-sm">
            {typeLabel(venue.type)}
          </span>
        </div>
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="line-clamp-2 text-lg leading-snug">
            {venue.title}
          </CardTitle>
          {venue.cityName ? (
            <CardDescription>{venue.cityName}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {formatPrice(venue.priceFrom)}
          </span>
          <span>до {venue.maxGuests} чел.</span>
        </CardContent>
      </Card>
    </Link>
  );
}
