import React, { useState, useEffect, useCallback } from 'react';
import {
  StoreSettings,
  HomepageCMSConfig,
  Product,
  BlogPost,
  HeaderConfig,
  HeroConfig,
  ProductSectionConfig,
  PromotionalBannerItem,
  ConsultationSectionConfig,
  CorporateSectionConfig,
  BlogSectionConfig,
  FooterConfig,
  HomepageSeoConfig,
  SectionOrderConfig,
  GlobalSiteConfig,
} from '../../types';
import {
  DEFAULT_HOMEPAGE_CMS_CONFIG,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_HERO_CONFIG,
  DEFAULT_PRODUCTS_CONFIG,
  DEFAULT_BANNERS_CONFIG,
  DEFAULT_CONSULTATION_CONFIG,
  DEFAULT_CORPORATE_CONFIG,
  DEFAULT_BLOG_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_SEO_CONFIG,
  DEFAULT_SECTION_ORDER,
  DEFAULT_GLOBAL_CONFIG,
} from '../../data/defaultHomepageCMS';
import { PRODUCTS } from '../../data/products';
import { INITIAL_BLOG_POSTS } from '../../data/blogData';
import { api, recordDiagLog } from '../../services/api';

// Tabs
import { HomepageOverviewTab } from './homepage/HomepageOverviewTab';
import { HeaderSettingsTab } from './homepage/HeaderSettingsTab';
import { HeroSettingsTab } from './homepage/HeroSettingsTab';
import { ProductsSettingsTab } from './homepage/ProductsSettingsTab';
import { BannersSettingsTab } from './homepage/BannersSettingsTab';
import { ConsultationSettingsTab } from './homepage/ConsultationSettingsTab';
import { CorporateSettingsTab } from './homepage/CorporateSettingsTab';
import { BlogSettingsTab } from './homepage/BlogSettingsTab';
import { FooterSettingsTab } from './homepage/FooterSettingsTab';
import { GlobalSiteSettingsTab } from './homepage/GlobalSiteSettingsTab';
import { HomepageLivePreviewModal } from './homepage/HomepageLivePreviewModal';

import {
  Layers,
  Layout,
  Sparkles,
  ShoppingBag,
  Flag,
  Headphones,
  Building2,
  BookOpen,
  LayoutTemplate,
  Globe,
  Save,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface AdminHomepageSettingsProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void | Promise<void>;
  onExitAdmin?: () => void;
  products?: Product[];
  blogPosts?: BlogPost[];
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  onRefresh?: () => void | Promise<void>;
}

export type CMSActiveTab =
  | 'overview'
  | 'header'
  | 'hero'
  | 'products'
  | 'banners'
  | 'consultation'
  | 'corporate'
  | 'blog'
  | 'footer'
  | 'global';

interface TabItem {
  id: CMSActiveTab;
  label: string;
  badge?: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}

const CMS_TABS: TabItem[] = [
  {
    id: 'overview',
    label: 'چیدمان و وضعیت بخش‌ها',
    icon: Layers,
    description: 'ترتیب نمایش و فعال/مخفی‌سازی بخش‌ها',
  },
  {
    id: 'header',
    label: 'هدر و منوی ناوبری',
    icon: Layout,
    description: 'لوگو، نام برند، نوار اعلان و لینک‌های منو',
  },
  {
    id: 'hero',
    label: 'بخش آغازین (Hero)',
    icon: Sparkles,
    description: 'تیترها، تصویر اصلی، دکمه‌ها و مزایای ۴ گانه',
  },
  {
    id: 'products',
    label: 'ویترین پک‌های هدیه',
    icon: ShoppingBag,
    description: 'عناوین، فیلترها و انتخاب پک‌های شاخص',
  },
  {
    id: 'banners',
    label: 'بنرهای تبلیغاتی',
    icon: Flag,
    description: 'اطلاعیه‌ها، تخفیف‌های فصلی و کمپین‌ها',
  },
  {
    id: 'consultation',
    label: 'مشاوره انتخاب هدیه',
    icon: Headphones,
    description: 'تیترها، دکمه‌ها و چک‌لیست خدمات',
  },
  {
    id: 'corporate',
    label: 'هدایای سازمانی (B2B)',
    icon: Building2,
    description: 'ویژگی‌ها، جدول تخفیف عمده و راه‌های ارتباط',
  },
  {
    id: 'blog',
    label: 'مجله و مقالات',
    icon: BookOpen,
    description: 'عناوین و انتخاب مقالات برگزیده',
  },
  {
    id: 'footer',
    label: 'فوتر و شبکه‌ها',
    icon: LayoutTemplate,
    description: 'ضمانت‌ها، لینک‌های سریع و اطلاعات تماس',
  },
  {
    id: 'global',
    label: 'تنظیمات برند و ظاهر',
    icon: Globe,
    description: 'نام برند، شعار، رنگ‌های سازمانی و نشانی',
  },
];

