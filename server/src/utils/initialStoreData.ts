import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_CUSTOM_ITEMS,
  SEED_COUPONS,
  SEED_REVIEWS,
  SEED_BLOG_POSTS,
  SEED_BLOG_CATEGORIES,
  SEED_BLOG_AUTHORS,
  SEED_HOMEPAGE_CMS,
  SEED_SITE_SETTINGS,
} from '../db/seedData.js';

export const initialStoreData = {
  products: SEED_PRODUCTS,
  categories: SEED_CATEGORIES,
  customItems: SEED_CUSTOM_ITEMS,
  reviews: SEED_REVIEWS,
  coupons: SEED_COUPONS,
  blogPosts: SEED_BLOG_POSTS,
  blogCategories: SEED_BLOG_CATEGORIES,
  blogAuthors: SEED_BLOG_AUTHORS,
  homepageCMS: SEED_HOMEPAGE_CMS,
  siteSettings: SEED_SITE_SETTINGS,
};
