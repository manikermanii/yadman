import { prisma, isDbConnected } from '../config/database.js';
import { initialStoreData } from '../utils/initialStoreData.js';
import { AppError } from '../utils/apiResponse.js';

// In-memory fallback cache and database query cache
let inMemoryProducts = [...initialStoreData.products];
let inMemoryCategories = [...initialStoreData.categories];
let cachedDbProducts: any[] | null = null;
let lastDbProductsFetchTime = 0;
const DB_PRODUCTS_CACHE_TTL = 45000; // 45 seconds

export function invalidateProductCache() {
  cachedDbProducts = null;
  lastDbProductsFetchTime = 0;
}

export function isBase64ImageData(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim().toLowerCase();
  return trimmed.startsWith('data:image/') || trimmed.includes(';base64,');
}

export function formatProductFromPrisma(p: any) {
  let itemsIncluded: string[] = [];
  try {
    if (typeof p.itemsIncluded === 'string') {
      itemsIncluded = JSON.parse(p.itemsIncluded || '[]');
    } else if (Array.isArray(p.itemsIncluded)) {
      itemsIncluded = p.itemsIncluded;
    }
  } catch {
    itemsIncluded = [];
  }

  let tags: string[] = [];
  try {
    if (typeof p.tags === 'string') {
      tags = JSON.parse(p.tags || '[]');
    } else if (Array.isArray(p.tags)) {
      tags = p.tags;
    }
  } catch {
    tags = [];
  }

  let occasions: string[] = [];
  try {
    if (typeof p.occasions === 'string') {
      occasions = JSON.parse(p.occasions || '[]');
    } else if (Array.isArray(p.occasions)) {
      occasions = p.occasions;
    }
  } catch {
    occasions = [];
  }

  let suitableFor: string[] = [];
  try {
    if (typeof p.suitableFor === 'string') {
      suitableFor = JSON.parse(p.suitableFor || '[]');
    } else if (Array.isArray(p.suitableFor)) {
      suitableFor = p.suitableFor;
    }
  } catch {
    suitableFor = [];
  }

  const primaryImage =
    p.image ||
    (p.images && p.images.length > 0 ? (p.images.find((img: any) => img.isPrimary)?.url || p.images[0]?.url) : '') ||
    '';

  return {
    id: p.id,
    titleFa: p.titleFa,
    titleEn: p.titleEn || undefined,
    sku: p.sku,
    slug: p.slug,
    category: p.categoryId,
    categoryId: p.categoryId,
    price: Number(p.price) || 0,
    oldPrice: p.oldPrice ? Number(p.oldPrice) : undefined,
    discountPercent: Number(p.discountPercent) || 0,
    rating: Number(p.rating) || 5.0,
    reviewsCount: Number(p.reviewsCount) || 0,
    salesCount: Number(p.salesCount) || 0,
    description: p.description || '',
    shortDescription: p.shortDescription || undefined,
    image: primaryImage,
    images: (p.images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      thumbnailUrl: img.thumbnailUrl || undefined,
      altText: img.altText || undefined,
      sortOrder: Number(img.sortOrder) || 0,
      isPrimary: Boolean(img.isPrimary),
    })),
    additionalImages: (!p.images || p.images.length === 0) ? (Array.isArray(p.additionalImages) ? p.additionalImages : []) : [],
    videos: (p.videos || []).map((v: any) => ({
      id: v.id,
      productId: v.productId,
      platform: v.platform || 'aparat',
      videoId: v.videoId || '',
      videoUrl: v.videoUrl || '',
      embedUrl: v.embedUrl || '',
      title: v.title || undefined,
      description: v.description || undefined,
      thumbnailUrl: v.thumbnailUrl || undefined,
      durationSeconds: v.durationSeconds || undefined,
      sortOrder: Number(v.sortOrder) || 0,
      isActive: Boolean(v.isActive),
    })),
    variants: (p.variants || []).map((vr: any) => {
      let attributes = {};
      try {
        if (typeof vr.attributes === 'string') {
          attributes = JSON.parse(vr.attributes || '{}');
        } else if (typeof vr.attributes === 'object') {
          attributes = vr.attributes || {};
        }
      } catch {
        attributes = {};
      }
      return {
        id: vr.id,
        titleFa: vr.titleFa || '',
        sku: vr.sku || undefined,
        price: vr.price ? Number(vr.price) : undefined,
        priceModifier: vr.priceModifier ? Number(vr.priceModifier) : 0,
        stockQuantity: Number(vr.stockQuantity) || 0,
        attributes,
        inStock: vr.inStock !== false,
      };
    }),
    itemsIncluded,
    boxType: p.boxType || 'هاردباکس لوکس',
    ribbonColor: p.ribbonColor || 'زرشکی',
    ribbonColorHex: p.ribbonColorHex || '#8B0000',
    waxSeal: p.waxSeal || 'مهر موم طلایی',
    badge: p.badge || undefined,
    weightGrams: Number(p.weightGrams) || 500,
    dimensions: p.dimensions || undefined,
    materials: p.materials || undefined,
    shippingInfo: p.shippingInfo || undefined,
    customizationOptions: p.customizationOptions || undefined,
    inStock: p.inStock !== false,
    stockQuantity: Number(p.stockQuantity) ?? 15,
    lowStockThreshold: Number(p.lowStockThreshold) ?? 3,
    status: (p.status ? p.status.toLowerCase() : 'active') as any,
    tags,
    occasions,
    giftType: p.giftType || undefined,
    boxPackagingType: p.boxPackagingType || undefined,
    suitableFor,
    brandOrigin: p.brandOrigin || undefined,
    featured: Boolean(p.featured),
    isB2BRecommended: Boolean(p.isB2BRecommended),
    seoTitle: p.seoTitle || undefined,
    seoDescription: p.seoDescription || undefined,
    canonicalUrl: p.canonicalUrl || undefined,
    ogImage: p.ogImage || undefined,
    metaKeywords: p.metaKeywords || undefined,
    createdAt: p.createdAt ? (typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString()) : new Date().toISOString(),
    updatedAt: p.updatedAt ? (typeof p.updatedAt === 'string' ? p.updatedAt : p.updatedAt.toISOString()) : new Date().toISOString(),
  };
}

