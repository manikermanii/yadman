import React, { useState } from 'react';
import { PromotionalBannerItem } from '../../../types';
import { ImageUploadField } from '../../common/ImageUploadField';
import {
  Flag,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Palette,
  MousePointer,
  Sparkles,
} from 'lucide-react';

interface BannersSettingsTabProps {
  banners: PromotionalBannerItem[];
  onChange: (updated: PromotionalBannerItem[]) => void;
}

const ACTION_OPTIONS = [
  { id: 'catalog', label: 'ورود به کاتالوگ پک‌های هدیه' },
  { id: 'corporate', label: 'صفحه هدایای سازمانی (B2B)' },
  { id: 'builder', label: 'سازنده پک اختصاصی (Custom Builder)' },
  { id: 'consultation', label: 'صفحه مشاوره انتخاب هدیه' },
  { id: 'ai', label: 'مشاور هوشمند هدیه (AI Concierge)' },
  { id: 'blog', label: 'مجله و مقالات یادمان' },
];

const PRESET_COLORS = [
  { bg: '#0F4C3A', text: '#FAF8F5', label: 'سبز زمردی یادمان' },
  { bg: '#1C2826', text: '#FAF8F5', label: 'دودی نفیس' },
  { bg: '#3D2619', text: '#FAF8F5', label: 'قهوه‌ای چوبی و لوکس' },
  { bg: '#4A154B', text: '#FAF8F5', label: 'بادمجانی رویال' },
  { bg: '#D4AF37', text: '#0F4C3A', label: 'طلایی متالیک' },
  { bg: '#F4EFE6', text: '#0F4C3A', label: 'کرم ابریشمی' },
];

