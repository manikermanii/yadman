import React from 'react';
import {
  SectionOrderConfig,
  HomepageSectionType,
  HomepageCMSConfig,
} from '../../../types';
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit3,
  Layers,
  Sparkles,
  ShoppingBag,
  Flag,
  Headphones,
  Building2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';

interface HomepageOverviewTabProps {
  config: HomepageCMSConfig;
  onChangeSectionOrder: (newOrder: SectionOrderConfig[]) => void;
  onNavigateToTab: (tabId: string) => void;
  onOpenLivePreview: () => void;
}

const SECTION_ICONS: Record<HomepageSectionType, any> = {
  hero: Sparkles,
  product_showcase: ShoppingBag,
  banners: Flag,
  consultation: Headphones,
  corporate: Building2,
  blog: BookOpen,
};

const SECTION_TAB_MAPPING: Record<HomepageSectionType, string> = {
  hero: 'hero',
  product_showcase: 'products',
  banners: 'banners',
  consultation: 'consultation',
  corporate: 'corporate',
  blog: 'blog',
};

const SECTION_DESCRIPTIONS: Record<HomepageSectionType, string> = {
  hero: 'تیتر اصلی، تصویر معرفی، دکمه‌های اقدام سریع و مزایای برجسته ۴ گانه',
  product_showcase: 'ویترین و کارت‌های پک‌های هدیه، فیلترهای دسته‌بندی و دکمه ورود به کاتالوگ',
  banners: 'بنرهای اطلاع‌رسانی، تخفیف‌های ویژه سازمانی و اطلاعیه‌های پویا',
  consultation: 'بخش جذاب مشاوره هدیه شخصی و شرکتی با کارت پشتیبانی و چک‌لیست خدمات',
  corporate: 'بخش هدایای سازمانی B2B، جدول تخفیف‌های پلکانی و فرم استعلام سریع',
  blog: 'آخرین مقالات و راهنماهای انتخاب هدیه از مجله رسمی یادمان',
};

export const HomepageOverviewTab: React.FC<HomepageOverviewTabProps> = ({
  config,
  onChangeSectionOrder,
  onNavigateToTab,
  onOpenLivePreview,
}) => {
  const sections = config.sectionOrder || [];

  const handleToggleSection = (sectionId: HomepageSectionType) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    onChangeSectionOrder(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChangeSectionOrder(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChangeSectionOrder(updated);
  };

  const activeSectionsCount = sections.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Intro Card */}
      <div className="bg-gradient-to-l from-[#0F4C3A]/10 to-[#D4AF37]/10 p-5 rounded-3xl border border-[#0F4C3A]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#0F4C3A] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D4AF37]" />
            <span>مدیریت ساختار و چیدمان بخش‌های صفحه اصلی</span>
          </h2>
          <p className="text-xs text-[#4A5A55] mt-1">
            شما می‌توانید ترتیب نمایش بخش‌های صفحه اصلی را با دکمه‌های بالا و پایین تغییر دهید یا هر بخش را در صورت نیاز فعال یا مخفی کنید.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenLivePreview}
          className="shrink-0 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
        >
          <Play className="w-4 h-4 text-[#D4AF37]" />
          <span>پیش‌نمایش زنده صفحه اصلی</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-[#EAE6DF] shadow-2xs">
          <span className="text-[11px] text-[#6A7873] block">کل بخش‌های صفحه</span>
          <span className="text-lg font-extrabold text-[#0F4C3A]">{sections.length} بخش</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#EAE6DF] shadow-2xs">
          <span className="text-[11px] text-[#6A7873] block">بخش‌های فعال</span>
          <span className="text-lg font-extrabold text-emerald-700">{activeSectionsCount} فعال</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#EAE6DF] shadow-2xs">
          <span className="text-[11px] text-[#6A7873] block">بنرهای تبلیغاتی</span>
          <span className="text-lg font-extrabold text-[#D4AF37]">
            {config.banners?.filter((b) => b.visible).length || 0} بنر
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#EAE6DF] shadow-2xs">
          <span className="text-[11px] text-[#6A7873] block">وضعیت هدر و فوتر</span>
          <span className="text-lg font-extrabold text-[#0F4C3A]">شخصی‌سازی‌شده</span>
        </div>
      </div>

      {/* Sections Table / Reorder List */}
      <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#F4EFE6] flex items-center justify-between">
          <span className="font-extrabold text-sm text-[#0F4C3A]">
            ترتیب و وضعیت نمایش بخش‌ها (از بالا به پایین در وب‌سایت)
          </span>
          <span className="text-[11px] text-[#8C8375]">
            تغییر موقعیت با فلش‌های بالا و پایین
          </span>
        </div>

        <div className="divide-y divide-[#F4EFE6]">
          {sections.map((section, idx) => {
            const Icon = SECTION_ICONS[section.id] || Layers;
            const targetTab = SECTION_TAB_MAPPING[section.id];
            const description = SECTION_DESCRIPTIONS[section.id];

            return (
              <div
                key={section.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                  section.enabled ? 'bg-white' : 'bg-gray-50/70 opacity-75'
                }`}
              >
                {/* Left: Info */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E0D8C8] text-xs font-bold flex items-center justify-center text-[#0F4C3A] shrink-0">
                    {idx + 1}
                  </div>

                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      section.enabled
                        ? 'bg-[#0F4C3A]/10 text-[#0F4C3A]'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[#1C2826]">
                        {section.label}
                      </h3>
                      {section.enabled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          فعال در صفحه
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">
                          مخفی
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6A7873]">{description}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    title="انتقال به بالا"
                    className="p-2 rounded-xl border border-[#EAE6DF] hover:bg-[#F4EFE6] text-[#0F4C3A] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === sections.length - 1}
                    title="انتقال به پایین"
                    className="p-2 rounded-xl border border-[#EAE6DF] hover:bg-[#F4EFE6] text-[#0F4C3A] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() => handleToggleSection(section.id)}
                    title={section.enabled ? 'مخفی کردن بخش' : 'فعال کردن بخش'}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      section.enabled
                        ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {section.enabled ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>مخفی‌سازی</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>فعال‌سازی</span>
                      </>
                    )}
                  </button>

                  {/* Edit Section Button */}
                  <button
                    type="button"
                    onClick={() => onNavigateToTab(targetTab)}
                    className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#0F4C3A] hover:text-white border border-[#E0D8C8] text-[#0F4C3A] rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ویرایش محتوا</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
