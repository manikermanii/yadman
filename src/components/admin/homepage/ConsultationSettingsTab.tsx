import React, { useState } from 'react';
import { ConsultationSectionConfig, ConsultationBenefitItem } from '../../../types';
import { IconPicker, renderLucideIcon } from './IconSelector';
import {
  Headphones,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ListCheck,
  ShieldCheck,
} from 'lucide-react';

interface ConsultationSettingsTabProps {
  consultation: ConsultationSectionConfig;
  onChange: (updated: ConsultationSectionConfig) => void;
}

export const ConsultationSettingsTab: React.FC<ConsultationSettingsTabProps> = ({
  consultation,
  onChange,
}) => {
  const [newCardItemText, setNewCardItemText] = useState('');

  const handleAddCardItem = () => {
    if (!newCardItemText.trim()) return;
    onChange({
      ...consultation,
      cardItems: [...(consultation.cardItems || []), newCardItemText.trim()],
    });
    setNewCardItemText('');
  };

  const handleUpdateCardItem = (index: number, text: string) => {
    const updated = [...(consultation.cardItems || [])];
    updated[index] = text;
    onChange({ ...consultation, cardItems: updated });
  };

  const handleDeleteCardItem = (index: number) => {
    const updated = (consultation.cardItems || []).filter((_, i) => i !== index);
    onChange({ ...consultation, cardItems: updated });
  };

  const handleUpdateBenefit = (index: number, partial: Partial<ConsultationBenefitItem>) => {
    const updated = [...(consultation.benefits || [])];
    updated[index] = { ...updated[index], ...partial };
    onChange({ ...consultation, benefits: updated });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Main Titles & Visibility */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
            <Headphones className="w-4 h-4 text-[#D4AF37]" />
            <span>عناوین و متون بخش مشاوره انتخاب هدیه</span>
          </h2>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F4C3A]">
            <span>نمایش بخش در صفحه:</span>
            <input
              type="checkbox"
              checked={consultation.visible !== false}
              onChange={(e) => onChange({ ...consultation, visible: e.target.checked })}
              className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              برچسب کوچک بالای تیتر (Badge):
            </label>
            <input
              type="text"
              value={consultation.badgeText || ''}
              onChange={(e) => onChange({ ...consultation, badgeText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs"
              placeholder="مثال: مشاوره تخصصی و همراهی اختصاصی"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              تیتر اصلی بخش مشاوره:
            </label>
            <input
              type="text"
              value={consultation.title || ''}
              onChange={(e) => onChange({ ...consultation, title: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs font-extrabold text-[#0F4C3A]"
              placeholder="برای انتخاب بهترین هدیه، با ما مشورت کنید"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            متن توضیحات بخش مشاوره:
          </label>
          <textarea
            rows={2}
            value={consultation.description || ''}
            onChange={(e) => onChange({ ...consultation, description: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs leading-relaxed"
          />
        </div>

        {/* Buttons Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              متن دکمه مشاوره هدیه شخصی (سبز):
            </label>
            <input
              type="text"
              value={consultation.primaryButtonText || ''}
              onChange={(e) => onChange({ ...consultation, primaryButtonText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              متن دکمه مشاوره سازمانی و تیراژ (طلایی):
            </label>
            <input
              type="text"
              value={consultation.secondaryButtonText || ''}
              onChange={(e) => onChange({ ...consultation, secondaryButtonText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
            />
          </div>
        </div>
      </div>

      {/* 2. Highlight Badges */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>۳ نشان و مزیت برجسته زیر متن مشاوره</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(consultation.benefits || []).map((benefit, bIdx) => (
            <div key={benefit.id || bIdx} className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E0D8C8] space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-[#E0D8C8] flex items-center justify-center text-[#0F4C3A]">
                  {renderLucideIcon(benefit.iconName, 'w-3.5 h-3.5')}
                </div>
                <span className="text-xs font-bold text-[#0F4C3A]">مزیت {bIdx + 1}</span>
              </div>

              <input
                type="text"
                value={benefit.text}
                onChange={(e) => handleUpdateBenefit(bIdx, { text: e.target.value })}
                className="w-full bg-white p-2 rounded-lg border border-[#E0D8C8] text-xs"
              />

              <IconPicker
                value={benefit.iconName}
                onChange={(iconName) => handleUpdateBenefit(bIdx, { iconName })}
                label="آیکون:"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Right Card Items / Service Checklist */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <ListCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>کارت خدمات و چک‌لیست مشاوره سمت راست</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">عنوان کارت:</label>
            <input
              type="text"
              value={consultation.cardTitle || ''}
              onChange={(e) => onChange({ ...consultation, cardTitle: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold text-[#0F4C3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">زیرعنوان کارت:</label>
            <input
              type="text"
              value={consultation.cardSubtitle || ''}
              onChange={(e) => onChange({ ...consultation, cardSubtitle: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">برچسب بالای کارت:</label>
            <input
              type="text"
              value={consultation.cardBadgeText || ''}
              onChange={(e) => onChange({ ...consultation, cardBadgeText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
            />
          </div>
        </div>

        {/* Checklist bullets */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-[#0F4C3A]">
            موارد چک‌لیست خدمت (مراحل و اقدامات کارشناسان):
          </label>

          {(consultation.cardItems || []).map((itemText, iIdx) => (
            <div key={iIdx} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <input
                type="text"
                value={itemText}
                onChange={(e) => handleUpdateCardItem(iIdx, e.target.value)}
                className="flex-1 bg-[#FAF8F5] p-2 rounded-xl border border-[#E0D8C8] text-xs"
              />
              <button
                type="button"
                onClick={() => handleDeleteCardItem(iIdx)}
                className="p-2 text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Add item input */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newCardItemText}
              onChange={(e) => setNewCardItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCardItem();
                }
              }}
              placeholder="افزودن مورد جدید به چک‌لیست..."
              className="flex-1 bg-white p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
            />
            <button
              type="button"
              onClick={handleAddCardItem}
              className="px-3.5 py-2.5 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-[#0B3C2E] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن</span>
            </button>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            پیام نهایی زیر کارت:
          </label>
          <input
            type="text"
            value={consultation.cardBottomNote || ''}
            onChange={(e) => onChange({ ...consultation, cardBottomNote: e.target.value })}
            className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs"
          />
        </div>
      </div>

    </div>
  );
};
