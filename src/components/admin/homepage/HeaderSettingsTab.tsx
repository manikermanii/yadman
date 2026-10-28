import React, { useState } from 'react';
import { HeaderConfig, HeaderNavItemConfig } from '../../../types';
import { ImageUploadField } from '../../common/ImageUploadField';
import { IconPicker, renderLucideIcon } from './IconSelector';
import {
  Menu,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Bell,
  Phone,
  Search,
  CheckCircle2,
  Sparkles,
  Layout,
} from 'lucide-react';

interface HeaderSettingsTabProps {
  header: HeaderConfig;
  onChange: (updated: HeaderConfig) => void;
}

const AVAILABLE_TARGET_TABS = [
  { id: 'home', label: 'صفحه اصلی (Home)' },
  { id: 'catalog', label: 'کاتالوگ پک‌های هدیه (Catalog)' },
  { id: 'corporate', label: 'هدایای سازمانی (Corporate B2B)' },
  { id: 'consultation', label: 'مشاوره انتخاب هدیه (Consultation)' },
  { id: 'builder', label: 'طراحی پک اختصاصی (Custom Builder)' },
  { id: 'blog', label: 'مجله یادمان (Blog Articles)' },
];

export const HeaderSettingsTab: React.FC<HeaderSettingsTabProps> = ({ header, onChange }) => {
  const [editingNavId, setEditingNavId] = useState<string | null>(null);

  // Add new nav item
  const handleAddNavItem = () => {
    const newId = `nav-custom-${Date.now().toString().slice(-4)}`;
    const newItem: HeaderNavItemConfig = {
      id: newId,
      label: 'لینک جدید',
      targetTab: 'catalog',
      iconName: 'Gift',
      visible: true,
    };
    onChange({
      ...header,
      navItems: [...header.navItems, newItem],
    });
    setEditingNavId(newId);
  };

  const handleUpdateNavItem = (id: string, partial: Partial<HeaderNavItemConfig>) => {
    const updated = header.navItems.map((item) =>
      item.id === id ? { ...item, ...partial } : item
    );
    onChange({ ...header, navItems: updated });
  };

  const handleDeleteNavItem = (id: string) => {
    if (header.navItems.length <= 1) {
      alert('حداقل یک آیتم منو باید در هدر باقی بماند.');
      return;
    }
    const updated = header.navItems.filter((item) => item.id !== id);
    onChange({ ...header, navItems: updated });
  };

  const handleMoveNavItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= header.navItems.length) return;
    const items = [...header.navItems];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    onChange({ ...header, navItems: items });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Header Identity & Logo */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
          <Layout className="w-4 h-4 text-[#D4AF37]" />
          <span>لوگو و هویت برند در هدر سایت</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              عنوان وب‌سایت در هدر:
            </label>
            <input
              type="text"
              value={header.websiteName || 'یادمان'}
              onChange={(e) => onChange({ ...header, websiteName: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs focus:border-[#0F4C3A] focus:outline-none"
              placeholder="مثال: یادمان"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              متن جایگزین لوگو (Alt):
            </label>
            <input
              type="text"
              value={header.logoAlt || ''}
              onChange={(e) => onChange({ ...header, logoAlt: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs focus:border-[#0F4C3A] focus:outline-none"
              placeholder="مثال: پک‌های هدیه لوکس یادمان"
            />
          </div>
        </div>

        {/* Custom Logo Image Option */}
        <div className="pt-2">
          <ImageUploadField
            label="تصویر سفارشی لوگو (اختیاری):"
            description="در صورت خالی بودن، خطاطی زیبای اصیل «یادمان» به شکل خودکار نمایش داده می‌شود."
            value={header.logoImage || ''}
            onChange={(url) => onChange({ ...header, logoImage: url })}
            aspectRatioHint="مستطیل یا مربع کوچک"
            recommendedSize="فرمت PNG بدون پس‌زمینه (Transparent) پیشنهاد می‌شود"
          />
        </div>
      </div>

      {/* 2. Top Announcement Bar */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#D4AF37]" />
            <span>نوار اعلان بالای سایت (Top Announcement Bar)</span>
          </h2>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F4C3A]">
            <span>نمایش نوار اعلان:</span>
            <input
              type="checkbox"
              checked={header.showAnnouncement}
              onChange={(e) => onChange({ ...header, showAnnouncement: e.target.checked })}
              className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            متن اعلان بالای سایت:
          </label>
          <input
            type="text"
            value={header.announcementText}
            onChange={(e) => onChange({ ...header, announcementText: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs focus:border-[#0F4C3A] focus:outline-none"
            placeholder="ارسال رایگان برای سفارش‌های بالای ۳ میلیون تومان..."
          />
        </div>

        {/* Contact info in top bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#0F4C3A]">
                متن شماره تماس در نوار بالا:
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-[11px] text-[#6A7873]">
                <input
                  type="checkbox"
                  checked={header.showPhone}
                  onChange={(e) => onChange({ ...header, showPhone: e.target.checked })}
                  className="w-3.5 h-3.5 accent-[#0F4C3A]"
                />
                <span>نمایش شماره</span>
              </label>
            </div>
            <input
              type="text"
              value={header.phoneText}
              onChange={(e) => onChange({ ...header, phoneText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs focus:border-[#0F4C3A] focus:outline-none"
              placeholder="مشاوره و سفارش سازمانی: ۰۲۱-۸۸۸۸۰۰۰۰"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              شماره جهت تماس مستقیم (لینک tel:):
            </label>
            <input
              type="text"
              value={header.phoneLink}
              onChange={(e) => onChange({ ...header, phoneLink: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs font-mono text-left focus:border-[#0F4C3A] focus:outline-none"
              placeholder="02188880000"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* 3. Search Bar Settings */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#D4AF37]" />
            <span>باکس جستجو در هدر</span>
          </h2>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F4C3A]">
            <span>نمایش کادر جستجو:</span>
            <input
              type="checkbox"
              checked={header.showSearch !== false}
              onChange={(e) => onChange({ ...header, showSearch: e.target.checked })}
              className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            متن پیش‌فرض داخل کادر جستجو (Placeholder):
          </label>
          <input
            type="text"
            value={header.searchPlaceholder || ''}
            onChange={(e) => onChange({ ...header, searchPlaceholder: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs focus:border-[#0F4C3A] focus:outline-none"
            placeholder="جستجو در میان پک‌های هدیه، سازمانی و مناسبتی..."
          />
        </div>
      </div>

      {/* 4. Navigation Menu Items Manager */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
              <Menu className="w-4 h-4 text-[#D4AF37]" />
              <span>آیتم‌های منوی ناوبری اصلی (Navigation Links)</span>
            </h2>
            <p className="text-[11px] text-[#6A7873] mt-0.5">
              عناوین، لینک‌ها، آیکون‌ها، نشان‌ها (Badge) و وضعیت نمایش هر آیتم در هدر را مدیریت کنید.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddNavItem}
            className="px-3 py-1.5 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#0B3C2E] transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن لینک منو</span>
          </button>
        </div>

        {/* Nav Items List */}
        <div className="space-y-3">
          {header.navItems.map((item, idx) => {
            const isEditing = editingNavId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition ${
                  item.visible ? 'bg-[#FAF8F5] border-[#E0D8C8]' : 'bg-gray-100 border-gray-300 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Summary */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E0D8C8] flex items-center justify-center text-[#0F4C3A]">
                      {renderLucideIcon(item.iconName, 'w-4 h-4')}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-[#1C2826]">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#D4AF37] text-[#0F4C3A]">
                            {item.badge}
                          </span>
                        )}
                        {!item.visible && (
                          <span className="text-[9px] bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded">
                            مخفی در هدر
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#8C8375]">
                        مقصد: {AVAILABLE_TARGET_TABS.find((t) => t.id === item.targetTab)?.label || item.targetTab}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleMoveNavItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 bg-white border border-[#E0D8C8] rounded-lg text-[#0F4C3A] disabled:opacity-30 cursor-pointer"
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveNavItem(idx, 'down')}
                      disabled={idx === header.navItems.length - 1}
                      className="p-1.5 bg-white border border-[#E0D8C8] rounded-lg text-[#0F4C3A] disabled:opacity-30 cursor-pointer"
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateNavItem(item.id, { visible: !item.visible })}
                      className="p-1.5 bg-white border border-[#E0D8C8] rounded-lg text-[#0F4C3A] cursor-pointer"
                      title={item.visible ? 'مخفی کردن' : 'نمایش در منو'}
                    >
                      {item.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingNavId(isEditing ? null : item.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        isEditing
                          ? 'bg-[#0F4C3A] text-white'
                          : 'bg-white border border-[#E0D8C8] text-[#0F4C3A] hover:bg-[#F4EFE6]'
                      }`}
                    >
                      {isEditing ? 'بستن ویرایش' : 'ویرایش'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNavItem(item.id)}
                      className="p-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition cursor-pointer"
                      title="حذف آیتم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Edit Form */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-[#E0D8C8] grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">
                        عنوان در منو:
                      </label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleUpdateNavItem(item.id, { label: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">
                        صفحه مقصد (تب):
                      </label>
                      <select
                        value={item.targetTab}
                        onChange={(e) => handleUpdateNavItem(item.id, { targetTab: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs font-bold text-[#0F4C3A]"
                      >
                        {AVAILABLE_TARGET_TABS.map((tab) => (
                          <option key={tab.id} value={tab.id}>
                            {tab.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4A5A55] mb-1">
                        برچسب ویژه (اختیاری مثل «رایگان» یا «جدید»):
                      </label>
                      <input
                        type="text"
                        value={item.badge || ''}
                        onChange={(e) => handleUpdateNavItem(item.id, { badge: e.target.value })}
                        className="w-full bg-[#FAF8F5] p-2 rounded-lg border border-[#E0D8C8] text-xs"
                        placeholder="مثال: رایگان"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <IconPicker
                        value={item.iconName}
                        onChange={(iconName) => handleUpdateNavItem(item.id, { iconName })}
                        label="انتخاب آیکون آیتم منو:"
                      />
                    </div>
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
