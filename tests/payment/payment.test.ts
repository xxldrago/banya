// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as initiatePay } from "@/app/api/v1/bookings/[id]/pay/route";
import { GET as getPaymentStatus } from "@/app/api/v1/payments/status/[bookingId]/route";
import { POST as webhook } from "@/app/api/v1/payments/webhook/route";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/db/client";
import { signAccess } from "@/modules/auth/token.service";
import { simulatePaymentSuccess } from "@/modules/payments/payment.service";

// Данные сюита маркируются префиксом email — демо-данные не затрагиваются.
const TEST_PREFIX = "pay-test-";

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

describe("Payment API", () => {
  let clientToken: string;
  let clientUserId: string;
  let venueId: string;
  let bookingId: string;

  /** Удаляет только данные этого сюита (пользователи с префиксом pay-test-). */
  async function cleanupOwnData() {
    const users = await prisma.user.findMany({ where: { email: { startsWith: TEST_PREFIX } }, select: { id: true } });
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return;
    const bookings = await prisma.booking.findMany({ where: { userId: { in: ids } }, select: { id: true } });
    const bookingIds = bookings.map((b) => b.id);
    await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.bookingService.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.refund.deleteMany({ where: { payment: { bookingId: { in: bookingIds } } } });
    await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  beforeAll(async () => {
    // Чистим только остатки предыдущих запусков этого сюита — глобальные таблицы не трогаем.
    await cleanupOwnData();

    const user = await prisma.user.create({
      data: {
        email: `${TEST_PREFIX}client-${Date.now()}@example.com`,
        passwordHash: "x",
        role: "CLIENT",
        status: "active",
      },
    });
    clientUserId = user.id;
    clientToken = await signAccess(user.id, "CLIENT");

    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    if (!venue) throw new Error("No venue found");
    venueId = venue.id;

    // Create a confirm-mode booking (requires payment)
    const booking = await prisma.booking.create({
      data: {
        venueId,
        userId: clientUserId,
        startsAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 30 + 7200000).toISOString(),
        bookingMode: "confirm",
        status: "PENDING",
      },
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    await cleanupOwnData();
  });

  it("POST /api/v1/bookings/[id]/pay initiates mock payment", async () => {
    const res = await initiatePay(
      new NextRequest(`http://localhost/api/v1/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: { cookie: `access_token=${clientToken}` },
      }),
      { params: Promise.resolve({ id: bookingId }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.paymentUrl).toContain("mock");
    expect(body.data.status).toBe("PENDING");
    expect(body.data.amount).toBeGreaterThan(0);
  });

  it("GET /api/v1/payments/status/[bookingId] returns payment status", async () => {
    const res = await getPaymentStatus(
      new NextRequest(`http://localhost/api/v1/payments/status/${bookingId}`, {
        headers: { cookie: `access_token=${clientToken}` },
      }),
      { params: Promise.resolve({ bookingId }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.bookingId).toBe(bookingId);
    expect(body.data.payment.status).toBe("PENDING");
  });

  it("POST /api/v1/payments/webhook success updates booking to CONFIRMED", async () => {
    const payment = await prisma.payment.findUnique({ where: { bookingId } });
    expect(payment).toBeTruthy();
    const providerPaymentId = payment!.providerPaymentId!;

    const res = await webhook(
      new NextRequest("http://localhost/api/v1/payments/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerPaymentId,
          status: "success",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.bookingStatus).toBe("CONFIRMED");
    expect(body.data.paymentStatus).toBe("SUCCESS");
  });

  it("GET /api/v1/payments/status/[bookingId] shows CONFIRMED after webhook", async () => {
    const res = await getPaymentStatus(
      new NextRequest(`http://localhost/api/v1/payments/status/${bookingId}`, {
        headers: { cookie: `access_token=${clientToken}` },
      }),
      { params: Promise.resolve({ bookingId }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.bookingStatus).toBe("CONFIRMED");
    expect(body.data.payment.status).toBe("SUCCESS");
  });

  it("Webhook is idempotent (re-sending success returns alreadyProcessed)", async () => {
    const payment = await prisma.payment.findUnique({ where: { bookingId } });
    expect(payment).toBeTruthy();
    const providerPaymentId = payment!.providerPaymentId!;

    const res = await webhook(
      new NextRequest("http://localhost/api/v1/payments/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerPaymentId,
          status: "success",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.alreadyProcessed).toBe(true);
  });

  it("simulatePaymentSuccess service function works", async () => {
    // Create another booking for this test
    const booking = await prisma.booking.create({
      data: {
        venueId,
        userId: clientUserId,
        startsAt: new Date(Date.now() + 86400000 * 40).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 40 + 7200000).toISOString(),
        bookingMode: "confirm",
        status: "PENDING",
      },
    });

    // Create payment record first via Prisma
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        providerPaymentId: `mock_test_${Date.now()}`,
        amount: 500000,
        status: "PENDING",
      },
    });

    // Now simulate payment success
    const result = await simulatePaymentSuccess(payment.providerPaymentId!);
    expect(result.booking.status).toBe("CONFIRMED");
    expect(result.payment.status).toBe("SUCCESS");
  });
});
