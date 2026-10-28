import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

export interface JwtUserPayload {
  userId: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPERADMIN' | string;
  phoneNumber?: string;
  phone?: string;
  email?: string;
  fullName?: string;
  name?: string;
}

export type AuthenticatedRequest = Request & {
  user: JwtUserPayload;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export function generateToken(payload: JwtUserPayload, expiresIn = '7d'): string {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign(payload, config.jwtSecret, { expiresIn } as any);
}

export function verifyToken(token: string): JwtUserPayload | null {
  try {
    if (!config.jwtSecret) return null;
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    if (!decoded) return null;
    return {
      userId: decoded.userId || decoded.id,
      role: decoded.role,
      phoneNumber: decoded.phoneNumber || decoded.phone,
      phone: decoded.phone || decoded.phoneNumber,
      email: decoded.email,
      fullName: decoded.fullName || decoded.name,
      name: decoded.name || decoded.fullName,
    };
  } catch {
    return null;
  }
}

export function extractToken(req: Request, type: 'customer' | 'admin' | 'any' = 'any'): string | null {
  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  // 2. Check cookies
  if (req.cookies) {
    if (type === 'admin') {
      return req.cookies.yadman_admin_token || req.cookies.yadman_token || null;
    }
    if (type === 'customer') {
      return req.cookies.yadman_token || req.cookies.yadman_admin_token || null;
    }
    return req.cookies.yadman_token || req.cookies.yadman_admin_token || null;
  }
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req, 'customer');
  if (!token) {
    return sendError(res, 'UNAUTHORIZED', 'لطفاً ابتدا وارد حساب کاربری خود شوید.', 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    return sendError(res, 'INVALID_TOKEN', 'نشست کاربری شما منقضی شده است. لطفاً مجدداً وارد شوید.', 401);
  }

  req.user = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req, 'admin');
  if (!token) {
    return sendError(res, 'UNAUTHORIZED', 'دسترسی به این بخش نیاز به ورود به پنل مدیریت دارد.', 401);
  }

  const payload = verifyToken(token);
  const isAdmin = payload && (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN' || payload.role === 'SUPERADMIN');
  if (!isAdmin) {
    return sendError(res, 'FORBIDDEN', 'شما دسترسی لازم برای مشاهده این بخش را ندارید.', 403);
  }

  req.user = payload;
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req, 'any');
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}
