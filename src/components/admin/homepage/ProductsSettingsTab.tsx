import React from 'react';
import { ProductSectionConfig, Product } from '../../../types';
import { ShoppingBag, Eye, EyeOff, CheckSquare, Square, Layers, ListFilter } from 'lucide-react';

interface ProductsSettingsTabProps {
  productsConfig: ProductSectionConfig;
  allProducts: Product[];
  onChange: (updated: ProductSectionConfig) => void;
}

export const ProductsSettingsTab: React.FC<ProductsSettingsTabProps> = ({
  productsConfig,
  allProducts,
  onChange,
}) => {
  const selectedIds = productsConfig.productIds || [];

  const handleToggleProduct = (productId: string) => {
    let updated: string[];
    if (selectedIds.includes(productId)) {
      updated = selectedIds.filter((id) => id !== productId);
    } else {
      updated = [...selectedIds, productId];
    }
    onChange({ ...productsConfig, productIds: updated });
  };

  const handleSelectAll = () => {
    onChange({ ...productsConfig, productIds: allProducts.map((p) => p.id) });
  };

  const handleClearSelection = () => {
    onChange({ ...productsConfig, productIds: [] });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Main Headings & Visibility */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
            <span>عناوین و تنظیمات ویترین محصولات صفحه اصلی</span>
          </h2>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F4C3A]">
            <span>نمایش بخش در صفحه:</span>
            <input
              type="checkbox"
              checked={productsConfig.visible !== false}
              onChange={(e) => onChange({ ...productsConfig, visible: e.target.checked })}
              className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              عنوان بخش محصولات:
            </label>
            <input
              type="text"
              value={productsConfig.title || ''}
              onChange={(e) => onChange({ ...productsConfig, title: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs font-extrabold text-[#0F4C3A] focus:outline-none"
              placeholder="مثال: ویترین پک‌های هدیه"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              تعداد محصولات قابل نمایش در صفحه اصلی:
            </label>
            <input
              type="number"
              min={1}
              max={24}
              value={productsConfig.displayLimit || 6}
              onChange={(e) => onChange({ ...productsConfig, displayLimit: parseInt(e.target.value) || 6 })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs font-bold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            زیرعنوان و توضیحات بخش:
          </label>
          <textarea
            rows={2}
            value={productsConfig.description || ''}
            onChange={(e) => onChange({ ...productsConfig, description: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs leading-relaxed focus:outline-none"
            placeholder="بسته‌بندی اختصاصی هاردباکس همراه با امکان درج کارت تبریک..."
          />
        </div>

        {/* Categories Pills Toggle & View All Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E0D8C8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F4C3A]">
                دکمه‌های فیلتر دسته‌بندی بالای ویترین
              </span>
              <input
                type="checkbox"
                checked={productsConfig.showCategories !== false}
                onChange={(e) => onChange({ ...productsConfig, showCategories: e.target.checked })}
                className="w-4 h-4 accent-[#0F4C3A]"
              />
            </div>
            <p className="text-[11px] text-[#6A7873]">
              نمایش چیپ‌های فیلتر (همه، سازمانی، نوروز، زعفران و...) بالای کارت‌های محصول
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E0D8C8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F4C3A]">
                دکمه «مشاهده همه محصولات» در پایین
              </span>
              <input
                type="checkbox"
                checked={productsConfig.showViewAllButton !== false}
                onChange={(e) => onChange({ ...productsConfig, showViewAllButton: e.target.checked })}
                className="w-4 h-4 accent-[#0F4C3A]"
              />
            </div>
            <input
              type="text"
              value={productsConfig.viewAllButtonText || ''}
              onChange={(e) => onChange({ ...productsConfig, viewAllButtonText: e.target.value })}
              className="w-full bg-white p-2 rounded-xl border border-[#E0D8C8] text-xs"
              placeholder="مشاهده همه هدایا در فروشگاه..."
            />
          </div>
        </div>
      </div>

      {/* 2. Product Picker / Specific Featured Products */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4EFE6] pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-[#D4AF37]" />
              <span>انتخاب پک‌های هدیه برای ویترین صفحه اصلی</span>
            </h2>
            <p className="text-[11px] text-[#6A7873] mt-0.5">
              {selectedIds.length === 0
                ? 'در حالت خودکار: محصولات به ترتیب اولویت پیش‌فرض کاتالوگ نمایش داده می‌شوند.'
                : `تعداد ${selectedIds.length} پک به صورت دستی برای نمایش انتخاب شده است.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1 text-[11px] font-bold text-[#6A7873] hover:text-red-700 bg-[#FAF8F5] border border-[#E0D8C8] rounded-lg transition cursor-pointer"
            >
              حالت خودکار (پاک کردن انتخاب دستی)
            </button>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 text-[11px] font-bold text-[#0F4C3A] bg-[#FAF8F5] border border-[#E0D8C8] rounded-lg transition cursor-pointer"
            >
              انتخاب همه
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
          {allProducts.map((product) => {
            const isSelected = selectedIds.includes(product.id);

            return (
              <div
                key={product.id}
                onClick={() => handleToggleProduct(product.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] shadow-2xs'
                    : 'bg-[#FAF8F5] border-[#EAE6DF] hover:border-[#D4AF37]'
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 shrink-0 border border-[#EAE6DF]">
                  <img
                    src={product.image}
                    alt={product.titleFa || 'محصول'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#1C2826] truncate block">
                      {product.titleFa}
                    </span>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#0F4C3A] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-[#D4AF37] font-bold block mt-0.5">
                    {product.price.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
