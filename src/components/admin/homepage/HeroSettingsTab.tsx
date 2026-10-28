import React, { useState } from 'react';
import { HeroConfig, HeroBenefitItem } from '../../../types';
import { ImageUploadField } from '../../common/ImageUploadField';
import { IconPicker, renderLucideIcon } from './IconSelector';
import { HERO_BANNER_IMAGE } from '../../../data/products';
import {
  Sparkles,
  Type,
  Image as ImageIcon,
  MousePointer,
  Award,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface HeroSettingsTabProps {
  hero: HeroConfig;
  onChange: (updated: HeroConfig) => void;
}

const ACTION_OPTIONS = [
  { id: 'catalog', label: 'ورود به کاتالوگ پک‌های هدیه' },
  { id: 'corporate', label: 'صفحه هدایای سازمانی (B2B)' },
  { id: 'builder', label: 'سازنده پک اختصاصی (Custom Builder)' },
  { id: 'consultation', label: 'صفحه مشاوره انتخاب هدیه' },
  { id: 'ai', label: 'مشاور هوشمند هدیه (AI Concierge)' },
  { id: 'blog', label: 'مجله و مقالات یادمان' },
];

export const HeroSettingsTab: React.FC<HeroSettingsTabProps> = ({ hero, onChange }) => {
  const [editingBenefitId, setEditingBenefitId] = useState<string | null>(null);

  // Add new benefit item
  const handleAddBenefit = () => {
    const newId = `benefit-${Date.now().toString().slice(-4)}`;
    const newBenefit: HeroBenefitItem = {
      id: newId,
      title: 'مزیت جدید',
      description: 'توضیح کوتاه درباره این خدمت یا مزیت رقابتی',
      iconName: 'Award',
      visible: true,
    };
    onChange({
      ...hero,
      benefits: [...(hero.benefits || []), newBenefit],
    });
    setEditingBenefitId(newId);
  };

  const handleUpdateBenefit = (id: string, partial: Partial<HeroBenefitItem>) => {
    const updated = (hero.benefits || []).map((b) =>
      b.id === id ? { ...b, ...partial } : b
    );
    onChange({ ...hero, benefits: updated });
  };

  const handleDeleteBenefit = (id: string) => {
    if ((hero.benefits || []).length <= 1) {
      alert('حداقل یک مزیت باید وجود داشته باشد.');
      return;
    }
    const updated = (hero.benefits || []).filter((b) => b.id !== id);
    onChange({ ...hero, benefits: updated });
  };

  const handleMoveBenefit = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const items = [...(hero.benefits || [])];
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    onChange({ ...hero, benefits: items });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Main Titles & Text Content */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <Type className="w-4 h-4 text-[#D4AF37]" />
          <span>تیترها و متون بخش آغازین (Hero Headlines)</span>
        </h2>

        {/* Small Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#0F4C3A]">
                نشان / برچسب بالای تیتر (Small Badge):
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-[11px] text-[#6A7873]">
                <input
                  type="checkbox"
                  checked={hero.showBadge !== false}
                  onChange={(e) => onChange({ ...hero, showBadge: e.target.checked })}
                  className="w-3.5 h-3.5 accent-[#0F4C3A]"
                />
                <span>نمایش برچسب</span>
              </label>
            </div>
            <input
              type="text"
              value={hero.badgeText || ''}
              onChange={(e) => onChange({ ...hero, badgeText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs focus:border-[#0F4C3A] focus:outline-none"
              placeholder="مثال: پک‌های هدیه لوکس و سازمانی"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              تیتر اصلی سطر اول (Main Title):
            </label>
            <input
              type="text"
              value={hero.mainTitle || ''}
              onChange={(e) => onChange({ ...hero, mainTitle: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs font-extrabold text-[#0F4C3A] focus:outline-none"
              placeholder="مثال: هدیه‌ای برای ماندن در یاد"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            بخش برجسته و طلایی تیتر (Highlighted Golden Text):
          </label>
          <input
            type="text"
            value={hero.highlightedTitle || ''}
            onChange={(e) => onChange({ ...hero, highlightedTitle: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#D4AF37]/50 text-xs font-extrabold text-[#D4AF37] focus:outline-none"
            placeholder="مثال: با سلیقه شما"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            متن توضیحات زیر تیتر (Subtext / Description):
          </label>
          <textarea
            rows={3}
            value={hero.description || ''}
            onChange={(e) => onChange({ ...hero, description: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs leading-relaxed focus:border-[#0F4C3A] focus:outline-none"
            placeholder="پک‌های هدیه باکیفیت برای مناسبت‌های شخصی و سازمانی..."
          />
        </div>
      </div>

      {/* 2. Hero Image Management */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
          <span>تصویر اصلی بخش Hero و کارت شناور روی آن</span>
        </h2>

        <ImageUploadField
          label="تصویر اصلی بخش Hero:"
          description="تصویر شاخص سمت چپ بخش معرفی صفحه اصلی. برای جلوه لوکس، از تصاویر باکیفیت بسته‌بندی هدیه استفاده کنید."
          value={hero.heroImage || HERO_BANNER_IMAGE}
          onChange={(url) => onChange({ ...hero, heroImage: url })}
          altText={hero.heroImageAlt || ''}
          onAltTextChange={(alt) => onChange({ ...hero, heroImageAlt: alt })}
          defaultImage={HERO_BANNER_IMAGE}
          aspectRatioHint="عکس پرتره یا مربعی با رزولوشن حداقل 800x1000 پیکسل"
        />

        {/* Floating Card Overlay */}
        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E0D8C8] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F4C3A]">
              کارت شیشه‌ای شناور روی تصویر (Floating Card Overlay)
            </span>
            <label className="flex items-center gap-1 cursor-pointer text-[11px] text-[#6A7873]">
              <input
                type="checkbox"
                checked={hero.showFloatingCard !== false}
                onChange={(e) => onChange({ ...hero, showFloatingCard: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#0F4C3A]"
              />
              <span>نمایش کارت شناور</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">
                عنوان کارت:
              </label>
              <input
                type="text"
                value={hero.floatingCardTitle || ''}
                onChange={(e) => onChange({ ...hero, floatingCardTitle: e.target.value })}
                className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold text-[#0F4C3A]"
                placeholder="مثال: بسته‌بندی اختصاصی"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">
                متن توضیحی کارت:
              </label>
              <input
                type="text"
                value={hero.floatingCardText || ''}
                onChange={(e) => onChange({ ...hero, floatingCardText: e.target.value })}
                className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
                placeholder="مثال: هر پک با دقت بسته‌بندی و آماده ارسال می‌شود."
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CTA Action Buttons */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <MousePointer className="w-4 h-4 text-[#D4AF37]" />
          <span>دکمه‌های اقدام به عمل (CTA Buttons) در بخش آغازین</span>
        </h2>

        {/* Primary Button */}
        <div className="p-4 rounded-2xl bg-[#0F4C3A]/5 border border-[#0F4C3A]/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F4C3A]">
              دکمه اصلی (Primary Action Button - سبز زمردی)
            </span>
            <label className="flex items-center gap-1 cursor-pointer text-[11px] text-[#6A7873]">
              <input
                type="checkbox"
                checked={hero.showPrimaryButton !== false}
                onChange={(e) => onChange({ ...hero, showPrimaryButton: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#0F4C3A]"
              />
              <span>نمایش دکمه اصلی</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">متن دکمه:</label>
              <input
                type="text"
                value={hero.primaryButtonText || ''}
                onChange={(e) => onChange({ ...hero, primaryButtonText: e.target.value })}
                className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">صفحه مقصد:</label>
              <select
                value={hero.primaryButtonAction || 'catalog'}
                onChange={(e) => onChange({ ...hero, primaryButtonAction: e.target.value })}
                className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold text-[#0F4C3A]"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Secondary Button */}
        <div className="p-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C6D1F]">
              دکمه دوم (Secondary Action Button - کرم طلایی)
            </span>
            <label className="flex items-center gap-1 cursor-pointer text-[11px] text-[#6A7873]">
              <input
                type="checkbox"
                checked={hero.showSecondaryButton !== false}
                onChange={(e) => onChange({ ...hero, showSecondaryButton: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#0F4C3A]"
              />
              <span>نمایش دکمه دوم</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">متن دکمه:</label>
              <input
                type="text"
                value={hero.secondaryButtonText || ''}
                onChange={(e) => onChange({ ...hero, secondaryButtonText: e.target.value })}
                className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">صفحه مقصد:</label>
              <select
                value={hero.secondaryButtonAction || 'corporate'}
                onChange={(e) => onChange({ ...hero, secondaryButtonAction: e.target.value })}
                className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold text-[#0F4C3A]"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tertiary Button */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E0D8C8] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F4C3A]">
              دکمه متنی سوم (Tertiary Text Link)
            </span>
            <label className="flex items-center gap-1 cursor-pointer text-[11px] text-[#6A7873]">
              <input
                type="checkbox"
                checked={hero.showTertiaryButton !== false}
                onChange={(e) => onChange({ ...hero, showTertiaryButton: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#0F4C3A]"
              />
              <span>نمایش دکمه سوم</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">متن لینک:</label>
              <input
                type="text"
                value={hero.tertiaryButtonText || ''}
                onChange={(e) => onChange({ ...hero, tertiaryButtonText: e.target.value })}
                className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">صفحه مقصد:</label>
              <select
                value={hero.tertiaryButtonAction || 'builder'}
                onChange={(e) => onChange({ ...hero, tertiaryButtonAction: e.target.value })}
                className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold text-[#0F4C3A]"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Benefits / Key Value Props Section */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>نوار مزایا و ویژگی‌های کلیدی (Key Value Props)</span>
            </h2>
            <p className="text-[11px] text-[#6A7873] mt-0.5">
              عناوین، توضیحات، آیکون‌ها و ترتیب نمایش ۴ مزیت برجسته زیر بخش معرفی را تنظیم کنید.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#0F4C3A]">
              <span>نمایش نوار مزایا:</span>
              <input
                type="checkbox"
                checked={hero.showBenefits !== false}
                onChange={(e) => onChange({ ...hero, showBenefits: e.target.checked })}
                className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={handleAddBenefit}
              className="px-3 py-1.5 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#0B3C2E] transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن مزیت</span>
            </button>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-3">
          {(hero.benefits || []).map((benefit, idx) => {
            const isEditing = editingBenefitId === benefit.id;

            return (
              <div
                key={benefit.id}
                className={`p-4 rounded-2xl border transition ${
                  benefit.visible ? 'bg-[#FAF8F5] border-[#E0D8C8]' : 'bg-gray-100 border-gray-300 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E0D8C8] flex items-center justify-center text-[#0F4C3A]">
                      {renderLucideIcon(benefit.iconName, 'w-4 h-4 text-[#0F4C3A]')}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#1C2826]">{benefit.title}</span>
                        {!benefit.visible && (
                          <span className="text-[9px] bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded">
                            مخفی
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6A7873]">{benefit.description}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleMoveBenefit(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 bg-white border border-[#E0D8C8] rounded-lg text-[#0F4C3A] disabled:opacity-30 cursor-pointer"
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveBenefit(idx, 'down')}
                      disabled={idx === (hero.benefits || []).length - 1}
                      className="p-1.5 bg-white border border-[#E0D8C8] rounded-lg text-[#0F4C3A] disabled:opacity-30 cursor-pointer"
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateBenefit(benefit.id, { visible: !benefit.visible })}
                      className="p-1.5 bg-white border border-[#E0D8C8] rounded-lg text-[#0F4C3A] cursor-pointer"
                      title={benefit.visible ? 'مخفی کردن' : 'نمایش'}
                    >
                      {benefit.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingBenefitId(isEditing ? null : benefit.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        isEditing
                          ? 'bg-[#0F4C3A] text-white'
                          : 'bg-white border border-[#E0D8C8] text-[#0F4C3A] hover:bg-[#F4EFE6]'
                      }`}
                    >
                      {isEditing ? 'بستن' : 'ویرایش'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBenefit(benefit.id)}
                      className="p-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Benefit Edit */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-[#E0D8C8] space-y-3 bg-white p-4 rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">
                          عنوان مزیت:
                        </label>
                        <input
                          type="text"
                          value={benefit.title}
                          onChange={(e) => handleUpdateBenefit(benefit.id, { title: e.target.value })}
                          className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">
                          توضیح کوتاه:
                        </label>
                        <input
                          type="text"
                          value={benefit.description}
                          onChange={(e) => handleUpdateBenefit(benefit.id, { description: e.target.value })}
                          className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs"
                        />
                      </div>
                    </div>

                    <IconPicker
                      value={benefit.iconName}
                      onChange={(iconName) => handleUpdateBenefit(benefit.id, { iconName })}
                      label="آیکون مزیت:"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
