import React, { useState } from 'react';
import {
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Tag,
  Gift,
  Calendar,
  Package,
  Users,
  MapPin,
  Check,
  Percent,
  Sparkles,
  SlidersHorizontal,
  Star,
  CheckCircle2,
} from 'lucide-react';
import {
  ProductFilterState,
  Category,
  FilterFacetOption,
} from '../../types';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { PRICE_PRESETS } from '../../utils/filterEngine';

interface ProductFilterSidebarProps {
  filters: ProductFilterState;
  categories: Category[];
  categoryFacets: FilterFacetOption[];
  occasionFacets: FilterFacetOption[];
  giftTypeFacets: FilterFacetOption[];
  boxPackagingFacets: FilterFacetOption[];
  suitableForFacets: FilterFacetOption[];
  brandOriginFacets: FilterFacetOption[];
  onUpdateFilters: (updates: Partial<ProductFilterState>) => void;
  onResetFilters: () => void;
  className?: string;
}

export const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  filters,
  categories,
  categoryFacets,
  occasionFacets,
  giftTypeFacets,
  boxPackagingFacets,
  suitableForFacets,
  brandOriginFacets,
  onUpdateFilters,
  onResetFilters,
  className = '',
}) => {
  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    price: true,
    availability: true,
    occasions: true,
    giftTypes: true,
    boxPackaging: true,
    suitableFor: false,
    brandOrigins: false,
    rating: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper to toggle array item
  const handleToggleArrayItem = (key: keyof ProductFilterState, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];

    onUpdateFilters({ [key]: newArray, page: 1 });
  };

  // Handle Preset Price
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
    <aside
      className={`bg-[#FAF8F5] border border-[#EAE6DF] rounded-3xl p-5 shadow-sm space-y-6 select-none ${className}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAE6DF]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0F4C3A]/10 flex items-center justify-center text-[#0F4C3A]">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h2 className="font-extrabold text-lg text-[#0F4C3A]">فیلترهای پیشرفته</h2>
        </div>

        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs text-[#8C8375] hover:text-rose-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
          title="بازنشانی همه فیلترها"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>پاک‌سازی</span>
        </button>
      </div>

      {/* 1. Quick Toggles: In-Stock & Discounts */}
      <div className="bg-[#F4EFE6] p-3.5 rounded-2xl space-y-3">
        {/* In Stock Toggle */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`w-4 h-4 ${
                filters.inStockOnly ? 'text-[#0F4C3A]' : 'text-[#8C8375]'
              }`}
            />
            <span className="text-xs font-bold text-[#1C2826] group-hover:text-[#0F4C3A] transition-colors">
              فقط کالاهای موجود
            </span>
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

        {/* Discount Only Toggle */}
        <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-[#E5DEC9]">
          <div className="flex items-center gap-2">
            <Percent
              className={`w-4 h-4 ${
                filters.discountOnly ? 'text-[#D4AF37]' : 'text-[#8C8375]'
              }`}
            />
            <span className="text-xs font-bold text-[#1C2826] group-hover:text-[#0F4C3A] transition-colors">
              فقط کالاهای تخفیف‌دار
            </span>
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

      {/* 2. Category Filter */}
      {categoryFacets.length > 0 && (
        <div className="border-b border-[#EAE6DF] pb-5">
          <button
            type="button"
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between text-right font-bold text-sm text-[#0F4C3A] mb-3 focus:outline-hidden"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#D4AF37]" />
              <span>دسته‌بندی‌ها</span>
            </div>
            {openSections.categories ? (
              <ChevronUp className="w-4 h-4 text-[#8C8375]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8C8375]" />
            )}
          </button>

          {openSections.categories && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pl-1">
              {categoryFacets.map((facet) => {
                const isSelected =
                  (facet.value === 'all' && filters.category === 'all') ||
                  filters.category === facet.value;

                return (
                  <button
                    key={facet.value}
                    type="button"
                    onClick={() => onUpdateFilters({ category: facet.value as any, page: 1 })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-right ${
                      isSelected
                        ? 'bg-[#0F4C3A] text-white font-bold shadow-xs'
                        : 'text-[#2C3B37] hover:bg-[#F4EFE6] font-medium'
                    }`}
                  >
                    <span className="truncate">{facet.label}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[#EAE6DF] text-[#6A7873]'
                      }`}
                    >
                      {toPersianDigits(facet.count)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Price Range Filter */}
      <div className="border-b border-[#EAE6DF] pb-5">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-right font-bold text-sm text-[#0F4C3A] mb-3 focus:outline-hidden"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>محدوده قیمت</span>
          </div>
          {openSections.price ? (
            <ChevronUp className="w-4 h-4 text-[#8C8375]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C8375]" />
          )}
        </button>

        {openSections.price && (
          <div className="space-y-3.5">
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((preset) => {
                const isSelected = filters.pricePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-[#0F4C3A] text-white font-bold shadow-2xs'
                        : 'bg-[#F4EFE6] text-[#2C3B37] hover:bg-[#EAE6DF]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Min and Max Range Inputs */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <label className="text-[10px] text-[#8C8375] block mb-1">حداقل (تومان)</label>
                <input
                  type="number"
                  min="0"
                  step="500000"
                  value={filters.minPrice || ''}
                  placeholder="۰"
                  onChange={(e) =>
                    onUpdateFilters({
                      minPrice: Number(e.target.value) || 0,
                      pricePreset: 'custom',
                      page: 1,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D1C9BE] rounded-lg text-right focus:border-[#0F4C3A] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8C8375] block mb-1">حداکثر (تومان)</label>
                <input
                  type="number"
                  min="0"
                  step="500000"
                  value={filters.maxPrice >= 20000000 ? '' : filters.maxPrice}
                  placeholder="۲۰,۰۰۰,۰۰۰"
                  onChange={(e) =>
                    onUpdateFilters({
                      maxPrice: Number(e.target.value) || 20000000,
                      pricePreset: 'custom',
                      page: 1,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D1C9BE] rounded-lg text-right focus:border-[#0F4C3A] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Slider visual representation */}
            <div className="text-center text-[11px] font-semibold text-[#0F4C3A] bg-[#F4EFE6] py-1.5 px-2 rounded-lg">
              {filters.minPrice === 0 && filters.maxPrice >= 20000000
                ? 'تمام قیمت‌ها'
                : `از ${formatToman(filters.minPrice)} تا ${
                    filters.maxPrice >= 20000000 ? 'نامحدود' : formatToman(filters.maxPrice)
                  }`}
            </div>
          </div>
        )}
      </div>

      {/* 4. Occasion Filter */}
      {occasionFacets.length > 0 && (
        <div className="border-b border-[#EAE6DF] pb-5">
          <button
            type="button"
            onClick={() => toggleSection('occasions')}
            className="w-full flex items-center justify-between text-right font-bold text-sm text-[#0F4C3A] mb-3 focus:outline-hidden"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>مناسبت هدیه</span>
            </div>
            {openSections.occasions ? (
              <ChevronUp className="w-4 h-4 text-[#8C8375]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8C8375]" />
            )}
          </button>

          {openSections.occasions && (
            <div className="space-y-2 max-h-48 overflow-y-auto pl-1">
              {occasionFacets.map((facet) => {
                const isChecked = filters.occasions.includes(facet.value);
                return (
                  <label
                    key={facet.value}
                    className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-[#0F4C3A] border-[#0F4C3A] text-white'
                            : 'border-[#D1C9BE] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs text-[#2C3B37] font-medium">{facet.label}</span>
                    </div>
                    <span className="text-[10px] text-[#8C8375]">({toPersianDigits(facet.count)})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Gift Type Filter */}
      {giftTypeFacets.length > 0 && (
        <div className="border-b border-[#EAE6DF] pb-5">
          <button
            type="button"
            onClick={() => toggleSection('giftTypes')}
            className="w-full flex items-center justify-between text-right font-bold text-sm text-[#0F4C3A] mb-3 focus:outline-hidden"
          >
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#D4AF37]" />
              <span>نوع هدیه</span>
            </div>
            {openSections.giftTypes ? (
              <ChevronUp className="w-4 h-4 text-[#8C8375]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8C8375]" />
            )}
          </button>

          {openSections.giftTypes && (
            <div className="space-y-2">
              {giftTypeFacets.map((facet) => {
                const isChecked = filters.giftTypes.includes(facet.value);
                return (
                  <label
                    key={facet.value}
                    className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-[#0F4C3A] border-[#0F4C3A] text-white'
                            : 'border-[#D1C9BE] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs text-[#2C3B37] font-medium">{facet.label}</span>
                    </div>
                    <span className="text-[10px] text-[#8C8375]">({toPersianDigits(facet.count)})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Box Packaging Type Filter */}
      {boxPackagingFacets.length > 0 && (
        <div className="border-b border-[#EAE6DF] pb-5">
          <button
            type="button"
            onClick={() => toggleSection('boxPackaging')}
            className="w-full flex items-center justify-between text-right font-bold text-sm text-[#0F4C3A] mb-3 focus:outline-hidden"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#D4AF37]" />
              <span>نوع بسته‌بندی</span>
            </div>
            {openSections.boxPackaging ? (
              <ChevronUp className="w-4 h-4 text-[#8C8375]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8C8375]" />
            )}
          </button>

          {openSections.boxPackaging && (
            <div className="space-y-2">
              {boxPackagingFacets.map((facet) => {
                const isChecked = filters.boxPackagingTypes.includes(facet.value);
                return (
                  <label
                    key={facet.value}
                    className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-[#0F4C3A] border-[#0F4C3A] text-white'
                            : 'border-[#D1C9BE] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs text-[#2C3B37] font-medium">{facet.label}</span>
                    </div>
                    <span className="text-[10px] text-[#8C8375]">({toPersianDigits(facet.count)})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. Suitable For Filter */}
      {suitableForFacets.length > 0 && (
        <div className="border-b border-[#EAE6DF] pb-5">
          <button
            type="button"
            onClick={() => toggleSection('suitableFor')}
            className="w-full flex items-center justify-between text-right font-bold text-sm text-[#0F4C3A] mb-3 focus:outline-hidden"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <span>مناسب برای</span>
            </div>
            {openSections.suitableFor ? (
              <ChevronUp className="w-4 h-4 text-[#8C8375]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8C8375]" />
            )}
          </button>

          {openSections.suitableFor && (
            <div className="space-y-2">
              {suitableForFacets.map((facet) => {
                const isChecked = filters.suitableFor.includes(facet.value);
                return (
                  <label
                    key={facet.value}
                    className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-[#0F4C3A] border-[#0F4C3A] text-white'
                            : 'border-[#D1C9BE] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs text-[#2C3B37] font-medium">{facet.label}</span>
                    </div>
                    <span className="text-[10px] text-[#8C8375]">({toPersianDigits(facet.count)})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 8. Brand Origin */}
      {brandOriginFacets.length > 0 && (
        <div className="border-b border-[#EAE6DF] pb-5">
          <button
            type="button"
            onClick={() => toggleSection('brandOrigins')}
            className="w-full flex items-center justify-between text-right font-bold text-sm text-[#0F4C3A] mb-3 focus:outline-hidden"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span>خاستگاه و اصالت هنر</span>
            </div>
            {openSections.brandOrigins ? (
              <ChevronUp className="w-4 h-4 text-[#8C8375]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8C8375]" />
            )}
          </button>

          {openSections.brandOrigins && (
            <div className="space-y-2">
              {brandOriginFacets.map((facet) => {
                const isChecked = filters.brandOrigins.includes(facet.value);
                return (
                  <label
                    key={facet.value}
                    className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-[#0F4C3A] border-[#0F4C3A] text-white'
                            : 'border-[#D1C9BE] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs text-[#2C3B37] font-medium">{facet.label}</span>
                    </div>
                    <span className="text-[10px] text-[#8C8375]">({toPersianDigits(facet.count)})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 9. Minimum Rating Filter */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('rating')}
          className="w-full flex items-center justify-between text-right font-bold text-sm text-[#0F4C3A] mb-3 focus:outline-hidden"
        >
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#D4AF37]" />
            <span>حداقل امتیاز مشتریان</span>
          </div>
          {openSections.rating ? (
            <ChevronUp className="w-4 h-4 text-[#8C8375]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C8375]" />
          )}
        </button>

        {openSections.rating && (
          <div className="space-y-1.5">
            {[
              { val: 0, label: 'همه امتیازها' },
              { val: 4.5, label: '۴.۵ ستاره و بالاتر' },
              { val: 4.0, label: '۴ ستاره و بالاتر' },
            ].map((r) => {
              const isSelected = filters.minRating === r.val;
              return (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => onUpdateFilters({ minRating: r.val, page: 1 })}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#0F4C3A] text-white font-bold'
                      : 'text-[#2C3B37] hover:bg-[#F4EFE6]'
                  }`}
                >
                  <span>{r.label}</span>
                  {r.val > 0 && <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
