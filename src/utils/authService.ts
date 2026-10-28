import { User, CartItem, AuthSession, PasswordResetRequest } from '../types';

// Convert Persian and Arabic digits to English digits
export function normalizeDigits(str: string): string {
  if (!str) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str.toString();
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return result.trim();
}

// Normalize Iranian phone numbers to standard 09xxxxxxxxx format
export function normalizePhoneNumber(phone: string): string {
  const cleaned = normalizeDigits(phone).replace(/[\s\-()+]/g, '');
  if (cleaned.startsWith('0098')) {
    return '0' + cleaned.slice(4);
  }
  if (cleaned.startsWith('98')) {
    return '0' + cleaned.slice(2);
  }
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '0' + cleaned;
  }
  return cleaned;
}

// Validate Iranian mobile numbers
export function isValidMobileNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  const regex = /^09[0-9]{9}$/;
  return regex.test(normalized);
}

// Validate Email
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return true; // Optional field
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

// Check password strength
export function checkPasswordStrength(password: string): {
  score: number; // 0 to 4
  label: string;
  color: string;
  feedback: string;
} {
  if (!password) {
    return { score: 0, label: 'خالی', color: 'bg-stone-200', feedback: 'رمز عبور حداقل ۶ نویسه باشد' };
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 9) score += 1;
  if (/[0-9]/.test(password) && /[a-zA-Z\u0600-\u06FF]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9\u0600-\u06FF]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'ضعیف', color: 'bg-rose-500', feedback: 'از ترکیب حروف و اعداد استفاده کنید' };
    case 2:
      return { score: 2, label: 'متوسط', color: 'bg-amber-500', feedback: 'طول رمز را افزایش دهید' };
    case 3:
      return { score: 3, label: 'خوب', color: 'bg-emerald-600', feedback: 'امنیت رمز عبور مناسب است' };
    case 4:
      return { score: 4, label: 'بسیار قوی', color: 'bg-[#0F4C3A]', feedback: 'رمز عبور عالی و غیرقابل حدس است' };
    default:
      return { score: 0, label: 'بسیار ضعیف', color: 'bg-rose-400', feedback: 'حداقل ۶ نویسه وارد کنید' };
  }
}

// Generate random salt
export function generateSalt(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let salt = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      salt += chars[array[i] % chars.length];
    }
    return salt;
  }
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

// Secure SHA-256 Hash with salt using Web Crypto API
export async function hashPassword(password: string, customSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = customSalt || generateSalt();
  const text = `${salt}:${password}:HEDIEH_LUXURY_SECRET_PEPPER`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return { hash: hashHex, salt };
    } catch {
      // Fallback
    }
  }

  // Pure JS fallback SHA-like deterministic representation
  let hashVal = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hashVal = (hashVal << 5) - hashVal + char;
    hashVal |= 0;
  }
  return { hash: `hashed_${Math.abs(hashVal).toString(16)}_${salt.slice(0, 6)}`, salt };
}

// Verify password
export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const result = await hashPassword(password, storedSalt);
  return result.hash === storedHash;
}

// Merge guest cart with user cart without losing custom gift selections
export function mergeCarts(guestCart: CartItem[] = [], userCart: CartItem[] = []): CartItem[] {
  if (!guestCart || guestCart.length === 0) return userCart || [];
  if (!userCart || userCart.length === 0) return guestCart || [];

  const merged = [...(userCart || [])];

  (guestCart || []).forEach((guestItem) => {
    if (!guestItem) return;
    // If it's a standard catalog product
    if (guestItem.product && !guestItem.isCustomBox) {
      const existingIndex = merged.findIndex(
        (m) =>
          m.product?.id === guestItem.product?.id &&
          m.waxSeal === guestItem.waxSeal &&
          m.ribbonColor === guestItem.ribbonColor &&
          m.cardMessage === guestItem.cardMessage
      );

      if (existingIndex > -1) {
        merged[existingIndex] = {
          ...merged[existingIndex],
          quantity: merged[existingIndex].quantity + guestItem.quantity,
        };
      } else {
        merged.push(guestItem);
      }
    } else {
      // Custom box is uniquely identified
      merged.push(guestItem);
    }
  });

  return merged;
}

// Format Persian date helper
export function getPersianNowString(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format(now);
  } catch {
    return 'هم‌اکنون';
  }
}
