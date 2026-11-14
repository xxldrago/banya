import { createCloudPaymentsService, CloudPaymentsService } from "./cloudpayments";

export type PaymentProviderName = "mock" | "cloudpayments";

export interface PaymentProvider {
  name: PaymentProviderName;
  /** Create a payment at the provider. Amount in kopecks. Returns provider payment id and payment URL. */
  createPayment(params: {
    bookingId: string;
    amountKopecks: number;
    description: string;
    receipt?: ReceiptItem[] | null;
    email?: string | null;
  }): Promise<{ providerPaymentId: string; paymentUrl: string }>;
  /** Verify webhook authenticity. rawBody is the exact request body text. */
  verifyWebhook(headers: Headers, rawBody: string): boolean;
  /** Refund a payment at the provider. Amount in kopecks. */
  refund(providerPaymentId: string, amountKopecks: number, reason: string): Promise<{ providerRef: string }>;
  /** Query provider for current payment status (for refresh/retry flows). */
  getStatus(providerPaymentId: string): Promise<"PENDING" | "SUCCESS" | "FAILED" | "EXPIRED">;
}

export interface ReceiptItem {
  label: string;
  price: number; // rubles
  quantity: number;
  amount: number; // rubles
  vat: number; // CloudPayments enum value, e.g. 0 = НДС 0%
  method: number; // 4 = full payment
  object: number; // 1 = goods
}

/**
 * Mock provider for local development and tests.
 * Webhooks are accepted when they carry X-Webhook-Secret equal to PAYMENTS_WEBHOOK_SECRET,
 * or unauthenticated when that env var is not set (local demo).
 */
class MockProvider implements PaymentProvider {
  name = "mock" as const;

  async createPayment(params: { bookingId: string; amountKopecks: number }) {
    const providerPaymentId = `mock_${Date.now()}_${params.bookingId.slice(-8)}`;
    return {
      providerPaymentId,
      paymentUrl: `/payment/mock/${providerPaymentId}`,
    };
  }

  verifyWebhook(headers: Headers): boolean {
    const secret = process.env.PAYMENTS_WEBHOOK_SECRET;
    if (!secret) return true; // local demo mode
    return headers.get("x-webhook-secret") === secret;
  }

  async refund(providerPaymentId: string) {
    return { providerRef: `mock_refund_${providerPaymentId}` };
  }

  async getStatus() {
    return "PENDING" as const;
  }
}

/**
 * CloudPayments provider.
 * Webhook authenticity: Content-Hmac header = base64(HMAC-SHA256(rawBody, API secret)).
 * Docs: https://developers.cloudpayments.ru/#proverka-uvedomleniy
 */
class CloudPaymentsProvider implements PaymentProvider {
  name = "cloudpayments" as const;
  private service: CloudPaymentsService;
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.CLOUDPAYMENTS_SECRET_KEY || "";
    this.service = createCloudPaymentsService({
      publicKey: process.env.CLOUDPAYMENTS_PUBLIC_KEY || "",
      secretKey: this.secretKey,
      baseUrl: process.env.CLOUDPAYMENTS_API_URL || "https://api.cloudpayments.ru",
    });
  }

  async createPayment(params: {
    bookingId: string;
    amountKopecks: number;
    description: string;
    receipt?: ReceiptItem[] | null;
    email?: string | null;
  }) {
    const amountRub = params.amountKopecks / 100;
    const response = await this.service.createPayment(
      amountRub,
      "RUB",
      params.description,
      params.bookingId,
      params.receipt
        ? {
            Items: params.receipt.map((i) => ({
              label: i.label,
              price: i.price,
              quantity: i.quantity,
              amount: i.amount,
              method: i.method,
              object: i.object,
              vat: i.vat,
            })),
            taxationSystem: 0, // общая система
            email: params.email || undefined,
            amounts: { electronic: amountRub },
          }
        : undefined,
    );
    if (!response.success || !response.paymentUrl) {
      throw new Error(response.error?.message || "CloudPayments createPayment failed");
    }
    return { providerPaymentId: response.id || params.bookingId, paymentUrl: response.paymentUrl };
  }

  verifyWebhook(headers: Headers, rawBody: string): boolean {
    const hmac = headers.get("content-hmac");
    if (!hmac || !this.secretKey) return false;
    // Node runtime: use crypto to compute HMAC-SHA256 over raw body
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("crypto") as typeof import("crypto");
    const expected = crypto.createHmac("sha256", this.secretKey).update(rawBody, "utf8").digest("base64");
    return expected === hmac;
  }

  async refund(providerPaymentId: string, amountKopecks: number, reason: string) {
    const response = await this.service.refundPayment(providerPaymentId, amountKopecks / 100, reason);
    if (!response.success) {
      throw new Error(response.error?.message || "CloudPayments refund failed");
    }
    return { providerRef: response.id || providerPaymentId };
  }

  async getStatus(providerPaymentId: string) {
    const response = await this.service.getPaymentStatus(providerPaymentId);
    if (!response.success) return "PENDING" as const;
    const s = (response.status || "").toLowerCase();
    if (s === "completed" || s === "authorized" || s === "confirmed") return "SUCCESS" as const;
    if (s === "cancelled" || s === "declined") return "FAILED" as const;
    if (s === "expired") return "EXPIRED" as const;
    return "PENDING" as const;
  }
}

export function getPaymentProvider(): PaymentProvider {
  const name = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase() as PaymentProviderName;
  if (name === "cloudpayments" && process.env.CLOUDPAYMENTS_SECRET_KEY) {
    return new CloudPaymentsProvider();
  }
  return new MockProvider();
}

export function getProviderName(): PaymentProviderName {
  const name = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase() as PaymentProviderName;
  if (name === "cloudpayments" && process.env.CLOUDPAYMENTS_SECRET_KEY) return "cloudpayments";
  return "mock";
}
