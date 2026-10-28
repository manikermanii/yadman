import React from 'react';
import { CorporateSectionConfig, CorporateFeatureItem, CorporateDiscountTier } from '../../../types';
import { IconPicker, renderLucideIcon } from './IconSelector';
import {
  Building2,
  Plus,
  Trash2,
  Award,
  Layers,
  Phone,
  Mail,
  Clock,
  Table,
} from 'lucide-react';

interface CorporateSettingsTabProps {
  corporate: CorporateSectionConfig;
  onChange: (updated: CorporateSectionConfig) => void;
}

export const CorporateSettingsTab: React.FC<CorporateSettingsTabProps> = ({
  corporate,
  onChange,
}) => {
  const handleUpdateFeature = (index: number, partial: Partial<CorporateFeatureItem>) => {
    const updated = [...(corporate.features || [])];
    updated[index] = { ...updated[index], ...partial };
    onChange({ ...corporate, features: updated });
  };

  const handleAddTier = () => {
    const newTier: CorporateDiscountTier = {
      id: `tier-${Date.now().toString().slice(-4)}`,
      quantityRange: 'سفارش‌های جدید',
      discountText: '۱۰٪ تخفیف',
    };
    onChange({
      ...corporate,
      discountTiers: [...(corporate.discountTiers || []), newTier],
    });
  };

  const handleUpdateTier = (index: number, partial: Partial<CorporateDiscountTier>) => {
    const updated = [...(corporate.discountTiers || [])];
    updated[index] = { ...updated[index], ...partial };
    onChange({ ...corporate, discountTiers: updated });
  };

  const handleDeleteTier = (index: number) => {
    const updated = (corporate.discountTiers || []).filter((_, i) => i !== index);
    onChange({ ...corporate, discountTiers: updated });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Headings & Visibility */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#D4AF37]" />
            <span>عناوین و تنظیمات بخش هدایای سازمانی (B2B)</span>
          </h2>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#0F4C3A]">
              <span>نمایش فرم درخواست:</span>
              <input
                type="checkbox"
                checked={corporate.showForm !== false}
                onChange={(e) => onChange({ ...corporate, showForm: e.target.checked })}
                className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#0F4C3A]">
              <span>نمایش کل بخش:</span>
              <input
                type="checkbox"
                checked={corporate.visible !== false}
                onChange={(e) => onChange({ ...corporate, visible: e.target.checked })}
                className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              برچسب کوچک بالای تیتر:
            </label>
            <input
              type="text"
              value={corporate.badgeText || ''}
              onChange={(e) => onChange({ ...corporate, badgeText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs"
              placeholder="مثال: هدایای سازمانی"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              تیتر اصلی بخش سازمانی:
            </label>
            <input
              type="text"
              value={corporate.title || ''}
              onChange={(e) => onChange({ ...corporate, title: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs font-extrabold text-[#0F4C3A]"
              placeholder="هدایای سازمانی و مدیریتی با لوگوی اختصاصی شما"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            توضیحات معرفی خدمات سازمانی:
          </label>
          <textarea
            rows={2}
            value={corporate.description || ''}
            onChange={(e) => onChange({ ...corporate, description: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs leading-relaxed"
          />
        </div>
      </div>

      {/* 2. Three Feature Cards */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <Award className="w-4 h-4 text-[#D4AF37]" />
          <span>کارت‌های سه‌گانه ویژگی‌های سازمانی (برندینگ، تخفیف، نمونه)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(corporate.features || []).map((feat, fIdx) => (
            <div key={feat.id || fIdx} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E0D8C8] space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#E0D8C8] flex items-center justify-center text-[#0F4C3A]">
                  {renderLucideIcon(feat.iconName, 'w-4 h-4')}
                </div>
                <span className="text-xs font-bold text-[#0F4C3A]">ویژگی {fIdx + 1}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">عنوان:</label>
                <input
                  type="text"
                  value={feat.title}
                  onChange={(e) => handleUpdateFeature(fIdx, { title: e.target.value })}
                  className="w-full bg-white p-2 rounded-lg border border-[#E0D8C8] text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">توضیحات:</label>
                <textarea
                  rows={2}
                  value={feat.description}
                  onChange={(e) => handleUpdateFeature(fIdx, { description: e.target.value })}
                  className="w-full bg-white p-2 rounded-lg border border-[#E0D8C8] text-xs leading-relaxed"
                />
              </div>

              <IconPicker
                value={feat.iconName}
                onChange={(iconName) => handleUpdateFeature(fIdx, { iconName })}
                label="آیکون:"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Discount Tiers Table */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
              <Table className="w-4 h-4 text-[#D4AF37]" />
              <span>جدول تخفیف‌های پلکانی سفارش‌های عمده و سازمانی</span>
            </h2>
            <p className="text-[11px] text-[#6A7873] mt-0.5">
              تعریف بازه‌های تعدادی و میزان درصد تخفیف یا هدایای ویژه سازمانی
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddTier}
            className="px-3 py-1.5 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-[#0B3C2E] transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن پله تخفیف</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">عنوان جدول:</label>
          <input
            type="text"
            value={corporate.discountTableTitle || ''}
            onChange={(e) => onChange({ ...corporate, discountTableTitle: e.target.value })}
            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
          />
        </div>

        <div className="space-y-2">
          {(corporate.discountTiers || []).map((tier, tIdx) => (
            <div key={tier.id || tIdx} className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E0D8C8]">
              <div className="w-6 h-6 rounded-lg bg-white border border-[#E0D8C8] flex items-center justify-center text-xs font-bold text-[#0F4C3A]">
                {tIdx + 1}
              </div>

              <input
                type="text"
                value={tier.quantityRange}
                onChange={(e) => handleUpdateTier(tIdx, { quantityRange: e.target.value })}
                className="flex-1 bg-white p-2 rounded-lg border border-[#E0D8C8] text-xs font-bold"
                placeholder="بازه تعداد (مثال: سفارش‌های ۲۰ تا ۵۰ عدد)"
              />

              <input
                type="text"
                value={tier.discountText}
                onChange={(e) => handleUpdateTier(tIdx, { discountText: e.target.value })}
                className="flex-1 bg-white p-2 rounded-lg border border-[#E0D8C8] text-xs text-emerald-800 font-bold"
                placeholder="تخفیف (مثال: ۵٪ تخفیف + پلاک اختصاصی)"
              />

              <button
                type="button"
                onClick={() => handleDeleteTier(tIdx)}
                className="p-2 text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Corporate Contact Info Block */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <Phone className="w-4 h-4 text-[#D4AF37]" />
          <span>اطلاعات تماس مستقیم واحد سازمانی</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              عنوان بخش تماس سازمانی:
            </label>
            <input
              type="text"
              value={corporate.contactTitle || ''}
              onChange={(e) => onChange({ ...corporate, contactTitle: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              شماره تلفن سازمانی:
            </label>
            <input
              type="text"
              value={corporate.contactPhone || ''}
              onChange={(e) => onChange({ ...corporate, contactPhone: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              ساعات پاسخگویی:
            </label>
            <input
              type="text"
              value={corporate.contactHours || ''}
              onChange={(e) => onChange({ ...corporate, contactHours: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              ایمیل بخش سازمانی:
            </label>
            <input
              type="email"
              value={corporate.contactEmail || ''}
              onChange={(e) => onChange({ ...corporate, contactEmail: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-mono text-left"
              dir="ltr"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
