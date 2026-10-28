import {
  Order,
  CorporateInquiry,
  StoreSettings,
  Product,
  CustomContentItem,
  Category,
  Coupon,
  ProductReview,
  ConsultationRequest,
  User,
  BlogPost,
  BlogCategory,
  BlogAuthor,
  HomepageCMSConfig,
} from '../types';
import { HERO_BANNER_IMAGE } from './products';
import { DEFAULT_HOMEPAGE_CMS_CONFIG } from './defaultHomepageCMS';

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: 'یادمان',
  storeNameFa: 'یادمان | پک‌های هدیه و هدایای سازمانی',
  storeNameEn: 'Yadman Luxury Gifts',
  tagline: 'انتخابی برای هدیه‌های ماندگار',
  announcementText: 'ارسال اکسپرس و رایگان برای سفارش‌های بالای ۳ میلیون تومان | بسته‌بندی هاردباکس و خطاطی کارت هدیه',
  freeShippingThreshold: 3000000,
  supportPhone: '۰۲۱-۸۸۸۸۰۰۰۰',
  corporatePhone: '۰۲۱-۸۸۸۸۰۰۰۰ (داخلی ۱۰۴ و ۱۰۵)',
  corporateEmail: 'corporate@yadman.ir',
  isStoreActive: true,
  customRibbonEnabled: true,
  waxSealEnabled: true,
  freeCalligraphyEnabled: true,
  heroImage: HERO_BANNER_IMAGE,
  defaultMetaTitle: 'یادمان | پک‌های هدیه و هدایای سازمانی',
  defaultMetaDescription: 'یادمان؛ انتخابی برای هدیه‌های ماندگار. ارائه پک‌های هدیه شخصی و سازمانی با امکان شخصی‌سازی و طراحی پک اختصاصی.',
  defaultOgImage: 'https://yadman.ir/og-cover.jpg',
  canonicalBaseUrl: 'https://yadman.ir',
  instagramHandle: 'yadman_gifts',
  telegramHandle: 'yadman_gifts_official',
  homepage: {
    ...DEFAULT_HOMEPAGE_CMS_CONFIG,
    banners: [],
  },
};

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_INQUIRIES: CorporateInquiry[] = [];

export const INITIAL_CONSULTATIONS: ConsultationRequest[] = [];

export const INITIAL_USERS: User[] = [];

// ==========================================
// STORAGE LOADERS & SAVERS (Clean State)
// ==========================================

