"use strict";
import axios from "axios";
import twilio from "twilio";

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SMSProvider {
  name: string;
  config: any;
  service: any;
}

export class SMSService {
  private twilioClient: any;
  private twilioConfig: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.twilioConfig = config;
    this.twilioClient = twilio(config.accountSid, config.authToken);
  }

  async sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: any }> {
    try {
      const response = await this.twilioClient.messages.create({
        body: message,
        to,
        from: this.twilioConfig.fromNumber,
      });

      return {
        success: true,
        sid: response.sid,
      };
    } catch (error) {
      console.error("Failed to send SMS:", error);
      return {
        success: false,
        error: {
          message: error.message || "Failed to send SMS",
          code: error.code || "unknown",
          details: error,
        },
      };
    }
  }

  async sendBookingConfirmationSms(phoneNumber: string, bookingDetails: any): Promise<{ success: boolean; sid?: string; error?: any }> {
    const message = `Подтверждение бронирования №${bookingDetails.id}. 
Объект: ${bookingDetails.venue?.title}
Дата: ${new Date(bookingDetails.startsAt).toLocaleString("ru-RU")}
Стоимость: ${bookingDetails.price} ₽`;

    return await this.sendSMS(phoneNumber, message);
  }

  async sendPaymentConfirmationSms(phoneNumber: string, paymentDetails: any, bookingDetails: any): Promise<{ success: boolean; sid?: string; error?: any }> {
    const message = `Платеж №${paymentDetails.id} подтвержден на сумму ${paymentDetails.amount} ₽. 
Статус: ${paymentDetails.status}`;

    return await this.sendSMS(phoneNumber, message);
  }

  async sendBookingReminderSms(phoneNumber: string, bookingDetails: any): Promise<{ success: boolean; sid?: string; error?: any }> {
    const message = `Напоминание: завтра посещение бани #${bookingDetails.id} в ${bookingDetails.venue?.title} в ${new Date(bookingDetails.startsAt).toLocaleTimeString("ru-RU")}`;

    return await this.sendSMS(phoneNumber, message);
  }

  async sendCancellationSms(phoneNumber: string, bookingDetails: any): Promise<{ success: boolean; sid?: string; error?: any }> {
    const message = `Бронирование #${bookingDetails.id} в ${bookingDetails.venue?.title} отменено ${bookingDetails.cancellationReason ? `причина: ${bookingDetails.cancellationReason}` : ""}`;

    return await this.sendSMS(phoneNumber, message);
  }

  async getSMSStats(): Promise<any> {
    // TODO: Implement SMS delivery tracking and statistics
    return {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      undelivered: 0,
    };
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    // Basic phone number validation (Russian format)
    const regex = /^\+7\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/;
    return regex.test(phoneNumber);
  }
}

export function createSMSService(config: TwilioConfig): SMSService {
  return new SMSService(config);
}