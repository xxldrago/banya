import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { requireAdminRole } from "@/shared/middlewares/require-auth";
import { HttpError } from "@/shared/lib/errors";
import { getPaymentProvider } from "@/modules/payments/providers/factory";

const REFUND_MANAGERS = ["finance", "superadmin"];

// List refunds (optionally filtered by status)
export async function GET(req: NextRequest) {
  try {
    await requireAdminRole(req, REFUND_MANAGERS);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const refunds = await prisma.refund.findMany({
      where: status ? { status } : undefined,
      include: {
        payment: { include: { booking: { include: { venue: { select: { title: true } }, user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return apiSuccess(refunds);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/admin/refunds failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

// Process a refund: approve (call provider) or reject
export async function POST(req: NextRequest) {
  try {
    await requireAdminRole(req, REFUND_MANAGERS);
    const body = await req.json();
    const { refundId, action, reason } = body;
    if (!refundId || !["approve", "reject"].includes(action)) {
      return apiError("VALIDATION_ERROR", "refundId and action (approve|reject) required", 400);
    }

    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { payment: { include: { booking: { include: { venue: true } } } } },
    });
    if (!refund) return apiError("NOT_FOUND", "Refund not found", 404);
    if (refund.status !== "pending") {
      return apiError("INVALID_STATE", "Refund already processed", 400);
    }

    if (action === "reject") {
      const updated = await prisma.refund.update({
        where: { id: refund.id },
        data: { status: "rejected", reason: reason || refund.reason },
      });
      return apiSuccess(updated);
    }

    // Approve: call provider refund (mock provider just marks it done)
    const provider = getPaymentProvider();
    let providerRef = "";
    try {
      const result = await provider.refund(refund.payment.providerPaymentId || "", refund.amount, reason || "Admin refund");
      providerRef = result.providerRef;
    } catch (e) {
      console.error("Provider refund failed", e);
      return apiError("PROVIDER_ERROR", "Provider refund failed", 502);
    }

    const [updatedRefund] = await prisma.$transaction([
      prisma.refund.update({
        where: { id: refund.id },
        data: { status: "completed", reason: reason || refund.reason, providerRef },
      }),
      prisma.payment.update({
        where: { id: refund.paymentId },
        data: { status: "REFUNDED", refundedAt: new Date() },
      }),
    ]);

    return apiSuccess({ ...updatedRefund, providerRef });
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/admin/refunds failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