export const loadOrdersFromStorage = (): Order[] => {
  try {
    localStorage.removeItem('yadman_orders');
    localStorage.removeItem('hedyeh_orders');
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveOrdersToStorage = (_orders: Order[]) => {
  try {
    localStorage.removeItem('yadman_orders');
    localStorage.removeItem('hedyeh_orders');
  } catch {
    // Ignore storage errors
  }
};

export const loadInquiriesFromStorage = (): CorporateInquiry[] => {
  try {
    localStorage.removeItem('yadman_corporate_inquiries');
    localStorage.removeItem('hedyeh_corporate_inquiries');
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveInquiriesToStorage = (_inquiries: CorporateInquiry[]) => {
  try {
    localStorage.removeItem('yadman_corporate_inquiries');
    localStorage.removeItem('hedyeh_corporate_inquiries');
  } catch {
    // Ignore storage errors
  }
};

export const loadProductsFromStorage = (): Product[] => {
  try {
    // Purge obsolete product keys so stale test/demo data is completely removed from clients
    localStorage.removeItem('yadman_products_v2');
    localStorage.removeItem('yadman_products');
    localStorage.removeItem('hedyeh_products');
  } catch {
    // Ignore storage access errors
  }
  return [];
};

export const saveProductsToStorage = (_products: Product[]) => {
  // Obsolete: The PostgreSQL database is the only source of truth for products.
  try {
    localStorage.removeItem('yadman_products_v2');
    localStorage.removeItem('yadman_products');
    localStorage.removeItem('hedyeh_products');
  } catch {
    // Ignore storage access errors
  }
};

export const loadCategoriesFromStorage = (): Category[] => {
  try {
    // Purge obsolete localStorage categories keys so PostgreSQL is always the source of truth
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('hedyeh_categories');
      localStorage.removeItem('yadman_categories');
    }
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveCategoriesToStorage = (_categories: Category[]) => {
  // Categories are now persisted directly into PostgreSQL via backend API.
  // Purge any stale legacy keys if present.
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('hedyeh_categories');
      localStorage.removeItem('yadman_categories');
    }
  } catch {
    // Ignore storage errors
  }
};

export const loadCouponsFromStorage = (): Coupon[] => {
  try {
    // Purge obsolete localStorage coupons keys so PostgreSQL is always the source of truth
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('hedyeh_coupons');
      localStorage.removeItem('yadman_coupons');
    }
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveCouponsToStorage = (_coupons: Coupon[]) => {
  // Coupons are now persisted directly into PostgreSQL via backend API.
  // Purge any stale legacy keys if present.
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('hedyeh_coupons');
      localStorage.removeItem('yadman_coupons');
    }
  } catch {
    // Ignore storage errors
  }
};

export const loadReviewsFromStorage = (): ProductReview[] => {
  try {
    localStorage.removeItem('hedyeh_reviews');
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveReviewsToStorage = (_reviews: ProductReview[]) => {
  try {
    localStorage.removeItem('hedyeh_reviews');
  } catch {
    // Ignore storage errors
  }
};

export const loadCustomItemsFromStorage = (): CustomContentItem[] => {
  try {
    // Purge obsolete localStorage custom items keys so PostgreSQL is always the source of truth
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('yadman_custom_items');
      localStorage.removeItem('hedyeh_custom_items');
    }
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveCustomItemsToStorage = (_items: CustomContentItem[]) => {
  // Custom items are now persisted directly into PostgreSQL via backend API.
  // Purge any stale legacy keys if present.
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('yadman_custom_items');
      localStorage.removeItem('hedyeh_custom_items');
    }
  } catch {
    // Ignore storage errors
  }
};

export const loadStoreSettingsFromStorage = (): StoreSettings => {
  try {
    // Purge obsolete localStorage store settings keys so PostgreSQL is always the source of truth
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('yadman_store_settings');
      localStorage.removeItem('hedyeh_store_settings');
      localStorage.removeItem('yadman_hero_image');
    }
    return {
      ...INITIAL_STORE_SETTINGS,
      heroImage: HERO_BANNER_IMAGE,
      homepage: {
        ...DEFAULT_HOMEPAGE_CMS_CONFIG,
        banners: [],
        hero: {
          ...DEFAULT_HOMEPAGE_CMS_CONFIG.hero,
          heroImage: HERO_BANNER_IMAGE,
        },
      },
    };
  } catch {
    return INITIAL_STORE_SETTINGS;
  }
};

export const saveStoreSettingsToStorage = (_settings: StoreSettings) => {
  // Store settings are now persisted directly into PostgreSQL via backend API.
  // Purge any stale legacy keys if present.
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('yadman_store_settings');
      localStorage.removeItem('hedyeh_store_settings');
      localStorage.removeItem('yadman_hero_image');
    }
  } catch {
    // Ignore storage errors
  }
};

export const loadConsultationsFromStorage = (): ConsultationRequest[] => {
  try {
    localStorage.removeItem('hedyeh_consultations');
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveConsultationsToStorage = (_consultations: ConsultationRequest[]) => {
  try {
    localStorage.removeItem('hedyeh_consultations');
  } catch {
    // Ignore storage errors
  }
};

export const loadUsersFromStorage = (): User[] => {
  return INITIAL_USERS;
};

export const saveUsersToStorage = (_users: User[]) => {
  // Security cleanup: Disallow saving real user credentials/data to localStorage
};

export const loadCurrentUserFromStorage = (): User | null => {
  return null;
};

export const saveCurrentUserToStorage = (_user: User | null) => {
  // Security cleanup: Disallow saving current user session to localStorage
};

export const removeCurrentUserFromStorage = () => {
  try {
    localStorage.removeItem('hedyeh_current_user');
  } catch (e) {
    console.error('Failed to remove current user from localStorage', e);
  }
};

// ==========================================
// BLOG CMS STORAGE LOADERS & SAVERS
// ==========================================

export const loadBlogPostsFromStorage = (): BlogPost[] => {
  try {
    localStorage.removeItem('hedyeh_blog_posts');
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveBlogPostsToStorage = (_posts: BlogPost[]) => {
  try {
    localStorage.removeItem('hedyeh_blog_posts');
  } catch {
    // Ignore storage errors
  }
};

export const loadBlogCategoriesFromStorage = (): BlogCategory[] => {
  try {
    localStorage.removeItem('hedyeh_blog_categories');
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveBlogCategoriesToStorage = (_categories: BlogCategory[]) => {
  try {
    localStorage.removeItem('hedyeh_blog_categories');
  } catch {
    // Ignore storage errors
  }
};

export const loadBlogAuthorsFromStorage = (): BlogAuthor[] => {
  try {
    localStorage.removeItem('hedyeh_blog_authors');
  } catch {
    // Ignore storage errors
  }
  return [];
};

export const saveBlogAuthorsToStorage = (_authors: BlogAuthor[]) => {
  try {
    localStorage.removeItem('hedyeh_blog_authors');
  } catch {
    // Ignore storage errors
  }
};
