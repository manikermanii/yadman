import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { cartService, orderService, couponService } from '../services/orderService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { orderCreateSchema, couponValidateSchema, addToCartSchema, updateCartItemSchema, couponCreateSchema, couponUpdateSchema } from '../validators/index.js';

function formatZodMessage(err: any, fallback = 'اطلاعات ارسالی نامعتبر است'): { message: string; issues: any[] } {
  const issues = err?.issues || err?.errors || [];
  const message = issues.map((e: any) => e.message).filter(Boolean).join('، ') || fallback;
  return { message, issues };
}

export class CartController {
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً ابتدا وارد حساب کاربری خود شوید.', 401);
      }
      const cart = await cartService.getCart(req.user.userId);
      return sendSuccess(res, cart);
    } catch (err: any) {
      next(err);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً ابتدا وارد حساب کاربری خود شوید.', 401);
      }
      const validated = addToCartSchema.parse(req.body);
      const cart = await cartService.addItem(req.user.userId, validated);
      return sendSuccess(res, cart, 201);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات ارسالی افزودن به سبد نامعتبر است');
        return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
      }
      if (err.statusCode) {
        return sendError(res, 'CART_ERROR', err.message, err.statusCode);
      }
      next(err);
    }
  }

  async updateItemQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً ابتدا وارد حساب کاربری خود شوید.', 401);
      }
      const { itemId } = req.params;
      const { quantity } = updateCartItemSchema.parse(req.body);
      const cart = await cartService.updateItemQuantity(req.user.userId, itemId, quantity);
      return sendSuccess(res, cart);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'تعداد محصول نامعتبر است');
        return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
      }
      if (err.statusCode) {
        return sendError(res, 'CART_ERROR', err.message, err.statusCode);
      }
      next(err);
    }
  }

  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً ابتدا وارد حساب کاربری خود شوید.', 401);
      }
      const { itemId } = req.params;
      const cart = await cartService.removeItem(req.user.userId, itemId);
      return sendSuccess(res, cart);
    } catch (err: any) {
      if (err.statusCode) {
        return sendError(res, 'CART_ERROR', err.message, err.statusCode);
      }
      next(err);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً ابتدا وارد حساب کاربری خود شوید.', 401);
      }
      const cart = await cartService.clearCart(req.user.userId);
      return sendSuccess(res, cart);
    } catch (err: any) {
      next(err);
    }
  }
}

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = orderCreateSchema.parse(req.body);
      const order = await orderService.createOrder({
        ...validated,
        userId: req.user?.userId,
      });

      // Clear the user's cart upon order placement
      if (req.user?.userId) {
        await cartService.clearCart(req.user.userId);
      }

      return sendSuccess(res, order, 201);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات ثبت سفارش نامعتبر است');
        return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
      }

      if (err.statusCode) {
        return sendError(res, err.code || 'BAD_REQUEST', err.message, err.statusCode);
      }
      // Business/validation rule violations thrown as Error (e.g. out of stock, coupon expired, etc.)
      const isBusinessRuleError =
        err.message &&
        (err.message.includes('موجودی') ||
          err.message.includes('کد تخفیف') ||
          err.message.includes('سبد خرید') ||
          err.message.includes('الزامی') ||
          err.message.includes('یافت نشد') ||
          err.message.includes('حداقل مبلغ'));

      if (isBusinessRuleError) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }

      next(err);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً وارد شوید.', 401);
      }
      const orders = await orderService.getOrders({ userId: req.user.userId });
      return sendSuccess(res, orders);
    } catch (err: any) {
      next(err);
    }
  }

  async getAllOrdersAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await orderService.getOrders(req.query as any);
      return sendSuccess(res, orders);
    } catch (err: any) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);
      if (!order) {
        return sendError(res, 'NOT_FOUND', 'سفارش یافت نشد.', 404);
      }
      // Customer ownership verification
      const userPhone = req.user?.phone || req.user?.phoneNumber;
      const isOwner =
        (req.user?.userId && order.userId === req.user.userId) ||
        (userPhone && order.customerPhone === userPhone);

      if (!isOwner) {
        return sendError(res, 'FORBIDDEN', 'شما دسترسی به این سفارش ندارید.', 403);
      }

      return sendSuccess(res, order);
    } catch (err: any) {
      next(err);
    }
  }

  async getOrderByIdAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);
      if (!order) {
        return sendError(res, 'NOT_FOUND', 'سفارش یافت نشد.', 404);
      }
      return sendSuccess(res, order);
    } catch (err: any) {
      next(err);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, adminNotes, trackingNumber } = req.body;
      const allowedStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'PACKAGED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!status || !allowedStatuses.includes(String(status).toUpperCase())) {
        return sendError(res, 'VALIDATION_ERROR', `وضعیت نامعتبر است. وضعیت‌های مجاز: ${allowedStatuses.join(', ')}`, 400);
      }
      const order = await orderService.updateOrderStatus(id, status, adminNotes, trackingNumber);
      if (!order) {
        return sendError(res, 'NOT_FOUND', 'سفارش یافت نشد.', 404);
      }
      return sendSuccess(res, order);
    } catch (err: any) {
      if (err.message && err.message.includes('یافت نشد')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      next(err);
    }
  }

  async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await orderService.deleteOrder(id);
      return sendSuccess(res, result);
    } catch (err: any) {
      if (err.message && err.message.includes('یافت نشد')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      next(err);
    }
  }
}

export class CouponController {
  async validateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = couponValidateSchema.parse(req.body);
      const result = await couponService.validateCoupon(validated.code, validated.cartTotal);
      return sendSuccess(res, result);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'کد تخفیف نامعتبر است');
        return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
      }
      return sendError(res, 'INVALID_COUPON', err.message, 400);
    }
  }

  async getCouponsAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const coupons = await couponService.getCoupons();
      return sendSuccess(res, coupons);
    } catch (err: any) {
      next(err);
    }
  }

  async getActiveCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const coupons = await couponService.getActiveCoupons();
      return sendSuccess(res, coupons);
    } catch (err: any) {
      next(err);
    }
  }

  async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = couponCreateSchema.parse(req.body);
      const coupon = await couponService.createCoupon(validated);
      return sendSuccess(res, coupon, 201);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات کوپن نامعتبر است');
        return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
      }
      if (err.message) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      next(err);
    }
  }

  async updateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = couponUpdateSchema.parse(req.body);
      const coupon = await couponService.updateCoupon(id, validated);
      return sendSuccess(res, coupon);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات کوپن نامعتبر است');
        return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
      }
      if (err.message && err.message.includes('یافت نشد')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      next(err);
    }
  }

  async deleteCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await couponService.deleteCoupon(id);
      return sendSuccess(res, { success: true, deleted });
    } catch (err: any) {
      if (err.message && err.message.includes('یافت نشد')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      next(err);
    }
  }
}

export const cartController = new CartController();
export const orderController = new OrderController();
export const couponController = new CouponController();
