import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createIntegrationService } from "@/modules/integrations/integration.service";
import { getEnvironmentConfig } from "@/shared/lib/env";

// Initialize integration service with real providers
const config = getEnvironmentConfig();
const integrationService = createIntegrationService(config);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case "create_payment":
        const payment = await integrationService.createPayment(
          data.amount,
          data.currency || "RUB",
          data.description,
          data.orderId
        );

        if (!payment.success) {
          return NextResponse.json(
            { error: payment.error?.message || "Payment creation failed" },
            { status: 400 }
          );
        }

        // Save payment to database
        const savedPayment = await prisma.payment.create({
          data: {
            id: payment.id,
            bookingId: data.bookingId,
            userId: data.userId,
            amount: data.amount,
            currency: data.currency || "RUB",
            status: "PENDING",
            paymentUrl: payment.paymentUrl,
            metadata: {
              provider: "cloudpayments",
              providerPaymentId: payment.id,
              webhookData: data,
            },
          },
        });

        // Send confirmation email
        await integrationService.sendBookingConfirmation(
          data.userEmail,
          data.bookingDetails
        );

        return NextResponse.json({
          success: true,
          payment: savedPayment,
          providerResponse: payment,
        });

      case "check_payment":
        const paymentStatus = await integrationService.getPaymentStatus(data.paymentId);

        if (!paymentStatus.success) {
          return NextResponse.json(
            { error: paymentStatus.error?.message || "Failed to check payment" },
            { status: 400 }
          );
        }

        // Update payment status in database
        const updatedPayment = await prisma.payment.update({
          where: { id: data.paymentId },
          data: {
            status: paymentStatus.status || "COMPLETED",
            providerPaymentId: paymentStatus.id,
            paidAt: paymentStatus.status === "SUCCESS" ? new Date() : null,
            metadata: {
              ...(paymentStatus.metadata || {}),
              lastCheck: new Date(),
            },
          },
        });

        return NextResponse.json({
          success: true,
          payment: updatedPayment,
        });

      case "process_refund":
        const refund = await integrationService.refundPayment(
          data.paymentId,
          data.amount,
          data.reason
        );

        if (!refund.success) {
          return NextResponse.json(
            { error: refund.error?.message || "Refund failed" },
            { status: 400 }
          );
        }

        // Create refund record
        const refundRecord = await prisma.refund.create({
          data: {
            paymentId: data.paymentId,
            amount: data.amount,
            reason: data.reason || "Customer request",
            status: "COMPLETED",
            providerRef: refund.id,
          },
        });

        return NextResponse.json({
          success: true,
          refund: refundRecord,
        });

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Payment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const paymentId = searchParams.get("paymentId");
    const action = searchParams.get("action") || "status";

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "status":
        const paymentStatus = await integrationService.getPaymentStatus(paymentId);

        if (!paymentStatus.success) {
          return NextResponse.json(
            { error: paymentStatus.error?.message || "Payment not found" },
            { status: 404 }
          );
        }

        // Get payment from database
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { booking: true, user: true },
        });

        if (!payment) {
          return NextResponse.json(
            { error: "Payment not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          payment: payment,
          providerStatus: paymentStatus,
        });

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Payment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}