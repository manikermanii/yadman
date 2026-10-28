import React from 'react';
import { GlobalSiteConfig } from '../../../types';
import { ImageUploadField } from '../../common/ImageUploadField';
import {
  Globe,
  Palette,
  Type,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Send,
  Sparkles,
  Info,
} from 'lucide-react';

interface GlobalSiteSettingsTabProps {
  globalConfig?: GlobalSiteConfig;
  onChange: (updated: GlobalSiteConfig) => void;
}

export const GlobalSiteSettingsTab: React.FC<GlobalSiteSettingsTabProps> = ({
  globalConfig,
  onChange,
}) => {
  const current: GlobalSiteConfig = globalConfig || {
    websiteName: 'یادمان',
    websiteNameEn: 'Yadman Luxury Gifts',
    tagline: 'انتخابی برای هدیه‌های ماندگار',
    logoImage: '',
    faviconImage: '',
    primaryColor: '#0F4C3A',
    secondaryColor: '#D4AF37',
    mainFont: 'Vazirmatn',
    phone: '۰۲۱-۸۸۸۸۰۰۰۰',
    email: 'info@yadman.ir',
    address: 'تهران، خیابان فرشته، مجتمع تشریفاتی یادمان، پلاک ۱۲',
    instagram: 'yadman_gifts',
    telegram: 'yadman_gifts_official',
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Brand Names & Tagline */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <Globe className="w-4 h-4 text-[#D4AF37]" />
          <span>نام تجاری و شعار برند یادمان</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              نام رسمی برند (فارسی):
            </label>
            <input
              type="text"
              value={current.websiteName || ''}
              onChange={(e) => onChange({ ...current, websiteName: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs font-extrabold text-[#0F4C3A]"
              placeholder="مثال: یادمان"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              نام برند به انگلیسی:
            </label>
            <input
              type="text"
              value={current.websiteNameEn || ''}
              onChange={(e) => onChange({ ...current, websiteNameEn: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs font-mono text-left"
              placeholder="Yadman Luxury Gifts"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            شعار تبلیغاتی برند (Tagline):
          </label>
          <input
            type="text"
            value={current.tagline || ''}
            onChange={(e) => onChange({ ...current, tagline: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs"
            placeholder="مثال: انتخابی برای هدیه‌های ماندگار"
          />
        </div>
      </div>

      {/* 2. Brand Colors & Typography */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <Palette className="w-4 h-4 text-[#D4AF37]" />
          <span>پالت رنگ سازمانی و تایپوگرافی اصیل</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E0D8C8] space-y-2">
            <label className="block text-xs font-bold text-[#0F4C3A]">
              رنگ اصلی (Primary Color):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={current.primaryColor || '#0F4C3A'}
                onChange={(e) => onChange({ ...current, primaryColor: e.target.value })}
                className="w-10 h-10 rounded-xl border border-[#E0D8C8] cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={current.primaryColor || '#0F4C3A'}
                onChange={(e) => onChange({ ...current, primaryColor: e.target.value })}
                className="w-28 bg-white p-2 rounded-lg border border-[#E0D8C8] text-xs font-mono text-center"
                dir="ltr"
              />
              <span className="text-[11px] text-[#6A7873]">سبز زمردی یادمان</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E0D8C8] space-y-2">
            <label className="block text-xs font-bold text-[#0F4C3A]">
              رنگ ثانویه / طلایی (Accent Gold):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={current.secondaryColor || '#D4AF37'}
                onChange={(e) => onChange({ ...current, secondaryColor: e.target.value })}
                className="w-10 h-10 rounded-xl border border-[#E0D8C8] cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={current.secondaryColor || '#D4AF37'}
                onChange={(e) => onChange({ ...current, secondaryColor: e.target.value })}
                className="w-28 bg-white p-2 rounded-lg border border-[#E0D8C8] text-xs font-mono text-center"
                dir="ltr"
              />
              <span className="text-[11px] text-[#6A7873]">طلایی متالیک و نفیس</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-[#0F4C3A]/5 rounded-2xl border border-[#0F4C3A]/15 text-xs text-[#0F4C3A] flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#D4AF37]" />
          <span>
            تایپوگرافی سایت بر اساس فونت اصیل و فاخر «وزیرمتن» (Vazirmatn) استاندارد تنظیم شده است.
          </span>
        </div>
      </div>

      {/* 3. Master Contact Info */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <Phone className="w-4 h-4 text-[#D4AF37]" />
          <span>اطلاعات تماس و نشانی مرکزی</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              تلفن پشتیبانی و سفارشات:
            </label>
            <input
              type="text"
              value={current.phone || ''}
              onChange={(e) => onChange({ ...current, phone: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              ایمیل رسمی پشتیبانی:
            </label>
            <input
              type="email"
              value={current.email || ''}
              onChange={(e) => onChange({ ...current, email: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-mono text-left"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            نشانی دفتر مرکزی و شوروم:
          </label>
          <input
            type="text"
            value={current.address || ''}
            onChange={(e) => onChange({ ...current, address: e.target.value })}
            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
          />
        </div>
      </div>

    </div>
  );
};
