import { Order, OrderStatus, ShippingMethod, PaymentMethod, CartItem } from '../types';

/**
 * Normalizes backend Prisma/Express Order object to frontend Order model.
 */
export function mapBackendOrderToFrontendOrder(so: any): Order {
  if (!so) {
    throw new Error('Cannot map null or undefined order');
  }

  // 1. Status normalization
  let status: OrderStatus = 'pending';
  const rawStatus = String(so.status || '').toUpperCase();
  if (rawStatus === 'PREPARING' || rawStatus === 'CONFIRMED') {
    status = 'preparing';
  } else if (rawStatus === 'PACKAGED') {
    status = 'packaged';
  } else if (rawStatus === 'SHIPPED') {
    status = 'shipped';
  } else if (rawStatus === 'DELIVERED') {
    status = 'delivered';
  } else if (rawStatus === 'CANCELLED') {
    status = 'cancelled';
  } else {
    status = 'pending';
  }

  // 2. Shipping method
  const shippingMethod: ShippingMethod =
    so.shippingMethod === 'express_courier' ||
    so.shippingMethod === 'chapar_vip' ||
    so.shippingMethod === 'in_person'
      ? so.shippingMethod
      : 'post_pishtaz';

  // 3. Payment method & status
  const paymentMethod: PaymentMethod =
    so.paymentMethod === 'card_to_card'
      ? 'card_to_card'
      : so.paymentMethod === 'corporate_invoice'
      ? 'corporate_invoice'
      : 'online';

  let paymentStatus: 'paid' | 'pending' | 'failed' = 'pending';
  const rawPay = String(so.paymentStatus || '').toUpperCase();
  if (rawPay === 'PAID') paymentStatus = 'paid';
  else if (rawPay === 'FAILED') paymentStatus = 'failed';
  else paymentStatus = 'pending';

  // 4. Customer info
  const customer = {
    fullName: (so.customerName || so.customer?.fullName || 'مشتری گرامی').trim(),
    phoneNumber: (so.customerPhone || so.customer?.phoneNumber || '').trim(),
    email: so.customerEmail || so.customer?.email || undefined,
    province: so.customer?.province || 'تهران',
    city: so.deliveryCity || so.customer?.city || 'تهران',
    address: so.deliveryAddress || so.customer?.address || '',
    recipientName: so.recipientName || so.customer?.recipientName || undefined,
    recipientPhone: so.recipientPhone || so.customer?.recipientPhone || undefined,
    deliveryDate: so.deliveryDate || so.customer?.deliveryDate || undefined,
    specialInstructions: so.customPackingNotes || so.customer?.specialInstructions || undefined,
    giftCardMessage: so.cardMessage || so.customer?.giftCardMessage || undefined,
  };

  // 5. Items mapping
  const items: CartItem[] = Array.isArray(so.items)
    ? so.items.map((it: any) => {
        let customBoxDetails = it.customBoxDetails;
        if (typeof customBoxDetails === 'string') {
          try {
            customBoxDetails = JSON.parse(customBoxDetails);
          } catch {
            customBoxDetails = undefined;
          }
        }

        const unitPrice = Number(it.unitPrice || it.product?.price || 0);

        return {
          id: it.id || `item-${Math.random()}`,
          productId: it.productId || it.product?.id,
          productTitleFa: it.productTitleFa || it.product?.titleFa || 'محصول',
          productImage: it.productImage || it.product?.image || undefined,
          product: {
            id: it.productId || it.product?.id || '',
            titleFa: it.productTitleFa || it.product?.titleFa || 'محصول',
            price: unitPrice,
            sku: it.productSku || it.product?.sku,
            image: it.productImage || it.product?.image || undefined,
          } as any,
          quantity: Number(it.quantity || 1),
          unitPrice,
          isCustomBox: Boolean(it.isCustomBox),
          customBoxDetails,
          cardMessage: it.cardMessage,
          waxSeal: it.waxSeal,
          ribbonColor: it.ribbonColor,
        };
      })
    : [];

  // 6. Voice recording
  let voiceRecording = undefined;
  if (so.voiceRecordingUrl) {
    voiceRecording = {
      url: so.voiceRecordingUrl,
      duration: Number(so.voiceDuration || 0),
    };
  } else if (so.voiceRecording && so.voiceRecording.url) {
    voiceRecording = so.voiceRecording;
  }

  // 7. Dates
  const createdAtIso = so.createdAt ? new Date(so.createdAt).toISOString() : new Date().toISOString();
  let createdAtFa = 'امروز';
  try {
    if (so.createdAt) {
      createdAtFa = new Date(so.createdAt).toLocaleDateString('fa-IR');
    }
  } catch {
    createdAtFa = 'امروز';
  }

  return {
    id: so.orderNumber || so.id,
    userId: so.userId || undefined,
    customer,
    items,
    subtotal: Number(so.subtotal || 0),
    shippingCost: Number(so.shippingCost || 0),
    discountAmount: Number(so.discountAmount || 0),
    couponCode: so.couponCode || undefined,
    totalPrice: Number(so.totalAmount ?? so.totalPrice ?? 0),
    status,
    shippingMethod,
    paymentMethod,
    paymentStatus,
    voiceRecording,
    createdAt: createdAtIso,
    createdAtFa,
    adminNotes: so.adminNotes || undefined,
    trackingNumber: so.paymentTrackingCode || so.trackingNumber || undefined,
  };
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'در انتظار بررسی';
    case 'preparing':
      return 'در حال آماده‌سازی';
    case 'packaged':
      return 'مهر و موم شده';
    case 'shipped':
      return 'ارسال شده';
    case 'delivered':
      return 'تحویل شده';
    case 'cancelled':
      return 'لغو شده';
    default:
      return status;
  }
}
