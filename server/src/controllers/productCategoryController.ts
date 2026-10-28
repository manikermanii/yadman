import { Request, Response, NextFunction } from 'express';
import { productService, categoryService } from '../services/productService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { productCreateSchema, productUpdateSchema, categoryCreateSchema, categoryUpdateSchema } from '../validators/index.js';
import { extractToken, verifyToken } from '../middleware/auth.js';

export class ProductController {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      // Determine if caller has an active admin session
      const token = extractToken(req, 'admin');
      const payload = token ? verifyToken(token) : null;
      const isAdmin = Boolean(
        payload &&
        (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN' || payload.role === 'SUPERADMIN')
      );

      const query = {
        category: req.query.category as string,
        searchQuery: req.query.searchQuery as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        occasions: req.query.occasions ? (Array.isArray(req.query.occasions) ? req.query.occasions as string[] : [req.query.occasions as string]) : undefined,
        giftTypes: req.query.giftTypes ? (Array.isArray(req.query.giftTypes) ? req.query.giftTypes as string[] : [req.query.giftTypes as string]) : undefined,
        boxPackagingTypes: req.query.boxPackagingTypes ? (Array.isArray(req.query.boxPackagingTypes) ? req.query.boxPackagingTypes as string[] : [req.query.boxPackagingTypes as string]) : undefined,
        suitableFor: req.query.suitableFor ? (Array.isArray(req.query.suitableFor) ? req.query.suitableFor as string[] : [req.query.suitableFor as string]) : undefined,
        brandOrigins: req.query.brandOrigins ? (Array.isArray(req.query.brandOrigins) ? req.query.brandOrigins as string[] : [req.query.brandOrigins as string]) : undefined,
        inStockOnly: req.query.inStockOnly === 'true',
        discountOnly: req.query.discountOnly === 'true',
        minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
        sortBy: req.query.sortBy as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 24,
        featured: req.query.featured ? req.query.featured === 'true' : undefined,
        status: req.query.status as string,
        isAdmin,
      };

      const result = await productService.getProducts(query);
      return sendSuccess(res, result.products, 200, result.pagination);
    } catch (err: any) {
      next(err);
    }
  }

  async getProductBySlugOrId(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier } = req.params;
      const token = extractToken(req, 'admin');
      const payload = token ? verifyToken(token) : null;
      const isAdmin = Boolean(
        payload &&
        (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN' || payload.role === 'SUPERADMIN')
      );

      const product = await productService.getProductBySlugOrId(identifier, isAdmin);
      if (!product) {
        return sendError(res, 'PRODUCT_NOT_FOUND', 'محصول مورد نظر یافت نشد.', 404);
      }
      return sendSuccess(res, product);
    } catch (err: any) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = productCreateSchema.parse(req.body);
      const product = await productService.createProduct(validated);
      return sendSuccess(res, product, 201);
    } catch (err: any) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = productUpdateSchema.parse(req.body);
      const product = await productService.updateProduct(id, validated);
      return sendSuccess(res, product);
    } catch (err: any) {
      next(err);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await productService.deleteProduct(id);
      return sendSuccess(res, deleted);
    } catch (err: any) {
      next(err);
    }
  }
}

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.getCategories();
      return sendSuccess(res, categories);
    } catch (err: any) {
      next(err);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const category = await categoryService.getCategoryBySlug(slug);
      if (!category) {
        return sendError(res, 'CATEGORY_NOT_FOUND', 'دسته‌بندی یافت نشد.', 404);
      }
      return sendSuccess(res, category);
    } catch (err: any) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = {
        ...req.body,
        nameFa: req.body?.nameFa || req.body?.name || req.body?.titleFa || req.body?.title,
      };
      const validated = categoryCreateSchema.parse(payload);
      const created = await categoryService.createCategory(validated);
      return sendSuccess(res, created, 201);
    } catch (err: any) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const normalizedNameFa = req.body?.nameFa || req.body?.name || req.body?.titleFa || req.body?.title;
      const payload = {
        ...req.body,
        ...(normalizedNameFa ? { nameFa: normalizedNameFa } : {}),
      };
      const validated = categoryUpdateSchema.parse(payload);
      const updated = await categoryService.updateCategory(id, validated);
      return sendSuccess(res, updated);
    } catch (err: any) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await categoryService.deleteCategory(id);
      return sendSuccess(res, deleted);
    } catch (err: any) {
      next(err);
    }
  }
}

export const productController = new ProductController();
export const categoryController = new CategoryController();
