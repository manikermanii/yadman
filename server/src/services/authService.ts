import bcrypt from 'bcryptjs';
import { prisma, isDbConnected } from '../config/database.js';
import { config } from '../config/env.js';
import { generateToken, JwtUserPayload } from '../middleware/auth.js';

// In-memory fallback cache for when DB is connecting or in development
const inMemoryUsers: any[] = [
  {
    id: 'USR-ADMIN-01',
    email: 'admin@yadman.ir',
    phone: '09120000000',
    role: 'ADMIN',
    isActive: true,
    companyName: 'یادمان',
    addresses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class AuthService {
  async registerUser(data: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    password: string;
    accountType?: 'personal' | 'corporate';
    corporateName?: string;
    jobTitle?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = 'CUSTOMER';
    const email = data.email || `${data.phoneNumber}@yadman.local`;

    if (isDbConnected()) {
      // Check existing phone or email
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: data.phoneNumber },
            ...(data.email ? [{ email: data.email }] : []),
          ],
        },
      });
      if (existing) {
        throw new Error('این شماره موبایل یا ایمیل قبلاً در سیستم ثبت شده است.');
      }

      const user = await prisma.user.create({
        data: {
          name: data.fullName,
          phone: data.phoneNumber,
          email,
          passwordHash,
          role,
          companyName: data.corporateName,
          isActive: true,
        },
      });

      const tokenPayload: JwtUserPayload = {
        userId: user.id,
        role: user.role as any,
        phoneNumber: user.phone || undefined,
        phone: user.phone || undefined,
        email: user.email,
        fullName: user.name,
        name: user.name,
      };

      const token = generateToken(tokenPayload);
      const { passwordHash: _, ...safeUser } = user;
      return { user: safeUser, token };
    }

    // In-memory fallback
    const exists = inMemoryUsers.find((u) => u.phone === data.phoneNumber || (data.email && u.email === data.email));
    if (exists) {
      throw new Error('این شماره موبایل قبلاً در سیستم ثبت شده است.');
    }

    const newUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: data.fullName,
      phone: data.phoneNumber,
      email,
      passwordHash,
      role: 'CUSTOMER',
      isActive: true,
      companyName: data.corporateName,
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryUsers.push(newUser);

    const token = generateToken({
      userId: newUser.id,
      role: 'CUSTOMER',
      phoneNumber: newUser.phone,
      phone: newUser.phone,
      email: newUser.email,
      fullName: newUser.name,
      name: newUser.name,
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  async loginUser(identifier: string, password: string) {
    if (isDbConnected()) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ phone: identifier }, { email: identifier }],
        },
        include: { addresses: true },
      });

      if (!user) {
        throw new Error('کاربری با این مشخصات یافت نشد.');
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new Error('رمز عبور وارد شده نادرست است.');
      }

      if (!user.isActive) {
        throw new Error('حساب کاربری شما مسدود یا غیرفعال شده است.');
      }

      const token = generateToken({
        userId: user.id,
        role: user.role as any,
        phoneNumber: user.phone || undefined,
        phone: user.phone || undefined,
        email: user.email,
        fullName: user.name,
        name: user.name,
      });

      const { passwordHash: _, ...safeUser } = user;
      return { user: safeUser, token };
    }

    // In-memory fallback
    const user = inMemoryUsers.find(
      (u) => u.phone === identifier || u.email === identifier
    );
    if (!user) {
      throw new Error('کاربری با این مشخصات یافت نشد.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('رمز عبور وارد شده نادرست است.');
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phone,
      phone: user.phone,
      email: user.email,
      fullName: user.name,
      name: user.name,
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async loginAdmin(identifier: string, password: string) {
    const user = await this.loginUser(identifier, password);
    if (user.user.role !== 'ADMIN' && user.user.role !== 'SUPER_ADMIN' && user.user.role !== 'SUPERADMIN') {
      throw new Error('دسترسی مدیریت برای این حساب کاربری مجاز نیست.');
    }
    return user;
  }

  async getCurrentUser(userId: string) {
    if (isDbConnected()) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { addresses: true },
      });
      if (!user) return null;
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }

    const user = inMemoryUsers.find((u) => u.id === userId);
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async updateUserStatus(
    userId: string,
    isActive?: boolean,
    role?: string,
    profileData?: { name?: string; phone?: string; companyName?: string }
  ) {
    if (isDbConnected()) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new Error('کاربر مورد نظر یافت نشد.');
      }

      // Safeguard: Protect primary system admin from deactivation or role demotion
      if (user.email === 'admin@yadman.ir') {
        if (isActive === false) {
          throw new Error('حساب مدیر ارشد سامانه (admin@yadman.ir) قابل غیرفعال‌سازی نیست.');
        }
        if (role && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
          throw new Error('امکان تغییر نقش مدیر ارشد سیستم وجود ندارد.');
        }
      }

      const dataToUpdate: any = {};
      if (typeof isActive === 'boolean') {
        dataToUpdate.isActive = isActive;
      }
      if (typeof role === 'string' && role.trim()) {
        dataToUpdate.role = role.trim().toUpperCase();
      }
      if (profileData) {
        if (typeof profileData.name === 'string' && profileData.name.trim()) {
          dataToUpdate.name = profileData.name.trim();
        }
        if (typeof profileData.phone === 'string' && profileData.phone.trim()) {
          const trimmedPhone = profileData.phone.trim();
          if (trimmedPhone !== user.phone) {
            const existingWithPhone = await prisma.user.findFirst({
              where: {
                phone: trimmedPhone,
                id: { not: userId },
              },
            });
            if (existingWithPhone) {
              throw new Error('شماره موبایل وارد شده قبلاً در سیستم برای کاربر دیگری ثبت شده است.');
            }
            dataToUpdate.phone = trimmedPhone;
          }
        }
        if (typeof profileData.companyName === 'string') {
          dataToUpdate.companyName = profileData.companyName.trim() || null;
        }
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
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

      return updated;
    }

    const user = inMemoryUsers.find((u) => u.id === userId);
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (typeof role === 'string' && role.trim()) user.role = role.trim().toUpperCase();
    if (profileData?.name) user.name = profileData.name.trim();
    if (profileData?.phone) user.phone = profileData.phone.trim();
    if (profileData?.companyName !== undefined) user.companyName = profileData.companyName.trim() || null;
    user.updatedAt = new Date();
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();
