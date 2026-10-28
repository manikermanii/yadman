-- Migration: 001_enable_rls_and_policies.sql
-- Description: Enable Row Level Security (RLS) on all 22 public tables in Supabase
-- and define strict, minimal read-only policies for public storefront tables.
-- User, order, cart, review, coupon, consultation, and corporate inquiry tables
-- remain completely private with no public (anon/authenticated) policies.

BEGIN;

-- ============================================================================
-- STEP 1: Enable Row Level Security on all 22 public schema tables
-- ============================================================================

-- Group A: Public Storefront Data (11 tables)
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVideo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomItemOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogAuthor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HomepageCMS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;

-- Group B: User & Private Data (9 tables)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wishlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;

-- Group C: Admin / Business Inquiries Data (2 tables)
ALTER TABLE "CorporateInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Consultation" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop existing policies if any (idempotency)
-- ============================================================================
DROP POLICY IF EXISTS "public_read_active_products" ON "Product";
DROP POLICY IF EXISTS "public_read_product_images" ON "ProductImage";
DROP POLICY IF EXISTS "public_read_product_variants" ON "ProductVariant";
DROP POLICY IF EXISTS "public_read_active_product_videos" ON "ProductVideo";
DROP POLICY IF EXISTS "public_read_categories" ON "Category";
DROP POLICY IF EXISTS "public_read_custom_items" ON "CustomItemOption";
DROP POLICY IF EXISTS "public_read_published_blog_posts" ON "BlogPost";
DROP POLICY IF EXISTS "public_read_blog_categories" ON "BlogCategory";
DROP POLICY IF EXISTS "public_read_blog_authors" ON "BlogAuthor";
DROP POLICY IF EXISTS "public_read_homepage_cms" ON "HomepageCMS";
DROP POLICY IF EXISTS "public_read_site_settings" ON "SiteSettings";

-- ============================================================================
-- STEP 3: Create strict, read-only SELECT policies for storefront tables
-- ============================================================================

-- 1. Product: Allow public to view only ACTIVE products
CREATE POLICY "public_read_active_products"
  ON "Product"
  FOR SELECT
  TO anon, authenticated
  USING (status = 'ACTIVE');

-- 2. ProductImage: Allow public to view images belonging to ACTIVE products
CREATE POLICY "public_read_product_images"
  ON "ProductImage"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Product" p
      WHERE p.id = "ProductImage"."productId"
        AND p.status = 'ACTIVE'
    )
  );

-- 3. ProductVariant: Allow public to view variants belonging to ACTIVE products
CREATE POLICY "public_read_product_variants"
  ON "ProductVariant"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Product" p
      WHERE p.id = "ProductVariant"."productId"
        AND p.status = 'ACTIVE'
    )
  );

-- 4. ProductVideo: Allow public to view active videos of ACTIVE products
CREATE POLICY "public_read_active_product_videos"
  ON "ProductVideo"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    AND EXISTS (
      SELECT 1 FROM "Product" p
      WHERE p.id = "ProductVideo"."productId"
        AND p.status = 'ACTIVE'
    )
  );

-- 5. Category: Allow public to view categories
CREATE POLICY "public_read_categories"
  ON "Category"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. CustomItemOption: Allow public to view items that are in stock
CREATE POLICY "public_read_custom_items"
  ON "CustomItemOption"
  FOR SELECT
  TO anon, authenticated
  USING ("inStock" = true);

-- 7. BlogPost: Allow public to view only PUBLISHED blog articles
CREATE POLICY "public_read_published_blog_posts"
  ON "BlogPost"
  FOR SELECT
  TO anon, authenticated
  USING (status = 'PUBLISHED');

-- 8. BlogCategory: Allow public to view blog categories
CREATE POLICY "public_read_blog_categories"
  ON "BlogCategory"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 9. BlogAuthor: Allow public to view blog authors
CREATE POLICY "public_read_blog_authors"
  ON "BlogAuthor"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 10. HomepageCMS: Allow public to read homepage CMS configuration
CREATE POLICY "public_read_homepage_cms"
  ON "HomepageCMS"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 11. SiteSettings: Allow public to read site settings configuration
CREATE POLICY "public_read_site_settings"
  ON "SiteSettings"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- NOTE:
-- Tables "User", "Address", "Cart", "CartItem", "Wishlist", "Order", "OrderItem",
-- "Review", "Coupon", "CorporateInquiry", and "Consultation" intentionally have
-- NO policies created for anon or authenticated.
-- With RLS enabled, default deny applies, shielding all private data from
-- direct PostgREST/Supabase client access while allowing full access to
-- backend Prisma connections via the postgres bypass role.

COMMIT;
