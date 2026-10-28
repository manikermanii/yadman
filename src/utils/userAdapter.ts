import { User, UserRole, UserStatus, AccountType } from '../types';
import { getPersianNowString } from './authService';

/**
 * Maps raw backend user data (from Prisma/Express API) to the rich frontend User model.
 * Guarantees that both `fullName` and `name`, as well as `phoneNumber` and `phone`,
 * are properly populated with resilient fallbacks.
 */
export function mapBackendUserToFrontendUser(rawUser: any, fallbackUser?: User | null): User {
  if (!rawUser) {
    throw new Error('Cannot map null or undefined user');
  }

  // 1. Resolve Display Name / Full Name
  const resolvedName = (
    rawUser.fullName ||
    rawUser.name ||
    rawUser.displayName ||
    fallbackUser?.fullName ||
    fallbackUser?.name ||
    'کاربر یادمان'
  ).toString().trim();

  // 2. Resolve Phone Number
  const resolvedPhone = (
    rawUser.phoneNumber ||
    rawUser.phone ||
    fallbackUser?.phoneNumber ||
    fallbackUser?.phone ||
    ''
  ).toString().trim();

  // 3. Resolve Email
  const resolvedEmail = (
    rawUser.email ||
    fallbackUser?.email ||
    undefined
  );

  // 4. Resolve Account Type & Corporate Profile
  const companyName = (
    rawUser.companyName ||
    rawUser.corporateProfile?.companyName ||
    fallbackUser?.corporateProfile?.companyName ||
    ''
  ).toString().trim();

  const accountType: AccountType =
    rawUser.accountType === 'corporate' || !!companyName
      ? 'corporate'
      : (fallbackUser?.accountType || 'personal');

  const corporateProfile = accountType === 'corporate' && companyName
    ? {
        companyName,
        jobTitle: rawUser.corporateProfile?.jobTitle || fallbackUser?.corporateProfile?.jobTitle || 'نماینده شرکت',
        corporatePhone: rawUser.corporateProfile?.corporatePhone || fallbackUser?.corporateProfile?.corporatePhone || resolvedPhone,
        economicCode: rawUser.corporateProfile?.economicCode || fallbackUser?.corporateProfile?.economicCode,
        nationalId: rawUser.corporateProfile?.nationalId || fallbackUser?.corporateProfile?.nationalId,
      }
    : undefined;

  // 5. Resolve Role
  const rawRole = (rawUser.role || fallbackUser?.role || 'CUSTOMER').toString().toLowerCase();
  const role: UserRole =
    rawRole === 'admin' || rawRole === 'super_admin' || rawRole === 'superadmin'
      ? 'admin'
      : 'customer';

  // 6. Resolve Status
  let status: UserStatus = 'active';
  if (rawUser.isActive === false || rawUser.status === 'inactive') {
    status = 'inactive';
  } else if (rawUser.status === 'suspended') {
    status = 'suspended';
  } else if (rawUser.isActive === true || rawUser.status === 'active') {
    status = 'active';
  } else if (fallbackUser?.status) {
    status = fallbackUser.status;
  }

  // 7. Resolve Addresses
  const addresses = Array.isArray(rawUser.addresses)
    ? rawUser.addresses.map((a: any) => ({
        id: a.id || `addr-${Date.now()}-${Math.random()}`,
        title: a.title || 'آدرس پیش‌فرض',
        recipientName: a.recipientName || resolvedName,
        phoneNumber: a.phoneNumber || resolvedPhone,
        province: a.province || 'تهران',
        city: a.city || 'تهران',
        postalCode: a.postalCode || '',
        address: a.fullAddress || a.address || '',
        fullAddress: a.fullAddress || a.address || '',
        isDefault: Boolean(a.isDefault),
      }))
    : (Array.isArray(fallbackUser?.addresses) ? fallbackUser!.addresses : []);

  // 8. Resolve Wishlist & Cart
  const wishlist = Array.isArray(rawUser.wishlist)
    ? rawUser.wishlist
    : (Array.isArray(fallbackUser?.wishlist) ? fallbackUser!.wishlist : []);

  const cart = Array.isArray(rawUser.cart)
    ? rawUser.cart
    : (Array.isArray(fallbackUser?.cart) ? fallbackUser!.cart : []);

  // 9. Dates
  const createdAt = rawUser.createdAt || fallbackUser?.createdAt || new Date().toISOString();
  const createdAtFa =
    rawUser.createdAtFa ||
    (rawUser.createdAt ? new Date(rawUser.createdAt).toLocaleDateString('fa-IR') : undefined) ||
    fallbackUser?.createdAtFa ||
    getPersianNowString();
  const lastLoginAt = rawUser.lastLoginAt || new Date().toISOString();
  const lastLoginAtFa = rawUser.lastLoginAtFa || 'هم‌اکنون';

  return {
    id: rawUser.id || fallbackUser?.id || `USR-${Date.now()}`,
    fullName: resolvedName,
    name: resolvedName,
    phoneNumber: resolvedPhone,
    phone: resolvedPhone,
    email: resolvedEmail,
    passwordHash: rawUser.passwordHash || fallbackUser?.passwordHash || '',
    passwordSalt: rawUser.passwordSalt || fallbackUser?.passwordSalt || '',
    accountType,
    corporateProfile,
    role,
    status,
    addresses,
    wishlist,
    cart,
    createdAt,
    createdAtFa,
    lastLoginAt,
    lastLoginAtFa,
    ordersCount: rawUser.ordersCount ?? rawUser._count?.orders ?? fallbackUser?.ordersCount ?? 0,
    totalSpent: rawUser.totalSpent ?? fallbackUser?.totalSpent ?? 0,
    adminNotes: rawUser.adminNotes || fallbackUser?.adminNotes,
  };
}

/**
 * Returns safe initials and display name for user avatars
 */
export function getUserDisplayInfo(user: Partial<User> | null | undefined): {
  displayName: string;
  initial: string;
  displayPhone: string;
  isCorporate: boolean;
} {
  if (!user) {
    return {
      displayName: 'مهمان',
      initial: 'م',
      displayPhone: '',
      isCorporate: false,
    };
  }

  const rawName = (user.fullName || user.name || '').trim();
  const displayName = rawName || 'کاربر';
  const initial = displayName.charAt(0).toUpperCase() || 'ک';
  const displayPhone = (user.phoneNumber || user.phone || '').trim();
  const isCorporate = user.accountType === 'corporate' || !!user.corporateProfile?.companyName;

  return {
    displayName,
    initial,
    displayPhone,
    isCorporate,
  };
}
