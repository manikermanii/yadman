import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  LayoutGrid,
  Grid3X3,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  PackageOpen,
  Filter,
} from 'lucide-react';
import {
  Product,
  Category,
  ProductFilterState,
  SortOptionKey,
} from '../../types';
import { ProductCard } from '../ProductCard';
import { ProductFilterSidebar } from './ProductFilterSidebar';
import { ProductFilterMobileDrawer } from './ProductFilterMobileDrawer';
import { ActiveFilterChips } from './ActiveFilterChips';
import {
  filterAndSortProducts,
  getCategoryFacets,
  getOccasionFacets,
  getGiftTypeFacets,
  getBoxPackagingFacets,
  getSuitableForFacets,
  getBrandOriginFacets,
  countActiveFilters,
  SORT_OPTIONS,
  ITEMS_PER_PAGE,
} from '../../utils/filterEngine';
import { formatToman, toPersianDigits } from '../../utils/formatters';

interface ShopCatalogViewProps {
  products: Product[];
  categories: Category[];
  filters: ProductFilterState;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onUpdateFilters: (updates: Partial<ProductFilterState>) => void;
  onResetFilters: () => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
}

export const ShopCatalogView: React.FC<ShopCatalogViewProps> = ({
  products,
  categories,
  filters,
  isLoading = false,
  error = null,
  onRetry,
  onUpdateFilters,
  onResetFilters,
  onQuickView,
  onAddToCart,
  wishlistIds = [],
  onToggleWishlist,
}) => {
  // Mobile drawer open state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Grid column density (3 columns vs 2 columns / list)
  const [gridCols, setGridCols] = useState<'3' | '2'>('3');

  // Search input local state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.searchQuery);

  useEffect(() => {
    setLocalSearch(filters.searchQuery);
  }, [filters.searchQuery]);

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.searchQuery) {
        onUpdateFilters({ searchQuery: localSearch, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters.searchQuery, onUpdateFilters]);

  // Compute live facets based on complete product catalog
  const categoryFacets = useMemo(() => getCategoryFacets(categories, products), [categories, products]);
  const occasionFacets = useMemo(() => getOccasionFacets(products), [products]);
  const giftTypeFacets = useMemo(() => getGiftTypeFacets(products), [products]);
  const boxPackagingFacets = useMemo(() => getBoxPackagingFacets(products), [products]);
  const suitableForFacets = useMemo(() => getSuitableForFacets(products), [products]);
  const brandOriginFacets = useMemo(() => getBrandOriginFacets(products), [products]);

  // Compute filtered & paginated products
  const {
    filteredProducts,
    totalCount,
    totalPages,
    paginatedProducts,
  } = useMemo(() => {
    return filterAndSortProducts(products, filters, ITEMS_PER_PAGE);
  }, [products, filters]);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Pagination helper calculations
  const currentPage = Math.min(Math.max(1, filters.page), totalPages);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  // Generate page numbers
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-4 text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0F4C3A]/10 text-[#0F4C3A] border border-[#0F4C3A]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>کاتالوگ جامع و دسته‌بندی هوشمند</span>
          </span>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F4C3A] tracking-tight">
            فروشگاه پک‌های هدیه و هدایای فاخر
          </h1>

          <p className="text-sm sm:text-base text-[#6A7873] leading-relaxed">
            انتخاب، فیلتر و سفارشی‌سازی زیباترین هدایای سازمانی، مدیریتی و شخصی با بسته‌بندی نفیس و اصیل.
          </p>

          {/* Large Search Input */}
          <div className="relative pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-[#8C8375] absolute right-4 pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="جستجوی عنوان هدیه، زعفران، دیوان حافظ، مناسبت یا محتویات..."
                className="w-full pl-10 pr-12 py-3.5 rounded-2xl bg-white border border-[#D1C9BE] text-sm text-[#1C2826] placeholder-[#8C8375] focus:outline-hidden focus:border-[#0F4C3A] focus:ring-2 focus:ring-[#0F4C3A]/10 shadow-xs transition-all text-right"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('');
                    onUpdateFilters({ searchQuery: '', page: 1 });
                  }}
                  className="absolute left-3 p-1.5 rounded-full text-[#8C8375] hover:text-[#1C2826] hover:bg-[#F4EFE6] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Quick Category Bar */}
      {categoryFacets.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryFacets.map((facet) => {
            const isSelected =
              (facet.value === 'all' && filters.category === 'all') ||
              filters.category === facet.value;

            return (
              <button
                key={facet.value}
                type="button"
                onClick={() => onUpdateFilters({ category: facet.value as any, page: 1 })}
                className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F4C3A] text-white shadow-sm border border-[#0F4C3A]'
                    : 'bg-[#FAF8F5] text-[#2C3B37] hover:bg-[#F4EFE6] border border-[#EAE6DF]'
                }`}
              >
                <span>{facet.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-[#EAE6DF] text-[#6A7873]'
                  }`}
                >
                  {toPersianDigits(facet.count)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar: Result Counts, Sorting & Mobile Filter Trigger */}
      <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        
        {/* Mobile Filter Button */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="lg:hidden flex items-center gap-2 bg-[#0F4C3A] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
          <span>فیلترها</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#D4AF37] text-[#0F4C3A] px-1.5 py-0.5 rounded-full text-[10px] font-black">
              {toPersianDigits(activeFilterCount)}
            </span>
          )}
        </button>

        {/* Dynamic Result Count */}
        <div className="text-xs sm:text-sm text-[#6A7873] font-medium">
          {totalCount > 0 ? (
            <span>
              نمایش{' '}
              <strong className="text-[#0F4C3A] font-bold">
                {toPersianDigits(startItem)} تا {toPersianDigits(endItem)}
              </strong>{' '}
              از{' '}
              <strong className="text-[#0F4C3A] font-bold">
                {toPersianDigits(totalCount)}
              </strong>{' '}
              محصول
            </span>
          ) : (
            <span className="text-rose-600 font-bold">هیچ موردی پیدا نشد</span>
          )}
        </div>

        {/* Right Controls: Sort and Grid View Density */}
        <div className="flex items-center gap-3 mr-auto lg:mr-0">
          
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-[#2C3B37]">
            <ArrowUpDown className="w-4 h-4 text-[#8C8375] hidden sm:block" />
            <span className="font-semibold text-[#8C8375] hidden sm:inline">مرتب‌سازی:</span>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onUpdateFilters({ sortBy: e.target.value as SortOptionKey, page: 1 })
              }
              className="bg-white border border-[#D1C9BE] text-[#0F4C3A] font-bold text-xs py-2 px-3 rounded-xl focus:border-[#0F4C3A] focus:outline-hidden cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Grid Layout Toggle (Desktop) */}
          <div className="hidden sm:flex items-center bg-[#F4EFE6] p-1 rounded-xl border border-[#EAE6DF]">
            <button
              type="button"
              onClick={() => setGridCols('3')}
              className={`p-1.5 rounded-lg transition-colors ${
                gridCols === '3' ? 'bg-white text-[#0F4C3A] shadow-2xs' : 'text-[#8C8375]'
              }`}
              title="نمای متراکم (بیشترین محصول)"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setGridCols('2')}
              className={`p-1.5 rounded-lg transition-colors ${
                gridCols === '2' ? 'bg-white text-[#0F4C3A] shadow-2xs' : 'text-[#8C8375]'
              }`}
              title="نمای بزرگ‌تر"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Active Filters Bar */}
      <ActiveFilterChips
        filters={filters}
        categories={categories}
        onUpdateFilters={onUpdateFilters}
        onResetFilters={onResetFilters}
      />

      {/* Main Grid & Desktop Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Sidebar (1 Column) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <ProductFilterSidebar
            filters={filters}
            categories={categories}
            categoryFacets={categoryFacets}
            occasionFacets={occasionFacets}
            giftTypeFacets={giftTypeFacets}
            boxPackagingFacets={boxPackagingFacets}
            suitableForFacets={suitableForFacets}
            brandOriginFacets={brandOriginFacets}
            onUpdateFilters={onUpdateFilters}
            onResetFilters={onResetFilters}
          />
        </div>

        {/* Product Cards Grid (3 Columns on Desktop) */}
        <div className="col-span-1 lg:col-span-3 space-y-8">
          
          {isLoading ? (
            /* Loading Skeleton */
            <div
              className={`grid gap-3 sm:gap-4 ${
                gridCols === '3'
                  ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3'
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE6DF] overflow-hidden p-2.5 sm:p-3 space-y-2.5 animate-pulse shadow-2xs"
                >
                  <div className="w-full aspect-[4/3] bg-[#F4EFE6] rounded-lg" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-[#F4EFE6] rounded-md w-3/4" />
                    <div className="h-2.5 bg-[#F4EFE6] rounded-md w-1/2" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#EAE6DF]/60">
                    <div className="h-4 bg-[#F4EFE6] rounded-md w-16" />
                    <div className="h-6 bg-[#F4EFE6] rounded-lg w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State with Retry */
            <div className="bg-[#FAF8F5] border border-red-200 rounded-3xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <PackageOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-extrabold text-base text-[#0F4C3A]">
                  خطا در دریافت لیست محصولات
                </h3>
                <p className="text-xs text-[#6A7873] leading-relaxed">
                  {error}
                </p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 bg-[#0F4C3A] text-white hover:bg-[#0B3C2E] px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>تلاش مجدد</span>
                </button>
              )}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div
              className={`grid gap-3 sm:gap-4 ${
                gridCols === '3'
                  ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3'
              }`}
            >
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty Store State (0 Products in Database) */
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-3xl p-12 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center mx-auto">
                <PackageOpen className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="font-extrabold text-lg text-[#0F4C3A]">
                  در حال حاضر محصولی در فروشگاه ثبت نشده است
                </h3>
                <p className="text-sm text-[#6A7873] leading-relaxed">
                  به‌زودی پک‌ها و هدایای نفیس یادمان در این بخش عرضه خواهند شد. برای مشاوره یا سفارش سازمانی می‌توانید با کارشناسان ما در ارتباط باشید.
                </p>
              </div>
            </div>
          ) : (
            /* Empty Filtered State (No products match current filters) */
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-3xl p-12 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center mx-auto">
                <PackageOpen className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="font-extrabold text-lg text-[#0F4C3A]">
                  محصولی با این مشخصات و فیلترها پیدا نشد
                </h3>
                <p className="text-sm text-[#6A7873] leading-relaxed">
                  می‌توانید با بازنشانی برخی فیلترها یا جستجوی کلمات عمومی‌تر مانند «زعفران»، «سازمانی» یا «نوروز»، محصولات متنوع‌تری را مشاهده کنید.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="bg-[#0F4C3A] text-white hover:bg-[#0B3C2E] px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#D4AF37]" />
                  <span>حذف همه فیلترها</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateFilters({ category: 'all', inStockOnly: false, discountOnly: false, page: 1 })}
                  className="bg-[#F4EFE6] text-[#0F4C3A] hover:bg-[#EAE6DF] px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <span>مشاهده همه مجموعه‌ها</span>
                </button>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              
              {/* Previous Page Button */}
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onUpdateFilters({ page: currentPage - 1 })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  currentPage <= 1
                    ? 'opacity-40 cursor-not-allowed bg-transparent text-[#8C8375]'
                    : 'bg-white border border-[#D1C9BE] text-[#0F4C3A] hover:bg-[#0F4C3A] hover:text-white shadow-2xs'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
                <span>صفحه قبل</span>
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1.5">
                {pageNumbers.map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[#8C8375]">
                        ...
                      </span>
                    );
                  }

                  const pageNum = Number(p);
                  const isCurrent = pageNum === currentPage;

                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => onUpdateFilters({ page: pageNum })}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        isCurrent
                          ? 'bg-[#0F4C3A] text-white shadow-xs'
                          : 'bg-white border border-[#D1C9BE] text-[#2C3B37] hover:bg-[#F4EFE6]'
                      }`}
                    >
                      {toPersianDigits(pageNum)}
                    </button>
                  );
                })}
              </div>

              {/* Next Page Button */}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onUpdateFilters({ page: currentPage + 1 })}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  currentPage >= totalPages
                    ? 'opacity-40 cursor-not-allowed bg-transparent text-[#8C8375]'
                    : 'bg-white border border-[#D1C9BE] text-[#0F4C3A] hover:bg-[#0F4C3A] hover:text-white shadow-2xs'
                }`}
              >
                <span>صفحه بعد</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>

      </div>

      {/* Mobile Filter Drawer */}
      <ProductFilterMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        filters={filters}
        categories={categories}
        categoryFacets={categoryFacets}
        occasionFacets={occasionFacets}
        giftTypeFacets={giftTypeFacets}
        boxPackagingFacets={boxPackagingFacets}
        suitableForFacets={suitableForFacets}
        brandOriginFacets={brandOriginFacets}
        totalMatchingCount={totalCount}
        onUpdateFilters={onUpdateFilters}
        onResetFilters={onResetFilters}
      />

    </div>
  );
};
