import { prisma } from '../server/src/services/prisma.js';
import jwt from 'jsonwebtoken';
import { config } from '../server/src/config/env.js';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = config.jwtSecret;

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function record(num: number, name: string, passed: boolean, details?: string, error?: string) {
  results.push({ num, name, passed, details, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [TEST ${num.toString().padStart(2, '0')}] [${passed ? 'PASS' : 'FAIL'}] ${name}${details ? ` -> ${details}` : ''}${error ? ` (Err: ${error})` : ''}`);
}

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('🧪 32 MANDATORY RUNTIME TESTS: PHASE 4 (ORDERS & CHECKOUT)');
  console.log('====================================================\n');

  // Setup test customer 1
  const customer1Phone = `0911${Math.floor(1000000 + Math.random() * 9000000)}`;
  const customer1 = await prisma.user.create({
    data: {
      name: 'مشتری آزمون اول',
      phone: customer1Phone,
      email: `cust1_${Date.now()}@test.ir`,
      role: 'CUSTOMER',
      passwordHash: 'hash',
    },
  });
  const customer1Token = jwt.sign({ id: customer1.id, role: 'CUSTOMER', phone: customer1.phone }, JWT_SECRET, { expiresIn: '1h' });

  // Setup test customer 2
  const customer2Phone = `0912${Math.floor(1000000 + Math.random() * 9000000)}`;
  const customer2 = await prisma.user.create({
    data: {
      name: 'مشتری آزمون دوم',
      phone: customer2Phone,
      email: `cust2_${Date.now()}@test.ir`,
      role: 'CUSTOMER',
      passwordHash: 'hash',
    },
  });
  const customer2Token = jwt.sign({ id: customer2.id, role: 'CUSTOMER', phone: customer2.phone }, JWT_SECRET, { expiresIn: '1h' });

  // Setup test Admin
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'مدیر کل یادمان',
        phone: '09120000999',
        email: 'admin_test@yadman.ir',
        role: 'ADMIN',
        passwordHash: 'hash',
      },
    });
  }
  const adminToken = jwt.sign({ id: admin.id, role: 'ADMIN', phone: admin.phone }, JWT_SECRET, { expiresIn: '1h' });

  // Prepare test category and products
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        id: 'test-cat-p4',
        slug: 'test-cat-p4',
        nameFa: 'دسته‌بندی تست',
        nameEn: 'Test Cat',
        descriptionFa: 'توضیحات تست',
      } as any,
    });
  }

  // Create product with stock
  const testProductStock = await prisma.product.create({
    data: {
      titleFa: 'بسته هدیه تست موجودی',
      sku: `SKU-TEST-${Date.now()}`,
      slug: `slug-test-${Date.now()}`,
      categoryId: category.id,
      price: 500000,
      stockQuantity: 10,
      inStock: true,
      description: 'توضیحات تست موجودی و سفارش',
      image: '/images/products/sample.jpg',
      status: 'ACTIVE',
      itemsIncluded: JSON.stringify(['شمع معطر', 'عود دست‌ساز']),
    },
  });

  // Create out of stock product
  const testProductOutOfStock = await prisma.product.create({
    data: {
      titleFa: 'بسته هدیه بدون موجودی',
      sku: `SKU-OOS-${Date.now()}`,
      slug: `slug-oos-${Date.now()}`,
      categoryId: category.id,
      price: 300000,
      stockQuantity: 0,
      inStock: false,
      description: 'توضیحات تست ناموجود',
      image: '/images/products/sample.jpg',
      status: 'ACTIVE',
      itemsIncluded: JSON.stringify(['گل خشک']),
    },
  });

  // Create test coupon
  const createdCouponCodes: string[] = [];
  const couponCode = `DISC${Date.now().toString().slice(-4)}`;
  createdCouponCodes.push(couponCode);
  const testCoupon = await prisma.coupon.create({
    data: {
      code: couponCode,
      description: 'تخفیف تست سفارش',
      discountPercent: 20,
      maxDiscount: 150000,
      minOrderAmount: 200000,
      usageLimit: 5,
      usedCount: 0,
      isActive: true,
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  let createdOrder1Id = '';
  let createdOrder1Number = '';

  // ----------------------------------------------------
  // TEST 01: Unauthenticated POST /api/orders blocked
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: testProductStock.id, quantity: 1 }] }),
    });
    record(1, 'Unauthenticated POST /api/orders blocked', res.status === 401, `Status: ${res.status}`);
  } catch (e: any) {
    record(1, 'Unauthenticated POST /api/orders blocked', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 02: Unauthenticated GET /api/orders/my blocked
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders/my`);
    record(2, 'Unauthenticated GET /api/orders/my blocked', res.status === 401, `Status: ${res.status}`);
  } catch (e: any) {
    record(2, 'Unauthenticated GET /api/orders/my blocked', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 03: Non-admin GET /api/admin/orders blocked
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    record(3, 'Non-admin GET /api/admin/orders blocked', res.status === 403, `Status: ${res.status}`);
  } catch (e: any) {
    record(3, 'Non-admin GET /api/admin/orders blocked', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 04: Non-admin PUT /api/admin/orders/:id/status blocked
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders/some-id/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    record(4, 'Non-admin PUT /api/admin/orders/:id/status blocked', res.status === 403, `Status: ${res.status}`);
  } catch (e: any) {
    record(4, 'Non-admin PUT /api/admin/orders/:id/status blocked', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 05: Order Creation with Empty Items Rejected
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        customer: { fullName: 'تست', phoneNumber: customer1Phone, address: 'تهران' },
        items: [],
      }),
    });
    record(5, 'Order Creation with Empty Items Rejected', res.status === 400, `Status: ${res.status}`);
  } catch (e: any) {
    record(5, 'Order Creation with Empty Items Rejected', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 06: Order Creation with Missing Customer Address Rejected
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        customer: { fullName: 'تست' }, // missing address/phone
        items: [{ productId: testProductStock.id, quantity: 1 }],
      }),
    });
    record(6, 'Order Creation with Missing Customer Address Rejected', res.status === 400, `Status: ${res.status}`);
  } catch (e: any) {
    record(6, 'Order Creation with Missing Customer Address Rejected', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 07: Order Creation with Out of Stock Product Rejected
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        customer: { fullName: 'تست', phoneNumber: customer1Phone, address: 'تهران، خیابان ولیعصر' },
        items: [{ productId: testProductOutOfStock.id, quantity: 1 }],
      }),
    });
    const data: any = await res.json();
    record(7, 'Order Creation with Out of Stock Product Rejected', res.status === 400, `Message: ${data.message || data.error}`);
  } catch (e: any) {
    record(7, 'Order Creation with Out of Stock Product Rejected', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 08: Order Creation with Quantity Exceeding Stock Rejected
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        customer: { fullName: 'تست', phoneNumber: customer1Phone, address: 'تهران، خیابان ولیعصر' },
        items: [{ productId: testProductStock.id, quantity: 999 }],
      }),
    });
    const data: any = await res.json();
    record(8, 'Order Creation with Quantity Exceeding Stock Rejected', res.status === 400, `Message: ${data.message || data.error}`);
  } catch (e: any) {
    record(8, 'Order Creation with Quantity Exceeding Stock Rejected', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 09: Tampered Frontend Price Ignored (Server Uses DB Price)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        customer: { fullName: 'تست قیمت جعلی', phoneNumber: customer1Phone, address: 'تهران، بلوار کشاورز' },
        items: [{ productId: testProductStock.id, quantity: 2, price: 100 }], // Tampered 100 Tomans
        shippingCost: 0,
        subtotal: 200,
        totalAmount: 200,
      }),
    });
    const data: any = await res.json();
    const created = data.data;
    // Expected: 2 * 500,000 = 1,000,000 subtotal
    const priceHonored = created && created.subtotal === 1000000;
    record(9, 'Tampered Frontend Price Ignored (Server Uses DB Price)', priceHonored, `Subtotal calculated: ${created?.subtotal}`);
    if (created) {
      createdOrder1Id = created.id;
      createdOrder1Number = created.orderNumber;
    }
  } catch (e: any) {
    record(9, 'Tampered Frontend Price Ignored (Server Uses DB Price)', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 10: Stock Decremented Correctly in PostgreSQL
  // ----------------------------------------------------
  try {
    const prodAfter = await prisma.product.findUnique({ where: { id: testProductStock.id } });
    // Started with 10, purchased 2 -> remaining 8
    const stockCorrect = prodAfter?.stockQuantity === 8;
    record(10, 'Stock Decremented Correctly in PostgreSQL', stockCorrect, `Stock before: 10, stock after: ${prodAfter?.stockQuantity}`);
  } catch (e: any) {
    record(10, 'Stock Decremented Correctly in PostgreSQL', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 11: Order Status Initialized to PENDING
  // ----------------------------------------------------
  try {
    const ord = await prisma.order.findUnique({ where: { id: createdOrder1Id } });
    record(11, 'Order Status Initialized to PENDING', ord?.status === 'PENDING', `Status: ${ord?.status}`);
  } catch (e: any) {
    record(11, 'Order Status Initialized to PENDING', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 12: Order PaymentStatus Initialized to UNPAID
  // ----------------------------------------------------
  try {
    const ord = await prisma.order.findUnique({ where: { id: createdOrder1Id } });
    record(12, 'Order PaymentStatus Initialized to UNPAID', ord?.paymentStatus === 'UNPAID', `PaymentStatus: ${ord?.paymentStatus}`);
  } catch (e: any) {
    record(12, 'Order PaymentStatus Initialized to UNPAID', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 13: OrderItem Preserves Historical Product Snapshot (title, sku, price)
  // ----------------------------------------------------
  try {
    const items = await prisma.orderItem.findMany({ where: { orderId: createdOrder1Id } });
    const item = items[0];
    const snapshotValid = item && item.productTitleFa === testProductStock.titleFa && item.productSku === testProductStock.sku && item.unitPrice === testProductStock.price;
    record(13, 'OrderItem Preserves Historical Product Snapshot', snapshotValid, `Snapshot: ${item?.productTitleFa}, SKU: ${item?.productSku}, Price: ${item?.unitPrice}`);
  } catch (e: any) {
    record(13, 'OrderItem Preserves Historical Product Snapshot', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 14: Subsequent Product Price Change Does Not Mutate Historical OrderItem
  // ----------------------------------------------------
  try {
    // Mutate product price in DB
    await prisma.product.update({
      where: { id: testProductStock.id },
      data: { price: 999999 },
    });
    // Re-query OrderItem
    const item = await prisma.orderItem.findFirst({ where: { orderId: createdOrder1Id } });
    const immutable = item?.unitPrice === 500000;
    record(14, 'Subsequent Product Price Change Does Not Mutate Historical OrderItem', immutable, `Item price remained: ${item?.unitPrice} despite product updated to 999999`);
    // Restore product price
    await prisma.product.update({ where: { id: testProductStock.id }, data: { price: 500000 } });
  } catch (e: any) {
    record(14, 'Subsequent Product Price Change Does Not Mutate Historical OrderItem', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 15: Valid Coupon Applied & Discount Amount Calculated by Server
  // ----------------------------------------------------
  let couponOrderId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        customer: { fullName: 'تست کوپن', phoneNumber: customer1Phone, address: 'تهران، نیاوران' },
        items: [{ productId: testProductStock.id, quantity: 1 }], // 500,000 Tomans
        couponCode: couponCode, // 20% discount = 100,000 Tomans
      }),
    });
    const data: any = await res.json();
    const created = data.data;
    // 20% of 500,000 = 100,000. shipping = 45,000. Total = 445,000
    const discountCorrect = created && created.discountAmount === 100000;
    record(15, 'Valid Coupon Applied & Discount Calculated by Server', discountCorrect, `Discount: ${created?.discountAmount}, Total: ${created?.totalAmount}`);
    if (created) couponOrderId = created.id;
  } catch (e: any) {
    record(15, 'Valid Coupon Applied & Discount Calculated by Server', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 16: Coupon Usage Counter Incremented in DB
  // ----------------------------------------------------
  try {
    const cpn = await prisma.coupon.findUnique({ where: { id: testCoupon.id } });
    record(16, 'Coupon Usage Counter Incremented in DB', cpn?.usedCount === 1, `usedCount: ${cpn?.usedCount}`);
  } catch (e: any) {
    record(16, 'Coupon Usage Counter Incremented in DB', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 17: Expired or Inactive Coupon Rejected
  // ----------------------------------------------------
  try {
    const inactiveCouponCode = `INACT_${Date.now()}`;
    createdCouponCodes.push(inactiveCouponCode);
    const inactiveCoupon = await prisma.coupon.create({
      data: {
        code: inactiveCouponCode,
        description: 'کوپن غیرفعال',
        discountPercent: 10,
        isActive: false,
      },
    });
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        customer: { fullName: 'تست کوپن غیرفعال', phoneNumber: customer1Phone, address: 'تهران' },
        items: [{ productId: testProductStock.id, quantity: 1 }],
        couponCode: inactiveCoupon.code,
      }),
    });
    record(17, 'Expired or Inactive Coupon Rejected', res.status === 400, `Status: ${res.status}`);
  } catch (e: any) {
    record(17, 'Expired or Inactive Coupon Rejected', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 18: Coupon MinOrderAmount Enforced by Server
  // ----------------------------------------------------
  try {
    const highMinCode = `HIGHMIN_${Date.now()}`;
    createdCouponCodes.push(highMinCode);
    const highMinCoupon = await prisma.coupon.create({
      data: {
        code: highMinCode,
        description: 'کوپن حداقل بالا',
        discountPercent: 10,
        minOrderAmount: 10000000, // 10 Million
        isActive: true,
      },
    });
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        customer: { fullName: 'تست حداقل سفارش', phoneNumber: customer1Phone, address: 'تهران' },
        items: [{ productId: testProductStock.id, quantity: 1 }], // 500,000 < 10,000,000
        couponCode: highMinCoupon.code,
      }),
    });
    record(18, 'Coupon MinOrderAmount Enforced by Server', res.status === 400, `Status: ${res.status}`);
  } catch (e: any) {
    record(18, 'Coupon MinOrderAmount Enforced by Server', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 19: Order Number Follows 'YAD-XXXXXX' Format
  // ----------------------------------------------------
  try {
    const pattern = /^YAD-\d{6}$/;
    const isValidPattern = pattern.test(createdOrder1Number);
    record(19, "Order Number Follows 'YAD-XXXXXX' Format", isValidPattern, `Generated: ${createdOrder1Number}`);
  } catch (e: any) {
    record(19, "Order Number Follows 'YAD-XXXXXX' Format", false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 20: GET /api/orders/my Returns Authenticated Customer Orders
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders/my`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const data: any = await res.json();
    const count = data.data?.length || 0;
    record(20, 'GET /api/orders/my Returns Authenticated Customer Orders', res.ok && count >= 2, `Found ${count} orders for customer 1`);
  } catch (e: any) {
    record(20, 'GET /api/orders/my Returns Authenticated Customer Orders', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 21: Cross-User Order Isolation (Customer 2 cannot see Customer 1 in /my)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders/my`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    const data: any = await res.json();
    const list: any[] = data.data || [];
    const customer1OrderInCustomer2 = list.some((o: any) => o.id === createdOrder1Id);
    record(21, 'Cross-User Order Isolation in /my', res.ok && !customer1OrderInCustomer2, `Customer 2 orders count: ${list.length}, leaked: ${customer1OrderInCustomer2}`);
  } catch (e: any) {
    record(21, 'Cross-User Order Isolation in /my', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 22: GET /api/orders/:id Forbidden for Unauthorized Other Customer
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders/${createdOrder1Id}`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    record(22, 'GET /api/orders/:id Forbidden for Unauthorized Other Customer', res.status === 403, `Status: ${res.status}`);
  } catch (e: any) {
    record(22, 'GET /api/orders/:id Forbidden for Unauthorized Other Customer', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 23: GET /api/orders/:id Allowed for Order Owner
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/orders/${createdOrder1Id}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const data: any = await res.json();
    record(23, 'GET /api/orders/:id Allowed for Order Owner', res.ok && data.data?.id === createdOrder1Id, `Order Number: ${data.data?.orderNumber}`);
  } catch (e: any) {
    record(23, 'GET /api/orders/:id Allowed for Order Owner', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 24: GET /api/admin/orders Returns Full List for Admin
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data: any = await res.json();
    const count = data.data?.length || 0;
    record(24, 'GET /api/admin/orders Returns Full List for Admin', res.ok && count >= 2, `Admin retrieved ${count} total orders`);
  } catch (e: any) {
    record(24, 'GET /api/admin/orders Returns Full List for Admin', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 25: GET /api/admin/orders/:id Allowed for Admin (Bypassing User Ownership)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders/${createdOrder1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data: any = await res.json();
    record(25, 'GET /api/admin/orders/:id Allowed for Admin', res.ok && data.data?.id === createdOrder1Id, `Fetched: ${data.data?.orderNumber}`);
  } catch (e: any) {
    record(25, 'GET /api/admin/orders/:id Allowed for Admin', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 26: Admin Search Orders by Order Number
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders?search=${createdOrder1Number}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data: any = await res.json();
    const found = data.data?.some((o: any) => o.orderNumber === createdOrder1Number);
    record(26, 'Admin Search Orders by Order Number', res.ok && found, `Found order: ${createdOrder1Number}`);
  } catch (e: any) {
    record(26, 'Admin Search Orders by Order Number', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 27: Admin Search Orders by Customer Phone
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders?search=${customer1Phone}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data: any = await res.json();
    const found = data.data?.some((o: any) => o.customerPhone === customer1Phone);
    record(27, 'Admin Search Orders by Customer Phone', res.ok && found, `Found order for phone: ${customer1Phone}`);
  } catch (e: any) {
    record(27, 'Admin Search Orders by Customer Phone', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 28: Admin Filter Orders by Status
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders?status=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data: any = await res.json();
    const allPending = Array.isArray(data.data) && data.data.every((o: any) => o.status === 'PENDING');
    record(28, 'Admin Filter Orders by Status', res.ok && allPending, `Returned ${data.data?.length} PENDING orders`);
  } catch (e: any) {
    record(28, 'Admin Filter Orders by Status', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 29: Admin Update Order Status to PREPARING
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders/${createdOrder1Id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'PREPARING', adminNotes: 'در حال بسته‌بندی هاردباکس' }),
    });
    const data: any = await res.json();
    record(29, 'Admin Update Order Status to PREPARING', res.ok && data.data?.status === 'PREPARING', `Status updated: ${data.data?.status}`);
  } catch (e: any) {
    record(29, 'Admin Update Order Status to PREPARING', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 30: Admin Update Order Status with Invalid Status Rejected
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders/${createdOrder1Id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'INVALID_STATUS_XYZ' }),
    });
    record(30, 'Admin Update Order Status with Invalid Status Rejected', res.status === 400, `Status: ${res.status}`);
  } catch (e: any) {
    record(30, 'Admin Update Order Status with Invalid Status Rejected', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 31: Admin Order Status Transition to DELIVERED
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/orders/${createdOrder1Id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'DELIVERED', adminNotes: 'تحویل داده شد به گیرنده' }),
    });
    const data: any = await res.json();
    record(31, 'Admin Order Status Transition to DELIVERED', res.ok && data.data?.status === 'DELIVERED', `Status: ${data.data?.status}`);
  } catch (e: any) {
    record(31, 'Admin Order Status Transition to DELIVERED', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // TEST 32: Transaction Atomicity on Failure (Rollback Simulation)
  // ----------------------------------------------------
  try {
    // If order creation fails halfway (e.g. stock validation fails for item 2),
    // item 1's stock must NOT be decremented and order must NOT exist.
    const initialStock = (await prisma.product.findUnique({ where: { id: testProductStock.id } }))?.stockQuantity;
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        customer: { fullName: 'تست رول‌بک اتمیک', phoneNumber: customer1Phone, address: 'تهران' },
        items: [
          { productId: testProductStock.id, quantity: 1 }, // Valid item
          { productId: testProductOutOfStock.id, quantity: 1 }, // Out of stock -> Triggers transaction abort
        ],
      }),
    });
    const afterStock = (await prisma.product.findUnique({ where: { id: testProductStock.id } }))?.stockQuantity;
    const atomicityPreserved = res.status === 400 && afterStock === initialStock;
    record(32, 'Transaction Atomicity on Failure (Rollback Verified)', atomicityPreserved, `HTTP: ${res.status}, Stock preserved: ${initialStock} == ${afterStock}`);
  } catch (e: any) {
    record(32, 'Transaction Atomicity on Failure (Rollback Verified)', false, undefined, e.message);
  }

  // ----------------------------------------------------
  // CLEANUP & SUMMARY
  // ----------------------------------------------------
  try {
    const userIds = [customer1?.id, customer2?.id].filter(Boolean);
    const prodIds = [testProductStock?.id, testProductOutOfStock?.id].filter(Boolean);

    await prisma.orderItem.deleteMany({
      where: {
        OR: [
          { order: { userId: { in: userIds } } },
          { productId: { in: prodIds } },
        ],
      },
    });

    await prisma.order.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { customerPhone: { in: [customer1Phone, customer2Phone] } },
        ],
      },
    });

    await prisma.cartItem.deleteMany({
      where: {
        cart: { userId: { in: userIds } },
      },
    });

    await prisma.cart.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });

    if (createdCouponCodes.length > 0) {
      await prisma.coupon.deleteMany({
        where: {
          code: { in: createdCouponCodes },
        },
      });
    }

    if (prodIds.length > 0) {
      await prisma.product.deleteMany({
        where: {
          id: { in: prodIds },
        },
      });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: { in: userIds },
        },
      });
    }
  } catch (cleanErr) {
    console.warn('DB Hygiene cleanup warning:', cleanErr);
  }

  console.log('\n====================================================');
  console.log('📊 32 RUNTIME TESTS SUMMARY');
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`\n❌ FAILED TESTS (${failedCount}):`);
    results.filter(r => !r.passed).forEach(r => {
      console.error(`- Test ${r.num}: ${r.name} -> ${r.error || r.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 32 MANDATORY RUNTIME TESTS PASSED COMPLETELY (100%)!');
  }
}

runPhase4Tests()
  .catch(e => {
    console.error('Fatal error during Phase 4 testing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
