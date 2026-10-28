import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isZod = err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues);
  if (isZod) {
    const issues = err.issues || err.errors || [];
    const firstIssue = issues[0];
    const message = issues.map((i: any) => i.message).filter(Boolean).join('، ') ||
      (firstIssue ? `${firstIssue.path?.join('.')}: ${firstIssue.message}` : 'اطلاعات ارسالی نامعتبر است');

    return sendError(res, 'VALIDATION_ERROR', message, 400, issues);
  }

  // Handle PrismaClientValidationError gracefully
  if (
    err?.name === 'PrismaClientValidationError' ||
    err?.constructor?.name === 'PrismaClientValidationError' ||
    (typeof err?.message === 'string' && err.message.includes('Invalid `prisma.'))
  ) {
    console.warn('[Prisma Validation Warning]', err.message?.split('\n').filter(Boolean).pop() || err.message);
    return sendError(
      res,
      'VALIDATION_ERROR',
      'داده‌های ارسالی با ساختار مجاز همخوانی ندارد. لطفاً تمامی مقادیر و فیلدهای الزامی را بررسی فرمایید.',
      400
    );
  }

  // Handle PrismaClientKnownRequestError gracefully
  if (
    err?.name === 'PrismaClientKnownRequestError' ||
    err?.constructor?.name === 'PrismaClientKnownRequestError'
  ) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target || 'مقدار یکتا';
      return sendError(
        res,
        'CONFLICT',
        `این مقدار (${target}) قبلاً ثبت شده است و تکراری می‌باشد.`,
        409
      );
    }
    if (err.code === 'P2025') {
      return sendError(
        res,
        'NOT_FOUND',
        'مورد درخواستی در سیستم یافت نشد.',
        404
      );
    }
    if (err.code === 'P2003') {
      return sendError(
        res,
        'FOREIGN_KEY_VIOLATION',
        'شناسه مرجع مشخص‌شده نامعتبر است.',
        400
      );
    }
  }

  console.error('[API Error]', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'خطای غیرمنتظره در سرور رخ داد. لطفاً مجدداً تلاش کنید.';

  return sendError(res, code, message, statusCode);
}

export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, 'NOT_FOUND', `مسیر درخواستی یافت نشد: ${req.method} ${req.originalUrl}`, 404);
}
