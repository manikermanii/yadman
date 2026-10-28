import { Product, Category, ProductFilterState, FilterFacetOption, SortOptionKey } from '../types';
import { formatToman } from './formatters';

export const ITEMS_PER_PAGE = 9;

export const PRICE_PRESETS = [
  { id: 'all', label: 'همه قیمت‌ها', min: 0, max: 20000000 },
  { id: 'under_2m', label: 'زیر ۲ میلیون تومان', min: 0, max: 2000000 },
  { id: '2m_5m', label: '۲ تا ۵ میلیون تومان', min: 2000000, max: 5000000 },
  { id: '5m_8m', label: '۵ تا ۸ میلیون تومان', min: 5000000, max: 8000000 },
  { id: 'above_8m', label: 'بالای ۸ میلیون تومان', min: 8000000, max: 30000000 },
];

export const SORT_OPTIONS: { key: SortOptionKey; label: string }[] = [
  { key: 'bestseller', label: 'پرفروش‌ترین' },
  { key: 'popular', label: 'محبوب‌ترین (امتیاز بالا)' },
  { key: 'newest', label: 'جدیدترین' },
  { key: 'price_asc', label: 'ارزان‌ترین' },
  { key: 'price_desc', label: 'گران‌ترین' },
  { key: 'discount', label: 'بیشترین تخفیف' },
];

export const DEFAULT_FILTER_STATE: ProductFilterState = {
  category: 'all',
  searchQuery: '',
  minPrice: 0,
  maxPrice: 20000000,
  pricePreset: 'all',
  occasions: [],
  giftTypes: [],
  boxPackagingTypes: [],
  suitableFor: [],
  brandOrigins: [],
  inStockOnly: false,
  discountOnly: false,
  minRating: 0,
  sortBy: 'bestseller',
  page: 1,
};

/**
 * Filter & Sort products with high performance and pure AND-logic across criteria
 */
export function filterAndSortProducts(
  products: Product[],
  filters: ProductFilterState,
  itemsPerPage = ITEMS_PER_PAGE
): {
  filteredProducts: Product[];
  totalCount: number;
  totalPages: number;
  paginatedProducts: Product[];
} {
  // 1. Filter
  const filtered = products.filter((product) => {
    // Category
    if (filters.category && filters.category !== 'all') {
      if (product.category !== filters.category) return false;
    }

    // Search Query (Text match on title, description, tags, items included, occasion, box)
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      const matchTitleFa = product.titleFa.toLowerCase().includes(q);
      const matchTitleEn = product.titleEn ? product.titleEn.toLowerCase().includes(q) : false;
      const matchDesc = product.description.toLowerCase().includes(q);
      const matchTags = product.tags ? product.tags.some((t) => t.toLowerCase().includes(q)) : false;
      const matchItems = product.itemsIncluded.some((item) => item.toLowerCase().includes(q));
      const matchBox = product.boxType.toLowerCase().includes(q);
      const matchBrand = product.brandOrigin ? product.brandOrigin.toLowerCase().includes(q) : false;
      const matchOccasion = product.occasions ? product.occasions.some((o) => o.toLowerCase().includes(q)) : false;

      if (
        !matchTitleFa &&
        !matchTitleEn &&
        !matchDesc &&
        !matchTags &&
        !matchItems &&
        !matchBox &&
        !matchBrand &&
        !matchOccasion
      ) {
        return false;
      }
    }

    // Price range
    if (filters.minPrice > 0 && product.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice < 20000000 && product.price > filters.maxPrice) {
      return false;
    }

    // In Stock Only
    if (filters.inStockOnly) {
      if (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
        return false;
      }
    }

    // Discount Only
    if (filters.discountOnly) {
      const hasDiscount =
        (product.discountPercent && product.discountPercent > 0) ||
        (product.oldPrice && product.oldPrice > product.price);
      if (!hasDiscount) return false;
    }

    // Rating Threshold
    if (filters.minRating > 0 && product.rating < filters.minRating) {
      return false;
    }

    // Occasions (Any of selected occasions)
    if (filters.occasions.length > 0) {
      if (!product.occasions || !product.occasions.some((occ) => filters.occasions.includes(occ))) {
        return false;
      }
    }

    // Gift Types
    if (filters.giftTypes.length > 0) {
      if (!product.giftType || !filters.giftTypes.includes(product.giftType)) {
        return false;
      }
    }

    // Box Packaging Types
    if (filters.boxPackagingTypes.length > 0) {
      if (!product.boxPackagingType || !filters.boxPackagingTypes.includes(product.boxPackagingType)) {
        return false;
      }
    }

    // Suitable For
    if (filters.suitableFor.length > 0) {
      if (!product.suitableFor || !product.suitableFor.some((sf) => filters.suitableFor.includes(sf))) {
        return false;
      }
    }

    // Brand Origins
    if (filters.brandOrigins.length > 0) {
      if (!product.brandOrigin || !filters.brandOrigins.includes(product.brandOrigin)) {
        return false;
      }
    }

    return true;
  });

  // 2. Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'bestseller':
        return (b.salesCount || b.reviewsCount || 0) - (a.salesCount || a.reviewsCount || 0);
      case 'popular':
        return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
      case 'newest':
        return new Date(b.createdAt || '2026-01-01').getTime() - new Date(a.createdAt || '2026-01-01').getTime();
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'discount': {
        const discountA = a.discountPercent || (a.oldPrice ? ((a.oldPrice - a.price) / a.oldPrice) * 100 : 0);
        const discountB = b.discountPercent || (b.oldPrice ? ((b.oldPrice - b.price) / b.oldPrice) * 100 : 0);
        return discountB - discountA;
      }
      default:
        return 0;
    }
  });

  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const currentPage = Math.min(Math.max(1, filters.page), totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sorted.slice(startIndex, startIndex + itemsPerPage);

  return {
    filteredProducts: sorted,
    totalCount,
    totalPages,
    paginatedProducts,
  };
}