export const AdminHomepageSettings: React.FC<AdminHomepageSettingsProps> = ({
  settings,
  onSaveSettings,
  onExitAdmin,
  products = PRODUCTS,
  blogPosts = INITIAL_BLOG_POSTS,
  isLoading: propIsLoading = false,
  isSaving: propIsSaving = false,
  error: propError = null,
  onRefresh,
}) => {
  // Initialize full draft homepage config
  const [draftHomepage, setDraftHomepage] = useState<HomepageCMSConfig>(() => {
    return {
      ...DEFAULT_HOMEPAGE_CMS_CONFIG,
      ...(settings.homepage || {}),
      sectionOrder: settings.homepage?.sectionOrder || DEFAULT_SECTION_ORDER,
      header: {
        ...DEFAULT_HEADER_CONFIG,
        ...(settings.homepage?.header || {}),
      },
      hero: {
        ...DEFAULT_HERO_CONFIG,
        heroImage: settings.homepage?.hero?.heroImage || settings.heroImage || DEFAULT_HERO_CONFIG.heroImage,
        ...(settings.homepage?.hero || {}),
      },
      products: {
        ...DEFAULT_PRODUCTS_CONFIG,
        ...(settings.homepage?.products || {}),
      },
      banners: settings.homepage?.banners || DEFAULT_BANNERS_CONFIG,
      consultation: {
        ...DEFAULT_CONSULTATION_CONFIG,
        ...(settings.homepage?.consultation || {}),
      },
      corporate: {
        ...DEFAULT_CORPORATE_CONFIG,
        ...(settings.homepage?.corporate || {}),
      },
      blog: {
        ...DEFAULT_BLOG_CONFIG,
        ...(settings.homepage?.blog || {}),
      },
      footer: {
        ...DEFAULT_FOOTER_CONFIG,
        ...(settings.homepage?.footer || {}),
      },
      seo: {
        ...DEFAULT_SEO_CONFIG,
        ...(settings.homepage?.seo || {}),
      },
      global: {
        ...DEFAULT_GLOBAL_CONFIG,
        ...(settings.homepage?.global || {}),
      },
    };
  });

  const [activeTab, setActiveTab] = useState<CMSActiveTab>('overview');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [internalSaving, setInternalSaving] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isSaving = propIsSaving || internalSaving;
  const isLoading = propIsLoading || internalLoading;
  const activeError = propError || internalError;

  // Load latest CMS data directly from PostgreSQL
  const loadHomepageData = useCallback(async () => {
    setInternalLoading(true);
    setInternalError(null);
    try {
      const [homepageRes] = await Promise.all([
        api.cms.getHomepage(),
        onRefresh ? onRefresh() : Promise.resolve(),
      ]);
      if (homepageRes) {
        setDraftHomepage((prev) => ({
          ...DEFAULT_HOMEPAGE_CMS_CONFIG,
          ...prev,
          ...homepageRes,
          sectionOrder: homepageRes.sectionOrder || prev.sectionOrder || DEFAULT_SECTION_ORDER,
          header: { ...DEFAULT_HEADER_CONFIG, ...(homepageRes.header || {}) },
          hero: { ...DEFAULT_HERO_CONFIG, ...(homepageRes.hero || {}) },
          products: { ...DEFAULT_PRODUCTS_CONFIG, ...(homepageRes.products || {}) },
          banners: homepageRes.banners || prev.banners || DEFAULT_BANNERS_CONFIG,
          consultation: { ...DEFAULT_CONSULTATION_CONFIG, ...(homepageRes.consultation || {}) },
          corporate: { ...DEFAULT_CORPORATE_CONFIG, ...(homepageRes.corporate || {}) },
          blog: { ...DEFAULT_BLOG_CONFIG, ...(homepageRes.blog || {}) },
          footer: { ...DEFAULT_FOOTER_CONFIG, ...(homepageRes.footer || {}) },
          seo: { ...DEFAULT_SEO_CONFIG, ...(homepageRes.seo || {}) },
          global: { ...DEFAULT_GLOBAL_CONFIG, ...(homepageRes.global || {}) },
        }));
        setHasUnsavedChanges(false);
      }
    } catch (err: any) {
      console.error('Failed to load homepage CMS from PostgreSQL:', err);
      setInternalError(err?.message || 'خطا در بارگذاری اطلاعات صفحه اصلی از پایگاه‌داده سرور');
    } finally {
      setInternalLoading(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    loadHomepageData();
  }, [loadHomepageData]);

  // Sync draft if external settings change unexpectedly
  useEffect(() => {
    if (settings.homepage) {
      setDraftHomepage((prev) => ({
        ...prev,
        ...settings.homepage,
      }));
    }
  }, [settings.homepage]);

  // Track modification
  const handleUpdateDraft = (updater: (prev: HomepageCMSConfig) => HomepageCMSConfig) => {
    setDraftHomepage((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // 1. Save All CMS Settings directly to PostgreSQL
  const handleSaveAll = async () => {
    recordDiagLog('handleSaveAll:start', { isSaving, isLoading, propIsSaving, internalSaving, hasOnSaveSettings: !!onSaveSettings });
    if (isSaving || isLoading) {
      recordDiagLog('handleSaveAll:blocked_by_guard', { isSaving, isLoading });
      return;
    }
    setInternalSaving(true);
    setFeedbackMessage(null);
    setInternalError(null);

    try {
      const updatedStoreSettings: StoreSettings = {
        ...settings,
        storeName: draftHomepage.global?.websiteName || draftHomepage.header?.websiteName || settings.storeName,
        storeNameFa: `${draftHomepage.global?.websiteName || 'یادمان'} | پک‌های هدیه و هدایای سازمانی`,
        tagline: draftHomepage.global?.tagline || settings.tagline,
        announcementText: draftHomepage.header?.announcementText ?? settings.announcementText,
        supportPhone: draftHomepage.footer?.phone || draftHomepage.global?.phone || settings.supportPhone,
        corporatePhone: draftHomepage.corporate?.contactPhone || settings.corporatePhone,
        corporateEmail: draftHomepage.corporate?.contactEmail || settings.corporateEmail,
        heroImage: draftHomepage.hero?.heroImage || settings.heroImage,
        defaultMetaTitle: draftHomepage.seo?.metaTitle || settings.defaultMetaTitle,
        defaultMetaDescription: draftHomepage.seo?.metaDescription || settings.defaultMetaDescription,
        defaultOgImage: draftHomepage.seo?.ogImage || settings.defaultOgImage,
        canonicalBaseUrl: draftHomepage.seo?.canonicalUrl || settings.canonicalBaseUrl,
        homepage: draftHomepage,
      };

      if (onSaveSettings) {
        await onSaveSettings(updatedStoreSettings);
      } else {
        await Promise.all([
          api.cms.updateHomepageAdmin(draftHomepage),
          api.cms.updateSettingsAdmin(updatedStoreSettings),
        ]);
      }

      setHasUnsavedChanges(false);
      setFeedbackMessage({
        text: 'تمامی تنظیمات صفحه اصلی با موفقیت در پایگاه‌داده ذخیره و در وب‌سایت اعمال شد.',
        type: 'success',
      });

      setTimeout(() => {
        setFeedbackMessage(null);
      }, 4000);
    } catch (e: any) {
      recordDiagLog('handleSaveAll:catch', { message: e?.message, code: e?.code, status: e?.status });
      console.error('Failed to save homepage CMS to PostgreSQL:', e);
      const errorMessage = e?.message || 'خطا در برقراری ارتباط با سرور و ذخیره‌سازی تنظیمات.';
      setInternalError(errorMessage);
      setFeedbackMessage({
        text: errorMessage,
        type: 'error',
      });
    } finally {
      recordDiagLog('handleSaveAll:finally_reset_internalSaving');
      setInternalSaving(false);
    }
  };

  // 2. Reset Current Tab Section to Default
  const handleResetCurrentSection = () => {
    const tabName = CMS_TABS.find((t) => t.id === activeTab)?.label || activeTab;
    if (!window.confirm(`آیا از بازگردانی تنظیمات «${tabName}» به مقادیر پیش‌فرض اطمینان دارید؟`)) {
      return;
    }

    handleUpdateDraft((prev) => {
      const updated = { ...prev };
      switch (activeTab) {
        case 'overview':
          updated.sectionOrder = DEFAULT_SECTION_ORDER;
          break;
        case 'header':
          updated.header = DEFAULT_HEADER_CONFIG;
          break;
        case 'hero':
          updated.hero = DEFAULT_HERO_CONFIG;
          break;
        case 'products':
          updated.products = DEFAULT_PRODUCTS_CONFIG;
          break;
        case 'banners':
          updated.banners = DEFAULT_BANNERS_CONFIG;
          break;
        case 'consultation':
          updated.consultation = DEFAULT_CONSULTATION_CONFIG;
          break;
        case 'corporate':
          updated.corporate = DEFAULT_CORPORATE_CONFIG;
          break;
        case 'blog':
          updated.blog = DEFAULT_BLOG_CONFIG;
          break;
        case 'footer':
          updated.footer = DEFAULT_FOOTER_CONFIG;
          break;
        case 'global':
          updated.global = DEFAULT_GLOBAL_CONFIG;
          break;
      }
      return updated;
    });

    setFeedbackMessage({
      text: `تنظیمات «${tabName}» به مقادیر پیش‌فرض بازگردانی شد. برای ثبت نهایی دکمه ذخیره تغییرات را بزنید.`,
      type: 'success',
    });
  };

  // 3. Reset Entire Homepage CMS to Default
  const handleResetEntireHomepage = () => {
    if (
      !window.confirm(
        'هشدار: آیا مطمئن هستید که می‌خواهید کل صفحه اصلی (تمامی ۱۱ بخش) را به تنظیمات پیش‌فرض کارخانه بازگردانید؟'
      )
    ) {
      return;
    }

    setDraftHomepage(DEFAULT_HOMEPAGE_CMS_CONFIG);
    setHasUnsavedChanges(true);
    setFeedbackMessage({
      text: 'کل صفحه اصلی به پیش‌فرض بازگردانی شد. برای ثبت نهایی روی «ذخیره تغییرات» کلیک کنید.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      
      {/* 1. Header Banner & Action Bar */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D4AF37]/20 text-[#0F4C3A] border border-[#D4AF37]/40">
              مدیریت محتوای صفحه اصلی (Homepage CMS)
            </span>
            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 animate-pulse">
                تغییرات ذخیره‌نشده
              </span>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-[#0F4C3A] mt-1">
            سامانه مدیریت جامع محتوای صفحه اصلی
          </h1>
          <p className="text-xs text-[#6A7873] mt-1">
            ویرایش کامل متن‌ها، تصاویر، بنرها، دکمه‌ها، رنگ‌ها و ترتیب نمایش بخش‌های مختلف وب‌سایت عمومی بدون نیاز به کدنویسی.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadHomepageData}
            disabled={isLoading || isSaving}
            className="bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#0F4C3A] border border-[#E0D8C8] px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="بارگذاری مجدد اطلاعات از سرور"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>

          {/* Live Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex-1 sm:flex-initial bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#0F4C3A] border border-[#E0D8C8] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <Play className="w-4 h-4 text-[#D4AF37]" />
            <span>پیش‌نمایش زنده</span>
          </button>

          {/* Reset Current Section */}
          <button
            type="button"
            onClick={handleResetCurrentSection}
            className="bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="بازگردانی بخش فعال به پیش‌فرض"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازگردانی بخش</span>
          </button>

          {/* Save All Changes Button */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || isLoading}
            className="flex-1 sm:flex-initial bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                <span>در حال ذخیره در سرور...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#D4AF37]" />
                <span>ذخیره تغییرات صفحه اصلی</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Server Error Alert */}
      {activeError && (
        <div className="p-4 rounded-2xl border bg-red-50 text-red-800 border-red-200 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{activeError}</span>
          </div>
          <button
            type="button"
            onClick={loadHomepageData}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs transition cursor-pointer"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 2. Main CMS Layout: Navigation Tabs (Right) + Active Editor (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Sub-Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white p-3.5 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-1 sticky top-20">
          <div className="px-3 py-2 border-b border-[#F4EFE6] mb-1">
            <span className="text-[11px] font-extrabold text-[#6A7873] block uppercase tracking-wider">
              بخش‌های مدیریت صفحه اصلی:
            </span>
          </div>

          <div className="space-y-1">
            {CMS_TABS.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-right p-3 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer ${
                    isActive
                      ? 'bg-[#0F4C3A] text-white shadow-xs'
                      : 'hover:bg-[#FAF8F5] text-[#2C3B37]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-[#D4AF37]' : 'bg-[#FAF8F5] text-[#0F4C3A]'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs block truncate">{tab.label}</span>
                      <span
                        className={`text-[10px] block truncate ${
                          isActive ? 'text-white/70' : 'text-[#8C8375]'
                        }`}
                      >
                        {tab.description}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-[#D4AF37] rotate-180' : 'text-gray-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Full Reset Link */}
          <div className="pt-3 border-t border-[#F4EFE6] mt-2 px-2">
            <button
              type="button"
              onClick={handleResetEntireHomepage}
              className="w-full text-center py-2 text-[11px] font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition cursor-pointer"
            >
              بازگردانی کل صفحه به پیش‌فرض کارخانه
            </button>
          </div>
        </div>

        {/* Active Tab Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: OVERVIEW & ORDER */}
          {activeTab === 'overview' && (
            <HomepageOverviewTab
              config={draftHomepage}
              onChangeSectionOrder={(newOrder) =>
                handleUpdateDraft((prev) => ({ ...prev, sectionOrder: newOrder }))
              }
              onNavigateToTab={(targetTabId) => setActiveTab(targetTabId as CMSActiveTab)}
              onOpenLivePreview={() => setIsPreviewOpen(true)}
            />
          )}

          {/* TAB 2: HEADER */}
          {activeTab === 'header' && (
            <HeaderSettingsTab
              header={draftHomepage.header}
              onChange={(updatedHeader) =>
                handleUpdateDraft((prev) => ({ ...prev, header: updatedHeader }))
              }
            />
          )}

          {/* TAB 3: HERO */}
          {activeTab === 'hero' && (
            <HeroSettingsTab
              hero={draftHomepage.hero}
              onChange={(updatedHero) =>
                handleUpdateDraft((prev) => ({ ...prev, hero: updatedHero }))
              }
            />
          )}

          {/* TAB 4: PRODUCTS SHOWCASE */}
          {activeTab === 'products' && (
            <ProductsSettingsTab
              productsConfig={draftHomepage.products}
              allProducts={products}
              onChange={(updatedProducts) =>
                handleUpdateDraft((prev) => ({ ...prev, products: updatedProducts }))
              }
            />
          )}

          {/* TAB 5: BANNERS */}
          {activeTab === 'banners' && (
            <BannersSettingsTab
              banners={draftHomepage.banners}
              onChange={(updatedBanners) =>
                handleUpdateDraft((prev) => ({ ...prev, banners: updatedBanners }))
              }
            />
          )}

          {/* TAB 6: CONSULTATION */}
          {activeTab === 'consultation' && (
            <ConsultationSettingsTab
              consultation={draftHomepage.consultation}
              onChange={(updatedConsultation) =>
                handleUpdateDraft((prev) => ({ ...prev, consultation: updatedConsultation }))
              }
            />
          )}

          {/* TAB 7: CORPORATE */}
          {activeTab === 'corporate' && (
            <CorporateSettingsTab
              corporate={draftHomepage.corporate}
              onChange={(updatedCorporate) =>
                handleUpdateDraft((prev) => ({ ...prev, corporate: updatedCorporate }))
              }
            />
          )}

          {/* TAB 8: BLOG */}
          {activeTab === 'blog' && (
            <BlogSettingsTab
              blogConfig={draftHomepage.blog}
              allPosts={blogPosts}
              onChange={(updatedBlog) =>
                handleUpdateDraft((prev) => ({ ...prev, blog: updatedBlog }))
              }
            />
          )}

          {/* TAB 9: FOOTER */}
          {activeTab === 'footer' && (
            <FooterSettingsTab
              footer={draftHomepage.footer}
              onChange={(updatedFooter) =>
                handleUpdateDraft((prev) => ({ ...prev, footer: updatedFooter }))
              }
            />
          )}

          {/* TAB 10: GLOBAL BRAND SETTINGS */}
          {activeTab === 'global' && (
            <GlobalSiteSettingsTab
              globalConfig={draftHomepage.global}
              onChange={(updatedGlobal) =>
                handleUpdateDraft((prev) => ({ ...prev, global: updatedGlobal }))
              }
            />
          )}

          {/* Bottom Save Reminder Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-[#6A7873]">
              پس از اعمال ویرایش‌های خود در هر برگه، دکمه ذخیره را بزنید تا تغییرات مستقیماً در سایت زنده ثبت شوند.
            </span>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              className="w-full sm:w-auto bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-5 py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                  <span>در حال ذخیره در سرور...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>ذخیره تغییرات</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <HomepageLivePreviewModal
          config={draftHomepage}
          products={products}
          blogPosts={blogPosts}
          onClose={() => setIsPreviewOpen(false)}
          onSave={handleSaveAll}
        />
      )}
    </div>
  );
};
