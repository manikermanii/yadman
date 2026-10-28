import React, { useState, useEffect, useCallback } from 'react';
import { Save, Settings, Store, Truck, Phone, Sparkles, CheckCircle2, ShieldAlert, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { StoreSettings } from '../../types';
import { formatToman } from '../../utils/formatters';
import { api } from '../../services/api';

interface AdminSettingsProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void | Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  onRefresh?: () => void | Promise<void>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  isLoading: propIsLoading = false,
  isSaving: propIsSaving = false,
  error: propError = null,
  onRefresh,
}) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [internalSaving, setInternalSaving] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const isSaving = propIsSaving || internalSaving;
  const isLoading = propIsLoading || internalLoading;
  const activeError = propError || internalError;

  // Load latest settings from PostgreSQL
  const loadSettingsData = useCallback(async () => {
    setInternalLoading(true);
    setInternalError(null);
    try {
      const [dbSettings] = await Promise.all([
        api.cms.getSettings(),
        onRefresh ? onRefresh() : Promise.resolve(),
      ]);
      if (dbSettings) {
        setFormData((prev) => ({
          ...prev,
          ...dbSettings,
        }));
      }
    } catch (err: any) {
      console.error('Failed to load store settings from PostgreSQL:', err);
      setInternalError(err?.message || 'خطا در بارگذاری تنظیمات فروشگاه از پایگاه‌داده سرور');
    } finally {
      setInternalLoading(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...settings,
    }));
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setInternalSaving(true);
    setInternalError(null);
    setIsSaved(false);

    try {
      // 1. Persist directly into PostgreSQL
      const updated = await api.cms.updateSettingsAdmin(formData);
      setFormData((prev) => ({
        ...prev,
        ...updated,
      }));

      // 2. Keep parent state in sync
      if (onSaveSettings) {
        await onSaveSettings({
          ...settings,
          ...updated,
        });
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to update store settings in PostgreSQL:', err);
      setInternalError(err?.message || 'خطا در ذخیره‌سازی تنظیمات در پایگاه‌داده سرور');
    } finally {
      setInternalSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F4C3A]">
            تنظیمات عمومی فروشگاه و بسته‌بندی
          </h1>
          <p className="text-xs text-[#6A7873] mt-1">
            پیکربندی سقف ارسال رایگان، متن اطلاعیه بالای سایت، اطلاعات پشتیبانی و خدمات اختصاصی
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            type="button"
            onClick={loadSettingsData}
            disabled={isLoading || isSaving}
            className="p-2.5 rounded-2xl border border-[#E0D8C8] bg-white hover:bg-[#FAF8F5] text-[#0F4C3A] flex items-center gap-1.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
            title="بروزرسانی داده‌ها از سرور"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>

          {isSaved && (
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>تنظیمات با موفقیت در پایگاه‌داده ذخیره شد</span>
            </div>
          )}
        </div>
      </div>

      {/* Server Error Alert */}
      {activeError && (
        <div className="p-4 rounded-2xl border bg-red-50 text-red-800 border-red-200 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{activeError}</span>
          </div>
          <button
            type="button"
            onClick={loadSettingsData}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs transition cursor-pointer"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        
        {/* Store Identity & Announcement */}
        <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
            <Store className="w-4 h-4 text-[#D4AF37]" />
            هویت فروشگاه و پیام‌های اطلاع‌رسانی
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#0F4C3A] mb-1">
                نام فارسی فروشگاه:
              </label>
              <input
                type="text"
                value={formData.storeNameFa}
                onChange={(e) => setFormData({ ...formData, storeNameFa: e.target.value })}
                className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#0F4C3A] mb-1">
                عنوان انگلیسی (Brand Name):
              </label>
              <input
                type="text"
                value={formData.storeNameEn}
                onChange={(e) => setFormData({ ...formData, storeNameEn: e.target.value })}
                className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-english-serif"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#0F4C3A] mb-1">
              متن نوار اطلاعیه بالای سایت:
            </label>
            <input
              type="text"
              value={formData.announcementText}
              onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
            />
          </div>
        </div>

        {/* Shipping & Financial Rules */}
        <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
            <Truck className="w-4 h-4 text-[#D4AF37]" />
            قوانین ارسال و حمل و نقل
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#0F4C3A] mb-1">
                سقف مبلغ خرید برای ارسال رایگان (تومان):
              </label>
              <input
                type="number"
                step={100000}
                value={formData.freeShippingThreshold}
                onChange={(e) => setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })}
                className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] font-bold text-[#0F4C3A]"
              />
              <span className="text-[11px] text-[#8C8375] block mt-1">
                سفارش‌های بالای {formatToman(formData.freeShippingThreshold)} بدون هزینه ارسال خواهند بود.
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
            <Phone className="w-4 h-4 text-[#D4AF37]" />
            شماره‌های تماس و واحد سازمانی
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-[#0F4C3A] mb-1">
                شماره پشتیبانی مشتریان:
              </label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] font-mono text-[#0F4C3A]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#0F4C3A] mb-1">
                تلفن واحد فروش سازمانی:
              </label>
              <input
                type="text"
                value={formData.corporatePhone}
                onChange={(e) => setFormData({ ...formData, corporatePhone: e.target.value })}
                className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] font-mono text-[#0F4C3A]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#0F4C3A] mb-1">
                ایمیل واحد سازمانی:
              </label>
              <input
                type="email"
                value={formData.corporateEmail}
                onChange={(e) => setFormData({ ...formData, corporateEmail: e.target.value })}
                className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Packaging Features Toggles */}
        <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            سفارشی‌سازی‌های فعال در سبد خرید
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.customRibbonEnabled}
                onChange={(e) => setFormData({ ...formData, customRibbonEnabled: e.target.checked })}
                className="w-4 h-4 text-[#0F4C3A] rounded border-gray-300"
              />
              <div>
                <span className="font-bold text-[#0F4C3A] block">انتخاب رنگ روبان</span>
                <span className="text-[10px] text-[#8C8375]">امکان انتخاب روبان توسط مشتری</span>
              </div>
            </label>

            <label className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.waxSealEnabled}
                onChange={(e) => setFormData({ ...formData, waxSealEnabled: e.target.checked })}
                className="w-4 h-4 text-[#0F4C3A] rounded border-gray-300"
              />
              <div>
                <span className="font-bold text-[#0F4C3A] block">مهر و موم مومی</span>
                <span className="text-[10px] text-[#8C8375]">امکان انتخاب طرح مهر مومی</span>
              </div>
            </label>

            <label className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.freeCalligraphyEnabled}
                onChange={(e) => setFormData({ ...formData, freeCalligraphyEnabled: e.target.checked })}
                className="w-4 h-4 text-[#0F4C3A] rounded border-gray-300"
              />
              <div>
                <span className="font-bold text-[#0F4C3A] block">کارت تبریک رایگان</span>
                <span className="text-[10px] text-[#8C8375]">خدمت خطاطی و چاپ کارت هدیه</span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                <span>در حال ذخیره در سرور...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#D4AF37]" />
                <span>ذخیره کلیه تنظیمات فروشگاه</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
