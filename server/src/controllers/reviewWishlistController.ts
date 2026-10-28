import { Request, Response, NextFunction } from 'express';
import { reviewService, wishlistService } from '../services/reviewWishlistService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { reviewCreateSchema, wishlistAddSchema } from '../validators/index.js';

export class ReviewController {
  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const reviews = await reviewService.getProductReviews(productId);
      return sendSuccess(res, reviews);
    } catch (err: any) {
      next(err);
    }
  }

  async getAllReviewsAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.getAllReviewsAdmin();
      return sendSuccess(res, reviews);
    } catch (err: any) {
      next(err);
    }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = reviewCreateSchema.parse(req.body);
      const review = await reviewService.createReview({
        ...validated,
        userId: req.user?.userId,
      });
      return sendSuccess(res, review, 201);
    } catch (err: any) {
      next(err);
    }
  }

  async updateReviewStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return sendError(res, 'VALIDATION_ERROR', 'وضعیت دیدگاه الزامی است.', 400);
      }
      const allowed = ['PENDING', 'APPROVED', 'REJECTED'];
      if (!allowed.includes(String(status).toUpperCase())) {
        return sendError(res, 'VALIDATION_ERROR', 'وضعیت نامعتبر است. وضعیت‌های مجاز: PENDING, APPROVED, REJECTED', 400);
      }
      const updated = await reviewService.updateReviewStatus(id, status);
      return sendSuccess(res, updated);
    } catch (err: any) {
      if (err.message && err.message.includes('یافت نشد')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      next(err);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await reviewService.deleteReview(id);
      return sendSuccess(res, { id, success: true, deleted });
    } catch (err: any) {
      if (err.message && err.message.includes('یافت نشد')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      next(err);
    }
  }
}

export class WishlistController {
  async getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً وارد حساب کاربری خود شوید.', 401);
      }
      const data = await wishlistService.getWishlist(req.user.userId);
      return sendSuccess(res, data);
    } catch (err: any) {
      next(err);
    }
  }

  async addToWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً وارد حساب کاربری خود شوید.', 401);
      }
      const validated = wishlistAddSchema.parse(req.body);
      const data = await wishlistService.addToWishlist(req.user.userId, validated.productId);
      return sendSuccess(res, data, 201);
    } catch (err: any) {
      if (err.statusCode) {
        return sendError(res, 'WISHLIST_ERROR', err.message, err.statusCode);
      }
      next(err);
    }
  }

  async removeFromWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً وارد حساب کاربری خود شوید.', 401);
      }
      const { productId } = req.params;
      const data = await wishlistService.removeFromWishlist(req.user.userId, productId);
      return sendSuccess(res, data);
    } catch (err: any) {
      if (err.statusCode) {
        return sendError(res, 'WISHLIST_ERROR', err.message, err.statusCode);
      }
      next(err);
    }
  }

  async toggleWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'UNAUTHORIZED', 'لطفاً وارد حساب کاربری خود شوید.', 401);
      }
      const { productId } = req.params;
      const result = await wishlistService.toggleWishlist(req.user.userId, productId);
      return sendSuccess(res, result);
    } catch (err: any) {
      if (err.statusCode) {
        return sendError(res, 'WISHLIST_ERROR', err.message, err.statusCode);
      }
      next(err);
    }
  }
}

export const reviewController = new ReviewController();
export const wishlistController = new WishlistController();