export const BannersSettingsTab: React.FC<BannersSettingsTabProps> = ({ banners, onChange }) => {
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  const handleAddBanner = () => {
    const newId = `banner-${Date.now().toString().slice(-4)}`;
    const newBanner: PromotionalBannerItem = {
      id: newId,
      title: 'عنوان بنر تبلیغاتی جدید',
      subtitle: 'توضیحات تکمیلی یا مناسبت ویژه',
      description: 'متن معرفی کمپین، تخفیف فصلی، ارسال رایگان یا پیشنهاد اختصاصی سازمانی...',
      badgeText: 'پیشنهاد ویژه',
      buttonText: 'مشاهده و سفارش',
      buttonAction: 'corporate',
      backgroundColor: '#0F4C3A',
      textColor: '#FAF8F5',
      visible: true,
    };
    onChange([...banners, newBanner]);
    setEditingBannerId(newId);
  };

  const handleUpdateBanner = (id: string, partial: Partial<PromotionalBannerItem>) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, ...partial } : b));
    onChange(updated);
  };

  const handleDeleteBanner = (id: string) => {
    if (banners.length <= 1) {
      alert('حداقل یک بنر باید در تنظیمات تعریف شده باشد (می‌توانید آن را مخفی کنید).');
      return;
    }
    const updated = banners.filter((b) => b.id !== id);
    onChange(updated);
  };

  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const items = [...banners];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    onChange(items);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top bar */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#D4AF37]" />
            <span>مدیریت بنرهای تبلیغاتی و اطلاعیه‌ها (Promotional Banners)</span>
          </h2>
          <p className="text-[11px] text-[#6A7873] mt-0.5">
            ایجاد بنرهای با رنگ‌بندی دلخواه، تصاویر تبلیغاتی، دکمه‌های فراخوان و تخفیف‌های ویژه مناسبتی
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddBanner}
          className="px-4 py-2 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#0B3C2E] transition shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن بنر تبلیغاتی جدید</span>
        </button>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {banners.map((banner, idx) => {
          const isEditing = editingBannerId === banner.id;

          return (
            <div
              key={banner.id}
              className={`rounded-3xl border overflow-hidden transition ${
                banner.visible ? 'border-[#E0D8C8] bg-white shadow-xs' : 'border-gray-300 bg-gray-100 opacity-60'
              }`}
            >
              {/* Header / Summary Preview */}
              <div
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                style={{
                  backgroundColor: banner.backgroundColor || '#0F4C3A',
                  color: banner.textColor || '#FAF8F5',
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {banner.badgeText && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D4AF37] text-[#0F4C3A]">
                        {banner.badgeText}
                      </span>
                    )}
                    <span className="font-extrabold text-sm">{banner.title}</span>
                    {!banner.visible && (
                      <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded">
                        مخفی در صفحه اصلی
                      </span>
                    )}
                  </div>
                  {banner.subtitle && <p className="text-xs opacity-90">{banner.subtitle}</p>}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleMoveBanner(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white disabled:opacity-30 cursor-pointer"
                    title="انتقال به بالا"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveBanner(idx, 'down')}
                    disabled={idx === banners.length - 1}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white disabled:opacity-30 cursor-pointer"
                    title="انتقال به پایین"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateBanner(banner.id, { visible: !banner.visible })}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white cursor-pointer"
                    title={banner.visible ? 'مخفی کردن' : 'نمایش'}
                  >
                    {banner.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingBannerId(isEditing ? null : banner.id)}
                    className="px-3 py-1 bg-white text-[#0F4C3A] font-bold text-xs rounded-lg hover:bg-[#FAF8F5] transition cursor-pointer"
                  >
                    {isEditing ? 'بستن تنظیمات' : 'ویرایش بنر'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-white cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Edit Details Form */}
              {isEditing && (
                <div className="p-6 space-y-4 bg-white border-t border-[#EAE6DF]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                        عنوان اصلی بنر:
                      </label>
                      <input
                        type="text"
                        value={banner.title}
                        onChange={(e) => handleUpdateBanner(banner.id, { title: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold text-[#0F4C3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                        زیرعنوان / متن تکمیلی:
                      </label>
                      <input
                        type="text"
                        value={banner.subtitle || ''}
                        onChange={(e) => handleUpdateBanner(banner.id, { subtitle: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                      متن توضیحات کامل بنر:
                    </label>
                    <textarea
                      rows={2}
                      value={banner.description}
                      onChange={(e) => handleUpdateBanner(banner.id, { description: e.target.value })}
                      className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                        برچسب بالا (Badge):
                      </label>
                      <input
                        type="text"
                        value={banner.badgeText || ''}
                        onChange={(e) => handleUpdateBanner(banner.id, { badgeText: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
                        placeholder="مثال: تخفیف ویژه سازمان‌ها"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                        متن دکمه بنر:
                      </label>
                      <input
                        type="text"
                        value={banner.buttonText}
                        onChange={(e) => handleUpdateBanner(banner.id, { buttonText: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                        صفحه مقصد دکمه:
                      </label>
                      <select
                        value={banner.buttonAction}
                        onChange={(e) => handleUpdateBanner(banner.id, { buttonAction: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold text-[#0F4C3A]"
                      >
                        {ACTION_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Colors & Palette */}
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E0D8C8] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0F4C3A]">
                      <Palette className="w-4 h-4 text-[#D4AF37]" />
                      <span>انتخاب پالت رنگی بنر</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() =>
                            handleUpdateBanner(banner.id, {
                              backgroundColor: preset.bg,
                              textColor: preset.text,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-2 cursor-pointer"
                          style={{
                            backgroundColor: preset.bg,
                            color: preset.text,
                            borderColor: banner.backgroundColor === preset.bg ? '#D4AF37' : 'transparent',
                          }}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-white/50"
                            style={{ backgroundColor: preset.bg }}
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Image for Banner */}
                  <div className="pt-2">
                    <ImageUploadField
                      label="تصویر تبلیغاتی داخل بنر (اختیاری):"
                      description="در صورت تمایل به نمایش عکس در کنار متن بنر"
                      value={banner.imageUrl || ''}
                      onChange={(url) => handleUpdateBanner(banner.id, { imageUrl: url })}
                      altText={banner.imageAlt || ''}
                      onAltTextChange={(alt) => handleUpdateBanner(banner.id, { imageAlt: alt })}
                      aspectRatioHint="مستطیل یا مربع"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
