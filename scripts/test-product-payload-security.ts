import { prisma } from '../server/src/services/prisma.js';
import { productCreateSchema, productUpdateSchema } from '../server/src/validators/index.js';
import { formatProductFromPrisma, isBase64ImageData } from '../server/src/services/productService.js';

const BASE_URL = 'http://localhost:3000';

interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];

function record(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${name}: ${details}`);
}

async function run() {
  console.log('========================================================');
  console.log('🛡️ TESTING PRODUCT PAYLOAD DEDUPLICATION & BASE64 SECURITY');
  console.log('========================================================\n');

  // 1. Authenticate as Admin
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@yadman.ir';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeThisSuperAdminPassword123!';
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: adminEmail, password: adminPassword }),
  });
  const adminLoginData: any = await adminLoginRes.json();
  const adminToken = adminLoginData.data?.token || '';

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
  };

  // 2. Test Zod Validation: productCreateSchema rejects Base64 in `image`
  const base64Sample = 'data:image/webp;base64,UklGRmQAAABXRUJQVlA4TFYAAAAvAAAA';
  let zodCreateImageBlocked = false;
  try {
    productCreateSchema.parse({
      titleFa: 'تست پک',
      sku: 'SKU-TEST-1',
      price: 100000,
      image: base64Sample,
    });
  } catch (err: any) {
    const issues = err.issues || err.errors || [];
    zodCreateImageBlocked = issues.some((e: any) =>
      e.message?.includes('Base64') || e.path?.includes('image')
    );
  }
  record(
    'Validator: productCreateSchema rejects Base64 image',
    zodCreateImageBlocked,
    'Zod refinement correctly blocked data:image/ Base64 URI on image'
  );

  // 3. Test Zod Validation: productCreateSchema rejects Base64 in `images[].url`
  let zodCreateGalleryBlocked = false;
  try {
    productCreateSchema.parse({
      titleFa: 'تست پک ۲',
      sku: 'SKU-TEST-2',
      price: 100000,
      image: '/uploads/products/valid.webp',
      images: [{ url: base64Sample, sortOrder: 0 }],
    });
  } catch (err: any) {
    const issues = err.issues || err.errors || [];
    zodCreateGalleryBlocked = issues.some((e: any) =>
      e.message?.includes('Base64') || e.path?.includes('images')
    );
  }
  record(
    'Validator: productCreateSchema rejects Base64 in images[].url',
    zodCreateGalleryBlocked,
    'Zod refinement correctly blocked data:image/ Base64 URI on images[0].url'
  );

  // 4. Test Zod Validation: productUpdateSchema rejects Base64 in partial updates
  let zodUpdateBlocked = false;
  try {
    productUpdateSchema.parse({
      image: base64Sample,
    });
  } catch (err: any) {
    const issues = err.issues || err.errors || [];
    zodUpdateBlocked = issues.some((e: any) =>
      e.message?.includes('Base64') || e.path?.includes('image')
    );
  }
  record(
    'Validator: productUpdateSchema rejects Base64 image update',
    zodUpdateBlocked,
    'Zod refinement correctly blocked Base64 string in partial update payload'
  );

  // 5. Test Helper: isBase64ImageData detects various Base64 forms
  const helperCatchesDataUri = isBase64ImageData('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...');
  const helperCatchesRawBase64 = isBase64ImageData('image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...');
  const helperPassesRelativeUrl = !isBase64ImageData('/uploads/products/gift-box-123.webp');
  const helperPassesAbsoluteUrl = !isBase64ImageData('https://yadman.ir/images/hero.jpg');
  const helperPassesEmpty = !isBase64ImageData('');
  const helperAllPassed =
    helperCatchesDataUri &&
    helperCatchesRawBase64 &&
    helperPassesRelativeUrl &&
    helperPassesAbsoluteUrl &&
    helperPassesEmpty;
  record(
    'Service Guard: isBase64ImageData detection',
    helperAllPassed,
    'Detected all Base64 variants and allowed valid relative/absolute URLs'
  );

  // 6. Test HTTP API: POST /api/admin/products rejects Base64 payload
  const createRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      titleFa: 'پک هدیه تستی با بیس۶۴',
      sku: 'SKU-BASE64-ATTEMPT',
      category: 'cat_yalda',
      price: 250000,
      image: base64Sample,
    }),
  });
  const createJson: any = await createRes.json();
  const createBlocked =
    createRes.status === 400 &&
    (JSON.stringify(createJson).includes('Base64') ||
      createJson.message?.includes('Base64') ||
      createJson.error?.message?.includes('Base64'));
  record(
    'HTTP POST /api/admin/products rejects Base64 payload with 400',
    createBlocked,
    `Status ${createRes.status}, Error: ${createJson.message || JSON.stringify(createJson.error || createJson.errors || {})}`
  );

  // 7. Test HTTP API: PUT /api/admin/products/:id rejects Base64 payload
  const updateRes = await fetch(`${BASE_URL}/api/admin/products/test-id-99`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      image: base64Sample,
    }),
  });
  const updateJson: any = await updateRes.json();
  const updateBlocked =
    updateRes.status === 400 &&
    (JSON.stringify(updateJson).includes('Base64') ||
      updateJson.message?.includes('Base64') ||
      updateJson.error?.message?.includes('Base64'));
  record(
    'HTTP PUT /api/admin/products/:id rejects Base64 payload with 400',
    updateBlocked,
    `Status ${updateRes.status}, Error: ${updateJson.message || JSON.stringify(updateJson.error || updateJson.errors || {})}`
  );

  // 8. Test Payload Deduplication in formatProductFromPrisma
  const mockProductWithImages = {
    id: 'prd-dedup-test',
    titleFa: 'پک هدیه حافظ',
    titleEn: 'Hafez Gift Set',
    sku: 'SKU-DEDUP-01',
    slug: 'hafez-gift-set',
    categoryId: 'cat_yalda',
    price: 850000,
    oldPrice: 950000,
    discountPercent: 10,
    rating: 4.8,
    reviewsCount: 15,
    salesCount: 42,
    description: 'توضیحات بسته',
    shortDescription: 'توضیحات کوتاه',
    image: '/uploads/products/hafez-main.webp',
    itemsIncluded: '["دیوان حافظ","جام مسی"]',
    boxType: 'صندوقچه چوبی',
    ribbonColor: 'طلایی',
    ribbonColorHex: '#D4AF37',
    waxSeal: 'سرخ',
    badge: 'پرفروش',
    weightGrams: 1200,
    dimensions: '25x25x15',
    materials: 'چوب طبیعی و مس',
    shippingInfo: 'ارسال اکسپرس',
    customizationOptions: null,
    inStock: true,
    stockQuantity: 25,
    lowStockThreshold: 5,
    status: 'ACTIVE',
    tags: '["حافظ","سنتی"]',
    occasions: '["یلدا","نوروز"]',
    suitableFor: '["مدیران"]',
    featured: true,
    isB2BRecommended: true,
    seoTitle: 'پک هدیه نفیس حافظ',
    seoDescription: 'هدیه سنتی یلدا',
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [
      {
        id: 'img-1',
        productId: 'prd-dedup-test',
        url: '/uploads/products/hafez-main.webp',
        thumbnailUrl: '/uploads/products/hafez-main-thumb.webp',
        altText: 'نمای روبرو',
        sortOrder: 0,
        isPrimary: true,
      },
      {
        id: 'img-2',
        productId: 'prd-dedup-test',
        url: '/uploads/products/hafez-side.webp',
        thumbnailUrl: '/uploads/products/hafez-side-thumb.webp',
        altText: 'نمای جانبی',
        sortOrder: 1,
        isPrimary: false,
      },
    ],
    videos: [],
    variants: [],
  };

  const formatted = formatProductFromPrisma(mockProductWithImages as any);
  const dedupPassed =
    Array.isArray(formatted.images) &&
    formatted.images.length === 2 &&
    formatted.image === '/uploads/products/hafez-main.webp' &&
    Array.isArray(formatted.additionalImages) &&
    formatted.additionalImages.length === 0;

  record(
    'Payload Deduplication: additionalImages empty when images relation exists',
    dedupPassed,
    `images count: ${formatted.images.length}, additionalImages length: ${formatted.additionalImages.length} (eliminated duplicate array serialization)`
  );

  // 9. Test Live Storefront GET /api/products response contract
  const liveGetRes = await fetch(`${BASE_URL}/api/products`);
  const liveJson: any = await liveGetRes.json();
  const liveProduct = liveJson.data?.[0];
  const liveContractValid =
    liveGetRes.status === 200 &&
    liveJson.success === true &&
    Array.isArray(liveJson.data) &&
    (!liveProduct || (
      typeof liveProduct.id === 'string' &&
      typeof liveProduct.titleFa === 'string' &&
      typeof liveProduct.price === 'number' &&
      Array.isArray(liveProduct.images) &&
      Array.isArray(liveProduct.additionalImages)
    ));

  record(
    'Live API Contract: GET /api/products returns valid schema & status 200',
    liveContractValid,
    `Status ${liveGetRes.status}, items returned: ${liveJson.data?.length || 0}`
  );

  // 10. Summary
  const allPassed = results.every((r) => r.passed);
  console.log('\n========================================================');
  console.log(`🏁 TEST SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
  console.log('========================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
