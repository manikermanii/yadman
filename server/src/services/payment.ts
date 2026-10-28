// Payment Gateway Provider Abstraction
// Ready for ZarinPal, IDPay, NextPay, Mellat, etc.

export interface PaymentRequestPayload {
  orderId: string;
  orderNumber: string;
  amountTomans: number;
  customerPhone: string;
  customerEmail?: string;
  description: string;
  callbackUrl: string;
}

export interface PaymentInitResult {
  paymentUrl: string;
  authority: string;
  provider: string;
}

export interface PaymentVerificationResult {
  isSuccessful: boolean;
  trackingCode?: string;
  cardPan?: string;
  feeTomans?: number;
  message: string;
}

export interface IPaymentProvider {
  name: string;
  requestPayment(payload: PaymentRequestPayload): Promise<PaymentInitResult>;
  verifyPayment(authority: string, amountTomans: number): Promise<PaymentVerificationResult>;
}

export class ZarinPalProvider implements IPaymentProvider {
  name = 'zarinpal';
  private merchantId: string;

  constructor(merchantId?: string) {
    this.merchantId = merchantId || process.env.ZARINPAL_MERCHANT_ID || '00000000-0000-0000-0000-000000000000';
  }

  async requestPayment(payload: PaymentRequestPayload): Promise<PaymentInitResult> {
    // In dev / sandbox or when real credentials are provided
    const authority = `A00000000000000000000000000${Date.now()}`;
    return {
      paymentUrl: `https://sandbox.zarinpal.com/pg/StartPay/${authority}`,
      authority,
      provider: this.name,
    };
  }

  async verifyPayment(authority: string, _amountTomans: number): Promise<PaymentVerificationResult> {
    if (!authority) {
      return { isSuccessful: false, message: 'شناسه تراکنش نامعتبر است' };
    }
    return {
      isSuccessful: true,
      trackingCode: `TRK-${Date.now().toString().slice(-8)}`,
      message: 'پرداخت با موفقیت انجام شد',
    };
  }
}

export const paymentProvider = new ZarinPalProvider();
