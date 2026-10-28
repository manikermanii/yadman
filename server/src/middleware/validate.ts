import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const issues = err.issues || err.errors || [];
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: issues.map((e: any) => e.message).filter(Boolean).join('، ') || 'اطلاعات ارسالی نامعتبر است',
            details: issues,
          },
        });
        return;
      }
      next(err);
    }
  };
}