function formatCategoryFromPrisma(c: any) {
  return {
    id: c.id,
    nameFa: c.nameFa,
    nameEn: c.nameEn,
    slug: c.slug,
    descriptionFa: c.descriptionFa || '',
    iconName: c.iconName || 'Gift',
    isFeatured: Boolean(c.isFeatured),
    productsCount: c._count?.products || 0,
  };
}

export class ProductService {
  async getProducts(query: {
    category?: string;
    searchQuery?: string;
    minPrice?: number;
    maxPrice?: number;
    occasions?: string[];
    giftTypes?: string[];
    boxPackagingTypes?: string[];
    suitableFor?: string[];
    brandOrigins?: string[];
    inStockOnly?: boolean;
    discountOnly?: boolean;
    minRating?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
    featured?: boolean;
    isB2BRecommended?: boolean;
    status?: string;
    isAdmin?: boolean;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 24));
    const skip = (page - 1) * limit;

    let items: any[] = [];
    const now = Date.now();

    if (isDbConnected()) {
      if (cachedDbProducts && now - lastDbProductsFetchTime < DB_PRODUCTS_CACHE_TTL) {
        items = [...cachedDbProducts];
      } else {
        try {
          const dbProducts = await prisma.product.findMany({
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              videos: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
              variants: true,
              category: true,
            },
            orderBy: { createdAt: 'desc' },
          });
          const formatted = dbProducts.map(formatProductFromPrisma);
          cachedDbProducts = formatted;
          lastDbProductsFetchTime = now;
          items = formatted;
        } catch (err: any) {
          console.error('Error querying products from Prisma:', err?.message || err);
          // If query fails but we have cached products, serve cached products to prevent blank page
          if (cachedDbProducts && cachedDbProducts.length > 0) {
            console.warn('Serving previously cached products due to temporary DB connection hiccup');
            items = [...cachedDbProducts];
          } else if (inMemoryProducts.length > 0) {
            items = [...inMemoryProducts];
          } else {
            throw err;
          }
        }
      }
    } else {
      items = cachedDbProducts && cachedDbProducts.length > 0 ? [...cachedDbProducts] : [...inMemoryProducts];
    }

    // Status filter:
    // - Public storefront requests without admin session must ONLY return active/published products
    // - Admin requests retain ability to view drafts, archived, or filter specifically
    if (!query.isAdmin) {
      items = items.filter((p) => (p.status || 'active').toLowerCase() === 'active');
    } else if (query.status && query.status !== 'all') {
      const requestedStatus = query.status.toLowerCase();
      items = items.filter((p) => (p.status || 'active').toLowerCase() === requestedStatus);
    }

    // Category filter
    if (query.category && query.category !== 'all') {
      items = items.filter((p) => p.category === query.category || p.categoryId === query.category);
    }

    // Search query
    if (query.searchQuery && query.searchQuery.trim()) {
      const q = query.searchQuery.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.titleFa.toLowerCase().includes(q) ||
          (p.titleEn && p.titleEn.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    // Price range
    if (typeof query.minPrice === 'number' && query.minPrice > 0) {
      items = items.filter((p) => p.price >= query.minPrice!);
    }
    if (typeof query.maxPrice === 'number' && query.maxPrice > 0) {
      items = items.filter((p) => p.price <= query.maxPrice!);
    }

    // Occasions
    if (query.occasions && query.occasions.length > 0) {
      items = items.filter((p) =>
        p.occasions && query.occasions!.some((occ) => p.occasions?.includes(occ))
      );
    }

    // Gift Types
    if (query.giftTypes && query.giftTypes.length > 0) {
      items = items.filter((p) => p.giftType && query.giftTypes!.includes(p.giftType));
    }

    // Box packaging types
    if (query.boxPackagingTypes && query.boxPackagingTypes.length > 0) {
      items = items.filter((p) => p.boxPackagingType && query.boxPackagingTypes!.includes(p.boxPackagingType));
    }

    // Suitable for
    if (query.suitableFor && query.suitableFor.length > 0) {
      items = items.filter((p) =>
        p.suitableFor && query.suitableFor!.some((s: string) => p.suitableFor?.includes(s))
      );
    }

    // Brand Origins
    if (query.brandOrigins && query.brandOrigins.length > 0) {
      items = items.filter((p) => p.brandOrigin && query.brandOrigins!.includes(p.brandOrigin));
    }

    // In-stock only
    if (query.inStockOnly) {
      items = items.filter((p) => p.inStock && (p.stockQuantity ?? 1) > 0);
    }

    // Discount only
    if (query.discountOnly) {
      items = items.filter((p) => (p.discountPercent || 0) > 0);
    }

    // Min rating
    if (typeof query.minRating === 'number' && query.minRating > 0) {
      items = items.filter((p) => (p.rating || 5.0) >= query.minRating!);
    }

    // Featured
    if (query.featured !== undefined) {
      items = items.filter((p) => Boolean(p.featured) === query.featured);
    }

    // Sorting
    switch (query.sortBy) {
      case 'price_asc':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        items.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        break;
      case 'popular':
        items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        items.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
        break;
      case 'bestseller':
      default:
        items.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
    }

    const total = items.length;
    const paginatedItems = items.slice(skip, skip + limit);

    return {
      products: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getProductBySlugOrId(identifier: string, isAdmin = false) {
    if (isDbConnected()) {
      try {
        const prod = await prisma.product.findFirst({
          where: {
            OR: [
              { id: identifier },
              { slug: identifier },
              { sku: identifier },
            ],
          },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            videos: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            variants: true,
            category: true,
          },
        });
        if (prod) {
          const formatted = formatProductFromPrisma(prod);
          if (!isAdmin && (formatted.status || 'active').toLowerCase() !== 'active') {
            return null;
          }
          return formatted;
        }
      } catch (err) {
        console.error('Prisma getProductBySlugOrId error:', err);
      }
    }
    const product = inMemoryProducts.find(
      (p) => p.id === identifier || p.slug === identifier || p.sku === identifier
    );
    if (product) {
      const formatted = formatProductFromPrisma(product);
      if (!isAdmin && (formatted.status || 'active').toLowerCase() !== 'active') {
        return null;
      }
      return formatted;
    }
    return null;
  }

  async getProductById(id: string, isAdmin = false) {
    return this.getProductBySlugOrId(id, isAdmin);
  }

  async createProduct(data: any) {
    // Reject Base64 data URLs in product image fields to prevent database bloat and excessive egress
    if (isBase64ImageData(data.image)) {
      throw new AppError('آپلود تصویر به صورت داده خام Base64 مجاز نمی‌باشد. لطفاً ابتدا تصویر را از طریق سامانه آپلود و آدرس فایل را ارسال فرمایید.', 400, 'BASE64_NOT_ALLOWED');
    }
    if (Array.isArray(data.images)) {
      for (const img of data.images) {
        const url = typeof img === 'string' ? img : img?.url;
        const thumb = typeof img === 'object' ? img?.thumbnailUrl : null;
        if (isBase64ImageData(url) || isBase64ImageData(thumb)) {
          throw new AppError('آپلود تصویر گالری به صورت داده خام Base64 مجاز نمی‌باشد. لطفاً ابتدا تصویر را از طریق سامانه آپلود و آدرس فایل را ارسال فرمایید.', 400, 'BASE64_NOT_ALLOWED');
        }
      }
    }

    const slug =
      data.slug ||
      data.titleFa
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\u0600-\u06FF\w-]/g, '') ||
      `product-${Date.now()}`;

    if (isDbConnected()) {
      let targetCategoryId = data.categoryId || data.category || '';
      if (!targetCategoryId) {
        throw new Error('لطفاً ابتدا یک دسته‌بندی برای محصول مشخص یا ایجاد نمایید.');
      }
      const catExists = await prisma.category.findFirst({
        where: {
          OR: [
            { id: targetCategoryId },
            { slug: targetCategoryId },
          ],
        },
      });
      if (!catExists) {
        throw new Error('دسته‌بندی مشخص‌شده در پایگاه‌داده وجود ندارد. لطفاً ابتدا از بخش دسته‌بندی‌ها آن را ایجاد کنید.');
      }
      targetCategoryId = catExists.id;

      const primaryImg = Array.isArray(data.images)
        ? data.images.find((img: any) => typeof img === 'object' && Boolean(img?.isPrimary && img?.url)) ||
          data.images.find((img: any) => Boolean(typeof img === 'string' ? img : img?.url))
        : null;
      const mainImage = (typeof primaryImg === 'string' ? primaryImg : primaryImg?.url) || data.image || '';

      const validImages = Array.isArray(data.images)
        ? data.images
            .map((img: any, idx: number) => ({
              url: typeof img === 'string' ? img : img.url,
              thumbnailUrl: typeof img === 'object' ? img.thumbnailUrl || null : null,
              altText: typeof img === 'object' ? img.altText || null : null,
              sortOrder: typeof img === 'object' && img.sortOrder !== undefined ? Number(img.sortOrder) : idx,
              isPrimary: typeof img === 'object' && img.isPrimary !== undefined ? Boolean(img.isPrimary) : idx === 0,
            }))
            .filter((img: any) => Boolean(img.url && typeof img.url === 'string' && img.url.trim()))
        : [];

      const created = await prisma.product.create({
        data: {
          id: data.id || `PRD-${Date.now().toString().slice(-5)}`,
          titleFa: data.titleFa,
          titleEn: data.titleEn || null,
          sku: data.sku || `SKU-${Date.now()}`,
          slug,
          categoryId: targetCategoryId,
          price: Number(data.price) || 0,
          oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
          discountPercent: data.discountPercent ? Math.round(Number(data.discountPercent)) : 0,
          description: data.description || '',
          shortDescription: data.shortDescription || null,
          image: mainImage,
          itemsIncluded: JSON.stringify(data.itemsIncluded || []),
          boxType: data.boxType || 'هاردباکس لوکس',
          ribbonColor: data.ribbonColor || 'زرشکی',
          ribbonColorHex: data.ribbonColorHex || '#8B0000',
          waxSeal: data.waxSeal || 'مهر موم طلایی',
          badge: data.badge || null,
          weightGrams: data.weightGrams ? Math.round(Number(data.weightGrams)) : 500,
          dimensions: data.dimensions || null,
          materials: data.materials || null,
          shippingInfo: data.shippingInfo || null,
          customizationOptions: data.customizationOptions || null,
          inStock: data.inStock !== false,
          stockQuantity: data.stockQuantity ? Math.round(Number(data.stockQuantity)) : 15,
          lowStockThreshold: data.lowStockThreshold ? Math.round(Number(data.lowStockThreshold)) : 3,
          status: (data.status || 'ACTIVE').toUpperCase(),
          tags: JSON.stringify(data.tags || []),
          occasions: JSON.stringify(data.occasions || []),
          giftType: data.giftType || null,
          boxPackagingType: data.boxPackagingType || null,
          suitableFor: JSON.stringify(data.suitableFor || []),
          brandOrigin: data.brandOrigin || null,
          featured: Boolean(data.featured),
          isB2BRecommended: Boolean(data.isB2BRecommended),
          seoTitle: data.seoTitle || data.titleFa,
          seoDescription: data.seoDescription || data.description?.slice(0, 160) || null,
          images: validImages.length > 0 ? { create: validImages } : undefined,
          videos: Array.isArray(data.videos) && data.videos.length > 0 ? {
            create: data.videos.map((v: any, idx: number) => ({
              platform: v.platform || 'aparat',
              videoId: v.videoId || '',
              videoUrl: v.videoUrl || '',
              embedUrl: v.embedUrl || '',
              title: v.title || null,
              description: v.description || null,
              thumbnailUrl: v.thumbnailUrl || null,
              durationSeconds: v.durationSeconds ? Number(v.durationSeconds) : null,
              sortOrder: v.sortOrder ? Number(v.sortOrder) : idx,
              isActive: v.isActive !== false,
            })).filter((v: any) => Boolean(v.videoUrl || v.embedUrl))
          } : undefined,
        },
        include: {
          images: true,
          videos: true,
          variants: true,
          category: true,
        },
      });
      invalidateProductCache();
      return formatProductFromPrisma(created);
    }

    const newProduct = {
      ...data,
      id: `PRD-${Date.now().toString().slice(-5)}`,
      slug,
      rating: 5.0,
      reviewsCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryProducts.unshift(newProduct);
    invalidateProductCache();
    return newProduct;
  }

  async updateProduct(id: string, data: any) {
    // Reject Base64 data URLs in product image fields to prevent database bloat and excessive egress
    if (isBase64ImageData(data.image)) {
      throw new AppError('آپلود تصویر به صورت داده خام Base64 مجاز نمی‌باشد. لطفاً ابتدا تصویر را از طریق سامانه آپلود و آدرس فایل را ارسال فرمایید.', 400, 'BASE64_NOT_ALLOWED');
    }
    if (Array.isArray(data.images)) {
      for (const img of data.images) {
        const url = typeof img === 'string' ? img : img?.url;
        const thumb = typeof img === 'object' ? img?.thumbnailUrl : null;
        if (isBase64ImageData(url) || isBase64ImageData(thumb)) {
          throw new AppError('آپلود تصویر گالری به صورت داده خام Base64 مجاز نمی‌باشد. لطفاً ابتدا تصویر را از طریق سامانه آپلود و آدرس فایل را ارسال فرمایید.', 400, 'BASE64_NOT_ALLOWED');
        }
      }
    }

    if (isDbConnected()) {
      const updatePayload: any = {};
      if (data.titleFa !== undefined) updatePayload.titleFa = data.titleFa;
      if (data.titleEn !== undefined) updatePayload.titleEn = data.titleEn;
      if (data.sku !== undefined) updatePayload.sku = data.sku;
      if (data.slug !== undefined) updatePayload.slug = data.slug;
      if (data.category !== undefined || data.categoryId !== undefined) {
        const catId = data.categoryId || data.category;
        const catExists = await prisma.category.findFirst({
          where: {
            OR: [
              { id: catId },
              { slug: catId },
            ],
          },
        });
        if (catExists) {
          updatePayload.categoryId = catExists.id;
        }
      }
      if (data.price !== undefined) updatePayload.price = Number(data.price);
      if (data.oldPrice !== undefined) updatePayload.oldPrice = data.oldPrice ? Number(data.oldPrice) : null;
      if (data.discountPercent !== undefined) updatePayload.discountPercent = Math.round(Number(data.discountPercent));
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.shortDescription !== undefined) updatePayload.shortDescription = data.shortDescription;
      if (data.image !== undefined) updatePayload.image = data.image;
      if (data.itemsIncluded !== undefined) updatePayload.itemsIncluded = JSON.stringify(data.itemsIncluded);
      if (data.boxType !== undefined) updatePayload.boxType = data.boxType;
      if (data.ribbonColor !== undefined) updatePayload.ribbonColor = data.ribbonColor;
      if (data.ribbonColorHex !== undefined) updatePayload.ribbonColorHex = data.ribbonColorHex;
      if (data.waxSeal !== undefined) updatePayload.waxSeal = data.waxSeal;
      if (data.badge !== undefined) updatePayload.badge = data.badge;
      if (data.weightGrams !== undefined) updatePayload.weightGrams = Math.round(Number(data.weightGrams));
      if (data.dimensions !== undefined) updatePayload.dimensions = data.dimensions;
      if (data.materials !== undefined) updatePayload.materials = data.materials;
      if (data.shippingInfo !== undefined) updatePayload.shippingInfo = data.shippingInfo;
      if (data.customizationOptions !== undefined) updatePayload.customizationOptions = data.customizationOptions;
      if (data.inStock !== undefined) updatePayload.inStock = Boolean(data.inStock);
      if (data.stockQuantity !== undefined) {
        const qty = Math.max(0, Math.round(Number(data.stockQuantity)));
        updatePayload.stockQuantity = qty;
        if (data.inStock === undefined) {
          updatePayload.inStock = qty > 0;
        }
      }
      if (data.lowStockThreshold !== undefined) updatePayload.lowStockThreshold = Math.max(0, Math.round(Number(data.lowStockThreshold)));
      if (data.status !== undefined) updatePayload.status = String(data.status).toUpperCase();
      if (data.tags !== undefined) updatePayload.tags = JSON.stringify(data.tags);
      if (data.occasions !== undefined) updatePayload.occasions = JSON.stringify(data.occasions);
      if (data.giftType !== undefined) updatePayload.giftType = data.giftType;
      if (data.boxPackagingType !== undefined) updatePayload.boxPackagingType = data.boxPackagingType;
      if (data.suitableFor !== undefined) updatePayload.suitableFor = JSON.stringify(data.suitableFor);
      if (data.brandOrigin !== undefined) updatePayload.brandOrigin = data.brandOrigin;
      if (data.featured !== undefined) updatePayload.featured = Boolean(data.featured);
      if (data.isB2BRecommended !== undefined) updatePayload.isB2BRecommended = Boolean(data.isB2BRecommended);
      if (data.seoTitle !== undefined) updatePayload.seoTitle = data.seoTitle;
      if (data.seoDescription !== undefined) updatePayload.seoDescription = data.seoDescription;

      // Update images if provided
      if (Array.isArray(data.images)) {
        await prisma.productImage.deleteMany({ where: { productId: id } });
        const validImages = data.images
          .map((img: any, idx: number) => ({
            productId: id,
            url: typeof img === 'string' ? img : img.url,
            thumbnailUrl: typeof img === 'object' ? img.thumbnailUrl || null : null,
            altText: typeof img === 'object' ? img.altText || null : null,
            sortOrder: typeof img === 'object' && img.sortOrder !== undefined ? Number(img.sortOrder) : idx,
            isPrimary: typeof img === 'object' && img.isPrimary !== undefined ? Boolean(img.isPrimary) : idx === 0,
          }))
          .filter((img: any) => Boolean(img.url && typeof img.url === 'string' && img.url.trim()));
        if (validImages.length > 0) {
          await prisma.productImage.createMany({
            data: validImages,
          });
        }
      }

      const updated = await prisma.product.update({
        where: { id },
        data: updatePayload,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          videos: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          variants: true,
          category: true,
        },
      });
      invalidateProductCache();
      return formatProductFromPrisma(updated);
    }

    const index = inMemoryProducts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('محصول مورد نظر یافت نشد.');
    }

    const existingProd = inMemoryProducts[index];
    const newQty = data.stockQuantity !== undefined ? Math.max(0, Math.round(Number(data.stockQuantity))) : existingProd.stockQuantity;
    const newInStock = data.inStock !== undefined ? Boolean(data.inStock) : (data.stockQuantity !== undefined ? newQty > 0 : existingProd.inStock);

    const updated = {
      ...existingProd,
      ...data,
      stockQuantity: newQty,
      inStock: newInStock,
      updatedAt: new Date().toISOString(),
    };

    inMemoryProducts[index] = updated;
    invalidateProductCache();
    return updated;
  }

  async deleteProduct(id: string) {
    if (isDbConnected()) {
      const deleted = await prisma.product.delete({
        where: { id },
      });
      invalidateProductCache();
      return formatProductFromPrisma(deleted);
    }
    const index = inMemoryProducts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('محصول مورد نظر یافت نشد.');
    }
    const [deleted] = inMemoryProducts.splice(index, 1);
    invalidateProductCache();
    return deleted;
  }

  async updateStock(id: string, quantityChange: number) {
    if (isDbConnected()) {
      const prod = await prisma.product.findUnique({ where: { id } });
      if (!prod) return null;
      const newQty = Math.max(0, prod.stockQuantity + quantityChange);
      const updated = await prisma.product.update({
        where: { id },
        data: {
          stockQuantity: newQty,
          inStock: newQty > 0,
        },
      });
      invalidateProductCache();
      return formatProductFromPrisma(updated);
    }
    const index = inMemoryProducts.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const product = inMemoryProducts[index];
    const newQty = Math.max(0, (product.stockQuantity || 0) + quantityChange);
    product.stockQuantity = newQty;
    product.inStock = newQty > 0;
    invalidateProductCache();
    return product;
  }

  async getAdminStats() {
    if (isDbConnected()) {
      try {
        const [
          productCount,
          categoryCount,
          userCount,
          orderCount,
          totalRevenueAgg,
          pendingOrderCount,
          preparingOrderCount,
          inquiryCount,
          newInquiryCount,
          consultationCount,
          reviewCount,
        ] = await Promise.all([
          prisma.product.count(),
          prisma.category.count(),
          prisma.user.count(),
          prisma.order.count(),
          prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { NOT: [{ status: 'CANCELLED' }, { status: 'cancelled' }] },
          }),
          prisma.order.count({ where: { status: { in: ['PENDING', 'pending'] } } }),
          prisma.order.count({ where: { status: { in: ['PREPARING', 'preparing', 'PACKAGED', 'packaged'] } } }),
          prisma.corporateInquiry.count(),
          prisma.corporateInquiry.count({ where: { status: { in: ['NEW', 'new'] } } }),
          prisma.consultation.count(),
          prisma.review.count(),
        ]);
        return {
          products: productCount,
          categories: categoryCount,
          users: userCount,
          orders: orderCount,
          totalRevenue: totalRevenueAgg._sum.totalAmount || 0,
          pendingOrders: pendingOrderCount,
          preparingOrders: preparingOrderCount,
          inquiries: inquiryCount,
          newInquiries: newInquiryCount,
          consultations: consultationCount,
          reviews: reviewCount,
        };
      } catch (err) {
        console.warn('Prisma getAdminStats error:', err);
      }
    }
    return {
      products: inMemoryProducts.length,
      categories: inMemoryCategories.length,
      users: 1,
      orders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      preparingOrders: 0,
      inquiries: 0,
      newInquiries: 0,
      consultations: 0,
      reviews: 0,
    };
  }
}

