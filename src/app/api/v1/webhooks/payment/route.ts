import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Verify webhook signature (CloudPayments)
function verifyCloudPaymentsWebhook(body: string, signature: string, secretKey: string): boolean {
  const hash = crypto.createHmac("sha512", secretKey).update(body, "utf8").digest("hex");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("X-CloudPayments-Signature") || req.headers.get("X-Signature");
  const body = await req.text();
  const webhookData = JSON.parse(body);

  // TODO: Add secret key for signature verification
  const cloudPaymentsSecret = process.env.CLOUDPAYMENTS_SECRET_KEY || "test-secret-key";

  // For now, skip signature verification (will implement in production)
  // if (!verifyCloudPaymentsWebhook(body, signature, cloudPaymentsSecret)) {
  //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  // }

  try {
    switch (webhookData.type) {
      case "payment.succeeded":
        await handlePaymentSuccess(webhookData.data);
        break;
      case "payment.failed":
        await handlePaymentFailed(webhookData.data);
        break;
      case "refund.succeeded":
        await handleRefundSuccess(webhookData.data);
        break;
      case "refund.failed":
        await handleRefundFailed(webhookData.data);
        break;
      default:
        console.log("Unknown webhook type:", webhookData.type);
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(data: any) {
  const paymentId = data.id;
  const status = "SUCCESS";
  const providerPaymentId = data.provider_payment_id;

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      providerPaymentId,
      paidAt: new Date(),
      metadata: {
        webhookData: data,
        processedAt: new Date(),
      },
    },
  });

  // Send confirmation email
  await sendPaymentConfirmationEmail(payment);

  console.log(`Payment ${paymentId} confirmed successfully`);
}

async function handlePaymentFailed(data: any) {
  const paymentId = data.id;
  const status = "FAILED";
  const errorCode = data.error?.code;
  const errorMessage = data.error?.message;

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      metadata: {
        webhookData: data,
        error: { code: errorCode, message: errorMessage },
        processedAt: new Date(),
      },
    },
  });

  console.log(`Payment ${paymentId} failed: ${errorMessage}`);
}

async function handleRefundSuccess(data: any) {
  const paymentId = data.payment_id;
  const refundId = data.id;
  const status = "REFUNDED";

  const refund = await prisma.refund.update({
    where: { id: refundId },
    data: {
      status,
      providerRef: data.provider_ref,
    },
  });

  console.log(`Refund ${refundId} processed successfully`);
}

async function handleRefundFailed(data: any) {
  const refundId = data.id;
  const status = "FAILED";

  const refund = await prisma.refund.update({
    where: { id: refundId },
    data: {
      status,
    },
  });

  console.log(`Refund ${refundId} failed: ${data.error?.message}`);
}

async function sendPaymentConfirmationEmail(payment: any) {
  try {
    // Send email notification
    const { email } = payment;
    if (!email) {
      console.log("No email address for payment", payment.id);
      return;
    }

    // TODO: Integrate with email service
    console.log(`Would send payment confirmation email to ${email} for payment ${payment.id}`);
    
    // For now, just log it
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error);
  }
}