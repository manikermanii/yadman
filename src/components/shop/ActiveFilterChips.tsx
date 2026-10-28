import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { ProductFilterState, Category } from '../../types';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { PRICE_PRESETS } from '../../utils/filterEngine';

interface ActiveFilterChipsProps {
  filters: ProductFilterState;
  categories: Category[];
  onUpdateFilters: (updates: Partial<ProductFilterState>) => void;
  onResetFilters: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  categories,
  onUpdateFilters,
  onResetFilters,
}) => {
  const chips: { id: string; label: string; onRemove: () => void }[] = [];

  // Search Query
  if (filters.searchQuery && filters.searchQuery.trim()) {
    chips.push({
      id: 'search',
      label: `جستجو: «${filters.searchQuery.trim()}»`,
      onRemove: () => onUpdateFilters({ searchQuery: '', page: 1 }),
    });
  }

  // Category
  if (filters.category && filters.category !== 'all') {
    const cat = categories.find((c) => c.id === filters.category);
    const label = cat ? cat.nameFa : filters.category;
    chips.push({
      id: 'category',
      label: `دسته‌بندی: ${label}`,
      onRemove: () => onUpdateFilters({ category: 'all', page: 1 }),
    });
  }

  // Price Preset or Range
  if (filters.pricePreset && filters.pricePreset !== 'all') {
    const preset = PRICE_PRESETS.find((p) => p.id === filters.pricePreset);
    if (preset) {
      chips.push({
        id: 'price-preset',
        label: `قیمت: ${preset.label}`,
        onRemove: () =>
          onUpdateFilters({
            pricePreset: 'all',
            minPrice: 0,
            maxPrice: 20000000,
            page: 1,
          }),
      });
    }
  } else if (filters.minPrice > 0 || filters.maxPrice < 20000000) {
    let priceLabel = 'قیمت: ';
    if (filters.minPrice > 0 && filters.maxPrice < 20000000) {
      priceLabel += `از ${formatToman(filters.minPrice)} تا ${formatToman(filters.maxPrice)}`;
    } else if (filters.minPrice > 0) {
      priceLabel += `از ${formatToman(filters.minPrice)}`;
    } else {
      priceLabel += `تا ${formatToman(filters.maxPrice)}`;
    }
    chips.push({
      id: 'price-custom',
      label: priceLabel,
      onRemove: () =>
        onUpdateFilters({
          minPrice: 0,
          maxPrice: 20000000,
          pricePreset: 'all',
          page: 1,
        }),
    });
  }

  // Occasions
  (filters.occasions || []).forEach((occ) => {
    chips.push({
      id: `occ-${occ}`,
      label: `مناسبت: ${occ}`,
      onRemove: () =>
        onUpdateFilters({
          occasions: (filters.occasions || []).filter((o) => o !== occ),
          page: 1,
        }),
    });
  });

  // Gift Types
  (filters.giftTypes || []).forEach((gt) => {
    chips.push({
      id: `gt-${gt}`,
      label: `نوع هدیه: ${gt}`,
      onRemove: () =>
        onUpdateFilters({
          giftTypes: (filters.giftTypes || []).filter((g) => g !== gt),
          page: 1,
        }),
    });
  });

  // Box Packaging Types
  (filters.boxPackagingTypes || []).forEach((bt) => {
    chips.push({
      id: `bt-${bt}`,
      label: `بسته‌بندی: ${bt}`,
      onRemove: () =>
        onUpdateFilters({
          boxPackagingTypes: (filters.boxPackagingTypes || []).filter((b) => b !== bt),
          page: 1,
        }),
    });
  });

  // Suitable For
  (filters.suitableFor || []).forEach((sf) => {
    chips.push({
      id: `sf-${sf}`,
      label: `مناسب: ${sf}`,
      onRemove: () =>
        onUpdateFilters({
          suitableFor: (filters.suitableFor || []).filter((s) => s !== sf),
          page: 1,
        }),
    });
  });

  // Brand Origin
  (filters.brandOrigins || []).forEach((bo) => {
    chips.push({
      id: `bo-${bo}`,
      label: `خاستگاه: ${bo}`,
      onRemove: () =>
        onUpdateFilters({
          brandOrigins: (filters.brandOrigins || []).filter((b) => b !== bo),
          page: 1,
        }),
    });
  });

  // In Stock
  if (filters.inStockOnly) {
    chips.push({
      id: 'in-stock',
      label: 'فقط کالاهای موجود',
      onRemove: () => onUpdateFilters({ inStockOnly: false, page: 1 }),
    });
  }

  // Discount Only
  if (filters.discountOnly) {
    chips.push({
      id: 'discount',
      label: 'فقط تخفیف‌دار',
      onRemove: () => onUpdateFilters({ discountOnly: false, page: 1 }),
    });
  }

  // Rating
  if (filters.minRating > 0) {
    chips.push({
      id: 'rating',
      label: `امتیاز بالاتر از ${toPersianDigits(filters.minRating)} ستاره`,
      onRemove: () => onUpdateFilters({ minRating: 0, page: 1 }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-3">
      <span className="text-xs text-[#8C8375] font-medium ml-1">فیلترهای فعال:</span>

      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#0F4C3A] border border-[#0F4C3A]/20 shadow-2xs hover:border-[#0F4C3A]/50 transition-colors"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="text-[#8C8375] hover:text-rose-600 rounded-full p-0.5 transition-colors focus:outline-hidden"
            title="حذف این فیلتر"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onResetFilters}
        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-full transition-colors mr-auto"
      >
        <RotateCcw className="w-3 h-3" />
        <span>حذف همه فیلترها</span>
      </button>
    </div>
  );
};
