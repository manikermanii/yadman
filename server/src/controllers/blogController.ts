import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { blogService } from '../services/blogService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  blogPostCreateSchema,
  blogPostUpdateSchema,
  blogCategorySchema,
  blogAuthorSchema,
} from '../validators/index.js';

function formatZodMessage(err: any, fallback = 'اطلاعات ارسالی نامعتبر است'): { message: string; issues: any[] } {
  const issues = err?.issues || err?.errors || [];
  const message = issues.map((e: any) => e.message).filter(Boolean).join('، ') || fallback;
  return { message, issues };
}

export class BlogController {
  async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.originalUrl.includes('/admin') || (req as any).user?.role === 'ADMIN';
      const query = {
        categorySlug: req.query.categorySlug as string,
        tag: req.query.tag as string,
        search: req.query.search as string,
        status: req.query.status as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : (isAdmin ? 50 : 12),
        isAdmin,
      };
      const result = await blogService.getPosts(query);
      return sendSuccess(res, result.posts, 200, result.pagination);
    } catch (err: any) {
      next(err);
    }
  }

  async getPostBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const isAdmin = (req as any).user?.role === 'ADMIN';
      const post = await blogService.getPostBySlug(slug, isAdmin);
      if (!post) {
        return sendError(res, 'POST_NOT_FOUND', 'مقاله مورد نظر یافت نشد.', 404);
      }
      return sendSuccess(res, post);
    } catch (err: any) {
      next(err);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await blogService.getCategories();
      return sendSuccess(res, categories);
    } catch (err: any) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = blogCategorySchema.parse(req.body);
      const category = await blogService.createCategory(validated);
      return sendSuccess(res, category, 201);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات دسته‌بندی نامعتبر است');
        return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
      }
      if (err.message) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = blogCategorySchema.partial().parse(req.body);
      const category = await blogService.updateCategory(id, validated);
      return sendSuccess(res, category);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات دسته‌بندی نامعتبر است');
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

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await blogService.deleteCategory(id);
      return sendSuccess(res, { success: true, deleted });
    } catch (err: any) {
      if (err.message && err.message.includes('یافت نشد')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      next(err);
    }
  }

  async getAuthors(req: Request, res: Response, next: NextFunction) {
    try {
      const authors = await blogService.getAuthors();
      return sendSuccess(res, authors);
    } catch (err: any) {
      next(err);
    }
  }

  async createAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = blogAuthorSchema.parse(req.body);
      const author = await blogService.createAuthor(validated);
      return sendSuccess(res, author, 201);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات نویسنده نامعتبر است');
        return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
      }
      if (err.message) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      next(err);
    }
  }

  async updateAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = blogAuthorSchema.partial().parse(req.body);
      const author = await blogService.updateAuthor(id, validated);
      return sendSuccess(res, author);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات نویسنده نامعتبر است');
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

  async deleteAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await blogService.deleteAuthor(id);
      return sendSuccess(res, { success: true, deleted });
    } catch (err: any) {
      if (err.message && err.message.includes('یافت نشد')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      next(err);
    }
  }

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = blogPostCreateSchema.parse(req.body);
      const post = await blogService.createPost(validated);
      return sendSuccess(res, post, 201);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات مقاله نامعتبر است');
        return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
      }
      if (err.message) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      next(err);
    }
  }

  async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = blogPostUpdateSchema.parse(req.body);
      const post = await blogService.updatePost(id, validated);
      return sendSuccess(res, post);
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const { message, issues } = formatZodMessage(err, 'اطلاعات مقاله نامعتبر است');
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

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await blogService.deletePost(id);
      return sendSuccess(res, { success: true, deleted });
    } catch (err: any) {
      if (err.message && err.message.includes('یافت نشد')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      next(err);
    }
  }
}

export const blogController = new BlogController();
