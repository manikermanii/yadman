import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Sparkles,
  Layers,
  Copy,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Eye,
  Tag,
  Image as ImageIcon,
  Film,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { Product, Category, CategoryId, ProductStatus } from '../../types';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { toast } from '../../context/ToastContext';

interface AdminProductsProps {
  products: Product[];
  categories?: Category[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => Promise<void> | void;
  onToggleStock: (productId: string) => void;
  onDuplicateProduct?: (product: Product) => void;
  onRefresh?: () => Promise<void> | void;
  isLoading?: boolean;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories = [],
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleStock,
  onDuplicateProduct,
  onRefresh,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryId>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_desc' | 'price_asc' | 'stock_desc' | 'rating'>('newest');

  // Deletion modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load fresh products from PostgreSQL when opening the section
  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const handleConfirmDelete = async () => {
    if (!productToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDeleteProduct(productToDelete.id);
      toast.success('پک هدیه با موفقیت حذف شد');
      setProductToDelete(null);
    } catch (err: any) {
      const errMsg = err?.message || 'خطا در حذف پک هدیه از سرور';
      setDeleteError(errMsg);
      toast.error('خطا در حذف پک هدیه', errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const categoryFilters: { id: CategoryId; nameFa: string }[] =
    categories && categories.length > 0
      ? [
          { id: 'all' as CategoryId, nameFa: 'همه دسته‌ها' },
          ...categories.map((c) => ({ id: c.id as CategoryId, nameFa: c.nameFa })),
        ]
      : [];

  // Filtering & Sorting logic
  const filteredProducts = products
    .filter((p) => {
      // Category filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

      // Product Status filter
      if (statusFilter !== 'all') {
        const prodStatus = p.status || (p.inStock ? 'active' : 'out_of_stock');
        if (prodStatus !== statusFilter) return false;
      }

      // Stock status filter
      if (stockFilter === 'in_stock' && (!p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0))) return false;
      if (stockFilter === 'out_of_stock' && (p.inStock && (p.stockQuantity === undefined || p.stockQuantity > 0))) return false;
      if (stockFilter === 'low_stock') {
        const isLow = p.inStock && p.stockQuantity !== undefined && p.stockQuantity <= (p.lowStockThreshold || 5);
        if (!isLow) return false;
      }

      // Search query (title, sku, tags, description, items)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.titleFa.toLowerCase().includes(q) || (p.titleEn && p.titleEn.toLowerCase().includes(q));
        const matchesSku = p.sku && p.sku.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesItems = p.itemsIncluded.some((item) => item.toLowerCase().includes(q));
        const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSku && !matchesDesc && !matchesItems && !matchesTags) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'stock_desc') return (b.stockQuantity || 0) - (a.stockQuantity || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // Default order
    });

  const getCategoryBadge = (cat: CategoryId) => {
    const matched = categories.find((c) => c.id === cat);
    if (matched) {
      return (
        <span className="bg-[#0F4C3A]/10 text-[#0F4C3A] text-[10px] font-bold px-2 py-0.5 rounded-md">
          {matched.nameFa}
        </span>
      );
    }
    return (
      <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
        {cat || 'بدون دسته‌بندی'}
      </span>
    );
  };

  const getStatusBadge = (status?: ProductStatus, inStock?: boolean) => {
    if (status === 'draft') {
      return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md">پیش‌نویس</span>;
    }
    if (status === 'archived') {
      return <span className="bg-zinc-200 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-md">بایگانی</span>;
    }
    if (status === 'out_of_stock' || !inStock) {
      return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">ناموجود</span>;
    }
    return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">فعال در ویترین</span>;
  };

  const handleDuplicate = (product: Product) => {
    if (onDuplicateProduct) {
      onDuplicateProduct(product);
    } else {
      const duplicated: Product = {
        ...product,
        id: `gift-${Date.now()}`,
        sku: `${product.sku}-COPY`,
        titleFa: `${product.titleFa} (کپی)`,
        status: 'draft',
      };
      onEditProduct(duplicated);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F4C3A]">
            مدیریت محصولات، پک‌های هدیه و گالری تصاویر
          </h1>
          <p className="text-xs text-[#6A7873] mt-1">
            ایجاد و ویرایش محصول، گالری تصاویر نامحدود، تعیین موجودی انبار، برچسب‌ها، تنوع و تنظیمات سئو
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#0F4C3A] border border-[#E0D8C8] px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
              title="بارگذاری مجدد محصولات از پایگاه‌داده"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
              <span className="hidden sm:inline">بروزرسانی از دیتابیس</span>
            </button>
          )}

          <button
            onClick={onAddProduct}
            id="admin-add-product-btn"
            className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>افزودن محصول جدید</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        
        {/* Categories Bar */}
        {categoryFilters.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoryFilters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  categoryFilter === cat.id
                    ? 'bg-[#0F4C3A] text-white shadow-xs'
                    : 'bg-[#F4EFE6] text-[#2C3B37] hover:bg-[#EAE6DF]'
                }`}
              >
                {cat.nameFa}
              </button>
            ))}
          </div>
        )}

        {/* Search, Status & Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در عنوان، کد کالا (SKU)، برچسب‌ها یا اقلام پک..."
              className="w-full bg-[#FAF8F5] text-xs text-[#1C2826] pr-10 pl-4 py-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
            />
            <Search className="w-4 h-4 text-[#8C8375] absolute right-3.5 top-3" />
          </div>

          {/* Stock & Status Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full bg-[#FAF8F5] text-xs font-bold text-[#0F4C3A] p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
            >
              <option value="all">فیلتر موجودی: همه موارد</option>
              <option value="in_stock">فقط موجود در انبار</option>
              <option value="low_stock">⚠️ رو به اتمام (هشدار کسری)</option>
              <option value="out_of_stock">❌ ناموجود</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#FAF8F5] text-xs font-bold text-[#0F4C3A] p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
            >
              <option value="newest">مرتب‌سازی: پیش‌فرض</option>
              <option value="price_desc">قیمت: گران‌ترین به ارزان‌ترین</option>
              <option value="price_asc">قیمت: ارزان‌ترین به گران‌ترین</option>
              <option value="stock_desc">موجودی: بیشترین تعداد انبار</option>
              <option value="rating">بالاترین امتیاز مشتریان</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-[11px] text-[#6A7873] pt-1">
          <span>نمایش {toPersianDigits(filteredProducts.length)} محصول از مجموع {toPersianDigits(products.length)} محصول</span>
          {(searchQuery || categoryFilter !== 'all' || stockFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStockFilter('all');
                setStatusFilter('all');
              }}
              className="text-rose-600 hover:underline font-bold"
            >
              پاک‌کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-[#8C8375] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] mx-auto flex items-center justify-center text-[#8C8375]">
              <Search className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm text-[#0F4C3A]">هیچ محصولی با معیارهای جستجوی شما یافت نشد!</div>
            <p className="text-xs">برای مشاهده محصولات، فیلترها را تغییر داده یا محصول جدیدی اضافه کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#6A7873] font-bold">
                  <th className="py-4 pr-6">تصویر و گالری</th>
                  <th className="py-4">عنوان محصول و کد SKU</th>
                  <th className="py-4">دسته‌بندی</th>
                  <th className="py-4">قیمت و تخفیف</th>
                  <th className="py-4">وضعیت انبار</th>
                  <th className="py-4">وضعیت نمایش</th>
                  <th className="py-4 pl-6 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFE6]">
                {filteredProducts.map((product) => {
                  const imageCount = product.images?.length || (product.additionalImages?.length ? product.additionalImages.length + 1 : 1);
                  const isLowStock = product.inStock && product.stockQuantity !== undefined && product.stockQuantity <= (product.lowStockThreshold || 5);

                  return (
                    <tr key={product.id} className="hover:bg-[#FAF8F5] transition">
                      
                      {/* Image & Gallery Count */}
                      <td className="py-3.5 pr-6">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-[#EAE6DF] bg-[#F4EFE6] group">
                          <img
                            src={product.image}
                            alt={product.titleFa}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {imageCount > 1 && (
                            <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 backdrop-blur-xs">
                              <ImageIcon className="w-2.5 h-2.5 text-[#D4AF37]" />
                              <span>{imageCount}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title & SKU */}
                      <td className="py-3.5 max-w-[260px]">
                        <div className="font-extrabold text-[#0F4C3A] text-sm line-clamp-1">
                          {product.titleFa}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#6A7873] font-mono">
                            SKU: {product.sku || product.id}
                          </span>
                          {product.titleEn && (
                            <span className="text-[10px] text-[#8C8375] font-english-serif line-clamp-1 truncate">
                              • {product.titleEn}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.badge && (
                            <span className="text-[9px] bg-[#D4AF37]/20 text-[#0F4C3A] font-bold px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                              {product.badge}
                            </span>
                          )}
                          {product.videos && product.videos.length > 0 && (
                            <span className="text-[9px] bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                              <Film className="w-2.5 h-2.5 text-rose-600" />
                              <span>ویدیو ({toPersianDigits(product.videos.length)})</span>
                            </span>
                          )}
                          {product.hasVariants && (
                            <span className="text-[9px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              دارای تنوع
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5">
                        {getCategoryBadge(product.category)}
                      </td>

                      {/* Price & Discount */}
                      <td className="py-3.5">
                        <div className="font-extrabold text-[#0F4C3A]">
                          {formatToman(product.price)}
                        </div>
                        {product.oldPrice && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-[#8C8375] line-through">
                              {formatToman(product.oldPrice)}
                            </span>
                            {product.discountPercent && (
                              <span className="text-[9px] text-rose-600 bg-rose-50 font-bold px-1.5 py-0.2 rounded">
                                {toPersianDigits(product.discountPercent)}٪-
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5">
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => onToggleStock(product.id)}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition ${
                              product.inStock
                                ? isLowStock
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {product.inStock ? (
                              isLowStock ? (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>{toPersianDigits(product.stockQuantity ?? 0)} عدد (رو به اتمام)</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>{toPersianDigits(product.stockQuantity ?? 0)} عدد موجود</span>
                                </>
                              )
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>اتمام موجودی</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Display Status */}
                      <td className="py-3.5">
                        {getStatusBadge(product.status, product.inStock)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 pl-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditProduct(product)}
                            className="bg-[#F4EFE6] hover:bg-[#0F4C3A] hover:text-white text-[#0F4C3A] px-3 py-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold shadow-xs"
                            title="ویرایش کامل محصول و گالری"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>ویرایش</span>
                          </button>

                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-1.5 text-gray-500 hover:text-[#0F4C3A] hover:bg-[#FAF8F5] rounded-lg transition"
                            title="ایجاد کپی از این محصول"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteError(null);
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف پک هدیه"
                            id={`btn-delete-product-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          id="product-delete-modal-overlay"
        >
          <div
            className="bg-[#FAF8F5] w-full max-w-md rounded-2xl border border-rose-200 shadow-2xl p-6 space-y-4 text-right"
            id="product-delete-modal"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <h3 className="font-extrabold text-[#800020] text-base flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span>حذف پک هدیه</span>
              </h3>
              <button
                type="button"
                onClick={() => !isDeleting && setProductToDelete(null)}
                disabled={isDeleting}
                className="p-1 text-[#6A7873] hover:text-[#1C2826] rounded-lg disabled:opacity-50 transition cursor-pointer"
                title="انصراف و بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 text-[#1C2826]">
              <p className="font-bold text-sm text-[#1C2826]">
                آیا از حذف این پک هدیه مطمئن هستید؟
              </p>

              <div className="bg-white p-3 rounded-xl border border-[#EAE6DF] flex items-center gap-3">
                <img
                  src={productToDelete.image}
                  alt={productToDelete.titleFa}
                  className="w-12 h-12 rounded-lg object-cover border border-[#EAE6DF] shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-[#0F4C3A] truncate">
                    {productToDelete.titleFa}
                  </p>
                  <p className="text-[11px] text-[#6A7873] mt-0.5">
                    کد شناسه (SKU): {productToDelete.sku}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#6A7873] leading-relaxed">
                این عملیات پک هدیه را از پایگاه‌داده و فهرست فروشگاه حذف می‌کند.
              </p>
            </div>

            {/* Error Display */}
            {deleteError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{deleteError}</span>
              </div>
            )}

            {/* Modal Footer: Cancel / Delete */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EAE6DF]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6A7873] hover:text-[#1C2826] hover:bg-[#EAE6DF]/40 rounded-xl transition disabled:opacity-50 cursor-pointer"
                id="btn-cancel-delete-product"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                id="btn-confirm-delete-product"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'در حال حذف...' : 'حذف'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