/**
 * Extract distinct Occasion Facets with product counts
 */
export function getOccasionFacets(products: Product[] = []): FilterFacetOption[] {
  const counts: Record<string, number> = {};
  (products || []).forEach((p) => {
    if (p && p.occasions) {
      (p.occasions || []).forEach((occ) => {
        if (occ) counts[occ] = (counts[occ] || 0) + 1;
      });
    }
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Extract distinct Gift Type Facets
 */
export function getGiftTypeFacets(products: Product[] = []): FilterFacetOption[] {
  const counts: Record<string, number> = {};
  (products || []).forEach((p) => {
    if (p && p.giftType) {
      counts[p.giftType] = (counts[p.giftType] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Extract distinct Box Packaging Type Facets
 */
export function getBoxPackagingFacets(products: Product[] = []): FilterFacetOption[] {
  const counts: Record<string, number> = {};
  (products || []).forEach((p) => {
    if (p && p.boxPackagingType) {
      counts[p.boxPackagingType] = (counts[p.boxPackagingType] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Extract distinct Suitable For Facets
 */
export function getSuitableForFacets(products: Product[] = []): FilterFacetOption[] {
  const counts: Record<string, number> = {};
  (products || []).forEach((p) => {
    if (p && p.suitableFor) {
      (p.suitableFor || []).forEach((sf) => {
        if (sf) counts[sf] = (counts[sf] || 0) + 1;
      });
    }
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Extract distinct Brand / Origin Facets
 */
export function getBrandOriginFacets(products: Product[] = []): FilterFacetOption[] {
  const counts: Record<string, number> = {};
  (products || []).forEach((p) => {
    if (p && p.brandOrigin) {
      counts[p.brandOrigin] = (counts[p.brandOrigin] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Extract Category Facets with live counts
 */
export function getCategoryFacets(categories: Category[] = [], products: Product[] = []): FilterFacetOption[] {
  return (categories || []).map((cat) => {
    const count =
      cat.id === 'all'
        ? (products || []).length
        : (products || []).filter((p) => p && p.category === cat.id).length;
    return {
      value: cat.id,
      label: cat.nameFa,
      count,
      iconName: cat.iconName,
    };
  });
}

/**
 * Parse filter state from URL search params
 */
export function parseFiltersFromUrl(
  searchString: string,
  defaults: ProductFilterState = DEFAULT_FILTER_STATE
): ProductFilterState {
  if (!searchString || searchString === '?') return { ...defaults };
  const params = new URLSearchParams(searchString);

  const category = (params.get('category') as any) || defaults.category;
  const searchQuery = params.get('q') || params.get('search') || defaults.searchQuery;
  const minPrice = params.has('minPrice') ? Number(params.get('minPrice')) || 0 : defaults.minPrice;
  const maxPrice = params.has('maxPrice') ? Number(params.get('maxPrice')) || 20000000 : defaults.maxPrice;
  const pricePreset = params.get('pricePreset') || defaults.pricePreset;

  const occasions = params.get('occasions') ? params.get('occasions')!.split(',').filter(Boolean) : [];
  const giftTypes = params.get('giftTypes') ? params.get('giftTypes')!.split(',').filter(Boolean) : [];
  const boxPackagingTypes = params.get('boxTypes') ? params.get('boxTypes')!.split(',').filter(Boolean) : [];
  const suitableFor = params.get('suitableFor') ? params.get('suitableFor')!.split(',').filter(Boolean) : [];
  const brandOrigins = params.get('brands') ? params.get('brands')!.split(',').filter(Boolean) : [];

  const inStockOnly = params.get('inStock') === 'true';
  const discountOnly = params.get('discount') === 'true';
  const minRating = params.has('minRating') ? Number(params.get('minRating')) || 0 : 0;
  const sortBy = (params.get('sort') as SortOptionKey) || defaults.sortBy;
  const page = params.has('page') ? Number(params.get('page')) || 1 : 1;

  return {
    category,
    searchQuery,
    minPrice,
    maxPrice,
    pricePreset,
    occasions,
    giftTypes,
    boxPackagingTypes,
    suitableFor,
    brandOrigins,
    inStockOnly,
    discountOnly,
    minRating,
    sortBy,
    page,
  };
}

/**
 * Serialize filter state to URL query string
 */
export function serializeFiltersToUrl(filters: ProductFilterState): string {
  const params = new URLSearchParams();

  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category);
  }
  if (filters.searchQuery && filters.searchQuery.trim()) {
    params.set('q', filters.searchQuery.trim());
  }
  if (filters.minPrice > 0) {
    params.set('minPrice', filters.minPrice.toString());
  }
  if (filters.maxPrice < 20000000) {
    params.set('maxPrice', filters.maxPrice.toString());
  }
  if (filters.pricePreset && filters.pricePreset !== 'all') {
    params.set('pricePreset', filters.pricePreset);
  }
  if (filters.occasions.length > 0) {
    params.set('occasions', filters.occasions.join(','));
  }
  if (filters.giftTypes.length > 0) {
    params.set('giftTypes', filters.giftTypes.join(','));
  }
  if (filters.boxPackagingTypes.length > 0) {
    params.set('boxTypes', filters.boxPackagingTypes.join(','));
  }
  if (filters.suitableFor.length > 0) {
    params.set('suitableFor', filters.suitableFor.join(','));
  }
  if (filters.brandOrigins.length > 0) {
    params.set('brands', filters.brandOrigins.join(','));
  }
  if (filters.inStockOnly) {
    params.set('inStock', 'true');
  }
  if (filters.discountOnly) {
    params.set('discount', 'true');
  }
  if (filters.minRating > 0) {
    params.set('minRating', filters.minRating.toString());
  }
  if (filters.sortBy && filters.sortBy !== 'bestseller') {
    params.set('sort', filters.sortBy);
  }
  if (filters.page > 1) {
    params.set('page', filters.page.toString());
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Count active filters (excluding defaults)
 */
export function countActiveFilters(filters: ProductFilterState): number {
  let count = 0;
  if (filters.category && filters.category !== 'all') count++;
  if (filters.searchQuery && filters.searchQuery.trim()) count++;
  if (filters.minPrice > 0 || filters.maxPrice < 20000000) count++;
  if (filters.occasions.length > 0) count += filters.occasions.length;
  if (filters.giftTypes.length > 0) count += filters.giftTypes.length;
  if (filters.boxPackagingTypes.length > 0) count += filters.boxPackagingTypes.length;
  if (filters.suitableFor.length > 0) count += filters.suitableFor.length;
  if (filters.brandOrigins.length > 0) count += filters.brandOrigins.length;
  if (filters.inStockOnly) count++;
  if (filters.discountOnly) count++;
  if (filters.minRating > 0) count++;
  return count;
}
