import { VenueCard, type VenueCardData } from "@/components/venue-card";

export function VenueList({ venues }: { venues: VenueCardData[] }) {
  if (venues.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-16 text-center">
        <p className="text-lg font-medium">Объекты не найдены</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Попробуйте выбрать другой город или загляните позже
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
