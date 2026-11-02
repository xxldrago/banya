import { ValidationError } from "@/shared/lib/errors";

export function checkTimeRangeValid(startsAt: Date | string, endsAt: Date | string): void {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError("Invalid date format");
  }

  if (end <= start) {
    throw new ValidationError("End time must be after start time");
  }

  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  if (durationMinutes < 30) {
    throw new ValidationError("Booking duration must be at least 30 minutes");
  }

  if (durationMinutes > 24 * 60) {
    throw new ValidationError("Booking duration cannot exceed 24 hours");
  }
}

export function toUtc(dateOrString: Date | string): Date {
  const date = typeof dateOrString === "string" ? new Date(dateOrString) : dateOrString;
  return new Date(date.toISOString());
}
