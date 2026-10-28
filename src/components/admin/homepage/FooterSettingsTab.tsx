import React, { useState } from 'react';
import { FooterConfig, FooterGuaranteeItem, FooterMenuItem } from '../../../types';
import { IconPicker, renderLucideIcon } from './IconSelector';
import {
  LayoutTemplate,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Link as LinkIcon,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Send,
  MessageCircle,
  Linkedin,
  Copyright,
} from 'lucide-react';

interface FooterSettingsTabProps {
  footer: FooterConfig;
  onChange: (updated: FooterConfig) => void;
}

const AVAILABLE_TARGET_TABS = [
  { id: 'catalog', label: 'کاتالوگ پک‌های هدیه' },
  { id: 'builder', label: 'ساخت پک اختصاصی' },
  { id: 'corporate', label: 'هدایای سازمانی' },
  { id: 'consultation', label: 'مشاوره انتخاب هدیه' },
  { id: 'blog', label: 'مجله یادمان' },
  { id: 'home', label: 'صفحه اصلی' },
];

export const FooterSettingsTab: React.FC<FooterSettingsTabProps> = ({ footer, onChange }) => {
  const [editingGuaranteeId, setEditingGuaranteeId] = useState<string | null>(null);

  // Guarantees handlers
  const handleAddGuarantee = () => {
    const newId = `g-${Date.now().toString().slice(-4)}`;
    const newG: FooterGuaranteeItem = {
      id: newId,
      title: 'عنوان ضمانت جدید',
      description: 'توضیح کوتاه درباره این خدمت یا ضمانت',
      iconName: 'ShieldCheck',
    };
    onChange({
      ...footer,
      guarantees: [...(footer.guarantees || []), newG],
    });
    setEditingGuaranteeId(newId);
  };

  const handleUpdateGuarantee = (id: string, partial: Partial<FooterGuaranteeItem>) => {
    const updated = (footer.guarantees || []).map((g) =>
      g.id === id ? { ...g, ...partial } : g
    );
    onChange({ ...footer, guarantees: updated });
  };

  const handleDeleteGuarantee = (id: string) => {
    if ((footer.guarantees || []).length <= 1) {
      alert('حداقل یک ضمانت باید باقی بماند.');
      return;
    }
    const updated = (footer.guarantees || []).filter((g) => g.id !== id);
    onChange({ ...footer, guarantees: updated });
  };

  // Quick Links handlers
  const handleAddQuickLink = () => {
    const newId = `ql-${Date.now().toString().slice(-4)}`;
    const newLink: FooterMenuItem = {
      id: newId,
      label: 'لینک جدید',
      target: 'catalog',
    };
    onChange({
      ...footer,
      quickLinks: [...(footer.quickLinks || []), newLink],
    });
  };

  const handleUpdateQuickLink = (id: string, partial: Partial<FooterMenuItem>) => {
    const updated = (footer.quickLinks || []).map((l) =>
      l.id === id ? { ...l, ...partial } : l
    );
    onChange({ ...footer, quickLinks: updated });
  };

  const handleDeleteQuickLink = (id: string) => {
    const updated = (footer.quickLinks || []).filter((l) => l.id !== id);
    onChange({ ...footer, quickLinks: updated });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. About & Description in Footer */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <LayoutTemplate className="w-4 h-4 text-[#D4AF37]" />
          <span>توضیحات و متن معرفی برند در فوتر</span>
        </h2>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            متن معرفی برند یادمان در فوتر:
          </label>
          <textarea
            rows={3}
            value={footer.description || ''}
            onChange={(e) => onChange({ ...footer, description: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs leading-relaxed focus:outline-none"
            placeholder="یادمان؛ طراحی و ارائه‌دهنده پک‌های هدیه فاخر..."
          />
        </div>
      </div>

      {/* 2. 4 Guarantee / Trust Badges */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>نوار ۴ ضمانت و اعتماد بالای فوتر</span>
            </h2>
            <p className="text-[11px] text-[#6A7873] mt-0.5">
              مهر و موم دست‌ساز، تضمین اصالت، کارت تبریک اختصاصی و پشتیبانی
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#0F4C3A]">
              <span>نمایش نوار ضمانت:</span>
              <input
                type="checkbox"
                checked={footer.showGuarantees !== false}
                onChange={(e) => onChange({ ...footer, showGuarantees: e.target.checked })}
                className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={handleAddGuarantee}
              className="px-3 py-1.5 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-[#0B3C2E] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(footer.guarantees || []).map((item) => {
            const isEditing = editingGuaranteeId === item.id;

            return (
              <div key={item.id} className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E0D8C8] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#E0D8C8] flex items-center justify-center text-[#0F4C3A]">
                      {renderLucideIcon(item.iconName, 'w-3.5 h-3.5')}
                    </div>
                    <span className="font-extrabold text-xs text-[#0F4C3A]">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingGuaranteeId(isEditing ? null : item.id)}
                      className="px-2 py-1 text-[10px] font-bold bg-white border border-[#E0D8C8] rounded-lg text-[#0F4C3A] cursor-pointer"
                    >
                      {isEditing ? 'بستن' : 'ویرایش'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGuarantee(item.id)}
                      className="p-1 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#6A7873]">{item.description}</p>

                {isEditing && (
                  <div className="pt-3 border-t border-[#E0D8C8] space-y-2 bg-white p-3 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4A5A55] mb-0.5">عنوان:</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateGuarantee(item.id, { title: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4A5A55] mb-0.5">توضیح:</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateGuarantee(item.id, { description: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs"
                      />
                    </div>
                    <IconPicker
                      value={item.iconName}
                      onChange={(iconName) => handleUpdateGuarantee(item.id, { iconName })}
                      label="آیکون:"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Quick Links */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#D4AF37]" />
            <span>لینک‌های دسترسی سریع در فوتر</span>
          </h2>

          <button
            type="button"
            onClick={handleAddQuickLink}
            className="px-3 py-1.5 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-[#0B3C2E] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن لینک</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            عنوان ستون لینک‌ها:
          </label>
          <input
            type="text"
            value={footer.quickLinksTitle || ''}
            onChange={(e) => onChange({ ...footer, quickLinksTitle: e.target.value })}
            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
          />
        </div>

        <div className="space-y-2">
          {(footer.quickLinks || []).map((link) => (
            <div key={link.id} className="flex items-center gap-2 p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E0D8C8]">
              <input
                type="text"
                value={link.label}
                onChange={(e) => handleUpdateQuickLink(link.id, { label: e.target.value })}
                className="flex-1 bg-white p-2 rounded-lg border border-[#E0D8C8] text-xs font-bold"
                placeholder="عنوان لینک"
              />

              <select
                value={link.target}
                onChange={(e) => handleUpdateQuickLink(link.id, { target: e.target.value })}
                className="bg-white p-2 rounded-lg border border-[#E0D8C8] text-xs font-bold text-[#0F4C3A]"
              >
                {AVAILABLE_TARGET_TABS.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleDeleteQuickLink(link.id)}
                className="p-2 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Contact & Socials & Copyright */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <Phone className="w-4 h-4 text-[#D4AF37]" />
          <span>اطلاعات تماس، شبکه‌های اجتماعی و کپی‌رایت</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">تلفن تماس:</label>
            <input
              type="text"
              value={footer.phone || ''}
              onChange={(e) => onChange({ ...footer, phone: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">ایمیل رسمی:</label>
            <input
              type="email"
              value={footer.email || ''}
              onChange={(e) => onChange({ ...footer, email: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-mono text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">آدرس فیزیکی:</label>
            <input
              type="text"
              value={footer.address || ''}
              onChange={(e) => onChange({ ...footer, address: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">اینستاگرام:</label>
            <input
              type="text"
              value={footer.socialInstagram || ''}
              onChange={(e) => onChange({ ...footer, socialInstagram: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs font-mono text-left"
              dir="ltr"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">تلگرام:</label>
            <input
              type="text"
              value={footer.socialTelegram || ''}
              onChange={(e) => onChange({ ...footer, socialTelegram: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs font-mono text-left"
              dir="ltr"
              placeholder="https://t.me/..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">واتس‌اپ:</label>
            <input
              type="text"
              value={footer.socialWhatsapp || ''}
              onChange={(e) => onChange({ ...footer, socialWhatsapp: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs font-mono text-left"
              dir="ltr"
              placeholder="https://wa.me/..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">لینکدین:</label>
            <input
              type="text"
              value={footer.socialLinkedin || ''}
              onChange={(e) => onChange({ ...footer, socialLinkedin: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs font-mono text-left"
              dir="ltr"
              placeholder="https://linkedin.com/..."
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            متن حق کپی‌رایت در پایین‌ترین بخش فوتر:
          </label>
          <input
            type="text"
            value={footer.copyrightText || ''}
            onChange={(e) => onChange({ ...footer, copyrightText: e.target.value })}
            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
          />
        </div>
      </div>

    </div>
  );
};
