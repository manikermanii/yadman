import { config } from '../config/env.js';

export interface PaymentRequestPayload {
  orderId: string;
  orderNumber: string;
  amountTomans: number;
  customerPhone: string;
  customerEmail?: string;
  description: string;
  callbackUrl?: string;
}

export interface PaymentInitResult {
  paymentUrl: string;
  authority: string;
  provider: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  refId?: string;
  amountTomans: number;
  cardPan?: string;
  statusCode?: number;
  message?: string;
}

export interface PaymentProvider {
  createPayment(payload: PaymentRequestPayload): Promise<PaymentInitResult>;
  verifyPayment(authority: string, amountTomans: number): Promise<PaymentVerificationResult>;
}

export class ZarinPalPaymentProvider implements PaymentProvider {
  private merchantId: string;
  private isSandbox: boolean;

  constructor() {
    this.merchantId = config.zarinpalMerchantId;
    this.isSandbox = config.paymentSandbox;
  }

  async createPayment(payload: PaymentRequestPayload): Promise<PaymentInitResult> {
    const callbackUrl = payload.callbackUrl || config.paymentCallbackUrl;
    const authority = `ZP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const baseUrl = this.isSandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay/'
      : 'https://www.zarinpal.com/pg/StartPay/';

    return {
      paymentUrl: `${baseUrl}${authority}`,
      authority,
      provider: 'zarinpal',
    };
  }

  async verifyPayment(authority: string, amountTomans: number): Promise<PaymentVerificationResult> {
    if (this.isSandbox) {
      return {
        success: true,
        refId: `REF-${Date.now().toString().slice(-6)}`,
        amountTomans,
        cardPan: '6037********1234',
        message: 'تراکنش آزمایشی با موفقیت انجام شد',
      };
    }

    return {
      success: false,
      message: 'درگاه زرین‌پال در حالت آزمایشی یا در حال پیکربندی است',
      amountTomans,
    };
  }
}

export const paymentService: PaymentProvider = new ZarinPalPaymentProvider();
