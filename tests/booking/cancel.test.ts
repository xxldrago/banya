// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { POST as cancelBookingRoute } from "@/app/api/v1/bookings/[id]/cancel/route";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/db/client";
import { signAccess } from "@/modules/auth/token.service";

let clientToken: string;
let clientUserId: string;
let venueId: string;

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

async function makeBooking(startsAt: Date, endsAt: Date) {
  return prisma.booking.create({
    data: {
      venueId,
      userId: clientUserId,
      startsAt,
      endsAt,
      totalPrice: 5000,
      status: "PAID",
    },
  });
}

describe("Booking cancellation refunds", () => {
  beforeAll(async () => {
    const user = await prisma.user.findFirst({ where: { email: { contains: "client" } } });
    if (!user) throw new Error("No client user found");
    clientUserId = user.id;
    clientToken = await signAccess(user.id, user.role);

    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    if (!venue) throw new Error("No venue found");
    venueId = venue.id;
  });

  it("full refund when cancelled >= freeHours (72h) before start", async () => {
    const startsAt = new Date(Date.now() + 100 * 3600 * 1000); // 100h ahead
    const booking = await makeBooking(startsAt, new Date(startsAt.getTime() + 2 * 3600 * 1000));
    const res = await cancelBookingRoute(req(`http://localhost:3000/api/v1/bookings/${booking.id}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `access_token=${clientToken}` },
      body: JSON.stringify({ reason: "test" }),
    }), { params: Promise.resolve({ id: booking.id }) } as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.refundAmount).toBe(5000);
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
  });

  it("partial refund (50%) when cancelled within partial window (24-72h)", async () => {
    const startsAt = new Date(Date.now() + 48 * 3600 * 1000); // 48h ahead
    const booking = await makeBooking(startsAt, new Date(startsAt.getTime() + 2 * 3600 * 1000));
    const res = await cancelBookingRoute(req(`http://localhost:3000/api/v1/bookings/${booking.id}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `access_token=${clientToken}` },
      body: JSON.stringify({ reason: "test" }),
    }), { params: Promise.resolve({ id: booking.id }) } as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.refundAmount).toBe(2500);
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
  });

  it("no refund when cancelled < partialHours (24h) before start", async () => {
    const startsAt = new Date(Date.now() + 5 * 3600 * 1000); // 5h ahead
    const booking = await makeBooking(startsAt, new Date(startsAt.getTime() + 2 * 3600 * 1000));
    const res = await cancelBookingRoute(req(`http://localhost:3000/api/v1/bookings/${booking.id}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `access_token=${clientToken}` },
      body: JSON.stringify({ reason: "test" }),
    }), { params: Promise.resolve({ id: booking.id }) } as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.refundAmount).toBe(0);
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
  });
});
