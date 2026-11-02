import { z } from "zod";

export const createBookingSchema = z.object({
  venueId: z.string(),
  userId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  bookingMode: z.enum(["instant", "confirm", "pay_on_site"]).default("instant"),
  allowBackToBack: z.boolean().default(false),
  serviceIds: z.array(z.string()).optional(),
  quantities: z.record(z.string(), z.number()).optional(),
});

export type BookingInput = z.infer<typeof createBookingSchema>;
