import React from 'react';
import {
  X,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  CheckCircle2,
  Percent,
  Sparkles,
  Calendar,
  Gift,
  Package,
  Users,
  MapPin,
  Check,
  Star,
} from 'lucide-react';
import {
  ProductFilterState,
  Category,
  FilterFacetOption,
} from '../../types';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { PRICE_PRESETS } from '../../utils/filterEngine';

interface ProductFilterMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilterState;
  categories: Category[];
  categoryFacets: FilterFacetOption[];
  occasionFacets: FilterFacetOption[];
  giftTypeFacets: FilterFacetOption[];
  boxPackagingFacets: FilterFacetOption[];
  suitableForFacets: FilterFacetOption[];
  brandOriginFacets: FilterFacetOption[];
  totalMatchingCount: number;
  onUpdateFilters: (updates: Partial<ProductFilterState>) => void;
  onResetFilters: () => void;
}

export const ProductFilterMobileDrawer: React.FC<ProductFilterMobileDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  categories,
  categoryFacets,
  occasionFacets,
  giftTypeFacets,
  boxPackagingFacets,
  suitableForFacets,
  brandOriginFacets,
  totalMatchingCount,
  onUpdateFilters,
  onResetFilters,
}) => {
  if (!isOpen) return null;

  const handleToggleArrayItem = (key: keyof ProductFilterState, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];

    onUpdateFilters({ [key]: newArray, page: 1 });
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PRICE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onUpdateFilters({
        pricePreset: presetId,
        minPrice: preset.min,
        maxPrice: preset.max,
        page: 1,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Drawer */}
      <div className="relative bg-[#FAF8F5] rounded-t-3xl max-h-[88vh] flex flex-col z-10 shadow-2xl border-t border-[#D4AF37]/30 overflow-hidden">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-[#D1C9BE] rounded-full mx-auto mt-3 mb-1" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#EAE6DF]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#0F4C3A]" />
            <h3 className="font-extrabold text-base text-[#0F4C3A]">فیلترهای پیشرفته</h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>پاک‌سازی</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-[#8C8375] hover:text-[#1C2826] hover:bg-[#EAE6DF]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-6 text-right">
          {/* Quick Toggles */}
          <div className="bg-[#F4EFE6] p-4 rounded-2xl space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    filters.inStockOnly ? 'text-[#0F4C3A]' : 'text-[#8C8375]'
                  }`}
                />
                <span className="text-xs font-bold text-[#1C2826]">فقط کالاهای موجود</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={filters.inStockOnly}
                onClick={() => onUpdateFilters({ inStockOnly: !filters.inStockOnly, page: 1 })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden ${
                  filters.inStockOnly ? 'bg-[#0F4C3A]' : 'bg-[#D1C9BE]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                    filters.inStockOnly ? 'translate-x-[-20px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-[#E5DEC9]">
              <div className="flex items-center gap-2">
                <Percent
                  className={`w-4 h-4 ${
                    filters.discountOnly ? 'text-[#D4AF37]' : 'text-[#8C8375]'
                  }`}
                />
                <span className="text-xs font-bold text-[#1C2826]">فقط کالاهای تخفیف‌دار</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={filters.discountOnly}
                onClick={() => onUpdateFilters({ discountOnly: !filters.discountOnly, page: 1 })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden ${
                  filters.discountOnly ? 'bg-[#0F4C3A]' : 'bg-[#D1C9BE]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                    filters.discountOnly ? 'translate-x-[-20px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Categories */}
          {categoryFacets.length > 0 && (
            <div>
              <h4 className="font-bold text-sm text-[#0F4C3A] mb-2.5 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#D4AF37]" />
                <span>دسته‌بندی‌ها</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {categoryFacets.map((facet) => {
                  const isSelected =
                    (facet.value === 'all' && filters.category === 'all') ||
                    filters.category === facet.value;
                  return (
                    <button
                      key={facet.value}
                      type="button"
                      onClick={() => onUpdateFilters({ category: facet.value as any, page: 1 })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#0F4C3A] text-white shadow-xs'
                          : 'bg-[#F4EFE6] text-[#2C3B37] hover:bg-[#EAE6DF]'
                      }`}
                    >
                      <span>{facet.label}</span>
                      <span className="text-[10px] opacity-70 mr-1">({toPersianDigits(facet.count)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <h4 className="font-bold text-sm text-[#0F4C3A] mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>محدوده قیمت</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {PRICE_PRESETS.map((preset) => {
                const isSelected = filters.pricePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`p-2 rounded-xl text-xs font-medium text-center transition-all ${
                      isSelected
                        ? 'bg-[#0F4C3A] text-white font-bold'
                        : 'bg-[#F4EFE6] text-[#2C3B37]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Occasions */}
          {occasionFacets.length > 0 && (
            <div>
              <h4 className="font-bold text-sm text-[#0F4C3A] mb-2.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                <span>مناسبت هدیه</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {occasionFacets.map((facet) => {
                  const isChecked = filters.occasions.includes(facet.value);
                  return (
                    <button
                      key={facet.value}
                      type="button"
                      onClick={() => handleToggleArrayItem('occasions', facet.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#0F4C3A] text-white font-bold'
                          : 'bg-[#F4EFE6] text-[#2C3B37]'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      <span>{facet.label}</span>
                      <span className="text-[10px] opacity-75">({toPersianDigits(facet.count)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gift Types */}
          {giftTypeFacets.length > 0 && (
            <div>
              <h4 className="font-bold text-sm text-[#0F4C3A] mb-2.5 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#D4AF37]" />
                <span>نوع هدیه</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {giftTypeFacets.map((facet) => {
                  const isChecked = filters.giftTypes.includes(facet.value);
                  return (
                    <button
                      key={facet.value}
                      type="button"
                      onClick={() => handleToggleArrayItem('giftTypes', facet.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#0F4C3A] text-white font-bold'
                          : 'bg-[#F4EFE6] text-[#2C3B37]'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      <span>{facet.label}</span>
                      <span className="text-[10px] opacity-75">({toPersianDigits(facet.count)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Box Packaging */}
          {boxPackagingFacets.length > 0 && (
            <div>
              <h4 className="font-bold text-sm text-[#0F4C3A] mb-2.5 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#D4AF37]" />
                <span>نوع بسته‌بندی</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {boxPackagingFacets.map((facet) => {
                  const isChecked = filters.boxPackagingTypes.includes(facet.value);
                  return (
                    <button
                      key={facet.value}
                      type="button"
                      onClick={() => handleToggleArrayItem('boxPackagingTypes', facet.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#0F4C3A] text-white font-bold'
                          : 'bg-[#F4EFE6] text-[#2C3B37]'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      <span>{facet.label}</span>
                      <span className="text-[10px] opacity-75">({toPersianDigits(facet.count)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suitable For */}
          {suitableForFacets.length > 0 && (
            <div>
              <h4 className="font-bold text-sm text-[#0F4C3A] mb-2.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                <span>مناسب برای</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {suitableForFacets.map((facet) => {
                  const isChecked = filters.suitableFor.includes(facet.value);
                  return (
                    <button
                      key={facet.value}
                      type="button"
                      onClick={() => handleToggleArrayItem('suitableFor', facet.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#0F4C3A] text-white font-bold'
                          : 'bg-[#F4EFE6] text-[#2C3B37]'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      <span>{facet.label}</span>
                      <span className="text-[10px] opacity-75">({toPersianDigits(facet.count)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brand Origin */}
          {brandOriginFacets.length > 0 && (
            <div>
              <h4 className="font-bold text-sm text-[#0F4C3A] mb-2.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span>خاستگاه و اصالت</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {brandOriginFacets.map((facet) => {
                  const isChecked = filters.brandOrigins.includes(facet.value);
                  return (
                    <button
                      key={facet.value}
                      type="button"
                      onClick={() => handleToggleArrayItem('brandOrigins', facet.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#0F4C3A] text-white font-bold'
                          : 'bg-[#F4EFE6] text-[#2C3B37]'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      <span>{facet.label}</span>
                      <span className="text-[10px] opacity-75">({toPersianDigits(facet.count)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Floating Apply Bottom Button */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#EAE6DF] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] py-3 px-4 rounded-2xl font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>مشاهده محصولات</span>
            <span className="bg-[#D4AF37] text-[#0F4C3A] px-2 py-0.5 rounded-full text-xs font-black">
              {toPersianDigits(totalMatchingCount)} مورد
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
