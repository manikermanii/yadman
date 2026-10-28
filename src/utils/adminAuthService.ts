/**
 * Admin Authentication & Authorization Service for Yadman Luxury Admin Panel
 * Uses real backend API endpoints (/api/auth/admin/login, /api/auth/admin/me, /api/auth/admin/logout)
 * No hardcoded credentials or client-side password verification.
 */

import { api } from '../services/api';

export interface AdminSession {
  adminId: string;
  username: string;
  name?: string;
  role: string;
  loginTime: number;
  expiresAt: number;
  token?: string;
}

export interface AdminAuthResult {
  success: boolean;
  session?: AdminSession;
  error?: string;
}

export const ADMIN_SESSION_STORAGE_KEY = 'yadman_admin_session_v1';
export const ADMIN_TOKEN_STORAGE_KEY = 'yadman_admin_token_v1';
const SESSION_DURATION_HOURS = 24 * 7;

/**
 * Real backend authentication for Admin Login
 * Calls POST /api/auth/admin/login
 * No passwords or hardcoded credentials on the client side.
 */
export async function authenticateAdmin(
  usernameInput: string,
  passwordInput: string
): Promise<AdminAuthResult> {
  const identifier = (usernameInput || '').trim();
  const password = (passwordInput || '').trim();

  if (!identifier || !password) {
    return {
      success: false,
      error: 'لطفاً نام کاربری و رمز عبور را وارد کنید.',
    };
  }

  try {
    const res = await api.auth.adminLogin({
      identifier,
      password,
    });

    const admin = res?.admin;
    if (!admin || !admin.id) {
      return {
        success: false,
        error: 'اطلاعات ورود مدیر نامعتبر است.',
      };
    }

    const now = Date.now();
    const expiresAt = now + SESSION_DURATION_HOURS * 60 * 60 * 1000;
    const token = res?.token;

    const session: AdminSession = {
      adminId: admin.id,
      username: admin.email || identifier,
      name: admin.name,
      role: admin.role,
      loginTime: now,
      expiresAt,
      token,
    };

    saveAdminSession(session);

    return {
      success: true,
      session,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'نام کاربری یا رمز عبور اشتباه است.',
    };
  }
}

/**
 * Save lightweight UI session convenience cache
 */
export function saveAdminSession(session: AdminSession): void {
  try {
    const serialized = JSON.stringify(session);
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, serialized);
    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, serialized);
    if (session.token && session.token !== 'undefined' && session.token !== 'null') {
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, session.token);
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, session.token);
    }
  } catch (err) {
    console.error('Failed to save admin session', err);
  }
}

/**
 * Retrieve cached UI session
 */
export function getAdminSession(): AdminSession | null {
  try {
    const raw =
      sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
      localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed: AdminSession = JSON.parse(raw);
    if (!parsed || !parsed.adminId || !parsed.expiresAt) {
      clearAdminSession();
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      clearAdminSession();
      return null;
    }

    if (
      !parsed.token ||
      typeof parsed.token !== 'string' ||
      parsed.token === 'undefined' ||
      parsed.token === 'null'
    ) {
      const storedToken =
        sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ||
        localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
      if (
        storedToken &&
        typeof storedToken === 'string' &&
        storedToken !== 'undefined' &&
        storedToken !== 'null'
      ) {
        parsed.token = storedToken;
      } else {
        clearAdminSession();
        return null;
      }
    }

    return parsed;
  } catch {
    clearAdminSession();
    return null;
  }
}

/**
 * Helper to retrieve stored admin JWT token
 */
export function getAdminToken(): string | null {
  try {
    const directToken =
      sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ||
      localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (
      directToken &&
      typeof directToken === 'string' &&
      directToken !== 'undefined' &&
      directToken !== 'null'
    ) {
      return directToken;
    }

    const session = getAdminSession();
    return session?.token || null;
  } catch {
    return null;
  }
}

/**
 * Real Backend Verification of Admin Session
 * Calls GET /api/auth/admin/me
 * Ensures that client state can never bypass backend authentication.
 */
export async function verifyAdminSessionWithBackend(): Promise<AdminSession | null> {
  try {
    const res = await api.auth.getAdminMe();
    const admin = (res as any)?.user || (res as any)?.admin;
    if (!admin || !admin.id) {
      clearAdminSession();
      return null;
    }

    const isAllowedRole = admin.role === 'ADMIN' || admin.role === 'SUPER_ADMIN' || admin.role === 'SUPERADMIN';
    if (!isAllowedRole) {
      clearAdminSession();
      return null;
    }

    const existingSession = getAdminSession();
    const existingToken = existingSession?.token || getAdminToken() || undefined;

    const now = Date.now();
    const session: AdminSession = {
      adminId: admin.id,
      username: admin.email,
      name: admin.name,
      role: admin.role,
      loginTime: now,
      expiresAt: now + SESSION_DURATION_HOURS * 60 * 60 * 1000,
      token: existingToken,
    };

    saveAdminSession(session);
    return session;
  } catch {
    clearAdminSession();
    return null;
  }
}

/**
 * Check if admin is currently authenticated (optimistic UI check)
 */
export function isCurrentAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}

/**
 * Clear admin session and notify backend
 */
export async function clearAdminSession(): Promise<void> {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    await api.auth.adminLogout().catch(() => {});
  } catch (err) {
    console.error('Failed to clear admin session', err);
  }
}
