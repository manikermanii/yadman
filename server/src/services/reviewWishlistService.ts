import { initialStoreData } from '../utils/initialStoreData.js';
import { storageService } from './storageService.js';
import { prisma, isDbConnected } from '../config/database.js';
import { productService } from './productService.js';

let inMemoryReviews: any[] = [...initialStoreData.reviews];
let inMemoryWishlists: Map<string, string[]> = new Map(); // userId -> productIds[]

function formatReviewFromPrisma(r: any) {
  const voiceRecording = r.voiceRecordingUrl
    ? {
        url: r.voiceRecordingUrl,
        duration: Number(r.voiceDuration || 0),
      }
    : r.voiceRecording || undefined;

  let rawStatus = String(r.status || '').toLowerCase();
  if (rawStatus !== 'approved' && rawStatus !== 'rejected') {
    rawStatus = r.approved ? 'approved' : 'pending';
  }

  return {
    ...r,
    id: r.id,
    productId: r.productId,
    product: r.product || undefined,
    productTitle: r.product?.titleFa || undefined,
    authorName: r.authorName || 'کاربر گرامی',
    companyName: r.companyName || undefined,
    rating: Number(r.rating || 5),
    comment: r.comment || '',
    isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
    isVerifiedBuyer: Boolean(r.isVerifiedPurchase || r.isVerifiedBuyer),
    likesCount: Number(r.likesCount || 0),
    recipientNote: r.recipientNote || undefined,
    voiceRecording,
    status: rawStatus,
    approved: rawStatus === 'approved',
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    createdAtFa: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(r.createdAt ? new Date(r.createdAt) : new Date()),
  };
}

