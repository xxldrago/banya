"use strict";
import { CloudPaymentsService, createCloudPaymentsService } from "../payments/providers/cloudpayments";
import { EmailService, createEmailService } from "../email/email.service";
import { SMSService, createSMSService } from "../sms/sms.service";

export interface IntegrationConfig {
  cloudPayments: {
    publicKey: string;
    secretKey: string;
    baseUrl: string;
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
}

export class IntegrationService {
  private cloudPayments: CloudPaymentsService;
  private email: EmailService;
  private sms: SMSService;

  constructor(config: IntegrationConfig) {
    // Initialize providers
    this.cloudPayments = createCloudPaymentsService(config.cloudPayments);
    this.email = createEmailService(config.email);
    this.sms = createSMSService(config.sms);

    console.log("Integration services initialized");
  }

  // Payment methods
  async createPayment(amount: number, currency: string, description: string, orderId: string) {
    return await this.cloudPayments.createPayment(amount, currency, description, orderId);
  }

  async getPaymentStatus(paymentId: string) {
    return await this.cloudPayments.getPaymentStatus(paymentId);
  }

  async refundPayment(paymentId: string, amount: number, reason: string) {
    return await this.cloudPayments.refundPayment(paymentId, amount, reason);
  }

  // Email methods
  async sendEmail(to: string, template: any, options?: any) {
    return await this.email.sendEmail(to, template, options);
  }

  async sendBookingConfirmation(userEmail: string, bookingDetails: any) {
    return await this.email.sendBookingConfirmation(userEmail, bookingDetails);
  }

  async sendPaymentConfirmation(userEmail: string, paymentDetails: any, bookingDetails: any) {
    return await this.email.sendPaymentConfirmation(userEmail, paymentDetails, bookingDetails);
  }

  async sendBookingReminder(userEmail: string, bookingDetails: any) {
    return await this.email.sendBookingReminder(userEmail, bookingDetails);
  }

  async sendCancellationNotification(userEmail: string, bookingDetails: any) {
    return await this.email.sendCancellationNotification(userEmail, bookingDetails);
  }

  async sendReviewRequest(userEmail: string, bookingDetails: any) {
    return await this.email.sendReviewRequest(userEmail, bookingDetails);
  }

  // SMS methods
  async sendSMS(phoneNumber: string, message: string) {
    return await this.sms.sendSMS(phoneNumber, message);
  }

  async sendBookingConfirmationSms(phoneNumber: string, bookingDetails: any) {
    return await this.sms.sendBookingConfirmationSms(phoneNumber, bookingDetails);
  }

  async sendPaymentConfirmationSms(phoneNumber: string, paymentDetails: any, bookingDetails: any) {
    return await this.sms.sendPaymentConfirmationSms(phoneNumber, paymentDetails, bookingDetails);
  }

  async sendBookingReminderSms(phoneNumber: string, bookingDetails: any) {
    return await this.sms.sendBookingReminderSms(phoneNumber, bookingDetails);
  }

  async sendCancellationSms(phoneNumber: string, bookingDetails: any) {
    return await this.sms.sendCancellationSms(phoneNumber, bookingDetails);
  }

  // Statistics and monitoring
  async getEmailStats() {
    return await this.email.getEmailStats();
  }

  async getSMSStats() {
    return await this.sms.getSMSStats();
  }

  async getIntegrationStats() {
    return {
      email: await this.email.getEmailStats(),
      sms: await this.sms.getSMSStats(),
      timestamp: new Date(),
    };
  }

  // Health checks
  async healthCheck() {
    const health = {
      cloudPayments: "unknown",
      email: "unknown",
      sms: "unknown",
      timestamp: new Date(),
    };

    try {
      // Test CloudPayments
      const paymentTest = await this.cloudPayments.getPaymentStatus("test");
      health.cloudPayments = paymentTest.success ? "healthy" : "error";
    } catch (error) {
      health.cloudPayments = "error";
    }

    // Email and SMS don't have direct health checks, assume healthy if service is initialized
    health.email = "healthy";
    health.sms = "healthy";

    return health;
  }
}

export function createIntegrationService(config: IntegrationConfig): IntegrationService {
  return new IntegrationService(config);
}