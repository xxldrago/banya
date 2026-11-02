"use strict";
import axios from "axios";

export interface CloudPaymentsConfig {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
}

export interface CloudPaymentsResponse {
  success: boolean;
  id?: string;
  status?: string;
  paymentUrl?: string;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
}

export class CloudPaymentsService {
  private config: CloudPaymentsConfig;

  constructor(config: CloudPaymentsConfig) {
    this.config = config;
  }

  async createPayment(amount: number, currency: string, description: string, orderId: string): Promise<CloudPaymentsResponse> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/v1/charge`, {
        amount,
        currency,
        description,
        order_id: orderId,
        auth_type: "cookie",
        skin: "simple",
        transaction_type: "charge",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?order_id=${orderId}`,
        fail_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?order_id=${orderId}`,
      }, {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.config.secretKey,
          "User-Agent": "BanyaSauna/1.0",
        },
        timeout: 30000,
      });

      return {
        success: true,
        id: response.data.id,
        status: response.data.status,
        paymentUrl: response.data.payment_url,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: {
            code: error.response?.status || 500,
            message: error.response?.data?.message || "CloudPayments API error",
            details: error.response?.data,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 500,
          message: "Internal error",
          details: error,
        },
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<CloudPaymentsResponse> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/v1/get`, {
        headers: {
          "X-API-KEY": this.config.secretKey,
          "User-Agent": "BanyaSauna/1.0",
        },
        params: { id: paymentId },
      });

      return {
        success: true,
        id: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: {
            code: error.response?.status || 500,
            message: error.response?.data?.message || "Failed to get payment status",
            details: error.response?.data,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 500,
          message: "Internal error",
        },
      };
    }
  }

  async refundPayment(paymentId: string, amount: number, reason: string): Promise<CloudPaymentsResponse> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/v1/refund`, {
        id: paymentId,
        amount,
        description: reason,
      }, {
        headers: {
          "X-API-KEY": this.config.secretKey,
          "User-Agent": "BanyaSauna/1.0",
        },
      });

      return {
        success: true,
        id: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: {
            code: error.response?.status || 500,
            message: error.response?.data?.message || "Failed to refund payment",
            details: error.response?.data,
          },
        };
      }
      return {
        success: false,
        error: {
          code: 500,
          message: "Internal error",
        },
      };
    }
  }
}

export function createCloudPaymentsService(config: CloudPaymentsConfig): CloudPaymentsService {
  return new CloudPaymentsService(config);
}