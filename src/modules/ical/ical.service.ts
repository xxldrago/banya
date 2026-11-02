import { prisma } from "@/shared/db/client";
import { ICalSyncJob, Venue } from "@prisma/client";

export class ICalService {
  async syncCalendar(venueId: string, sourceUrl: string): Promise<ICalSyncJob> {
    const job = await prisma.iCalSyncJob.create({
      data: {
        venueId,
        sourceUrl,
        status: "pending",
      },
    });

    // TODO: implement background sync job
    return job;
  }

  async getSyncJobs(venueId: string): Promise<ICalSyncJob[]> {
    return await prisma.iCalSyncJob.findMany({
      where: { venueId },
      orderBy: { createdAt: "desc" },
    });
  }

  async generateVenueICal(venueSlug: string): Promise<string> {
    const venue = await prisma.venue.findUnique({
      where: { slug: venueSlug },
    });

    if (!venue) throw new Error("Venue not found");

    // TODO: implement iCal calendar generation
    // Use ics library to generate calendar
    // For now, return empty calendar
    return "BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR";
  }
}

export async function syncVenueCalendar(venueId: string, sourceUrl: string): Promise<ICalSyncJob> {
  return new ICalService().syncCalendar(venueId, sourceUrl);
}