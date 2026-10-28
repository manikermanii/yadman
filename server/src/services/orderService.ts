import { productService, invalidateProductCache } from './productService.js';
import { initialStoreData } from '../utils/initialStoreData.js';
import { storageService } from './storageService.js';
import { prisma, isDbConnected } from '../config/database.js';

let inMemoryCarts: Map<string, any[]> = new Map(); // key = userId or sessionId
let inMemoryOrders: any[] = [];
let inMemoryCoupons: any[] = (initialStoreData.coupons as any[]).map((c, idx) => ({
  id: c.id || `cpn-${idx + 1}`,
  code: c.code,
  discountPercent: c.discountPercent || null,
  discountAmount: c.discountAmount || null,
  minOrderAmount: c.minOrderAmount || 0,
  maxDiscount: c.maxDiscount || null,
  usageLimit: c.usageLimit || 100,
  usedCount: c.usedCount || 0,
  description: c.description || '',
  isActive: c.isActive !== false,
}));

function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4)
    + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    days -= v;
  }
  return new Date(Date.UTC(gy, gm - 1, gd, 23, 59, 59));
}

function parseDateInput(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    // Normalize Persian digits to English
    const normalized = trimmed.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const parts = normalized.split(/[\/\-]/);
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      if (p0 >= 1300 && p0 <= 1500) {
        return jalaliToGregorian(p0, p1, p2);
      }
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatCouponFromPrisma(c: any) {
  if (!c) return null;
  const isPercent = c.discountPercent != null && c.discountPercent > 0;
  const type: 'percentage' | 'fixed' = isPercent ? 'percentage' : 'fixed';
  const value = isPercent ? Number(c.discountPercent) : Number(c.discountAmount || 0);

  const startDateFa = c.startDate
    ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(c.startDate))
    : undefined;

  const expiresAtFa = c.expiresAt
    ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(c.expiresAt))
    : undefined;

  return {
    id: c.id,
    code: c.code,
    type,
    value,
    discountPercent: c.discountPercent != null ? Number(c.discountPercent) : null,
    discountAmount: c.discountAmount != null ? Number(c.discountAmount) : null,
    minOrderAmount: Number(c.minOrderAmount || 0),
    maxDiscountAmount: c.maxDiscount != null ? Number(c.maxDiscount) : undefined,
    maxDiscount: c.maxDiscount != null ? Number(c.maxDiscount) : null,
    usageLimit: Number(c.usageLimit || 100),
    usageCount: Number(c.usedCount || 0),
    usedCount: Number(c.usedCount || 0),
    isActive: Boolean(c.isActive),
    startDate: c.startDate ? new Date(c.startDate).toISOString() : null,
    startDateFa,
    expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
    expiresAtFa,
    description: c.description || '',
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : undefined,
  };
}

export class CouponService {
  async getCoupons() {
    if (isDbConnected()) {
      try {
        const dbCoupons = await prisma.coupon.findMany({
          orderBy: { createdAt: 'desc' },
        });
        return dbCoupons.map(formatCouponFromPrisma);
      } catch (err) {
        console.warn('Prisma getCoupons fallback:', err);
      }
    }
    return inMemoryCoupons.map(formatCouponFromPrisma);
  }

  async getActiveCoupons() {
    if (isDbConnected()) {
      try {
        const now = new Date();
        const dbCoupons = await prisma.coupon.findMany({
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });
        return dbCoupons.map(formatCouponFromPrisma);
      } catch (err) {
        console.warn('Prisma getActiveCoupons fallback:', err);
      }
    }
    return inMemoryCoupons.filter((c) => c.isActive).map(formatCouponFromPrisma);
  }

  async validateCoupon(code: string, cartSubtotal: number) {
    let coupon: any = null;

    if (isDbConnected()) {
      try {
        coupon = await prisma.coupon.findFirst({
          where: {
            code: {
              equals: code.trim(),
              mode: 'insensitive',
            },
          },
        });
      } catch (err) {
        console.warn('Prisma find coupon fallback:', err);
      }
    }

    if (!coupon) {
      coupon = inMemoryCoupons.find(
        (c) => c.code.toUpperCase() === code.trim().toUpperCase()
      );
    }

    if (!coupon) {
      throw new Error('کد تخفیف وارد شده معتبر نیست.');
    }

    if (!coupon.isActive) {
      throw new Error('این کد تخفیف در حال حاضر غیرفعال است.');
    }

    const now = new Date();
    if (coupon.startDate && now < new Date(coupon.startDate)) {
      throw new Error('مهلت استفاده از این کد تخفیف هنوز شروع نشده است.');
    }

    if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
      throw new Error('مهلت استفاده از این کد تخفیف به پایان رسیده است.');
    }

    if (coupon.minOrderAmount && cartSubtotal < coupon.minOrderAmount) {
      throw new Error(
        `حداقل مبلغ سفارش برای اعمال این کد ${coupon.minOrderAmount.toLocaleString('fa-IR')} تومان است.`
      );
    }

