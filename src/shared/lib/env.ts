"use strict";

export interface IntegrationConfig {
  cloudPayments: {
    publicKey: string;
    secretKey: string;
    baseUrl: string;
    enabled: boolean;
  };
  email: {
    provider: "sendgrid" | "ses" | "mock";
    apiKey: string;
    fromEmail: string;
    enabled: boolean;
  };
  sms: {
    provider: "twilio" | "mock";
    accountSid: string;
    authToken: string;
    fromNumber: string;
    enabled: boolean;
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
      enabled: process.env.CLOUD_PAYMENTS_ENABLED === "true" || false,
    },
    email: {
      provider: (process.env.EMAIL_PROVIDER as "sendgrid" | "ses" | "mock") || "mock",
      apiKey: process.env.EMAIL_API_KEY || "test-key",
      fromEmail: process.env.FROM_EMAIL || "noreply@example.com",
      enabled: process.env.EMAIL_ENABLED === "true" || false,
    },
    sms: {
      provider: (process.env.SMS_PROVIDER as "twilio" | "mock") || "mock",
      accountSid: process.env.TWILIO_ACCOUNT_SID || "test-sid",
      authToken: process.env.TWILIO_AUTH_TOKEN || "test-token",
      fromNumber: process.env.TWILIO_FROM_NUMBER || "+1234567890",
      enabled: process.env.SMS_ENABLED === "true" || false,
    },
    webhooks: {
      secret: process.env.WEBHOOK_SECRET || "test-webhook-secret",
      url: process.env.WEBHOOK_URL || "/api/v1/webhooks/payment",
    },
  };
}

export function isRealProvidersConfigured(config: IntegrationConfig): boolean {
  return config.cloudPayments.enabled &&
         config.email.enabled &&
         config.sms.enabled;
}

export function getProviderStatus(config: IntegrationConfig): {
  cloudPayments: boolean;
  email: boolean;
  sms: boolean;
  overall: "ready" | "partial" | "not-ready";
} {
  const cloudPaymentsReady = config.cloudPayments.enabled &&
    config.cloudPayments.publicKey &&
    config.cloudPayments.secretKey;

  const emailReady = config.email.enabled &&
    config.email.apiKey &&
    config.email.fromEmail;

  const smsReady = config.sms.enabled &&
    config.sms.accountSid &&
    config.sms.authToken &&
    config.sms.fromNumber;

  const readyCount = [cloudPaymentsReady, emailReady, smsReady].filter(Boolean).length;

  if (readyCount === 3) {
    return { cloudPayments: true, email: true, sms: true, overall: "ready" };
  } else if (readyCount > 0) {
    return { cloudPayments: cloudPaymentsReady, email: emailReady, sms: smsReady, overall: "partial" };
  } else {
    return { cloudPayments: false, email: false, sms: false, overall: "not-ready" };
  }
}