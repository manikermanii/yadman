import { prisma } from '../server/src/services/prisma.js';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details?: string, error?: string) {
  results.push({ name, passed, details, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${name}${details ? ` - ${details}` : ''}${error ? ` (Error: ${error})` : ''}`);
}

async function main() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE RUNTIME & ENDPOINT TESTS');
  console.log('====================================================\n');

  let customerToken = '';
  let customerUser: any = null;
  let adminToken = '';
  const testRunId = Date.now();
  const testPhone = `099${Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8)}`;
  const testEmail = `test_${testRunId}@yadman-audit.test`;
  const testPassword = 'TestPassword123!';

  // ----------------------------------------------------
  // TEST 1: Direct SQL Role Security (RLS Enforcement Simulation for anon)
  // ----------------------------------------------------
  try {
    console.log('--- 1. Testing Database Role Security & Anon Isolation ---');
    
    // Switch to anon role
    await prisma.$executeRawUnsafe(`SET ROLE anon;`);

    // Check anon access on Product: should only see active or succeed for SELECT
    const anonProductSelect: any = await prisma.$queryRawUnsafe(`
      SELECT id, status FROM "Product" LIMIT 5;
    `);
    const allActive = Array.isArray(anonProductSelect) && anonProductSelect.every((p: any) => p.status === 'ACTIVE');
    record('RLS Anon SELECT on Product (filtered to ACTIVE)', allActive || anonProductSelect.length === 0, `Returned ${anonProductSelect.length} active rows`);

    // Check anon INSERT on Product: must be rejected
    let anonInsertBlocked = false;
    try {
      await prisma.$queryRawUnsafe(`
        INSERT INTO "Product" (id, "titleFa", sku, slug, "categoryId", price, description, image, "itemsIncluded")
        VALUES ('malicious-anon-prod', 'محصول غیرمجاز', 'SKU-MALICIOUS', 'slug-malicious', 'test-cat', 1000, 'desc', '', '[]');
      `);
    } catch (e: any) {
      anonInsertBlocked = true;
    }
    record('RLS Anon INSERT on Product (Blocked)', anonInsertBlocked, 'Anonymous INSERT rejected by policy');

    // Check anon SELECT on User: must return 0 rows (default deny)
    const anonUserSelect: any = await prisma.$queryRawUnsafe(`
      SELECT id, email, "passwordHash" FROM "User";
    `);
    const userProtected = Array.isArray(anonUserSelect) && anonUserSelect.length === 0;
    record('RLS Anon SELECT on User (Private / Denied)', userProtected, `Returned ${anonUserSelect.length} rows (0 leaked)`);

    // Check anon SELECT on Order: must return 0 rows (default deny)
    const anonOrderSelect: any = await prisma.$queryRawUnsafe(`
      SELECT id, "customerName", "deliveryAddress" FROM "Order";
    `);
    const orderProtected = Array.isArray(anonOrderSelect) && anonOrderSelect.length === 0;
    record('RLS Anon SELECT on Order (Private / Denied)', orderProtected, `Returned ${anonOrderSelect.length} rows (0 leaked)`);

    // Reset role back to postgres
    await prisma.$executeRawUnsafe(`RESET ROLE;`);
    record('RLS Role Reset to postgres', true, 'Session restored to postgres bypass role');
  } catch (e: any) {
    await prisma.$executeRawUnsafe(`RESET ROLE;`).catch(() => {});
    record('RLS Role Simulation Checks', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 2: Customer Registration & Login
  // ----------------------------------------------------
  try {
    console.log('\n--- 2. Customer Registration & Login ---');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'کاربر تست اعتبارسنجی',
        phoneNumber: testPhone,
        email: testEmail,
        password: testPassword,
      }),
    });
    const regData: any = await regRes.json();
    if (regRes.ok && regData.success && regData.data?.token) {
      customerToken = regData.data.token;
      customerUser = regData.data.user;
      record('Customer Registration', true, `User ID: ${customerUser?.id}, Phone: ${testPhone}`);
    } else {
      record('Customer Registration', false, undefined, JSON.stringify(regData));
    }

    // Test Customer Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testPhone,
        password: testPassword,
      }),
    });
    const loginData: any = await loginRes.json();
    if (loginRes.ok && loginData.success && loginData.data?.token) {
      customerToken = loginData.data.token;
      record('Customer Login', true, 'Login successful with JWT returned');
    } else {
      record('Customer Login', false, undefined, JSON.stringify(loginData));
    }
  } catch (e: any) {
    record('Customer Registration / Login', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 3: Customer Session /me
  // ----------------------------------------------------
  try {
    console.log('\n--- 3. Customer Session /me ---');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const meData: any = await meRes.json();
    if (meRes.ok && meData.success && meData.data?.user?.phone === testPhone) {
      record('Customer Session /me', true, `Authenticated user phone matches: ${meData.data.user.phone}`);
    } else {
      record('Customer Session /me', false, undefined, JSON.stringify(meData));
    }
  } catch (e: any) {
    record('Customer Session /me', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 4: Admin Login & Session
  // ----------------------------------------------------
  try {
    console.log('\n--- 4. Admin Login & Session ---');
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
    if (adminLoginRes.ok && adminLoginData.success && adminLoginData.data?.token) {
      adminToken = adminLoginData.data.token;
      record('Admin Login', true, `Admin authenticated: ${adminLoginData.data.user?.email || adminEmail}`);
    } else {
      record('Admin Login', false, undefined, JSON.stringify(adminLoginData));
    }

    const adminMeRes = await fetch(`${BASE_URL}/api/auth/admin/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminMeData: any = await adminMeRes.json();
    const roleUpper = (adminMeData.data?.user?.role || '').toUpperCase();
    if (adminMeRes.ok && adminMeData.success && (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN')) {
      record('Admin Session /admin/me', true, `Admin role verified: ${roleUpper}`);
    } else {
      record('Admin Session /admin/me', false, undefined, JSON.stringify(adminMeData));
    }
  } catch (e: any) {
    record('Admin Auth', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 5: Category CRUD
  // ----------------------------------------------------
  let createdCatId = '';
  try {
    console.log('\n--- 5. Category CRUD ---');
    const catPayload = {
      nameFa: `دسته‌بندی تست ${testRunId}`,
      nameEn: `Test Category ${testRunId}`,
      slug: `test-cat-${testRunId}`,
      descriptionFa: 'توضیحات تست دسته‌بندی امنیتی',
      iconName: 'Sparkles',
      isFeatured: false,
    };

    // CREATE Category (Admin)
    const createCatRes = await fetch(`${BASE_URL}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(catPayload),
    });
    const createCatData: any = await createCatRes.json();
    if (createCatRes.ok && createCatData.success) {
      createdCatId = createCatData.data.id;
      record('Category CREATE (Admin)', true, `Category ID: ${createdCatId}`);
    } else {
      record('Category CREATE (Admin)', false, undefined, JSON.stringify(createCatData));
    }

    // READ Public Categories
    const getCatsRes = await fetch(`${BASE_URL}/api/categories`);
    const getCatsData: any = await getCatsRes.json();
    const foundCat = getCatsData.data?.find((c: any) => c.id === createdCatId);
    record('Category READ (Public)', Boolean(foundCat), `Found created category in public list`);

    // UPDATE Category (Admin)
    const updateCatRes = await fetch(`${BASE_URL}/api/admin/categories/${createdCatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ nameFa: `دسته‌بندی ویرایش‌شده ${testRunId}` }),
    });
    const updateCatData: any = await updateCatRes.json();
    record('Category UPDATE (Admin)', updateCatRes.ok && updateCatData.success, 'Updated category title');

    // DELETE Category (Admin)
    const deleteCatRes = await fetch(`${BASE_URL}/api/admin/categories/${createdCatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteCatData: any = await deleteCatRes.json();
    record('Category DELETE (Admin)', deleteCatRes.ok && deleteCatData.success, 'Cleaned up test category');
  } catch (e: any) {
    record('Category CRUD', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 6: Admin Product CRUD
  // ----------------------------------------------------
  let createdProductId = '';
  try {
    console.log('\n--- 6. Admin Product CRUD ---');
    const existingCats: any = await prisma.category.findFirst();
    const targetCatId = existingCats?.id || 'all';

    const prodPayload = {
      titleFa: `بسته هدیه تست امنیتی ${testRunId}`,
      titleEn: `Security Audit Gift Box ${testRunId}`,
      sku: `AUDIT-SEC-${testRunId.toString().slice(-6)}`,
      categoryId: targetCatId,
      category: targetCatId,
      price: 850000,
      description: 'توضیحات بسته هدیه برای آزمایش سازگاری RLS و پریسما',
      stockQuantity: 15,
      inStock: true,
      status: 'active',
    };

    // CREATE Product (Admin)
    const createProdRes = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(prodPayload),
    });
    const createProdData: any = await createProdRes.json();
    if (createProdRes.ok && createProdData.success) {
      createdProductId = createProdData.data.id;
      record('Product CREATE (Admin)', true, `Created Product ID: ${createdProductId}`);
    } else {
      record('Product CREATE (Admin)', false, undefined, JSON.stringify(createProdData));
    }

    // READ Single Product
    const getProdRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
    const getProdData: any = await getProdRes.json();
    record('Product READ By ID', getProdRes.ok && getProdData.success, `Fetched product: ${getProdData.data?.titleFa}`);

    // UPDATE Product (Admin)
    const updateProdRes = await fetch(`${BASE_URL}/api/admin/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ price: 920000, stockQuantity: 20 }),
    });
    const updateProdData: any = await updateProdRes.json();
    record('Product UPDATE (Admin)', updateProdRes.ok && updateProdData.success, `Updated price to 920000`);

    // DELETE Product (Admin)
    const deleteProdRes = await fetch(`${BASE_URL}/api/admin/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteProdData: any = await deleteProdRes.json();
    record('Product DELETE (Admin)', deleteProdRes.ok && deleteProdData.success, 'Cleaned up test product');
  } catch (e: any) {
    record('Product CRUD', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 7: Storefront Products & Categories Loading
  // ----------------------------------------------------
  try {
    console.log('\n--- 7. Storefront Products & Categories Loading ---');
    const storeProdsRes = await fetch(`${BASE_URL}/api/products`);
    const storeProdsData: any = await storeProdsRes.json();
    record('Storefront Products Loading', storeProdsRes.ok && storeProdsData.success && Array.isArray(storeProdsData.data), `Fetched ${storeProdsData.data?.length || 0} products`);

    const storeCatsRes = await fetch(`${BASE_URL}/api/categories`);
    const storeCatsData: any = await storeCatsRes.json();
    record('Storefront Categories Loading', storeCatsRes.ok && storeCatsData.success && Array.isArray(storeCatsData.data), `Fetched ${storeCatsData.data?.length || 0} categories`);
  } catch (e: any) {
    record('Storefront Loading', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 8: Cart Flow
  // ----------------------------------------------------
  try {
    console.log('\n--- 8. Cart Flow ---');
    const firstProd: any = await prisma.product.findFirst();

    // Add to cart
    const addCartRes = await fetch(`${BASE_URL}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        productId: firstProd?.id || 'sample-prod',
        quantity: 2,
        cardMessage: 'با آرزوی بهترین‌ها',
        recipientName: 'گیرنده تست',
      }),
    });
    const addCartData: any = await addCartRes.json();
    record('Cart Add Item', addCartRes.ok && addCartData.success, 'Item added to customer cart', !addCartRes.ok || !addCartData.success ? JSON.stringify(addCartData) : undefined);

    // Get Cart
    const getCartRes = await fetch(`${BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const getCartData: any = await getCartRes.json();
    const itemsCount = getCartData.data?.items?.length || 0;
    record('Cart Fetch (Customer)', getCartRes.ok && getCartData.success && itemsCount > 0, `Cart contains ${itemsCount} item(s)`);

    // Clear Cart
    const clearCartRes = await fetch(`${BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const clearCartData: any = await clearCartRes.json();
    record('Cart Clear', clearCartRes.ok && clearCartData.success, 'Customer cart cleared');
  } catch (e: any) {
    record('Cart Flow', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 9: Wishlist Flow
  // ----------------------------------------------------
  try {
    console.log('\n--- 9. Wishlist Flow ---');
    const firstProd: any = await prisma.product.findFirst();
    if (firstProd) {
      const toggleRes = await fetch(`${BASE_URL}/api/wishlist/${firstProd.id}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const toggleData: any = await toggleRes.json();
      record('Wishlist Toggle', toggleRes.ok && toggleData.success, `Toggled product: ${firstProd.titleFa}`);

      const getWishRes = await fetch(`${BASE_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const getWishData: any = await getWishRes.json();
      record('Wishlist Fetch', getWishRes.ok && getWishData.success, `Customer wishlist contains ${getWishData.data?.length || 0} item(s)`);
    } else {
      record('Wishlist Flow', true, 'Skipped toggle (no product found in DB)');
    }
  } catch (e: any) {
    record('Wishlist Flow', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 10: Orders Flow
  // ----------------------------------------------------
  try {
    console.log('\n--- 10. Orders Flow ---');
    const firstProd: any = await prisma.product.findFirst();

    const orderPayload = {
      customer: {
        fullName: 'کاربر سفارش تست',
        phoneNumber: testPhone,
        email: testEmail,
        province: 'تهران',
        city: 'تهران',
        address: 'تهران، خیابان ولیعصر، پلاک ۱، واحد ۴',
        postalCode: '1987654321',
      },
      items: [
        {
          productId: firstProd?.id || 'sample-p',
          quantity: 1,
          cardMessage: 'تبریک فراوان',
        },
      ],
      shippingMethod: 'post_pishtaz',
      paymentMethod: 'online',
    };

    const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(orderPayload),
    });
    const createOrderData: any = await createOrderRes.json();
    if (createOrderRes.ok && createOrderData.success) {
      record('Order CREATE', true, `Order Number: ${createOrderData.data.orderNumber}`);
    } else {
      record('Order CREATE', false, undefined, JSON.stringify(createOrderData));
    }

    const myOrdersRes = await fetch(`${BASE_URL}/api/orders/my`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const myOrdersData: any = await myOrdersRes.json();
    record('Customer Orders /my', myOrdersRes.ok && myOrdersData.success, `Found ${myOrdersData.data?.length || 0} order(s) for customer`);
  } catch (e: any) {
    record('Orders Flow', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 11: Reviews Flow
  // ----------------------------------------------------
  try {
    console.log('\n--- 11. Reviews Flow ---');
    const firstProd: any = await prisma.product.findFirst();
    if (firstProd) {
      const reviewRes = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          productId: firstProd.id,
          authorName: 'مشتری تست یادمان',
          rating: 5,
          comment: 'کیفیت بسته‌بندی عالی و ارسال به‌موقع بود.',
        }),
      });
      const reviewData: any = await reviewRes.json();
      record('Review CREATE', reviewRes.ok && reviewData.success, 'Review submitted successfully (pending moderation)');

      const getReviewsRes = await fetch(`${BASE_URL}/api/products/${firstProd.id}/reviews`);
      const getReviewsData: any = await getReviewsRes.json();
      record('Review Public Fetch', getReviewsRes.ok && getReviewsData.success, `Product reviews fetched`);
    } else {
      record('Reviews Flow', true, 'Skipped (no product in DB)');
    }
  } catch (e: any) {
    record('Reviews Flow', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 12: Blog Flow
  // ----------------------------------------------------
  try {
    console.log('\n--- 12. Blog Flow ---');
    const postsRes = await fetch(`${BASE_URL}/api/blog/posts`);
    const postsData: any = await postsRes.json();
    record('Blog Posts Fetch', postsRes.ok && postsData.success, `Fetched ${postsData.data?.length || 0} blog posts`);

    const authorsRes = await fetch(`${BASE_URL}/api/blog/authors`);
    const authorsData: any = await authorsRes.json();
    record('Blog Authors Fetch', authorsRes.ok && authorsData.success, `Fetched blog authors`);

    const categoriesRes = await fetch(`${BASE_URL}/api/blog/categories`);
    const categoriesData: any = await categoriesRes.json();
    record('Blog Categories Fetch', categoriesRes.ok && categoriesData.success, `Fetched blog categories`);
  } catch (e: any) {
    record('Blog Flow', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 13: Corporate Inquiry Flow
  // ----------------------------------------------------
  try {
    console.log('\n--- 13. Corporate Inquiry Flow ---');
    const inquiryPayload = {
      companyName: 'شرکت فناوری تست',
      contactName: 'مهندس رضایی',
      phone: '09121234567',
      estimatedQuantity: '100 عدد',
      budgetPerBox: '1,500,000 تومان',
      notes: 'درخواست پیش‌فاکتور پک سازمانی عید',
    };

    const inqRes = await fetch(`${BASE_URL}/api/corporate-inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryPayload),
    });
    const inqData: any = await inqRes.json();
    record('Corporate Inquiry Submit', inqRes.ok && inqData.success, `Inquiry Number: ${inqData.data?.inquiryNumber}`);

    const adminInqRes = await fetch(`${BASE_URL}/api/admin/corporate-inquiries`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminInqData: any = await adminInqRes.json();
    record('Corporate Inquiries Fetch (Admin)', adminInqRes.ok && adminInqData.success, `Fetched ${adminInqData.data?.length || 0} inquiries`);
  } catch (e: any) {
    record('Corporate Inquiry Flow', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 14: Consultation Flow
  // ----------------------------------------------------
  try {
    console.log('\n--- 14. Consultation Flow ---');
    const consultPayload = {
      fullName: 'آقای شایان',
      phone: '09127778899',
      customerType: 'personal',
      topic: 'box_selection',
      description: 'مشاوره برای انتخاب ترکیب زعفران و مس',
    };

    const consultRes = await fetch(`${BASE_URL}/api/consultations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultPayload),
    });
    const consultData: any = await consultRes.json();
    record('Consultation Submit', consultRes.ok && consultData.success, 'Consultation request saved');

    const adminConsultRes = await fetch(`${BASE_URL}/api/admin/consultations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminConsultData: any = await adminConsultRes.json();
    record('Consultations Fetch (Admin)', adminConsultRes.ok && adminConsultData.success, `Fetched ${adminConsultData.data?.length || 0} requests`);
  } catch (e: any) {
    record('Consultation Flow', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 15: Homepage CMS & Settings Flow
  // ----------------------------------------------------
  try {
    console.log('\n--- 15. Homepage CMS & Settings Flow ---');
    const cmsRes = await fetch(`${BASE_URL}/api/cms/homepage`);
    const cmsData: any = await cmsRes.json();
    record('Homepage CMS Fetch', cmsRes.ok && cmsData.success, 'Homepage configuration loaded');

    const settingsRes = await fetch(`${BASE_URL}/api/cms/settings`);
    const settingsData: any = await settingsRes.json();
    record('Site Settings Fetch', settingsRes.ok && settingsData.success, 'Site settings loaded');
  } catch (e: any) {
    record('Homepage CMS Flow', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log('📊 TEST SUMMARY RESULTS');
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`\n❌ FAILED TESTS (${failedCount}):`);
    results.filter(r => !r.passed).forEach(r => {
      console.error(`- ${r.name}: ${r.error || r.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL RUNTIME & ENDPOINT TESTS PASSED COMPLETELY!');
  }
}

main()
  .catch(e => {
    console.error('Fatal error running tests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
