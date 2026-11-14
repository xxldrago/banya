import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

// Public endpoint for the mock checkout page: returns minimal payment info by providerPaymentId.
// Only works for mock-provider payments (providerPaymentId starts with "mock_").
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id.startsWith("mock_")) return apiError("NOT_FOUND", "Not found", 404);

  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: id },
    select: { id: true, providerPaymentId: true, amount: true, status: true, bookingId: true },
  });
  if (!payment) return apiError("NOT_FOUND", "Not found", 404);

  const booking = await prisma.booking.findUnique({
    where: { id: payment.bookingId },
    select: { startsAt: true, endsAt: true, venue: { select: { title: true } } },
  });

  return apiSuccess({
    providerPaymentId: payment.providerPaymentId,
    amount: payment.amount,
    status: payment.status,
    bookingId: payment.bookingId,
    venueTitle: booking?.venue?.title ?? null,
    startsAt: booking?.startsAt ?? null,
    endsAt: booking?.endsAt ?? null,
  });
}
