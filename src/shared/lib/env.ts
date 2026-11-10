"use strict";

export interface IntegrationConfig {
  cloudPayments: {
    publicKey: string;
    secretKey: string;
    baseUrl: string;
    enabled: boolean;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    pool: boolean;
  };
  sms: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  webhooks: {
    secret: string;
    url: string;
  };
}

export function getEnvironmentConfig(): IntegrationConfig {
  // For development, use mock providers
  // In production, configure real providers
  return {
    cloudPayments: {
      publicKey: process.env.CLOUD_PAYMENTS_PUBLIC_KEY || "test-key",
      secretKey: process.env.CLOUD_PAYMENTS_SECRET_KEY || "test-secret",
      baseUrl: process.env.CLOUD_PAYMENTS_BASE_URL || "https://api.cloudpayments.ru",
      enabled: Boolean(process.env.CLOUD_PAYMENTS_ENABLED === "true"),
    },
    email: {
      host: process.env.EMAIL_HOST || "smtp.example.com",
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || "noreply@example.com",
        pass: process.env.EMAIL_PASSWORD || "test-password",
      },
      pool: Boolean(process.env.EMAIL_POOL === "true"),
    },
    sms: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || "test-sid",
      authToken: process.env.TWILIO_AUTH_TOKEN || "test-token",
      fromNumber: process.env.TWILIO_FROM_NUMBER || "+1234567890",
    },
    webhooks: {
      secret: process.env.WEBHOOK_SECRET || "test-webhook-secret",
      url: process.env.WEBHOOK_URL || "/api/v1/webhooks/payment",
    },
  };
}

export function isRealProvidersConfigured(config: IntegrationConfig): boolean {
  return config.cloudPayments.enabled &&
         config.email.host !== "smtp.example.com" &&
         config.sms.accountSid !== "test-sid";
}

export function getProviderStatus(config: IntegrationConfig): {
  cloudPayments: boolean;
  email: boolean;
  sms: boolean;
  overall: "ready" | "partial" | "not-ready";
} {
  const cloudPaymentsReady = Boolean(
    config.cloudPayments.enabled &&
      config.cloudPayments.publicKey &&
      config.cloudPayments.secretKey
  );

  const emailReady = Boolean(
    config.email.host &&
      config.email.host !== "smtp.example.com" &&
      config.email.auth.user &&
      config.email.auth.pass
  );

  const smsReady = Boolean(
    config.sms.accountSid &&
      config.sms.accountSid !== "test-sid" &&
      config.sms.authToken &&
      config.sms.fromNumber
  );

  const readyCount = [cloudPaymentsReady, emailReady, smsReady].filter(Boolean).length;

  if (readyCount === 3) {
    return { cloudPayments: true, email: true, sms: true, overall: "ready" };
  } else if (readyCount > 0) {
    return { cloudPayments: cloudPaymentsReady, email: emailReady, sms: smsReady, overall: "partial" };
  } else {
    return { cloudPayments: false, email: false, sms: false, overall: "not-ready" };
  }
}