    if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
      throw new Error('سقف مجاز استفاده از این کد تخفیف به پایان رسیده است.');
    }

    let discountAmount = 0;
    if (coupon.discountPercent) {
      discountAmount = Math.round((cartSubtotal * coupon.discountPercent) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.discountAmount) {
      discountAmount = coupon.discountAmount;
    }

    return {
      isValid: true,
      coupon: formatCouponFromPrisma(coupon),
      discountAmount,
    };
  }

  async createCoupon(data: any) {
    const code = data.code.toUpperCase().trim();
    if (!code || code.length < 2) {
      throw new Error('کد تخفیف باید حداقل ۲ کاراکتر باشد.');
    }

    let discountPercent: number | null = null;
    let discountAmount: number | null = null;

    if (data.type === 'percentage' || (data.discountPercent != null && !data.discountAmount)) {
      const p = Number(data.value != null ? data.value : data.discountPercent);
      if (isNaN(p) || p <= 0 || p > 100) {
        throw new Error('درصد تخفیف باید عددی بین ۱ تا ۱۰۰ باشد.');
      }
      discountPercent = p;
    } else {
      const a = Number(data.value != null ? data.value : data.discountAmount);
      if (isNaN(a) || a <= 0) {
        throw new Error('مبلغ تخفیف باید بزرگتر از صفر باشد.');
      }
      discountAmount = a;
    }

    const minOrderAmount = data.minOrderAmount != null ? Math.max(0, Number(data.minOrderAmount)) : 0;
    const maxDiscount = data.maxDiscountAmount != null
      ? Number(data.maxDiscountAmount)
      : (data.maxDiscount != null ? Number(data.maxDiscount) : null);
    const usageLimit = data.usageLimit != null ? Math.max(1, parseInt(String(data.usageLimit), 10)) : 100;
    const isActive = data.isActive !== false;
    const description = data.description ? String(data.description).trim() : '';

    const startDate = parseDateInput(data.startDate || data.startDateFa);
    const expiresAt = parseDateInput(data.expiresAt || data.expiresAtFa);

    if (startDate && expiresAt && startDate.getTime() > expiresAt.getTime()) {
      throw new Error('تاریخ شروع نمی‌تواند پس از تاریخ انقضا باشد.');
    }

    if (isDbConnected()) {
      // Check existing code
      const existing = await prisma.coupon.findFirst({
        where: { code: { equals: code, mode: 'insensitive' } },
      });
      if (existing) {
        throw new Error(`کد تخفیف «${code}» قبلاً ثبت شده است.`);
      }

      const created = await prisma.coupon.create({
        data: {
          id: data.id || `cpn-${Date.now().toString().slice(-6)}`,
          code,
          discountPercent,
          discountAmount,
          minOrderAmount,
          maxDiscount,
          usageLimit,
          usedCount: 0,
          description,
          isActive,
          startDate,
          expiresAt,
        },
      });
      return formatCouponFromPrisma(created);
    }

    const existingInMemory = inMemoryCoupons.find((c) => c.code.toUpperCase() === code);
    if (existingInMemory) {
      throw new Error(`کد تخفیف «${code}» قبلاً ثبت شده است.`);
    }

    const newCoupon = {
      id: data.id || `cpn-${Date.now().toString().slice(-6)}`,
      code,
      discountPercent,
      discountAmount,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      usedCount: 0,
      description,
      isActive,
      startDate,
      expiresAt,
    };
    inMemoryCoupons.unshift(newCoupon);
    return formatCouponFromPrisma(newCoupon);
  }

  async updateCoupon(id: string, data: any) {
    if (isDbConnected()) {
      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('کد تخفیف مورد نظر یافت نشد.');
      }

      let newCode: string | undefined = undefined;
      if (data.code) {
        newCode = data.code.toUpperCase().trim();
        if (newCode !== existing.code) {
          const duplicate = await prisma.coupon.findFirst({
            where: {
              code: { equals: newCode, mode: 'insensitive' },
              id: { not: id },
            },
          });
          if (duplicate) {
            throw new Error(`کد تخفیف «${newCode}» قبلاً ثبت شده است.`);
          }
        }
      }

      let discountPercent = existing.discountPercent;
      let discountAmount = existing.discountAmount;

      if (data.type !== undefined || data.value !== undefined || data.discountPercent !== undefined || data.discountAmount !== undefined) {
        const type = data.type || (existing.discountPercent ? 'percentage' : 'fixed');
        if (type === 'percentage') {
          const p = Number(data.value != null ? data.value : (data.discountPercent != null ? data.discountPercent : existing.discountPercent));
          if (isNaN(p) || p <= 0 || p > 100) {
            throw new Error('درصد تخفیف باید عددی بین ۱ تا ۱۰۰ باشد.');
          }
          discountPercent = p;
          discountAmount = null;
        } else {
          const a = Number(data.value != null ? data.value : (data.discountAmount != null ? data.discountAmount : existing.discountAmount));
          if (isNaN(a) || a <= 0) {
            throw new Error('مبلغ تخفیف باید بزرگتر از صفر باشد.');
          }
          discountAmount = a;
          discountPercent = null;
        }
      }

      const minOrderAmount = data.minOrderAmount !== undefined
        ? Math.max(0, Number(data.minOrderAmount))
        : existing.minOrderAmount;

      let maxDiscount = existing.maxDiscount;
      if (data.maxDiscountAmount !== undefined) {
        maxDiscount = data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null;
      } else if (data.maxDiscount !== undefined) {
        maxDiscount = data.maxDiscount ? Number(data.maxDiscount) : null;
      }

      const usageLimit = data.usageLimit !== undefined
        ? Math.max(1, parseInt(String(data.usageLimit), 10))
        : existing.usageLimit;

      const isActive = data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive;
      const description = data.description !== undefined ? String(data.description).trim() : existing.description;

      const startDate = (data.startDate !== undefined || data.startDateFa !== undefined)
        ? parseDateInput(data.startDate || data.startDateFa)
        : existing.startDate;

      const expiresAt = (data.expiresAt !== undefined || data.expiresAtFa !== undefined)
        ? parseDateInput(data.expiresAt || data.expiresAtFa)
        : existing.expiresAt;

      if (startDate && expiresAt && startDate.getTime() > expiresAt.getTime()) {
        throw new Error('تاریخ شروع نمی‌تواند پس از تاریخ انقضا باشد.');
      }

      const updated = await prisma.coupon.update({
        where: { id },
        data: {
          code: newCode,
          discountPercent,
          discountAmount,
          minOrderAmount,
          maxDiscount,
          usageLimit,
          description,
          isActive,
          startDate,
          expiresAt,
        },
      });
      return formatCouponFromPrisma(updated);
    }

    const index = inMemoryCoupons.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('کد تخفیف مورد نظر یافت نشد.');
    inMemoryCoupons[index] = { ...inMemoryCoupons[index], ...data };
    return formatCouponFromPrisma(inMemoryCoupons[index]);
  }

  async deleteCoupon(id: string) {
    if (isDbConnected()) {
      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('کد تخفیف مورد نظر یافت نشد.');
      }
      const deleted = await prisma.coupon.delete({ where: { id } });
      return formatCouponFromPrisma(deleted);
    }
    const index = inMemoryCoupons.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('کد تخفیف مورد نظر یافت نشد.');
    const [deleted] = inMemoryCoupons.splice(index, 1);
    return formatCouponFromPrisma(deleted);
  }
}

