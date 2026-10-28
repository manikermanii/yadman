import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../services/prisma.js';
import { authService } from '../services/authService.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.js';

export function formatUserResponse(user: any) {
  const rawRole = (user.role || 'CUSTOMER').toString().toLowerCase();
  const companyName = user.companyName ? user.companyName.trim() : null;
  const accountType = companyName ? 'corporate' : 'personal';
  const name = user.name || user.fullName || 'کاربر گرامی';
  const phone = user.phone || user.phoneNumber || '';

  return {
    id: user.id,
    email: user.email || null,
    name,
    fullName: name,
    phone,
    phoneNumber: phone,
    companyName,
    accountType,
    corporateProfile: companyName ? { companyName } : undefined,
    role: rawRole === 'admin' || rawRole === 'super_admin' || rawRole === 'superadmin' ? 'admin' : 'customer',
    avatar: user.avatar || null,
    addresses: user.addresses || [],
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
  };
}

export const authController = {
  // Customer Register
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, phone, fullName, phoneNumber, companyName } = req.body;

      const resolvedName = (name || fullName || '').trim();
      const resolvedPhone = (phone || phoneNumber || '').trim();
      const resolvedEmail = (email || '').trim().toLowerCase();

      if (!resolvedPhone && !resolvedEmail) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'شماره موبایل یا ایمیل الزامی است.' },
        });
        return;
      }

      if (!password || password.length < 6) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' },
        });
        return;
      }

      const finalEmail = resolvedEmail || `${resolvedPhone}@yadman.local`;

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(resolvedEmail ? [{ email: resolvedEmail }] : []),
            ...(resolvedPhone ? [{ phone: resolvedPhone }] : []),
          ],
        },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: { code: 'USER_EXISTS', message: 'کاربری با این ایمیل یا شماره موبایل قبلاً ثبت‌نام کرده است.' },
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: finalEmail,
          passwordHash,
          name: resolvedName || 'کاربر گرامی',
          phone: resolvedPhone || undefined,
          companyName: companyName ? companyName.trim() : undefined,
          role: 'CUSTOMER',
        },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        fullName: user.name,
        phoneNumber: user.phone || undefined,
      });

      res.cookie('yadman_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: {
          token,
          user: formatUserResponse(user),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Customer / Common Login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, phone, identifier: rawId, password } = req.body;
      const identifier = (email || phone || rawId || '').trim();

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'لطفاً نام کاربری/شماره موبایل و رمز عبور را وارد کنید.' },
        });
        return;
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier.toLowerCase() },
            { phone: identifier },
          ],
        },
        include: {
          addresses: true,
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'ایمیل/شماره موبایل یا رمز عبور اشتباه است.' },
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_INACTIVE', message: 'حساب کاربری شما مسدود یا غیرفعال است.' },
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'ایمیل/شماره موبایل یا رمز عبور اشتباه است.' },
        });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        fullName: user.name,
        phoneNumber: user.phone || undefined,
      });

      res.cookie('yadman_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          token,
          user: formatUserResponse(user),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin Login
  async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, identifier: rawId, password } = req.body;
      const identifier = (email || username || rawId || '').trim();

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'نام کاربری و رمز عبور را وارد کنید.' },
        });
        return;
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier.toLowerCase() },
            { phone: identifier },
            ...(identifier.toLowerCase() === 'admin' ? [{ email: 'admin@yadman.ir' }] : []),
          ],
        },
      });

      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'SUPERADMIN')) {
        res.status(401).json({
          success: false,
          error: { code: 'ADMIN_ACCESS_DENIED', message: 'اطلاعات ورود مدیر نامعتبر است یا دسترسی لازم وجود ندارد.' },
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'رمز عبور مدیریت اشتباه است.' },
        });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        fullName: user.name,
        phoneNumber: user.phone || undefined,
      });

      res.cookie('yadman_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          token,
          admin: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get Current Authenticated User (Me / getMe)
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'احراز هویت نشده است.' },
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          companyName: true,
          role: true,
          avatar: true,
          createdAt: true,
          addresses: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'کاربر یافت نشد.' },
        });
        return;
      }

      res.json({
        success: true,
        data: { user: formatUserResponse(user) },
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    return authController.getMe(req, res, next);
  },

  // Update Profile
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'احراز هویت نشده است.' } });
        return;
      }

      const { name, phone, companyName, avatar } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(companyName !== undefined && { companyName }),
          ...(avatar && { avatar }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          companyName: true,
          role: true,
          avatar: true,
          addresses: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: { user: formatUserResponse(updatedUser) },
      });
    } catch (error) {
      next(error);
    }
  },

  // Change Password
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'احراز هویت نشده است.' } });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword || newPassword.length < 6) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' },
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'کاربر یافت نشد.' } });
        return;
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'رمز عبور فعلی نادرست است.' },
        });
        return;
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      res.json({
        success: true,
        message: 'رمز عبور با موفقیت به‌روزرسانی شد.',
      });
    } catch (error) {
      next(error);
    }
  },

  // Logout
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.cookie('yadman_token', '', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 0, expires: new Date(0) });
      res.cookie('yadman_admin_token', '', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 0, expires: new Date(0) });
      res.json({
        success: true,
        message: 'با موفقیت خارج شدید.',
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Get all users
  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          companyName: true,
          role: true,
          isActive: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          addresses: true,
          _count: {
            select: { orders: true, reviews: true },
          },
        },
      });

      res.json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Update user active/inactive status, role, and profile details
  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive, status, role, name, fullName, phone, phoneNumber, companyName } = req.body;

      let newIsActive: boolean | undefined = undefined;
      if (typeof isActive === 'boolean') {
        newIsActive = isActive;
      } else if (typeof status === 'string') {
        newIsActive = status.toLowerCase() === 'active';
      }

      let newRole: string | undefined = undefined;
      if (typeof role === 'string' && role.trim()) {
        const normalized = role.trim().toUpperCase();
        if (['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'].includes(normalized)) {
          newRole = normalized;
        }
      }

      const resolvedName = (name || fullName)?.trim();
      const resolvedPhone = (phone || phoneNumber)?.trim();
      const resolvedCompany = companyName !== undefined ? companyName.trim() : undefined;

      const profileData: { name?: string; phone?: string; companyName?: string } = {};
      if (resolvedName) profileData.name = resolvedName;
      if (resolvedPhone) profileData.phone = resolvedPhone;
      if (resolvedCompany !== undefined) profileData.companyName = resolvedCompany;

      if (newIsActive === undefined && newRole === undefined && Object.keys(profileData).length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'حداقل یکی از موارد وضعیت، نقش یا مشخصات کاربر باید ارسال شود.' },
        });
        return;
      }

      const updatedUser = await authService.updateUserStatus(
        id,
        newIsActive,
        newRole,
        Object.keys(profileData).length > 0 ? profileData : undefined
      );

      res.json({
        success: true,
        data: { user: updatedUser },
      });
    } catch (error: any) {
      if (error?.message === 'کاربر مورد نظر یافت نشد.') {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
        return;
      }
      if (
        error?.message?.includes('مدیر ارشد') ||
        error?.message?.includes('قبلاً در سیستم ثبت شده است')
      ) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: error.message },
        });
        return;
      }
      next(error);
    }
  },
};
