import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { toPersianDigits, formatToman } from '../../utils/formatters';
import { Boxes, AlertTriangle, CheckCircle, Search, Save, RefreshCw, AlertCircle, Check, Loader2, Filter } from 'lucide-react';
import { api } from '../../services/api';

interface AdminInventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onSaveProducts?: (updated: Product[]) => void;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export const AdminInventory: React.FC<AdminInventoryProps> = ({
  products,
  setProducts,
  onSaveProducts,
  onRefresh,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Track modified stock: { [id: string]: { stockQuantity: number; inStock: boolean } }
  const [stockChanges, setStockChanges] = useState<{
    [id: string]: { stockQuantity: number; inStock: boolean };
  }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Clear stockChanges when products list changes from outside refresh
  useEffect(() => {
    setStockChanges({});
  }, [products]);

  // Dismiss feedback after 5 seconds
  useEffect(() => {
    if (feedback?.type === 'success') {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const lowStockCount = products.filter(
    (p) => p.inStock && (p.stockQuantity || 0) <= (p.lowStockThreshold || 5) && (p.stockQuantity || 0) > 0
  ).length;

  const outOfStockCount = products.filter((p) => !p.inStock || (p.stockQuantity || 0) === 0).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.titleFa.includes(searchTerm) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.includes(searchTerm);

    if (!matchesSearch) return false;

    const currentQty =
      stockChanges[p.id]?.stockQuantity !== undefined
        ? stockChanges[p.id].stockQuantity
        : p.stockQuantity || 0;
    const currentInStock =
      stockChanges[p.id]?.inStock !== undefined
        ? stockChanges[p.id].inStock
        : p.inStock;

    if (activeFilter === 'low') {
      return currentInStock && currentQty <= (p.lowStockThreshold || 5) && currentQty > 0;
    }
    if (activeFilter === 'out') {
      return !currentInStock || currentQty === 0;
    }
    return true;
  });

  const handleStockQuantityChange = (productId: string, val: number) => {
    const clampedVal = Math.max(0, isNaN(val) ? 0 : Math.round(val));
    const currentProduct = products.find((p) => p.id === productId);
    if (!currentProduct) return;

    setStockChanges((prev) => ({
      ...prev,
      [productId]: {
        stockQuantity: clampedVal,
        inStock: clampedVal > 0 ? (prev[productId]?.inStock ?? currentProduct.inStock) : false,
      },
    }));
  };

  const handleToggleInStock = (productId: string) => {
    const currentProduct = products.find((p) => p.id === productId);
    if (!currentProduct) return;

    const currentInStock =
      stockChanges[productId]?.inStock !== undefined
        ? stockChanges[productId].inStock
        : currentProduct.inStock;
    const currentQty =
      stockChanges[productId]?.stockQuantity !== undefined
        ? stockChanges[productId].stockQuantity
        : currentProduct.stockQuantity || 0;

    const nextInStock = !currentInStock;
    const nextQty = nextInStock && currentQty === 0 ? 10 : currentQty;

    setStockChanges((prev) => ({
      ...prev,
      [productId]: {
        stockQuantity: nextQty,
        inStock: nextInStock,
      },
    }));
  };

  // Save single product change to PostgreSQL
  const handleSaveSingleProduct = async (productId: string) => {
    const change = stockChanges[productId];
    if (!change || isSaving) return;

    setIsSaving(true);
    setSavingProductId(productId);
    setFeedback(null);

    try {
      const updatedProduct = await api.products.updateAdmin(productId, {
        stockQuantity: change.stockQuantity,
        inStock: change.inStock,
      });

      // Update state in React with fresh values from DB
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updatedProduct } : p))
      );

      // Remove saved product from pending changes
      setStockChanges((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });

      setFeedback({
        type: 'success',
        message: `موجودی کالای «${updatedProduct.titleFa || productId}» با موفقیت در پایگاه‌داده ذخیره شد.`,
      });
    } catch (err: any) {
      console.error('Failed to update stock in PostgreSQL:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'خطا در ثبت موجودی در پایگاه‌داده. لطفاً مجدداً تلاش کنید.',
      });
    } finally {
      setIsSaving(false);
      setSavingProductId(null);
    }
  };

  // Save all modified products to PostgreSQL
  const handleSaveAllStock = async () => {
    const changedIds = Object.keys(stockChanges);
    if (changedIds.length === 0 || isSaving) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      // Execute atomic updates across all modified items
      const updatePromises = changedIds.map(async (id) => {
        const change = stockChanges[id];
        return await api.products.updateAdmin(id, {
          stockQuantity: change.stockQuantity,
          inStock: change.inStock,
        });
      });

      const updatedProducts = await Promise.all(updatePromises);

      // Map newly updated products into the parent state
      const updatedMap = new Map(updatedProducts.map((p) => [p.id, p]));
      setProducts((prev) =>
        prev.map((p) => (updatedMap.has(p.id) ? { ...p, ...updatedMap.get(p.id) } : p))
      );

      if (onSaveProducts) {
        onSaveProducts(
          products.map((p) => (updatedMap.has(p.id) ? { ...p, ...updatedMap.get(p.id)! } : p))
        );
      }

      setStockChanges({});
      setFeedback({
        type: 'success',
        message: `تغییرات موجودی ${toPersianDigits(changedIds.length)} محصول با موفقیت در پایگاه‌داده PostgreSQL ذخیره و تثبیت شد.`,
      });

      // Trigger full database refresh if callback provided
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Failed to save stock changes to PostgreSQL:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'خطا در ذخیره‌سازی تغییرات موجودی در پایگاه‌داده. لطفاً اتصال را بررسی نمایید.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Manual refresh from database
  const handleManualRefresh = async () => {
    if (isManualRefreshing || isSaving) return;
    setIsManualRefreshing(true);
    setFeedback(null);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        const freshProducts = await api.products.getAll();
        if (Array.isArray(freshProducts)) {
          setProducts(freshProducts);
        }
      }
      setStockChanges({});
      setFeedback({
        type: 'success',
        message: 'آخرین اطلاعات موجودی با موفقیت از پایگاه‌داده بارگذاری شد.',
      });
    } catch (err: any) {
      console.error('Failed to refresh products from PostgreSQL:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'خطا در بارگذاری اطلاعات از پایگاه‌داده.',
      });
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const pendingChangesCount = Object.keys(stockChanges).length;
  const isCurrentlyBusy = isSaving || isLoading || isManualRefreshing;

  return (
    <div className="space-y-6 text-right">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F4C3A] flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#D4AF37]" />
            <span>مدیریت موجودی انبار و هشدار کسری</span>
          </h2>
          <p className="text-xs text-[#6A7873] mt-1">
            کنترل بلادرنگ موجودی فیزیکی هاردباکس‌ها، زعفران و اقلام کادویی در انبار مرکزی با ذخیره‌سازی مستقیم در پایگاه‌داده
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isCurrentlyBusy}
            title="بروزرسانی داده‌ها از پایگاه‌داده"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border border-[#D4AF37]/50 bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#0F4C3A] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${isManualRefreshing || isLoading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی از دیتابیس</span>
          </button>

          {/* Save All Stock Button */}
          <button
            type="button"
            onClick={handleSaveAllStock}
            disabled={pendingChangesCount === 0 || isCurrentlyBusy}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
              pendingChangesCount > 0 && !isCurrentlyBusy
                ? 'bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white cursor-pointer active:scale-95'
                : 'bg-[#EAE6DF] text-[#8C8375] cursor-not-allowed'
            }`}
          >
            {isSaving && !savingProductId ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
            ) : (
              <Save className="w-4 h-4 text-[#D4AF37]" />
            )}
            <span>
              {isSaving && !savingProductId
                ? 'در حال ذخیره‌سازی...'
                : `ذخیره تغییرات موجودی (${toPersianDigits(pendingChangesCount)})`}
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 px-2 py-0.5"
          >
            بستن
          </button>
        </div>
      )}

      {/* KPI Cards & Quick Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveFilter('all')}
          className={`p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            activeFilter === 'all'
              ? 'bg-white border-[#0F4C3A] shadow-md ring-2 ring-[#0F4C3A]/10'
              : 'bg-white border-[#EAE6DF] hover:border-[#0F4C3A]/40 shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs text-[#6A7873] font-medium">کل اقلام کاتالوگ</span>
            <p className="text-2xl font-extrabold text-[#0F4C3A] mt-1">
              {toPersianDigits(products.length)} قلم
            </p>
          </div>
          <div className={`p-3 rounded-xl ${activeFilter === 'all' ? 'bg-[#0F4C3A]/10 text-[#0F4C3A]' : 'bg-[#FAF8F5] text-[#6A7873]'}`}>
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('low')}
          className={`p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            activeFilter === 'low'
              ? 'bg-amber-50/70 border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-amber-200 hover:bg-amber-50/40 shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs text-amber-900 font-medium">اقلام در مرز اتمام (کمبود موجودی)</span>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">
              {toPersianDigits(lowStockCount)} محصول
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('out')}
          className={`p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            activeFilter === 'out'
              ? 'bg-red-50/70 border-red-500 shadow-md ring-2 ring-red-500/20'
              : 'bg-white border-red-200 hover:bg-red-50/40 shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs text-red-900 font-medium">محصولات اتمام موجودی (ناموجود)</span>
            <p className="text-2xl font-extrabold text-red-700 mt-1">
              {toPersianDigits(outOfStockCount)} محصول
            </p>
          </div>
          <div className="p-3 rounded-xl bg-red-100 text-red-700">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 bg-white p-3 rounded-2xl border border-[#EAE6DF] shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-[#8C8375] shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی محصول با نام، کد SKU یا دسته‌بندی..."
            className="w-full text-xs bg-transparent focus:outline-none text-[#1C2826]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-[10px] text-[#8C8375] hover:text-[#1C2826] px-2 py-0.5 bg-[#FAF8F5] rounded"
            >
              پاک کردن
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-[#EAE6DF] shadow-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'all'
                ? 'bg-[#0F4C3A] text-white shadow-xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            همه اقلام ({toPersianDigits(products.length)})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'low'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            کمبود موجودی ({toPersianDigits(lowStockCount)})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'out'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-800 hover:bg-red-50'
            }`}
          >
            ناموجود ({toPersianDigits(outOfStockCount)})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-[#FAF8F5] text-[#6A7873] border-b border-[#EAE6DF]">
              <tr>
                <th className="p-4 font-semibold">تصویر و نام محصول</th>
                <th className="p-4 font-semibold">کد کالا (SKU)</th>
                <th className="p-4 font-semibold">قیمت فروش</th>
                <th className="p-4 font-semibold text-center">وضعیت انبار</th>
                <th className="p-4 font-semibold text-center">تعداد موجود در انبار</th>
                <th className="p-4 font-semibold text-center">آستانه هشدار</th>
                <th className="p-4 font-semibold text-center">وضعیت عرضه</th>
                <th className="p-4 font-semibold text-center">ذخیره سریع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#6A7873]">
                    <Boxes className="w-10 h-10 mx-auto text-[#8C8375]/40 mb-2" />
                    <p className="font-bold">هیچ کالایی مطابق با فیلترهای انتخابی یافت نشد.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isModified = stockChanges[product.id] !== undefined;
                  const currentQty = isModified
                    ? stockChanges[product.id].stockQuantity
                    : product.stockQuantity || 0;
                  const currentInStock = isModified
                    ? stockChanges[product.id].inStock
                    : product.inStock;

                  const isLow = currentInStock && currentQty <= (product.lowStockThreshold || 5) && currentQty > 0;
                  const isOut = !currentInStock || currentQty === 0;
                  const isSavingThis = savingProductId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-[#FAF8F5]/60 transition ${
                        isModified ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.titleFa}
                            className="w-12 h-12 rounded-xl object-cover border border-[#EAE6DF] shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#0F4C3A]">{product.titleFa}</span>
                              {isModified && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-amber-300">
                                  تغییر یافته
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#6A7873] block mt-0.5">
                              {product.boxType || 'هاردباکس لوکس'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-[11px] text-[#2C3B37]">
                        {product.sku || product.id}
                      </td>

                      <td className="p-4 font-semibold text-[#0F4C3A]">
                        {formatToman(product.price)}
                      </td>

                      <td className="p-4 text-center">
                        {isOut ? (
                          <span className="inline-block bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            ناموجود در انبار
                          </span>
                        ) : isLow ? (
                          <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            کمبود موجودی ({toPersianDigits(currentQty)} عدد)
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            موجود و آماده ارسال
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isCurrentlyBusy || currentQty <= 0}
                            onClick={() => handleStockQuantityChange(product.id, currentQty - 1)}
                            className="w-7 h-7 bg-[#F4EFE6] hover:bg-[#EAE6DF] rounded-lg font-bold text-xs flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed"
                            title="کاهش یک عدد"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            disabled={isCurrentlyBusy}
                            value={currentQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleStockQuantityChange(product.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-14 text-center text-xs font-bold p-1 bg-[#FAF8F5] border border-[#E0D8C8] rounded-lg focus:border-[#0F4C3A] focus:outline-none disabled:opacity-50"
                          />
                          <button
                            type="button"
                            disabled={isCurrentlyBusy}
                            onClick={() => handleStockQuantityChange(product.id, currentQty + 1)}
                            className="w-7 h-7 bg-[#F4EFE6] hover:bg-[#EAE6DF] rounded-lg font-bold text-xs flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed"
                            title="افزایش یک عدد"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-center text-[#6A7873] font-bold">
                        {toPersianDigits(product.lowStockThreshold || 5)} عدد
                      </td>

                      <td className="p-4 text-center">
                        <button
                          type="button"
                          disabled={isCurrentlyBusy}
                          onClick={() => handleToggleInStock(product.id)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition ${
                            currentInStock
                              ? 'bg-[#0F4C3A]/10 text-[#0F4C3A] hover:bg-red-50 hover:text-red-700'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {currentInStock ? 'تغییر به ناموجود' : 'فعال‌سازی موجودی'}
                        </button>
                      </td>

                      <td className="p-4 text-center">
                        {isModified ? (
                          <button
                            type="button"
                            disabled={isCurrentlyBusy}
                            onClick={() => handleSaveSingleProduct(product.id)}
                            className="inline-flex items-center gap-1 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition shadow-xs disabled:opacity-50"
                          >
                            {isSavingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />
                            ) : (
                              <Save className="w-3 h-3 text-[#D4AF37]" />
                            )}
                            <span>ذخیره</span>
                          </button>
                        ) : (
                          <span className="text-[#8C8375] text-[10px] flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>تثبیت‌شده</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
