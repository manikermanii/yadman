import { prisma } from '../services/prisma.js';
import { ENV } from '../config/env.js';
import bcrypt from 'bcryptjs';
import { SEED_SITE_SETTINGS } from './seedData.js';
import { DEFAULT_HOMEPAGE_CMS_CONFIG } from '../../../src/data/defaultHomepageCMS.js';

export async function runSeed() {
  console.log('🌱 Starting Yadman Clean Database Seeding (Admin & Foundation Only)...');

  // 1. Create / Upsert Admin User
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@yadman.ir';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeThisSuperAdminPassword123!';
  const adminPhone = process.env.ADMIN_DEFAULT_PHONE || '09121112233';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      name: 'مدیریت ارشد یادمان',
      phone: adminPhone,
    },
    create: {
      email: adminEmail,
      phone: adminPhone,
      name: 'مدیریت ارشد یادمان',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      companyName: 'یادمان گیفت',
    },
  });

  console.log(`✅ Admin user configured: ${adminEmail}`);

  // 2. Seed Clean Homepage CMS & Site Settings
  const cleanHomepageCMS = {
    ...DEFAULT_HOMEPAGE_CMS_CONFIG,
    banners: [],
  };

  await prisma.homepageCMS.upsert({
    where: { id: 'default' },
    update: {
      config: JSON.stringify(cleanHomepageCMS),
    },
    create: {
      id: 'default',
      config: JSON.stringify(cleanHomepageCMS),
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {
      config: JSON.stringify(SEED_SITE_SETTINGS),
    },
    create: {
      id: 'default',
      config: JSON.stringify(SEED_SITE_SETTINGS),
    },
  });

  console.log('✅ Initialized clean Homepage CMS & Site Settings');
  console.log('🎉 Yadman Clean Seeding Completed (No demo content created)!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .catch((e) => {
      console.error('❌ Seeding Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