export const couponService = new CouponService();

function formatCartItemFromPrisma(item: any) {
  let customBoxDetails = null;
  if (item.customBoxDetails) {
    try {
      customBoxDetails = typeof item.customBoxDetails === 'string'
        ? JSON.parse(item.customBoxDetails)
        : item.customBoxDetails;
    } catch {
      customBoxDetails = null;
    }
  }

  const isCustomBox = Boolean(item.isCustomBox);
  // Source of truth: real product price from PostgreSQL database
  const unitPrice = isCustomBox
    ? Number(customBoxDetails?.totalPrice || 0)
    : Number(item.product?.price || 0);

  const product = item.product ? {
    id: item.product.id,
    titleFa: item.product.titleFa,
    titleEn: item.product.titleEn,
    slug: item.product.slug,
    sku: item.product.sku,
    price: Number(item.product.price),
    oldPrice: item.product.oldPrice ? Number(item.product.oldPrice) : null,
    discountPercent: item.product.discountPercent ? Number(item.product.discountPercent) : null,
    image: item.product.image,
    boxType: item.product.boxType,
    ribbonColor: item.product.ribbonColor,
    ribbonColorHex: item.product.ribbonColorHex,
    waxSeal: item.product.waxSeal,
    inStock: item.product.inStock !== false,
    stockQuantity: Number(item.product.stockQuantity ?? 15),
    status: item.product.status,
  } : null;

  return {
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    product,
    productTitleFa: product?.titleFa || 'پک هدیه یادمان',
    productImage: product?.image || '',
    productSku: product?.sku || '',
    isCustomBox,
    customBoxDetails,
    quantity: Number(item.quantity || 1),
    unitPrice,
    totalPrice: unitPrice * Number(item.quantity || 1),
    cardMessage: item.cardMessage || null,
    recipientName: item.recipientName || null,
    deliveryDate: item.deliveryDate || null,
    ribbonColor: item.ribbonColor || product?.ribbonColor || null,
    waxSeal: item.waxSeal || product?.waxSeal || null,
    voiceRecordingUrl: item.voiceRecordingUrl || null,
    voiceDuration: item.voiceDuration ? Number(item.voiceDuration) : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export class CartService {
  async getCart(cartKey: string) {
    const cleanUserId = cartKey.startsWith('user_') ? cartKey.replace('user_', '') : cartKey;

    if (isDbConnected()) {
      try {
        let cart = await prisma.cart.findUnique({
          where: { userId: cleanUserId },
          include: {
            items: {
              include: {
                product: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        if (!cart) {
          cart = await prisma.cart.create({
            data: { userId: cleanUserId },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          });
        }

        const items = (cart.items || []).map(formatCartItemFromPrisma);
        const subtotal = items.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
        const itemCount = items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

        return {
          id: cart.id,
          userId: cart.userId,
          items,
          subtotal,
          itemCount,
          couponCode: cart.couponCode || null,
        };
      } catch (err) {
        console.error('Prisma getCart error, falling back to memory:', err);
      }
    }

    const items = inMemoryCarts.get(cleanUserId) || inMemoryCarts.get(cartKey) || [];
    let subtotal = 0;
    for (const item of items) {
      subtotal += (item.unitPrice || 0) * (item.quantity || 1);
    }
    return {
      items,
      subtotal,
      itemCount: items.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
    };
  }

  async addItem(cartKey: string, payload: any) {
    const cleanUserId = cartKey.startsWith('user_') ? cartKey.replace('user_', '') : cartKey;
    const quantity = Math.max(1, parseInt(String(payload.quantity), 10) || 1);

    if (isDbConnected()) {
      try {
        let product: any = null;
        if (!payload.isCustomBox) {
          if (!payload.productId) {
            const error: any = new Error('شناسه محصول الزامی است.');
            error.statusCode = 400;
            throw error;
          }

          product = await prisma.product.findUnique({
            where: { id: payload.productId },
          });

          if (!product) {
            // Also check by slug or sku
            product = await prisma.product.findFirst({
              where: {
                OR: [
                  { id: payload.productId },
                  { slug: payload.productId },
                  { sku: payload.productId },
                ],
              },
            });
          }

          if (!product) {
            const error: any = new Error('محصول مورد نظر در فروشگاه یافت نشد.');
            error.statusCode = 404;
            throw error;
          }

          if (product.status && product.status.toUpperCase() !== 'ACTIVE') {
            const error: any = new Error('این محصول در حال حاضر غیرفعال است.');
            error.statusCode = 400;
            throw error;
          }

          if (product.inStock === false || (product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
            const error: any = new Error('این محصول در حال حاضر ناموجود است.');
            error.statusCode = 400;
            throw error;
          }

          if (product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity < quantity) {
            const error: any = new Error(`موجودی کالا (${product.stockQuantity} عدد) کمتر از تعداد درخواستی است.`);
            error.statusCode = 400;
            throw error;
          }
        }

        // Find or create user's cart in DB
        let cart = await prisma.cart.findUnique({
          where: { userId: cleanUserId },
        });
        if (!cart) {
          cart = await prisma.cart.create({
            data: { userId: cleanUserId },
          });
        }

        // Check for existing identical product in user's cart
        if (!payload.isCustomBox && product) {
          const existingItem = await prisma.cartItem.findFirst({
            where: {
              cartId: cart.id,
              productId: product.id,
              isCustomBox: false,
            },
          });

          if (existingItem) {
            const newQty = existingItem.quantity + quantity;
            if (product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity < newQty) {
              const error: any = new Error(`حداکثر موجودی قابل سفارش این محصول ${product.stockQuantity} عدد است.`);
              error.statusCode = 400;
              throw error;
            }

            await prisma.cartItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: newQty,
                ribbonColor: payload.ribbonColor || existingItem.ribbonColor,
                waxSeal: payload.waxSeal || existingItem.waxSeal,
                cardMessage: payload.cardMessage || existingItem.cardMessage,
                recipientName: payload.recipientName || existingItem.recipientName,
                deliveryDate: payload.deliveryDate || existingItem.deliveryDate,
                voiceRecordingUrl: payload.voiceRecordingUrl || existingItem.voiceRecordingUrl,
                voiceDuration: payload.voiceDuration !== undefined ? (payload.voiceDuration ? Number(payload.voiceDuration) : null) : existingItem.voiceDuration,
              },
            });

            return this.getCart(cleanUserId);
          }
        }

        // Create new item in user's cart
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product ? product.id : null,
            isCustomBox: Boolean(payload.isCustomBox),
            customBoxDetails: payload.customBoxDetails
              ? (typeof payload.customBoxDetails === 'string' ? payload.customBoxDetails : JSON.stringify(payload.customBoxDetails))
              : null,
            quantity,
            ribbonColor: payload.ribbonColor || product?.ribbonColor || null,
            waxSeal: payload.waxSeal || product?.waxSeal || null,
            cardMessage: payload.cardMessage || null,
            recipientName: payload.recipientName || null,
            deliveryDate: payload.deliveryDate || null,
            voiceRecordingUrl: payload.voiceRecordingUrl || null,
            voiceDuration: payload.voiceDuration ? Number(payload.voiceDuration) : null,
          },
        });

        return this.getCart(cleanUserId);
      } catch (err: any) {
        if (err.statusCode) throw err;
        console.error('Prisma addItem error, falling back to memory:', err);
      }
    }

    // Memory fallback
    let items = inMemoryCarts.get(cleanUserId) || [];
    if (payload.isCustomBox) {
      const customItem = {
        id: `CART-CUST-${Date.now()}`,
        isCustomBox: true,
        customBoxDetails: payload.customBoxDetails,
        unitPrice: payload.unitPrice || 0,
        quantity,
        ribbonColor: payload.ribbonColor,
        waxSeal: payload.waxSeal,
        cardMessage: payload.cardMessage,
        recipientName: payload.recipientName,
        deliveryDate: payload.deliveryDate,
        voiceRecordingUrl: payload.voiceRecordingUrl,
        voiceDuration: payload.voiceDuration,
      };
      items.push(customItem);
    } else {
      const product = await productService.getProductById(payload.productId);
      if (product && (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0))) {
        const error: any = new Error('این محصول در حال حاضر ناموجود است.');
        error.statusCode = 400;
        throw error;
      }
      const existingIndex = items.findIndex((i) => i.productId === payload.productId && !i.isCustomBox);
      if (existingIndex > -1) {
        items[existingIndex].quantity += quantity;
      } else {
        items.push({
          id: `CART-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: payload.productId,
          productTitleFa: product?.titleFa || 'پک هدیه یادمان',
          productSku: product?.sku,
          productImage: product?.image,
          unitPrice: product?.price || payload.unitPrice || 0,
          quantity,
          ribbonColor: payload.ribbonColor || product?.ribbonColor,
          waxSeal: payload.waxSeal || product?.waxSeal,
          cardMessage: payload.cardMessage,
          recipientName: payload.recipientName,
          deliveryDate: payload.deliveryDate,
          voiceRecordingUrl: payload.voiceRecordingUrl,
          voiceDuration: payload.voiceDuration,
        });
      }
    }
    inMemoryCarts.set(cleanUserId, items);
    return this.getCart(cleanUserId);
  }

  async addToCart(cartKey: string, payload: any) {
    return this.addItem(cartKey, payload);
  }

  async updateItemQuantity(cartKey: string, itemId: string, quantity: number) {
    const cleanUserId = cartKey.startsWith('user_') ? cartKey.replace('user_', '') : cartKey;
    const qty = parseInt(String(quantity), 10);

    if (isDbConnected()) {
      try {
        const item = await prisma.cartItem.findUnique({
          where: { id: itemId },
          include: {
            cart: true,
            product: true,
          },
        });

        if (!item) {
          const error: any = new Error('آیتم مورد نظر در سبد خرید یافت نشد.');
          error.statusCode = 404;
          throw error;
        }

        // STRICT SERVER-SIDE OWNERSHIP ENFORCEMENT
        if (item.cart.userId !== cleanUserId) {
          const error: any = new Error('شما دسترسی لازم برای ویرایش این آیتم را ندارید.');
          error.statusCode = 403;
          throw error;
        }

        if (qty <= 0) {
          await prisma.cartItem.delete({
            where: { id: itemId },
          });
          return this.getCart(cleanUserId);
        }

        if (item.product && item.product.stockQuantity !== null && item.product.stockQuantity !== undefined) {
          if (item.product.stockQuantity < qty) {
            const error: any = new Error(`موجودی کالا (${item.product.stockQuantity} عدد) کمتر از تعداد درخواستی است.`);
            error.statusCode = 400;
            throw error;
          }
        }

        await prisma.cartItem.update({
          where: { id: itemId },
          data: { quantity: qty },
        });

        return this.getCart(cleanUserId);
      } catch (err: any) {
        if (err.statusCode) throw err;
        console.error('Prisma updateItemQuantity error, falling back to memory:', err);
      }
    }

    let items = inMemoryCarts.get(cleanUserId) || [];
    if (qty <= 0) {
      items = items.filter((i) => i.id !== itemId);
    } else {
      const item = items.find((i) => i.id === itemId);
      if (item) item.quantity = qty;
    }
    inMemoryCarts.set(cleanUserId, items);
    return this.getCart(cleanUserId);
  }

  async removeItem(cartKey: string, itemId: string) {
    const cleanUserId = cartKey.startsWith('user_') ? cartKey.replace('user_', '') : cartKey;

    if (isDbConnected()) {
      try {
        const item = await prisma.cartItem.findUnique({
          where: { id: itemId },
          include: { cart: true },
        });

        if (!item) {
          const error: any = new Error('آیتم مورد نظر در سبد خرید یافت نشد.');
          error.statusCode = 404;
          throw error;
        }

        // STRICT SERVER-SIDE OWNERSHIP ENFORCEMENT
        if (item.cart.userId !== cleanUserId) {
          const error: any = new Error('شما دسترسی لازم برای حذف این آیتم را ندارید.');
          error.statusCode = 403;
          throw error;
        }

        await prisma.cartItem.delete({
          where: { id: itemId },
        });

        return this.getCart(cleanUserId);
      } catch (err: any) {
        if (err.statusCode) throw err;
        console.error('Prisma removeItem error, falling back to memory:', err);
      }
    }

    let items = inMemoryCarts.get(cleanUserId) || [];
    items = items.filter((i) => i.id !== itemId);
    inMemoryCarts.set(cleanUserId, items);
    return this.getCart(cleanUserId);
  }

  async clearCart(cartKey: string) {
    const cleanUserId = cartKey.startsWith('user_') ? cartKey.replace('user_', '') : cartKey;

    if (isDbConnected()) {
      try {
        const cart = await prisma.cart.findUnique({
          where: { userId: cleanUserId },
        });
        if (cart) {
          await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }
        return {
          id: cart?.id || '',
          userId: cleanUserId,
          items: [],
          subtotal: 0,
          itemCount: 0,
          couponCode: null,
        };
      } catch (err) {
        console.error('Prisma clearCart error:', err);
      }
    }

    inMemoryCarts.delete(cleanUserId);
    return { items: [], subtotal: 0, itemCount: 0 };
  }
}

export const cartService = new CartService();

function formatOrderFromPrisma(o: any) {
  return {
    ...o,
    trackingNumber: o.paymentTrackingCode || undefined,
    items: o.items ? o.items.map((it: any) => ({
      ...it,
      customBoxDetails: typeof it.customBoxDetails === 'string' ? JSON.parse(it.customBoxDetails || '{}') : it.customBoxDetails,
    })) : [],
  };
}

function calculateShippingCost(shippingMethod?: string): number {
  switch (shippingMethod) {
    case 'express_courier':
      return 150000;
    case 'chapar_vip':
      return 180000;
    case 'in_person':
      return 0;
    case 'post_pishtaz':
    default:
      return 95000;
  }
}

export class OrderService {
  async createOrder(data: any) {
    // 1. Normalize Customer & Address Data (never trust client userId)
    const customer = data.customer || {};
    const customerName = (customer.fullName || data.customerName || 'کاربر گرامی').trim();
    const customerPhone = (customer.phoneNumber || data.customerPhone || '').trim();
    const customerEmail = customer.email || data.customerEmail || null;
    const recipientName = customer.recipientName || data.recipientName || null;
    const recipientPhone = customer.recipientPhone || data.recipientPhone || null;
    const deliveryAddress = (customer.address || data.deliveryAddress || '').trim();
    const deliveryCity = (customer.city || data.deliveryCity || 'تهران').trim();
    const deliveryDate = customer.deliveryDate || data.deliveryDate || null;
    const deliveryTimeSlot = customer.deliveryTimeSlot || data.deliveryTimeSlot || null;
    const cardMessage = customer.giftCardMessage || data.cardMessage || null;
    const customPackingNotes = customer.specialInstructions || data.customPackingNotes || null;
    const voiceRecordingUrl = customer.voiceRecording?.url || data.voiceRecordingUrl || null;
    const voiceDuration = customer.voiceRecording?.duration || data.voiceDuration ? Number(customer.voiceRecording?.duration || data.voiceDuration) : null;
    const shippingMethod = data.shippingMethod || 'post_pishtaz';
    const paymentMethod = data.paymentMethod || 'online';
    const couponCode = data.couponCode ? data.couponCode.trim() : null;

    if (!customerPhone) {
      throw new Error('شماره تماس مشتری الزامی است.');
    }
    if (!deliveryAddress) {
      throw new Error('آدرس تحویل سفارش الزامی است.');
    }

    const rawItems = Array.isArray(data.items) ? data.items : [];
    if (rawItems.length === 0) {
      throw new Error('سبد خرید شما خالی است.');
    }

    // 2. Perform strictly via Prisma database transaction when DB is connected
    if (isDbConnected()) {
      const createdOrderResult = await prisma.$transaction(async (tx) => {
        // Collect product IDs to validate
        const productIds = rawItems
          .filter((it: any) => it.productId && !it.isCustomBox)
          .map((it: any) => it.productId);

        const dbProducts = productIds.length > 0
          ? await tx.product.findMany({
              where: { id: { in: productIds } },
              include: { images: true },
            })
          : [];
        const dbProductMap = new Map(dbProducts.map((p) => [p.id, p]));

        // Validate items and calculate subtotal strictly from DB prices
        const preparedItems: Array<{
          id: string;
          productId: string | null;
          productTitleFa: string;
          productSku: string | null;
          productImage: string | null;
          isCustomBox: boolean;
          customBoxDetails: string | null;
          unitPrice: number;
          quantity: number;
          totalPrice: number;
          ribbonColor: string | null;
          waxSeal: string | null;
        }> = [];

        let calculatedSubtotal = 0;

        for (const item of rawItems) {
          const qty = Math.max(1, Number(item.quantity) || 1);

          if (item.isCustomBox) {
            // Custom box calculation
            const boxDetails = item.customBoxDetails || {};
            const boxPrice = Number(boxDetails.boxType?.price) || 0;
            const itemsPrice = Array.isArray(boxDetails.items)
              ? boxDetails.items.reduce((sum: number, ci: any) => sum + (Number(ci.price) || 0), 0)
              : 0;
            const unitPrice = boxPrice + itemsPrice;
            const itemTotal = unitPrice * qty;

            calculatedSubtotal += itemTotal;
            preparedItems.push({
              id: `ITEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              productId: null,
              productTitleFa: boxDetails.boxType?.nameFa || 'پک هدیه اختصاصی دست‌ساز',
              productSku: 'CUSTOM-BOX',
              productImage: boxDetails.boxType?.image || null,
              isCustomBox: true,
              customBoxDetails: JSON.stringify(boxDetails),
              unitPrice,
              quantity: qty,
              totalPrice: itemTotal,
              ribbonColor: item.ribbonColor || boxDetails.ribbon?.nameFa || null,
              waxSeal: item.waxSeal || boxDetails.waxSeal?.nameFa || null,
            });
          } else {
            const dbProduct = dbProductMap.get(item.productId);
            if (!dbProduct) {
              throw new Error(`محصول با شناسه ${item.productId} در پایگاه‌داده یافت نشد یا نامعتبر است.`);
            }

            // Check stock availability
            if (!dbProduct.inStock || dbProduct.stockQuantity <= 0) {
              throw new Error(`محصول «${dbProduct.titleFa}» در حال حاضر ناموجود است.`);
            }
            if (dbProduct.stockQuantity < qty) {
              throw new Error(`موجودی کالای «${dbProduct.titleFa}» کافی نیست (موجودی فعلی: ${dbProduct.stockQuantity} عدد).`);
            }

            // Decrement stock transactionally and guarantee non-negative stock
            const remainingStock = Math.max(0, dbProduct.stockQuantity - qty);
            await tx.product.update({
              where: { id: dbProduct.id },
              data: {
                stockQuantity: remainingStock,
                inStock: remainingStock > 0,
              },
            });

            const unitPrice = Number(dbProduct.price);
            const itemTotal = unitPrice * qty;
            calculatedSubtotal += itemTotal;

            const primaryImg = dbProduct.image || (dbProduct.images && dbProduct.images.length > 0 ? dbProduct.images[0].url : null);

            preparedItems.push({
              id: `ITEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              productId: dbProduct.id,
              productTitleFa: dbProduct.titleFa,
              productSku: dbProduct.sku,
              productImage: primaryImg,
              isCustomBox: false,
              customBoxDetails: null,
              unitPrice,
              quantity: qty,
              totalPrice: itemTotal,
              ribbonColor: item.ribbonColor || null,
              waxSeal: item.waxSeal || null,
            });
          }
        }

        // Validate coupon strictly on server
        let calculatedDiscount = 0;
        let validatedCouponCode: string | null = null;

        if (couponCode) {
          const coupon = await tx.coupon.findFirst({
            where: {
              code: {
                equals: couponCode,
                mode: 'insensitive',
              },
            },
          });

          if (!coupon) {
            throw new Error('کد تخفیف وارد شده معتبر نیست.');
          }
          if (!coupon.isActive) {
            throw new Error('این کد تخفیف در حال حاضر غیرفعال است.');
          }
          if (coupon.minOrderAmount && calculatedSubtotal < coupon.minOrderAmount) {
            throw new Error(`حداقل مبلغ خرید برای اعمال این کد ${coupon.minOrderAmount.toLocaleString('fa-IR')} تومان است.`);
          }
          if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
            throw new Error('سقف مجاز استفاده از این کد تخفیف به پایان رسیده است.');
          }

          if (coupon.discountPercent) {
            calculatedDiscount = Math.round((calculatedSubtotal * coupon.discountPercent) / 100);
            if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
              calculatedDiscount = coupon.maxDiscount;
            }
          } else if (coupon.discountAmount) {
            calculatedDiscount = coupon.discountAmount;
          }

          // Increment coupon used count atomically in transaction
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });

          validatedCouponCode = coupon.code;
        }

        // Calculate shipping cost on server
        const calculatedShipping = calculateShippingCost(shippingMethod);
        const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscount + calculatedShipping);

        // Generate unique order number
        const orderNumber = `YAD-${Date.now().toString().slice(-6)}`;

        // Create Order and nested OrderItems in transaction
        const createdOrder = await tx.order.create({
          data: {
            id: `ORD-${Date.now()}`,
            orderNumber,
            userId: data.userId || null,
            customerName,
            customerPhone,
            customerEmail,
            recipientName,
            recipientPhone,
            deliveryAddress,
            deliveryCity,
            deliveryDate,
            deliveryTimeSlot,
            cardMessage,
            customPackingNotes,
            voiceRecordingUrl,
            voiceDuration,
            subtotal: calculatedSubtotal,
            discountAmount: calculatedDiscount,
            shippingCost: calculatedShipping,
            totalAmount: calculatedTotal,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            paymentProvider: paymentMethod === 'corporate_invoice' ? 'corporate_invoice' : (data.paymentProvider || 'zarinpal'),
            couponCode: validatedCouponCode,
            adminNotes: data.adminNotes || null,
            items: {
              create: preparedItems,
            },
          },
          include: {
            items: true,
          },
        });

        return formatOrderFromPrisma(createdOrder);
      });
      invalidateProductCache();
      return createdOrderResult;
    }

    // Fallback if DB is disconnected
    const orderNumber = `YAD-${Date.now().toString().slice(-6)}`;
    const shippingCost = calculateShippingCost(shippingMethod);
    const subtotal = rawItems.reduce((acc: number, item: any) => acc + (item.unitPrice || item.price || 0) * (item.quantity || 1), 0);
    const totalAmount = subtotal + shippingCost;

    const fallbackOrder = {
      id: `ORD-${Date.now()}`,
      orderNumber,
      userId: data.userId || null,
      customerName,
      customerPhone,
      customerEmail,
      recipientName,
      recipientPhone,
      deliveryAddress,
      deliveryCity,
      deliveryDate,
      cardMessage,
      customPackingNotes,
      voiceRecordingUrl,
      voiceDuration,
      subtotal,
      discountAmount: 0,
      shippingCost,
      totalAmount,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentProvider: 'zarinpal',
      items: rawItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Decrement stock for in-memory products
    for (const item of rawItems) {
      if (item.productId && !item.isCustomBox) {
        await productService.updateStock(item.productId, -(item.quantity || 1));
      }
    }

    inMemoryOrders.unshift(fallbackOrder);
    return fallbackOrder;
  }

  async getMyOrders(userId: string, phone?: string) {
    if (isDbConnected()) {
      try {
        const whereConditions: any[] = [];
        if (userId) whereConditions.push({ userId });
        if (phone) whereConditions.push({ customerPhone: phone });
        
        if (whereConditions.length > 0) {
          const dbOrders = await prisma.order.findMany({
            where: { OR: whereConditions },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
          });
          return dbOrders.map(formatOrderFromPrisma);
        }
      } catch (err) {
        console.warn('Prisma getMyOrders fallback:', err);
      }
    }
    return inMemoryOrders.filter(
      (o) => (userId && o.userId === userId) || (phone && o.customerPhone === phone)
    );
  }

  async getOrders(query?: { userId?: string; phone?: string; status?: string; search?: string }) {
    if (isDbConnected()) {
      try {
        const where: any = {};
        if (query?.userId) where.userId = query.userId;
        if (query?.phone) where.customerPhone = query.phone;
        if (query?.status && query.status !== 'all') where.status = query.status.toUpperCase();
        if (query?.search) {
          where.OR = [
            { orderNumber: { contains: query.search, mode: 'insensitive' } },
            { customerName: { contains: query.search, mode: 'insensitive' } },
            { customerPhone: { contains: query.search } },
          ];
        }
        const dbOrders = await prisma.order.findMany({
          where,
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        });
        return dbOrders.map(formatOrderFromPrisma);
      } catch (err) {
        console.warn('Prisma getOrders fallback:', err);
      }
    }

    let list = [...inMemoryOrders];
    if (query?.userId) {
      list = list.filter((o) => o.userId === query.userId);
    }
    if (query?.phone) {
      list = list.filter((o) => o.customerPhone === query.phone);
    }
    if (query?.status && query.status !== 'all') {
      list = list.filter((o) => o.status === query.status);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      );
    }
    return list;
  }

  async getOrderById(id: string) {
    if (isDbConnected()) {
      try {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { id },
              { orderNumber: id },
            ],
          },
          include: { items: true },
        });
        if (order) return formatOrderFromPrisma(order);
      } catch (err) {
        console.warn('Prisma getOrderById fallback:', err);
      }
    }
    return inMemoryOrders.find((o) => o.id === id || o.orderNumber === id);
  }

  async getAllOrdersAdmin(query?: { status?: string; search?: string }) {
    return this.getOrders(query);
  }

  async updateOrderStatus(id: string, status: string, adminNotes?: string, trackingNumber?: string) {
    const upperStatus = status.toUpperCase();

    if (isDbConnected()) {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const existing = await tx.order.findFirst({
          where: { OR: [{ id }, { orderNumber: id }] },
          include: { items: true },
        });
        if (!existing) throw new Error('سفارش مورد نظر یافت نشد.');

        const prevStatus = existing.status.toUpperCase();

        // 1. Stock restoration if transitioning to CANCELLED from an active status
        if (upperStatus === 'CANCELLED' && prevStatus !== 'CANCELLED') {
          for (const item of existing.items) {
            if (item.productId && !item.isCustomBox) {
              const prod = await tx.product.findUnique({ where: { id: item.productId } });
              if (prod) {
                const newQty = (prod.stockQuantity || 0) + item.quantity;
                await tx.product.update({
                  where: { id: item.productId },
                  data: {
                    stockQuantity: newQty,
                    inStock: true,
                  },
                });
              }
            }
          }
        }
        // 2. Stock re-decrement if reverting from CANCELLED to an active status
        else if (prevStatus === 'CANCELLED' && upperStatus !== 'CANCELLED') {
          for (const item of existing.items) {
            if (item.productId && !item.isCustomBox) {
              const prod = await tx.product.findUnique({ where: { id: item.productId } });
              if (prod) {
                const newQty = Math.max(0, (prod.stockQuantity || 0) - item.quantity);
                await tx.product.update({
                  where: { id: item.productId },
                  data: {
                    stockQuantity: newQty,
                    inStock: newQty > 0,
                  },
                });
              }
            }
          }
        }

        const updateData: any = {
          status: upperStatus,
        };
        if (adminNotes !== undefined) {
          updateData.adminNotes = adminNotes;
        }
        if (trackingNumber !== undefined) {
          updateData.paymentTrackingCode = trackingNumber;
        }

        const updated = await tx.order.update({
          where: { id: existing.id },
          data: updateData,
          include: { items: true },
        });
        return formatOrderFromPrisma(updated);
      });
      invalidateProductCache();
      return updatedOrder;
    }

    const order = inMemoryOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new Error('سفارش مورد نظر یافت نشد.');

    const prevStatus = (order.status || '').toUpperCase();
    if (upperStatus === 'CANCELLED' && prevStatus !== 'CANCELLED') {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId) {
            productService.updateStock(item.productId, item.quantity || 1);
          }
        }
      }
    } else if (prevStatus === 'CANCELLED' && upperStatus !== 'CANCELLED') {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId) {
            productService.updateStock(item.productId, -(item.quantity || 1));
          }
        }
      }
    }

    order.status = upperStatus;
    if (adminNotes !== undefined) order.adminNotes = adminNotes;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    order.updatedAt = new Date().toISOString();
    return order;
  }

  async deleteOrder(id: string) {
    if (isDbConnected()) {
      const deleteResult = await prisma.$transaction(async (tx) => {
        const existing = await tx.order.findFirst({
          where: { OR: [{ id }, { orderNumber: id }] },
          include: { items: true },
        });
        if (!existing) throw new Error('سفارش مورد نظر یافت نشد.');

        // If order was not cancelled, restore products stock before deleting
        if (existing.status.toUpperCase() !== 'CANCELLED') {
          for (const item of existing.items) {
            if (item.productId && !item.isCustomBox) {
              const prod = await tx.product.findUnique({ where: { id: item.productId } });
              if (prod) {
                const newQty = (prod.stockQuantity || 0) + item.quantity;
                await tx.product.update({
                  where: { id: item.productId },
                  data: {
                    stockQuantity: newQty,
                    inStock: true,
                  },
                });
              }
            }
          }
        }

        await tx.order.delete({
          where: { id: existing.id },
        });

        return { id: existing.id, orderNumber: existing.orderNumber, success: true };
      });
      invalidateProductCache();
      return deleteResult;
    }

    const index = inMemoryOrders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (index === -1) throw new Error('سفارش مورد نظر یافت نشد.');
    const [deleted] = inMemoryOrders.splice(index, 1);
    if (deleted.status?.toUpperCase() !== 'CANCELLED' && Array.isArray(deleted.items)) {
      for (const item of deleted.items) {
        if (item.productId) {
          productService.updateStock(item.productId, item.quantity || 1);
        }
      }
    }
    return { id: deleted.id, success: true };
  }
}

export const orderService = new OrderService();
