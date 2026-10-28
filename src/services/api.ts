/**
 * Yadman API Client Service
 * Fully typed, hosting-independent frontend client for the Yadman REST API.
 */

import {
  Product,
  Category,
  Order,
  Coupon,
  ProductReview,
  BlogPost,
  BlogCategory,
  BlogAuthor,
  CorporateInquiry,
  ConsultationRequest,
  StoreSettings,
  HomepageCMSConfig,
  User,
  CartItem,
  CustomContentItem,
} from '../types';
import { mapBackendUserToFrontendUser } from '../utils/userAdapter';

const API_BASE = '/api';

/**
 * Retrieve admin token from storage to pass Authorization: Bearer <adminToken> header
 * Supports cross-origin/iframe environments while credentials: 'include' maintains cookie auth.
 */
function getStoredAdminToken(): string | null {
  try {
    const directToken =
      sessionStorage.getItem('yadman_admin_token_v1') ||
      localStorage.getItem('yadman_admin_token_v1') ||
      sessionStorage.getItem('yadman_auth_token_v1') ||
      localStorage.getItem('yadman_auth_token_v1');
    if (
      directToken &&
      typeof directToken === 'string' &&
      directToken !== 'undefined' &&
      directToken !== 'null'
    ) {
      return directToken;
    }

    const rawSession =
      sessionStorage.getItem('yadman_admin_session_v1') ||
      localStorage.getItem('yadman_admin_session_v1') ||
      sessionStorage.getItem('yadman_auth_session_v1') ||
      localStorage.getItem('yadman_auth_session_v1');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (
        parsed?.token &&
        typeof parsed.token === 'string' &&
        parsed.token !== 'undefined' &&
        parsed.token !== 'null'
      ) {
        return parsed.token;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

export function recordDiagLog(tag: string, details?: any) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DIAG] ${tag}`, details !== undefined ? details : '');
    }
  } catch {}
}

/**
 * Resilient fetch execution with exponential backoff retry for transient network interruptions on GET requests,
 * direct relative URL resolution in browser environments, and a 30-second timeout for mutations (15s for queries)
 * to prevent premature aborts while saving large CMS configurations.
 */
async function fetchWithNetworkRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  const isBrowser = typeof window !== 'undefined';
  const method = (init.method || 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const effectiveRetries = isMutation ? 0 : retries;

  // In browser environments, always use relative URLs directly to avoid iframe/sandbox cross-origin issues
  // In Node.js environments (tests/SSR), prepend origin if relative URL is provided
  let targetUrl = url;
  if (url.startsWith('/')) {
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      // In a real browser with DOM document, relative URLs like /api/... are natively same-origin
      targetUrl = url;
    } else if (typeof window !== 'undefined' && window.location?.origin && window.location.origin.startsWith('http')) {
      targetUrl = `${window.location.origin}${url}`;
    } else {
      const defaultOrigin = process.env.VITE_APP_URL || 'http://localhost:3000';
      targetUrl = `${defaultOrigin}${url}`;
    }
  }

  let lastErr: any;
  for (let attempt = 0; attempt <= effectiveRetries; attempt++) {
    const controller = new AbortController();
    const timeoutDuration = isMutation ? 30000 : 15000;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutDuration);

    // If caller provided a signal, link it to abort controller
    if (init.signal) {
      init.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      recordDiagLog('fetchWithNetworkRetry:before_fetch', { url, targetUrl, attempt });
      const response = await fetch(targetUrl, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      recordDiagLog('fetchWithNetworkRetry:response_received', { url, targetUrl, status: response.status, ok: response.ok });
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastErr = err;
      const isAbort = err?.name === 'AbortError' || err?.message?.includes('abort') || controller.signal.aborted;
      recordDiagLog('fetchWithNetworkRetry:catch_error', { url, targetUrl, attempt, isAbort, message: err?.message, name: err?.name });
      const isNetworkError =
        isAbort ||
        err instanceof TypeError ||
        err?.name === 'TypeError' ||
        err?.message?.includes('fetch') ||
        err?.message?.includes('network') ||
        err?.message?.includes('Failed');

      if (isNetworkError && attempt < effectiveRetries) {
        // Backoff: 400ms, 800ms
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 400));
        continue;
      }
      break;
    }
  }

  const isTimeout = lastErr?.name === 'AbortError' || lastErr?.message?.includes('abort');
  recordDiagLog('fetchWithNetworkRetry:exhausted_or_fatal', { url, isTimeout, err: lastErr?.message });
  const customError = new Error(
    isTimeout
      ? 'مهلت زمان برقراری ارتباط با سرور به پایان رسید (تایم‌اوت). لطفاً اتصال اینترنت خود را بررسی و مجدداً تلاش کنید.'
      : 'خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی فرمایید.'
  ) as any;
  customError.code = isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR';
  customError.cause = lastErr;
  throw customError;
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Authorization: Bearer <adminToken> header when available
  const adminToken = getStoredAdminToken();
  if (!headers.has('Authorization')) {
    if (adminToken) {
      headers.set('Authorization', `Bearer ${adminToken}`);
    }
  }

  recordDiagLog('fetchJson:start', { url, method: options.method || 'GET', hasToken: !!adminToken });

  // All authenticated requests continue sending secure HTTP-only cookies via credentials: 'include'
  let res: Response;
  try {
    res = await fetchWithNetworkRetry(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (netErr: any) {
    recordDiagLog('fetchJson:network_throw', { url, message: netErr?.message, code: netErr?.code });
    throw netErr;
  }

  const data = await res.json().catch(() => null);
  recordDiagLog('fetchJson:response_parsed', { url, status: res.status, ok: res.ok, hasData: !!data });

  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      (res.status === 401
        ? 'دسترسی به این بخش نیاز به ورود به پنل مدیریت دارد.'
        : res.status === 403
        ? 'شما دسترسی لازم برای مشاهده این بخش را ندارید.'
        : 'خطایی در برقراری ارتباط با سرور رخ داد.');
    const error = new Error(message) as any;
    error.code =
      data?.error?.code ||
      (res.status === 401 ? 'UNAUTHORIZED' : res.status === 403 ? 'FORBIDDEN' : 'HTTP_ERROR');
    error.status = res.status;
    error.details = data?.error?.details;
    recordDiagLog('fetchJson:http_error_throw', { url, status: res.status, code: error.code, message });
    throw error;
  }

  const result = data?.data !== undefined ? data.data : data;
  recordDiagLog('fetchJson:success_return', { url, status: res.status });
  return result;
}

export const api = {
  // Authentication
  auth: {
    async register(payload: {
      name?: string;
      fullName?: string;
      phone?: string;
      phoneNumber?: string;
      email?: string;
      password: string;
      companyName?: string;
    }) {
      const res = await fetchJson<{ user: any; token: string }>(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return {
        ...res,
        user: mapBackendUserToFrontendUser(res.user),
      };
    },

    async login(payload: { identifier?: string; email?: string; phone?: string; password: string }) {
      const res = await fetchJson<{ user: any; token: string }>(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return {
        ...res,
        user: mapBackendUserToFrontendUser(res.user),
      };
    },

    async adminLogin(payload: { identifier?: string; username?: string; email?: string; password: string }) {
      return fetchJson<{ admin: any; token: string }>(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async getMe() {
      const res = await fetchJson<{ user: any }>(`${API_BASE}/auth/me`);
      return {
        ...res,
        user: mapBackendUserToFrontendUser(res.user),
      };
    },

    async getAdminMe() {
      return fetchJson<{ user?: any; admin?: any }>(`${API_BASE}/auth/admin/me`);
    },

    async getAllUsersAdmin(): Promise<User[]> {
      const res = await fetchJson<{ users: any[] }>(`${API_BASE}/auth/admin/users`);
      const rawList = res?.users || (Array.isArray(res) ? res : []);
      return rawList.map((u: any) => mapBackendUserToFrontendUser(u));
    },

    async updateProfile(payload: { name?: string; phone?: string; companyName?: string; avatar?: string }) {
      const res = await fetchJson<{ user: any }>(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return {
        ...res,
        user: mapBackendUserToFrontendUser(res.user),
      };
    },

    async changePassword(payload: { currentPassword: string; newPassword: string }) {
      return fetchJson<{ success: boolean; message: string }>(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    async logout() {
      return fetchJson<{ success: boolean }>(`${API_BASE}/auth/logout`, {
        method: 'POST',
      });
    },

    async adminLogout() {
      return fetchJson<{ success: boolean }>(`${API_BASE}/auth/admin/logout`, {
        method: 'POST',
      });
    },
  },

  // Products & Categories
  products: {
    async getAll(params: Record<string, any> = {}) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.set(key, String(val));
        }
      });
      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return fetchJson<Product[]>(`${API_BASE}/products${qs}`);
    },

    async getById(idOrSlug: string) {
      return fetchJson<Product>(`${API_BASE}/products/${idOrSlug}`);
    },

    async getCategories() {
      return fetchJson<Category[]>(`${API_BASE}/categories`);
    },

    async createAdmin(productData: Partial<Product>) {
      return fetchJson<Product>(`${API_BASE}/admin/products`, {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    },

    async updateAdmin(id: string, productData: Partial<Product>) {
      return fetchJson<Product>(`${API_BASE}/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
    },

    async deleteAdmin(id: string) {
      return fetchJson<{ success: boolean }>(`${API_BASE}/admin/products/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Categories
  categories: {
    async getAll() {
      return fetchJson<Category[]>(`${API_BASE}/categories`);
    },

    async getBySlug(slug: string) {
      return fetchJson<Category>(`${API_BASE}/categories/${slug}`);
    },

    async createAdmin(categoryData: Partial<Category>) {
      return fetchJson<Category>(`${API_BASE}/admin/categories`, {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
    },

    async updateAdmin(id: string, categoryData: Partial<Category>) {
      return fetchJson<Category>(`${API_BASE}/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      });
    },

    async deleteAdmin(id: string) {
      return fetchJson<{ success: boolean }>(`${API_BASE}/admin/categories/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Orders & Checkout
  orders: {
    async create(orderPayload: any) {
      return fetchJson<Order>(`${API_BASE}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
    },

    async getMyOrders() {
      return fetchJson<Order[]>(`${API_BASE}/orders/my`);
    },

    async getById(id: string) {
      return fetchJson<Order>(`${API_BASE}/orders/${id}`);
    },

    async getAllAdmin(params: Record<string, any> = {}) {
      const searchParams = new URLSearchParams(params as any);
      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return fetchJson<Order[]>(`${API_BASE}/admin/orders${qs}`);
    },

    async updateStatusAdmin(id: string, status: string, adminNotes?: string, trackingNumber?: string) {
      return fetchJson<Order>(`${API_BASE}/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNotes, trackingNumber }),
      });
    },

    async deleteAdmin(id: string) {
      return fetchJson<{ id: string; success: boolean }>(`${API_BASE}/admin/orders/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Coupons
  coupons: {
    async validate(code: string, cartTotal: number) {
      return fetchJson<{ isValid: boolean; coupon: Coupon; discountAmount: number }>(
        `${API_BASE}/coupons/validate`,
        {
          method: 'POST',
          body: JSON.stringify({ code, cartTotal }),
        }
      );
    },

    async getActive(): Promise<Coupon[]> {
      const res = await fetchJson<Coupon[]>(`${API_BASE}/coupons/active`);
      return Array.isArray(res) ? res : [];
    },

    async getAllAdmin() {
      return fetchJson<Coupon[]>(`${API_BASE}/admin/coupons`);
    },

    async createAdmin(data: Partial<Coupon>) {
      return fetchJson<Coupon>(`${API_BASE}/admin/coupons`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async updateAdmin(id: string, data: Partial<Coupon>) {
      return fetchJson<Coupon>(`${API_BASE}/admin/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteAdmin(id: string) {
      return fetchJson<{ success: boolean }>(`${API_BASE}/admin/coupons/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Blog
  blog: {
    async getPosts(params: Record<string, any> = {}) {
      const qs = new URLSearchParams(params as any).toString();
      return fetchJson<BlogPost[]>(`${API_BASE}/blog/posts${qs ? `?${qs}` : ''}`);
    },

    async getPostBySlug(slug: string) {
      return fetchJson<BlogPost>(`${API_BASE}/blog/posts/${slug}`);
    },

    async getCategories() {
      return fetchJson<BlogCategory[]>(`${API_BASE}/blog/categories`);
    },

    async getAuthors() {
      return fetchJson<BlogAuthor[]>(`${API_BASE}/blog/authors`);
    },

    // Admin Blog methods
    async getAllAdmin(params: Record<string, any> = {}) {
      const qs = new URLSearchParams({ status: 'all', ...params } as any).toString();
      return fetchJson<BlogPost[]>(`${API_BASE}/blog/admin/posts${qs ? `?${qs}` : ''}`);
    },

    async createAdmin(data: Partial<BlogPost>) {
      return fetchJson<BlogPost>(`${API_BASE}/blog/admin/posts`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async updateAdmin(id: string, data: Partial<BlogPost>) {
      return fetchJson<BlogPost>(`${API_BASE}/blog/admin/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteAdmin(id: string) {
      return fetchJson<{ success: boolean }>(`${API_BASE}/blog/admin/posts/${id}`, {
        method: 'DELETE',
      });
    },

    async createCategoryAdmin(data: Partial<BlogCategory>) {
      return fetchJson<BlogCategory>(`${API_BASE}/blog/admin/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async updateCategoryAdmin(id: string, data: Partial<BlogCategory>) {
      return fetchJson<BlogCategory>(`${API_BASE}/blog/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteCategoryAdmin(id: string) {
      return fetchJson<{ success: boolean }>(`${API_BASE}/blog/admin/categories/${id}`, {
        method: 'DELETE',
      });
    },

    async createAuthorAdmin(data: Partial<BlogAuthor>) {
      return fetchJson<BlogAuthor>(`${API_BASE}/blog/admin/authors`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async updateAuthorAdmin(id: string, data: Partial<BlogAuthor>) {
      return fetchJson<BlogAuthor>(`${API_BASE}/blog/admin/authors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteAuthorAdmin(id: string) {
      return fetchJson<{ success: boolean }>(`${API_BASE}/blog/admin/authors/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Reviews & Wishlist
  reviews: {
    async getProductReviews(productId: string) {
      return fetchJson<ProductReview[]>(`${API_BASE}/products/${productId}/reviews`);
    },

    async create(data: Partial<ProductReview>) {
      return fetchJson<ProductReview>(`${API_BASE}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getAllAdmin() {
      return fetchJson<ProductReview[]>(`${API_BASE}/admin/reviews`);
    },

    async updateStatusAdmin(id: string, status: string) {
      return fetchJson<ProductReview>(`${API_BASE}/admin/reviews/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    async deleteAdmin(id: string) {
      return fetchJson<{ id: string; success: boolean }>(`${API_BASE}/admin/reviews/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Inquiries & Custom Orders
  inquiries: {
    async submitCorporate(data: Partial<CorporateInquiry>) {
      return fetchJson<CorporateInquiry>(`${API_BASE}/corporate-inquiries`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getAllCorporateAdmin() {
      return fetchJson<CorporateInquiry[]>(`${API_BASE}/admin/corporate-inquiries`);
    },

    async updateCorporateAdmin(id: string, data: { status?: string; adminNotes?: string }) {
      return fetchJson<CorporateInquiry>(`${API_BASE}/admin/corporate-inquiries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteCorporateAdmin(id: string) {
      return fetchJson<{ success: boolean }>(`${API_BASE}/admin/corporate-inquiries/${id}`, {
        method: 'DELETE',
      });
    },

    async submitConsultation(data: Partial<ConsultationRequest>) {
      return fetchJson<ConsultationRequest>(`${API_BASE}/consultations`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getAllConsultationsAdmin() {
      return fetchJson<ConsultationRequest[]>(`${API_BASE}/admin/consultations`);
    },

    async updateConsultationAdmin(
      id: string,
      data: { status?: string; adminNotes?: string; assignedConsultant?: string }
    ) {
      return fetchJson<ConsultationRequest>(`${API_BASE}/admin/consultations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteConsultationAdmin(id: string) {
      return fetchJson<{ success: boolean }>(`${API_BASE}/admin/consultations/${id}`, {
        method: 'DELETE',
      });
    },

    async submitCustomBox(data: any) {
      return fetchJson<any>(`${API_BASE}/custom-gift-boxes`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getAllCustomBoxesAdmin() {
      return fetchJson<any[]>(`${API_BASE}/admin/custom-gift-boxes`);
    },

    async deleteCustomBoxAdmin(id: string) {
      return fetchJson<{ success: boolean }>(`${API_BASE}/admin/custom-gift-boxes/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Custom Items / Box Materials & Options
  customItems: {
    async getAll(): Promise<CustomContentItem[]> {
      const res = await fetchJson<CustomContentItem[]>(`${API_BASE}/custom-items`);
      return Array.isArray(res) ? res : [];
    },

    async getAllAdmin(): Promise<CustomContentItem[]> {
      const res = await fetchJson<CustomContentItem[]>(`${API_BASE}/admin/custom-items`);
      return Array.isArray(res) ? res : [];
    },

    async createAdmin(data: Partial<CustomContentItem>): Promise<CustomContentItem> {
      return fetchJson<CustomContentItem>(`${API_BASE}/admin/custom-items`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async updateAdmin(id: string, data: Partial<CustomContentItem>): Promise<CustomContentItem> {
      return fetchJson<CustomContentItem>(`${API_BASE}/admin/custom-items/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteAdmin(id: string): Promise<{ success: boolean }> {
      return fetchJson<{ success: boolean }>(`${API_BASE}/admin/custom-items/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  },

  // Admin Dashboard Statistics
  admin: {
    async getStats(): Promise<{
      products: number;
      categories: number;
      users: number;
      orders: number;
      totalRevenue?: number;
      pendingOrders?: number;
      preparingOrders?: number;
      inquiries?: number;
      newInquiries?: number;
      consultations?: number;
      reviews?: number;
    }> {
      return fetchJson<any>(`${API_BASE}/admin/stats`);
    },
  },

  // CMS & Settings
  cms: {
    async getHomepage(): Promise<HomepageCMSConfig> {
      return fetchJson<HomepageCMSConfig>(`${API_BASE}/cms/homepage`);
    },

    async updateHomepageAdmin(config: Partial<HomepageCMSConfig> | any): Promise<HomepageCMSConfig> {
      return fetchJson<HomepageCMSConfig>(`${API_BASE}/admin/cms/homepage`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
    },

    async resetHomepageAdmin(): Promise<HomepageCMSConfig> {
      return fetchJson<HomepageCMSConfig>(`${API_BASE}/admin/cms/homepage/reset`, {
        method: 'POST',
      });
    },

    async getSettings(): Promise<StoreSettings> {
      return fetchJson<StoreSettings>(`${API_BASE}/cms/settings`);
    },

    async updateSettingsAdmin(settings: Partial<StoreSettings>): Promise<StoreSettings> {
      return fetchJson<StoreSettings>(`${API_BASE}/admin/cms/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  },

  // File & Voice Uploads
  upload: {
    async singleImage(file: File, folder = 'products') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      return fetchJson<{ url: string; key: string }>(`${API_BASE}/upload/single`, {
        method: 'POST',
        body: formData,
      });
    },

    async voice(base64Data: string, mimeType = 'audio/webm') {
      return fetchJson<{ url: string }>(`${API_BASE}/upload/voice`, {
        method: 'POST',
        body: JSON.stringify({ base64Data, mimeType }),
      });
    },
  },

  // Cart (Real Backend with PostgreSQL Prisma persistence)
  cart: {
    async getCart() {
      return fetchJson<{
        id: string;
        userId: string;
        items: CartItem[];
        subtotal: number;
        itemCount: number;
        couponCode?: string | null;
      }>(`${API_BASE}/cart`);
    },

    async addItem(payload: {
      productId?: string;
      quantity?: number;
      ribbonColor?: string;
      waxSeal?: string;
      cardMessage?: string;
      recipientName?: string;
      deliveryDate?: string;
      voiceRecordingUrl?: string;
      voiceDuration?: number;
      isCustomBox?: boolean;
      customBoxDetails?: any;
    }) {
      return fetchJson<{
        id: string;
        userId: string;
        items: CartItem[];
        subtotal: number;
        itemCount: number;
        couponCode?: string | null;
      }>(`${API_BASE}/cart/items`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async updateQuantity(itemId: string, quantity: number) {
      return fetchJson<{
        id: string;
        userId: string;
        items: CartItem[];
        subtotal: number;
        itemCount: number;
        couponCode?: string | null;
      }>(`${API_BASE}/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
    },

    async removeItem(itemId: string) {
      return fetchJson<{
        id: string;
        userId: string;
        items: CartItem[];
        subtotal: number;
        itemCount: number;
        couponCode?: string | null;
      }>(`${API_BASE}/cart/items/${itemId}`, {
        method: 'DELETE',
      });
    },

    async clearCart() {
      return fetchJson<{
        id: string;
        userId: string;
        items: CartItem[];
        subtotal: number;
        itemCount: number;
        couponCode?: string | null;
      }>(`${API_BASE}/cart`, {
        method: 'DELETE',
      });
    },
  },

  // Wishlist (Real Backend with PostgreSQL Prisma persistence)
  wishlist: {
    async getWishlist() {
      return fetchJson<{ wishlist: string[]; items: Product[] }>(`${API_BASE}/wishlist`);
    },

    async addItem(productId: string) {
      return fetchJson<{ wishlist: string[]; items: Product[]; isAdded: boolean }>(
        `${API_BASE}/wishlist`,
        {
          method: 'POST',
          body: JSON.stringify({ productId }),
        }
      );
    },

    async removeItem(productId: string) {
      return fetchJson<{ wishlist: string[]; items: Product[]; isRemoved: boolean }>(
        `${API_BASE}/wishlist/${productId}`,
        {
          method: 'DELETE',
        }
      );
    },

    async toggle(productId: string) {
      return fetchJson<{ wishlist: string[]; items: Product[]; isAdded: boolean }>(
        `${API_BASE}/wishlist/${productId}/toggle`,
        {
          method: 'POST',
        }
      );
    },
  },

  // Users Management (Admin)
  users: {
    async getAllAdmin(): Promise<User[]> {
      let res: any;
      try {
        res = await fetchJson<{ users: any[] }>(`${API_BASE}/admin/users`);
      } catch {
        res = await fetchJson<{ users: any[] }>(`${API_BASE}/auth/admin/users`);
      }
      const rawList = res?.users || (Array.isArray(res) ? res : []);
      return rawList.map((u: any) => mapBackendUserToFrontendUser(u));
    },

    async updateStatusAdmin(
      userId: string,
      isActive?: boolean,
      role?: string,
      profile?: { name?: string; phone?: string; companyName?: string }
    ): Promise<User> {
      const payload: any = {};
      if (typeof isActive === 'boolean') payload.isActive = isActive;
      if (role) payload.role = role.toUpperCase();
      if (profile?.name) payload.name = profile.name;
      if (profile?.phone) payload.phone = profile.phone;
      if (profile?.companyName !== undefined) payload.companyName = profile.companyName;

      let res: any;
      try {
        res = await fetchJson<{ user?: any } | any>(
          `${API_BASE}/admin/users/${encodeURIComponent(userId)}/status`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
      } catch {
        // Fallback to /auth/admin/users/:id/status
        res = await fetchJson<{ user?: any } | any>(
          `${API_BASE}/auth/admin/users/${encodeURIComponent(userId)}/status`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
      }
      return mapBackendUserToFrontendUser(res?.user || res);
    },
  },
};