export class ReviewService {
  async getProductReviews(productId: string) {
    if (isDbConnected()) {
      try {
        const reviews = await prisma.review.findMany({
          where: {
            productId,
            status: 'APPROVED',
          },
          include: { product: { select: { titleFa: true, sku: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return reviews.map(formatReviewFromPrisma);
      } catch (err) {
        console.error('Prisma getProductReviews error:', err);
      }
    }

    return inMemoryReviews.filter(
      (r) => r.productId === productId && (r.status === 'approved' || r.approved === true)
    );
  }

  async getAllReviewsAdmin() {
    if (isDbConnected()) {
      try {
        const reviews = await prisma.review.findMany({
          include: { product: { select: { titleFa: true, sku: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return reviews.map(formatReviewFromPrisma);
      } catch (err) {
        console.error('Prisma getAllReviewsAdmin error:', err);
        throw err;
      }
    }
    return inMemoryReviews;
  }

  async createReview(data: any) {
    let voiceUrl = data.voiceRecordingUrl || data.voiceRecording?.dataUrl;
    if (data.voiceRecording?.dataUrl) {
      voiceUrl = await storageService.saveVoiceRecording(
        data.voiceRecording.dataUrl,
        data.voiceRecording.mimeType
      );
    }

    const now = new Date();

    if (isDbConnected()) {
      try {
        let validUserId: string | null = null;
        if (data.userId) {
          const userExists = await prisma.user.findUnique({
            where: { id: data.userId },
            select: { id: true },
          });
          if (userExists) {
            validUserId = userExists.id;
          }
        }

        const productExists = await prisma.product.findUnique({
          where: { id: data.productId },
          select: { id: true },
        });
        if (!productExists) {
          throw new Error('محصول مورد نظر در پایگاه داده یافت نشد.');
        }

        const created = await prisma.review.create({
          data: {
            id: data.id || `rev-${Date.now()}`,
            productId: data.productId,
            userId: validUserId,
            authorName: data.authorName || data.userName || data.fullName || 'کاربر گرامی',
            companyName: data.companyName || null,
            rating: Math.max(1, Math.min(5, Math.round(Number(data.rating || 5)))),
            comment: data.comment || '',
            voiceRecordingUrl: voiceUrl || null,
            voiceDuration: data.voiceDuration || data.voiceRecording?.duration ? Number(data.voiceDuration || data.voiceRecording?.duration) : null,
            isVerifiedPurchase: Boolean(data.isVerifiedPurchase || data.isVerifiedBuyer),
            status: 'PENDING',
            likesCount: 0,
          },
          include: { product: { select: { titleFa: true, sku: true } } },
        });
        return formatReviewFromPrisma(created);
      } catch (err: any) {
        console.error('Prisma createReview error:', err);
        throw err;
      }
    }

    const newReview = {
      ...data,
      id: `rev-${Date.now()}`,
      status: 'pending',
      approved: false,
      likesCount: 0,
      createdAt: now.toISOString(),
      createdAtFa: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(now),
    };

    inMemoryReviews.unshift(newReview);
    return newReview;
  }

  async updateReviewStatus(id: string, status: string) {
    const upper = status.toUpperCase();
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(upper)) {
      throw new Error('وضعیت نامعتبر است. وضعیت‌های مجاز: PENDING, APPROVED, REJECTED');
    }

    if (isDbConnected()) {
      try {
        const updated = await prisma.review.update({
          where: { id },
          data: {
            status: upper,
          },
          include: { product: { select: { titleFa: true, sku: true } } },
        });
        return formatReviewFromPrisma(updated);
      } catch (err: any) {
        if (err.code === 'P2025') {
          throw new Error('دیدگاه مورد نظر یافت نشد.');
        }
        console.error('Prisma updateReviewStatus error:', err);
        throw err;
      }
    }

    const index = inMemoryReviews.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('دیدگاه مورد نظر یافت نشد.');
    inMemoryReviews[index].status = upper.toLowerCase();
    inMemoryReviews[index].approved = upper === 'APPROVED';
    return inMemoryReviews[index];
  }

  async deleteReview(id: string) {
    if (isDbConnected()) {
      try {
        const deleted = await prisma.review.delete({
          where: { id },
          include: { product: { select: { titleFa: true, sku: true } } },
        });
        return formatReviewFromPrisma(deleted);
      } catch (err: any) {
        if (err.code === 'P2025') {
          throw new Error('دیدگاه مورد نظر یافت نشد.');
        }
        console.error('Prisma deleteReview error:', err);
        throw err;
      }
    }

    const index = inMemoryReviews.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('دیدگاه مورد نظر یافت نشد.');
    const [deleted] = inMemoryReviews.splice(index, 1);
    return deleted;
  }
}

function formatWishlistProduct(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    titleFa: p.titleFa,
    titleEn: p.titleEn,
    slug: p.slug,
    sku: p.sku,
    price: Number(p.price),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    discountPercent: p.discountPercent ? Number(p.discountPercent) : null,
    image: p.image || (p.images && p.images[0]?.url) || '',
    inStock: p.inStock !== false,
    stockQuantity: Number(p.stockQuantity ?? 15),
    status: p.status,
    boxType: p.boxType,
    ribbonColor: p.ribbonColor,
    waxSeal: p.waxSeal,
  };
}

export class WishlistService {
  async getWishlist(userId: string) {
    if (!userId) {
      return { wishlist: [], items: [] };
    }

    if (isDbConnected()) {
      try {
        const rows = await prisma.wishlist.findMany({
          where: { userId },
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const wishlist = rows.map((r) => r.productId);
        const items = rows.map((r) => formatWishlistProduct(r.product)).filter(Boolean);

        return { wishlist, items };
      } catch (err) {
        console.warn('Prisma getWishlist fallback:', err);
      }
    }

    const productIds = inMemoryWishlists.get(userId) || [];
    const items: any[] = [];
    for (const pid of productIds) {
      const p = await productService.getProductById(pid);
      if (p) items.push(formatWishlistProduct(p));
    }
    return { wishlist: productIds, items };
  }

  async addToWishlist(userId: string, productId: string) {
    if (!userId) {
      const error: any = new Error('لطفاً وارد حساب کاربری خود شوید.');
      error.statusCode = 401;
      throw error;
    }

    if (isDbConnected()) {
      try {
        // Validate product exists in DB
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { id: productId },
              { slug: productId },
            ],
          },
        });

        if (!product) {
          const error: any = new Error('محصول مورد نظر یافت نشد.');
          error.statusCode = 404;
          throw error;
        }

        if (product.status && product.status.toUpperCase() !== 'ACTIVE') {
          const error: any = new Error('این محصول در حال حاضر غیرفعال است.');
          error.statusCode = 400;
          throw error;
        }

        const actualProductId = product.id;

        // Check if already in user's wishlist
        const existing = await prisma.wishlist.findFirst({
          where: { userId, productId: actualProductId },
        });

        if (!existing) {
          await prisma.wishlist.create({
            data: {
              id: `wish-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              userId,
              productId: actualProductId,
            },
          });
        }

        const data = await this.getWishlist(userId);
        return { ...data, isAdded: true };
      } catch (err: any) {
        if (err.statusCode) throw err;
        console.warn('Prisma addToWishlist fallback:', err);
      }
    }

    const list = inMemoryWishlists.get(userId) || [];
    if (!list.includes(productId)) {
      list.push(productId);
      inMemoryWishlists.set(userId, list);
    }
    const data = await this.getWishlist(userId);
    return { ...data, isAdded: true };
  }

  async removeFromWishlist(userId: string, productId: string) {
    if (!userId) {
      const error: any = new Error('لطفاً وارد حساب کاربری خود شوید.');
      error.statusCode = 401;
      throw error;
    }

    if (isDbConnected()) {
      try {
        await prisma.wishlist.deleteMany({
          where: {
            userId,
            OR: [
              { productId },
              { product: { slug: productId } },
            ],
          },
        });

        const data = await this.getWishlist(userId);
        return { ...data, isRemoved: true };
      } catch (err: any) {
        if (err.statusCode) throw err;
        console.warn('Prisma removeFromWishlist fallback:', err);
      }
    }

    let list = inMemoryWishlists.get(userId) || [];
    list = list.filter((id) => id !== productId);
    inMemoryWishlists.set(userId, list);
    const data = await this.getWishlist(userId);
    return { ...data, isRemoved: true };
  }

  async toggleWishlist(userId: string, productId: string) {
    if (!userId) {
      const error: any = new Error('لطفاً وارد حساب کاربری خود شوید.');
      error.statusCode = 401;
      throw error;
    }

    if (isDbConnected()) {
      try {
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { id: productId },
              { slug: productId },
            ],
          },
        });

        if (!product) {
          const error: any = new Error('محصول مورد نظر یافت نشد.');
          error.statusCode = 404;
          throw error;
        }

        if (product.status && product.status.toUpperCase() !== 'ACTIVE') {
          const error: any = new Error('این محصول در حال حاضر غیرفعال است.');
          error.statusCode = 400;
          throw error;
        }

        const actualProductId = product.id;

        const existing = await prisma.wishlist.findFirst({
          where: { userId, productId: actualProductId },
        });

        let isAdded = false;
        if (existing) {
          await prisma.wishlist.delete({ where: { id: existing.id } });
          isAdded = false;
        } else {
          await prisma.wishlist.create({
            data: {
              id: `wish-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              userId,
              productId: actualProductId,
            },
          });
          isAdded = true;
        }

        const data = await this.getWishlist(userId);
        return { ...data, isAdded };
      } catch (err: any) {
        if (err.statusCode) throw err;
        console.warn('Prisma toggleWishlist fallback:', err);
      }
    }

    const list = inMemoryWishlists.get(userId) || [];
    const index = list.indexOf(productId);
    let isAdded = false;

    if (index > -1) {
      list.splice(index, 1);
      isAdded = false;
    } else {
      list.push(productId);
      isAdded = true;
    }

    inMemoryWishlists.set(userId, list);
    const data = await this.getWishlist(userId);
    return { ...data, isAdded };
  }
}

export const reviewService = new ReviewService();
export const wishlistService = new WishlistService();
