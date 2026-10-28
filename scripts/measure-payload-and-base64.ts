import { formatProductFromPrisma } from '../server/src/services/productService.js';

const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('========================================================');
  console.log('📊 MEASURING PRODUCT PAYLOAD SIZE & SERIALIZATION');
  console.log('========================================================\n');

  // 1. Measure real live GET /api/products response
  const res = await fetch(`${BASE_URL}/api/products`);
  const liveText = await res.text();
  const liveBytes = Buffer.byteLength(liveText, 'utf8');
  console.log('1. Live Storefront Response:');
  console.log(`   - HTTP Status: ${res.status}`);
  console.log(`   - Actual Serialized JSON Size: ${liveBytes} bytes (${(liveBytes / 1024).toFixed(2)} KB)`);

  // 2. Controlled Synthetic Test for Base64 Duplication
  // Generate a realistic 250 KB Base64 string representing a canvas-compressed WebP image
  const dummyBase64 = 'data:image/webp;base64,' + 'A'.repeat(250 * 1024);

  const mockDbProduct = {
    id: 'PRD-TEST-SYNTHETIC',
    titleFa: 'بسته هدیه تستی نمونه',
    titleEn: 'Sample Gift Pack',
    sku: 'SKU-TEST-99',
    slug: 'sample-gift-pack',
    categoryId: 'cat_test',
    price: 450000,
    oldPrice: 500000,
    discountPercent: 10,
    rating: 5,
    reviewsCount: 1,
    salesCount: 10,
    description: 'توضیحات بسته هدیه برای آزمایش اندازه حجم داده',
    shortDescription: 'توضیحات کوتاه',
    image: dummyBase64,
    itemsIncluded: '[]',
    boxType: 'هاردباکس',
    ribbonColor: 'زرشکی',
    ribbonColorHex: '#8B0000',
    waxSeal: 'طلایی',
    badge: 'ویژه',
    weightGrams: 500,
    dimensions: '20x20x10',
    materials: 'چوب',
    shippingInfo: 'ارسال فوری',
    customizationOptions: null,
    inStock: true,
    stockQuantity: 20,
    lowStockThreshold: 3,
    status: 'ACTIVE',
    tags: '[]',
    occasions: '[]',
    suitableFor: '[]',
    featured: true,
    isB2BRecommended: false,
    seoTitle: 'تست',
    seoDescription: 'تست سئو',
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [
      {
        id: 'img-1',
        productId: 'PRD-TEST-SYNTHETIC',
        url: dummyBase64,
        thumbnailUrl: dummyBase64.slice(0, 40000), // 40KB thumbnail
        altText: 'نمای کامل',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    videos: [],
    variants: [],
  };

  const formatted = formatProductFromPrisma(mockDbProduct as any);
  const serializedJson = JSON.stringify(formatted);
  const totalLength = Buffer.byteLength(serializedJson, 'utf8');

  // Count occurrences of dummyBase64 in the serialized JSON
  const occurrences = serializedJson.split(dummyBase64).length - 1;

  console.log('\n2. Controlled Synthetic Product (1 image with ~250 KB Base64):');
  console.log(`   - Serialized JSON Length: ${totalLength} bytes (${(totalLength / 1024).toFixed(2)} KB)`);
  console.log(`   - Occurrences of identical primary Base64 string in JSON: ${occurrences}`);
  console.log(`   - Has 'additionalImages' key: ${'additionalImages' in formatted}`);
  console.log(`   - additionalImages length: ${Array.isArray((formatted as any).additionalImages) ? (formatted as any).additionalImages.length : 'none'}`);

  console.log('\n========================================================\n');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
