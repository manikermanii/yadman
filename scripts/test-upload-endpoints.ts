import { prisma } from '../server/src/services/prisma.js';

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
  console.log('🧪 TESTING UPLOAD ENDPOINTS & STORAGE SECURITY CONTRACT');
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

  // 2. Test Single Valid Image Upload (Real PNG with valid magic bytes)
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);
  const form = new FormData();
  form.append('file', new Blob([validPngBuffer], { type: 'image/png' }), 'test-product.png');
  form.append('folder', 'products');

  const uploadRes = await fetch(`${BASE_URL}/api/upload/single`, {
    method: 'POST',
    body: form,
  });
  const uploadJson: any = await uploadRes.json();
  const uploadedData = uploadJson.data;

  const validUpload =
    uploadRes.status === 201 &&
    uploadedData &&
    typeof uploadedData.url === 'string' &&
    typeof uploadedData.key === 'string' &&
    uploadedData.mimeType === 'image/png';

  record(
    'Valid Image Upload (POST /api/upload/single)',
    validUpload,
    `Status ${uploadRes.status}, returned URL: ${uploadedData?.url || 'none'}, key: ${uploadedData?.key || 'none'}`
  );

  // 3. Test SVG Rejection (Stored XSS Prevention)
  const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle r="10"/></svg>';
  const svgForm = new FormData();
  svgForm.append('file', new Blob([Buffer.from(svgContent)], { type: 'image/svg+xml' }), 'malicious.svg');

  const svgRes = await fetch(`${BASE_URL}/api/upload/single`, {
    method: 'POST',
    body: svgForm,
  });
  const svgJson: any = await svgRes.json();
  const svgBlocked =
    svgRes.status === 400 &&
    (svgJson.error?.code === 'INVALID_FILE_TYPE' ||
      svgJson.code === 'INVALID_FILE_TYPE' ||
      (svgJson.message && svgJson.message.includes('SVG')));
  record(
    'SVG Upload Rejected (Stored XSS Prevention)',
    svgBlocked,
    `Status ${svgRes.status}, Message: ${svgJson.message || svgJson.error?.message}`
  );

  // 4. Test Disguised Executable Rejection (Magic Bytes Verification)
  const fakePngForm = new FormData();
  fakePngForm.append(
    'file',
    new Blob([Buffer.from('#!/bin/bash\necho bad-script')], { type: 'image/png' }),
    'disguised.png'
  );
  const fakePngRes = await fetch(`${BASE_URL}/api/upload/single`, {
    method: 'POST',
    body: fakePngForm,
  });
  const fakePngJson: any = await fakePngRes.json();
  const fakeBlocked = fakePngRes.status === 400;
  record(
    'Disguised Non-Image Rejection (Magic Bytes Verification)',
    fakeBlocked,
    `Status ${fakePngRes.status}, Error: ${fakePngJson.message || fakePngJson.error}`
  );

  // 5. Test Voice Recording Upload (POST /api/upload/voice)
  const dummyVoiceBuffer = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00]); // WebM EBML header
  const dummyVoiceBase64 = dummyVoiceBuffer.toString('base64');
  const voiceRes = await fetch(`${BASE_URL}/api/upload/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data: dummyVoiceBase64, mimeType: 'audio/webm' }),
  });
  const voiceJson: any = await voiceRes.json();
  const validVoice = voiceRes.status === 201 && voiceJson.data?.url && typeof voiceJson.data.url === 'string';
  record(
    'Voice Recording Upload (POST /api/upload/voice)',
    validVoice,
    `Status ${voiceRes.status}, returned URL: ${voiceJson.data?.url || 'none'}`
  );

  // 6. Test Path Traversal Protection on Deletion
  const traversalDelRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ key: '../../etc/passwd' }),
  });
  record(
    'Path Traversal in Key Blocked on Deletion',
    traversalDelRes.status === 400,
    `Status ${traversalDelRes.status} (expected 400)`
  );

  // 7. Test Image Delete Route Security (DELETE /api/upload)
  if (uploadedData?.key) {
    // Unauthenticated delete attempt
    const unauthDelRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: uploadedData.key }),
    });
    record(
      'Unauthenticated Image Delete Blocked',
      unauthDelRes.status === 401,
      `Status ${unauthDelRes.status} (expected 401)`
    );

    // Authenticated admin delete
    const adminDelRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ key: uploadedData.key }),
    });
    const adminDelJson: any = await adminDelRes.json();
    record(
      'Admin Image Delete (DELETE /api/upload)',
      adminDelRes.status === 200 && adminDelJson.data?.success === true,
      `Status ${adminDelRes.status}, deleted: ${adminDelJson.data?.success}`
    );
  }

  console.log('\n========================================================');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`📊 TOTAL: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('========================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

run()
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
