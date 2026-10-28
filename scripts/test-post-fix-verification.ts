import { prisma } from '../server/src/services/prisma.js';

const BASE_URL = 'http://localhost:3000';

interface CheckResult {
  priority: string;
  test: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];

function record(priority: string, test: string, passed: boolean, details: string) {
  results.push({ priority, test, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${priority}] ${test}: ${details}`);
}

async function run() {
  console.log('====================================================');
  console.log('🔍 POST-FIX VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // Login as admin to get admin token
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@yadman.ir';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeThisSuperAdminPassword123!';
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: adminEmail,
      password: adminPassword,
    }),
  });
  const adminLoginData: any = await adminLoginRes.json();
  const adminToken = adminLoginData.data?.token || '';
  if (!adminToken) {
    throw new Error('Failed to obtain admin token: ' + JSON.stringify(adminLoginData));
  }

  // Register and login a normal customer
  const phone = `099${Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8)}`;
  const custRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: phone,
      fullName: 'Verification Customer',
      password: 'CustPassword123!',
      email: `cust_${Date.now()}@yadman.test`,
    }),
  });
  const custRegData: any = await custRegRes.json();
  const customerToken = custRegData.data?.token || '';
  if (!customerToken) {
    throw new Error('Failed to obtain customer token: ' + JSON.stringify(custRegData));
  }

  // -----------------------------------------------------------------
  // PRIORITY 1: Diagnostic Endpoints Security
  // -----------------------------------------------------------------
  console.log('\n--- Priority 1: Secure Diagnostic Endpoints ---');

  // Test 1.1: Unauthenticated GET /api/diag/metrics
  const unauthMetricsRes = await fetch(`${BASE_URL}/api/diag/metrics`);
  record(
    'Priority 1',
    'Unauthenticated GET /api/diag/metrics',
    unauthMetricsRes.status === 401,
    `Status ${unauthMetricsRes.status} (expected 401)`
  );

  // Test 1.2: Customer token GET /api/diag/metrics
  const custMetricsRes = await fetch(`${BASE_URL}/api/diag/metrics`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  record(
    'Priority 1',
    'Customer GET /api/diag/metrics',
    custMetricsRes.status === 403,
    `Status ${custMetricsRes.status} (expected 403)`
  );

  // Test 1.3: Admin token GET /api/diag/metrics
  const adminMetricsRes = await fetch(`${BASE_URL}/api/diag/metrics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminMetricsData: any = await adminMetricsRes.json();
  const hasExpectedMetrics = adminMetricsData && adminMetricsData.success && typeof adminMetricsData.timestamp === 'string' && adminMetricsData.routes;
  record(
    'Priority 1',
    'Admin GET /api/diag/metrics',
    adminMetricsRes.status === 200 && Boolean(hasExpectedMetrics),
    `Status ${adminMetricsRes.status}, contains route metrics and uptime`
  );

  // Test 1.4: Unauthenticated POST /api/diag/trace
  const unauthTraceRes = await fetch(`${BASE_URL}/api/diag/trace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label: 'unauth-test' }),
  });
  record(
    'Priority 1',
    'Unauthenticated POST /api/diag/trace',
    unauthTraceRes.status === 401,
    `Status ${unauthTraceRes.status} (expected 401)`
  );

  // Test 1.5: Customer POST /api/diag/trace
  const custTraceRes = await fetch(`${BASE_URL}/api/diag/trace`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ label: 'customer-test' }),
  });
  record(
    'Priority 1',
    'Customer POST /api/diag/trace',
    custTraceRes.status === 403,
    `Status ${custTraceRes.status} (expected 403)`
  );

  // -----------------------------------------------------------------
  // PRIORITY 2: Product Visibility (Public vs Admin)
  // -----------------------------------------------------------------
  console.log('\n--- Priority 2: Fix Product Visibility ---');

  // Find or create category for test products
  let category = await prisma.category.findFirst();
  if (!category) {
    const catId = 'cat_' + Date.now();
    category = await prisma.category.create({
      data: {
        id: catId,
        nameFa: 'دسته تست',
        nameEn: 'Test Category',
        slug: 'test-category-' + Date.now(),
        descriptionFa: 'توضیحات دسته تست',
      },
    });
  }

  // Create a DRAFT product via Admin API
  const draftSku = `SKU-DRAFT-${Date.now()}`;
  const draftSlug = `draft-product-${Date.now()}`;
  const createDraftRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      titleFa: 'محصول پیش‌نویس تست',
      slug: draftSlug,
      sku: draftSku,
      status: 'draft',
      price: 250000,
      categoryId: category.id,
      description: 'این محصول نباید در دید عموم باشد',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',
      stockQuantity: 5,
    }),
  });
  const createDraftJson: any = await createDraftRes.json();
  const draftProduct = createDraftJson.data;

  // Test 2.1: Public GET /api/products should NOT return the draft product
  const publicProductsRes = await fetch(`${BASE_URL}/api/products`);
  const publicProductsJson: any = await publicProductsRes.json();
  const publicList = Array.isArray(publicProductsJson) ? publicProductsJson : (publicProductsJson.data || []);
  const draftInPublic = publicList.some((p: any) => p.id === draftProduct.id || p.slug === draftSlug);
  const allPublicActive = publicList.every((p: any) => (p.status || 'active').toLowerCase() === 'active');
  record(
    'Priority 2',
    'Public GET /api/products excludes drafts',
    !draftInPublic && allPublicActive,
    `Public list returned ${publicList.length} items, draft present: ${draftInPublic}, all active: ${allPublicActive}`
  );

  // Test 2.2: Public GET /api/products/:slugOrId should return 404 for draft product
  const publicDraftDetailRes = await fetch(`${BASE_URL}/api/products/${encodeURIComponent(draftProduct.slug)}`);
  record(
    'Priority 2',
    'Public GET /api/products/:slug for draft returns 404',
    publicDraftDetailRes.status === 404,
    `Status ${publicDraftDetailRes.status} (expected 404)`
  );

  // Test 2.3: Admin GET /api/products?status=all should return the draft product
  const adminProductsRes = await fetch(`${BASE_URL}/api/products?status=all`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminProductsJson: any = await adminProductsRes.json();
  const adminList = Array.isArray(adminProductsJson) ? adminProductsJson : (adminProductsJson.data || []);
  const draftInAdmin = adminList.some((p: any) => p.id === draftProduct.id || p.slug === draftProduct.slug);
  record(
    'Priority 2',
    'Admin GET /api/products?status=all includes drafts',
    draftInAdmin,
    `Admin list returned ${adminList.length} items, draft found: ${draftInAdmin}`
  );

  // Test 2.4: Admin GET /api/products/:slug should allow viewing draft product
  const adminDraftDetailRes = await fetch(`${BASE_URL}/api/products/${encodeURIComponent(draftProduct.slug)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  record(
    'Priority 2',
    'Admin GET /api/products/:slug for draft returns 200',
    adminDraftDetailRes.status === 200,
    `Status ${adminDraftDetailRes.status} (expected 200)`
  );

  // Clean up draft product
  await prisma.product.delete({ where: { id: draftProduct.id } });

  // -----------------------------------------------------------------
  // PRIORITY 3: Fix Product Cache Invalidation Post-Order
  // -----------------------------------------------------------------
  console.log('\n--- Priority 3: Product Cache Invalidation After Orders ---');

  // Create an active product with known stock via admin endpoint to prime product list
  const testStockSku = `SKU-STOCK-${Date.now()}`;
  const testStockSlug = `stock-product-${Date.now()}`;
  const createProdRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      titleFa: 'محصول تست کش موجودی',
      slug: testStockSlug,
      sku: testStockSku,
      status: 'active',
      price: 100000,
      categoryId: category.id,
      description: 'تست کش موجودی',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',
      stockQuantity: 20,
    }),
  });
  const createProdJson: any = await createProdRes.json();
  const stockProduct = createProdJson.data;

  // 1. Prime the product cache by fetching /api/products
  const primeRes = await fetch(`${BASE_URL}/api/products`);
  const primeJson: any = await primeRes.json();
  const primeList = Array.isArray(primeJson) ? primeJson : (primeJson.data || []);
  const primedItem = primeList.find((p: any) => p.id === stockProduct?.id || p.sku === testStockSku);
  const initialStockInCache = primedItem?.stockQuantity;

  // 2. Create an order purchasing 3 items of this product
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      customer: {
        fullName: 'کاربر تست کش',
        phoneNumber: phone,
        address: 'تهران، خیابان تست، پلاک ۱',
        city: 'تهران',
      },
      items: [
        {
          productId: stockProduct.id,
          quantity: 3,
        },
      ],
    }),
  });
  const orderJson: any = await orderRes.json();
  const placedOrder = orderJson.data;
  const orderCreated = orderRes.status === 201 && placedOrder && placedOrder.id;

  // 3. Immediately fetch /api/products without waiting for TTL
  const immediateRes = await fetch(`${BASE_URL}/api/products`);
  const immediateJson: any = await immediateRes.json();
  const immediateList = Array.isArray(immediateJson) ? immediateJson : (immediateJson.data || []);
  const immediateItem = immediateList.find((p: any) => p.id === stockProduct.id);
  const updatedStockInCache = immediateItem?.stockQuantity;

  record(
    'Priority 3',
    'Cache invalidated immediately after order placement',
    Boolean(orderCreated && updatedStockInCache === 17),
    `Initial cache: ${initialStockInCache}, after order: ${updatedStockInCache} (expected 17)`
  );

  // 4. Cancel order and verify stock restored & cache invalidated immediately
  if (placedOrder?.id) {
    const cancelRes = await fetch(`${BASE_URL}/api/admin/orders/${placedOrder.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });

    // Check immediate cache after cancellation
    const afterCancelRes = await fetch(`${BASE_URL}/api/products`);
    const afterCancelJson: any = await afterCancelRes.json();
    const afterCancelList = Array.isArray(afterCancelJson) ? afterCancelJson : (afterCancelJson.data || []);
    const afterCancelItem = afterCancelList.find((p: any) => p.id === stockProduct.id);

    record(
      'Priority 3',
      'Cache invalidated immediately after order status change (CANCELLED stock restore)',
      Boolean(cancelRes.status === 200 && afterCancelItem?.stockQuantity === 20),
      `After cancel status: ${cancelRes.status}, cache stock: ${afterCancelItem?.stockQuantity} (expected 20)`
    );

    // Clean up order items and order
    await prisma.orderItem.deleteMany({ where: { orderId: placedOrder.id } });
    await prisma.order.delete({ where: { id: placedOrder.id } });
  }

  // Clean up stock test product
  if (stockProduct?.id) {
    await prisma.product.delete({ where: { id: stockProduct.id } });
  }

  // -----------------------------------------------------------------
  // PRIORITY 4: Blog List Response Size Reduction
  // -----------------------------------------------------------------
  console.log('\n--- Priority 4: Reduce Blog List Response Size ---');

  // Test 4.1: Fetch blog list
  const blogListRes = await fetch(`${BASE_URL}/api/blog/posts`);
  const blogListBuffer = await blogListRes.arrayBuffer();
  const blogListBytes = blogListBuffer.byteLength;
  const blogListText = new TextDecoder().decode(blogListBuffer);
  const blogListData: any = JSON.parse(blogListText);
  const blogPosts = blogListData.data || [];

  const allContentEmpty = blogPosts.length > 0 && blogPosts.every((p: any) => !p.content || p.content === '');
  const hasRequiredFields = blogPosts.length > 0 && blogPosts.every((p: any) =>
    p.id && p.title && p.slug && p.coverImage !== undefined && p.publishedAt
  );

  record(
    'Priority 4',
    'GET /api/blog/posts excludes full article content',
    allContentEmpty && hasRequiredFields,
    `Posts returned: ${blogPosts.length}, total payload size: ${(blogListBytes / 1024).toFixed(2)} KB, all content empty: ${allContentEmpty}`
  );

  // Test 4.2: Fetch single blog post by slug to verify full content preserved
  if (blogPosts.length > 0) {
    const firstSlug = blogPosts[0].slug;
    const singlePostRes = await fetch(`${BASE_URL}/api/blog/posts/${firstSlug}`);
    const singlePostBuffer = await singlePostRes.arrayBuffer();
    const singlePostBytes = singlePostBuffer.byteLength;
    const singlePostData: any = JSON.parse(new TextDecoder().decode(singlePostBuffer));
    const singlePost = singlePostData.data || singlePostData;

    const hasFullContent = typeof singlePost.content === 'string' && singlePost.content.length > 50;

    record(
      'Priority 4',
      'GET /api/blog/posts/:slug includes full article content',
      singlePostRes.status === 200 && hasFullContent,
      `Slug: ${firstSlug}, detail payload size: ${(singlePostBytes / 1024).toFixed(2)} KB, content length: ${singlePost.content?.length || 0} chars`
    );
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('📊 TEST SUMMARY');
  console.log('====================================================');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${total - passed}`);
  if (passed === total) {
    console.log('🎉 ALL TARGETED TESTS PASSED COMPLETELY!');
  } else {
    console.log('❌ SOME TESTS FAILED.');
    process.exit(1);
  }
}

run()
  .catch((e) => {
    console.error('Test suite error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