export class CategoryService {
  async getCategories() {
    if (isDbConnected()) {
      try {
        const categories = await prisma.category.findMany({
          include: {
            _count: {
              select: { products: true },
            },
          },
          orderBy: { nameFa: 'asc' },
        });
        return categories.map(formatCategoryFromPrisma);
      } catch (err) {
        console.warn('Prisma getCategories error, falling back:', err);
      }
    }
    return inMemoryCategories;
  }

  async getCategoryBySlug(slug: string) {
    if (isDbConnected()) {
      try {
        const cat = await prisma.category.findFirst({
          where: {
            OR: [
              { slug },
              { id: slug },
            ],
          },
          include: {
            _count: {
              select: { products: true },
            },
          },
        });
        if (cat) return formatCategoryFromPrisma(cat);
      } catch (err) {
        console.warn('Prisma getCategoryBySlug error, falling back:', err);
      }
    }
    return inMemoryCategories.find((c) => c.slug === slug || c.id === slug) || null;
  }

  async createCategory(data: any) {
    const nameFa = (data.nameFa || data.name || data.titleFa || data.title || '').trim();
    if (!nameFa) {
      throw new Error('نام دسته‌بندی الزامی است.');
    }
    const id = data.id || `cat_${Date.now()}`;
    const slug = (data.slug || id).trim();
    const nameEn = (data.nameEn || '').trim();
    const descriptionFa = (data.descriptionFa || '').trim();
    const iconName = data.iconName ? String(data.iconName) : 'Gift';
    const isFeatured = Boolean(data.isFeatured);

    if (isDbConnected()) {
      const created = await prisma.category.create({
        data: {
          id,
          nameFa,
          nameEn,
          slug,
          descriptionFa,
          iconName,
          isFeatured,
        },
      });
      return formatCategoryFromPrisma(created);
    }
    const newCategory = { ...data, id, nameFa, nameEn, slug, descriptionFa, iconName, isFeatured };
    inMemoryCategories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: string, data: any) {
    if (isDbConnected()) {
      const updateData: any = {};
      if (data.nameFa !== undefined) updateData.nameFa = String(data.nameFa).trim();
      if (data.nameEn !== undefined) updateData.nameEn = String(data.nameEn).trim();
      if (data.slug !== undefined) updateData.slug = String(data.slug).trim();
      if (data.descriptionFa !== undefined) updateData.descriptionFa = String(data.descriptionFa).trim();
      if (data.iconName !== undefined) updateData.iconName = data.iconName ? String(data.iconName) : null;
      if (data.isFeatured !== undefined) updateData.isFeatured = Boolean(data.isFeatured);

      const updated = await prisma.category.update({
        where: { id },
        data: updateData,
      });
      return formatCategoryFromPrisma(updated);
    }
    const index = inMemoryCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('دسته‌بندی یافت نشد.');
    inMemoryCategories[index] = { ...inMemoryCategories[index], ...data };
    return inMemoryCategories[index];
  }

  async deleteCategory(id: string) {
    if (isDbConnected()) {
      const hasProducts = await prisma.product.count({ where: { categoryId: id } });
      if (hasProducts > 0) {
        throw new Error('امکان حذف این دسته‌بندی وجود ندارد چون محصولاتی به آن متصل هستند.');
      }
      const deleted = await prisma.category.delete({ where: { id } });
      return formatCategoryFromPrisma(deleted);
    }
    const hasProducts = inMemoryProducts.some((p) => p.category === id);
    if (hasProducts) {
      throw new Error('امکان حذف این دسته‌بندی وجود ندارد چون محصولاتی به آن متصل هستند.');
    }
    const index = inMemoryCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('دسته‌بندی یافت نشد.');
    const [deleted] = inMemoryCategories.splice(index, 1);
    return deleted;
  }
}

export const productService = new ProductService();
export const categoryService = new CategoryService();
