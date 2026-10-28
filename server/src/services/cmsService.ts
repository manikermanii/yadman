import { initialStoreData } from '../utils/initialStoreData.js';
import { prisma, isDbConnected } from '../config/database.js';

let inMemoryHomepageCMS = JSON.parse(JSON.stringify(initialStoreData.homepageCMS));
let inMemorySiteSettings = JSON.parse(JSON.stringify(initialStoreData.siteSettings));

export class CmsService {
  async getHomepageCMS() {
    if (isDbConnected()) {
      const record = await prisma.homepageCMS.findUnique({ where: { id: 'default' } });
      if (record && record.config) {
        try {
          return typeof record.config === 'string' ? JSON.parse(record.config) : record.config;
        } catch {
          return record.config;
        }
      }
    }
    return inMemoryHomepageCMS;
  }

  async updateHomepageCMS(config: any) {
    if (isDbConnected()) {
      const existing = await this.getHomepageCMS();
      const merged = { ...existing, ...config };
      await prisma.homepageCMS.upsert({
        where: { id: 'default' },
        update: { config: JSON.stringify(merged) },
        create: { id: 'default', config: JSON.stringify(merged) },
      });
      inMemoryHomepageCMS = merged;
      return merged;
    }
    inMemoryHomepageCMS = {
      ...inMemoryHomepageCMS,
      ...config,
    };
    return inMemoryHomepageCMS;
  }

  async resetHomepageCMS() {
    const defaults = JSON.parse(JSON.stringify(initialStoreData.homepageCMS));
    if (isDbConnected()) {
      await prisma.homepageCMS.upsert({
        where: { id: 'default' },
        update: { config: JSON.stringify(defaults) },
        create: { id: 'default', config: JSON.stringify(defaults) },
      });
    }
    inMemoryHomepageCMS = defaults;
    return inMemoryHomepageCMS;
  }

  async getSiteSettings() {
    if (isDbConnected()) {
      const record = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
      if (record && record.config) {
        try {
          return typeof record.config === 'string' ? JSON.parse(record.config) : record.config;
        } catch {
          return record.config;
        }
      }
    }
    return inMemorySiteSettings;
  }

  async updateSiteSettings(settings: any) {
    if (isDbConnected()) {
      const existing = await this.getSiteSettings();
      // Avoid storing duplicate nested homepage CMS payload inside site settings table
      const cleaned = { ...settings };
      delete cleaned.homepage;
      const merged = { ...existing, ...cleaned };
      delete merged.homepage;
      await prisma.siteSettings.upsert({
        where: { id: 'default' },
        update: { config: JSON.stringify(merged) },
        create: { id: 'default', config: JSON.stringify(merged) },
      });
      inMemorySiteSettings = merged;
      return merged;
    }
    const inMemCleaned = { ...settings };
    delete inMemCleaned.homepage;
    inMemorySiteSettings = {
      ...inMemorySiteSettings,
      ...inMemCleaned,
    };
    return inMemorySiteSettings;
  }

  async getSeoSettings() {
    const homepageCMS = await this.getHomepageCMS();
    const siteSettings = await this.getSiteSettings();
    return {
      homepageSeo: homepageCMS.seo,
      defaultSeo: {
        metaTitle: siteSettings.defaultMetaTitle,
        metaDescription: siteSettings.defaultMetaDescription,
        ogImage: siteSettings.defaultOgImage,
        canonicalBaseUrl: siteSettings.canonicalBaseUrl,
      },
    };
  }
}

export const cmsService = new CmsService();
