import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Edit, Trash2, Sliders, Save, Sparkles, RefreshCw, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { CustomContentItem } from '../../types';
import { formatToman } from '../../utils/formatters';

interface AdminCustomItemsProps {
  customItems: CustomContentItem[];
  onUpdateCustomItem: (item: CustomContentItem) => Promise<any> | any;
  onAddCustomItem: (item: CustomContentItem) => Promise<any> | any;
  onDeleteCustomItem: (id: string) => Promise<any> | any;
  onRefresh?: () => Promise<any> | any;
  isLoading?: boolean;
}

export const AdminCustomItems: React.FC<AdminCustomItemsProps> = ({
  customItems,
  onUpdateCustomItem,
  onAddCustomItem,
  onDeleteCustomItem,
  onRefresh,
  isLoading = false,
}) => {
  const [editingItem, setEditingItem] = useState<CustomContentItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CustomContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [nameFa, setNameFa] = useState('');
  const [category, setCategory] = useState<CustomContentItem['category']>('saffron');
  const [price, setPrice] = useState<number>(500000);
  const [weightGrams, setWeightGrams] = useState<number>(100);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [inStock, setInStock] = useState<boolean>(true);

  // Load fresh items from PostgreSQL when opening the section
  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const filteredItems = customItems.filter(
    (item) =>
      !searchQuery ||
      item.nameFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEdit = (item: CustomContentItem) => {
    setEditingItem(item);
    setIsNew(false);
    setNameFa(item.nameFa);
    setCategory(item.category);
    setPrice(item.price);
    setWeightGrams(item.weightGrams);
    setDescription(item.description);
    setImage(item.image);
    setInStock(item.inStock !== false);
    setFeedback(null);
  };

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditingItem({
      id: `custom-item-${Date.now()}`,
      nameFa: '',
      category: 'saffron',
      price: 650000,
      weightGrams: 150,
      description: '',
      image: customItems[0]?.image || '',
      inStock: true,
    });
    setNameFa('');
    setCategory('saffron');
    setPrice(650000);
    setWeightGrams(150);
    setDescription('');
    setImage(customItems[0]?.image || '');
    setInStock(true);
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFa || !editingItem || isSubmitting) return;

    const saved: CustomContentItem = {
      ...editingItem,
      nameFa: nameFa.trim(),
      category,
      price: Number(price) || 0,
      weightGrams: Number(weightGrams) || 0,
      description: description.trim(),
      image: (image || editingItem.image || '').trim(),
      inStock: inStock !== false,
    };

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (isNew) {
        await onAddCustomItem(saved);
        setFeedback({ type: 'success', message: `قلم «${saved.nameFa}» با موفقیت در پایگاه‌داده ایجاد شد.` });
      } else {
        await onUpdateCustomItem(saved);
        setFeedback({ type: 'success', message: `قلم «${saved.nameFa}» با موفقیت در پایگاه‌داده بروزرسانی شد.` });
      }
      setEditingItem(null);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'خطا در ثبت اطلاعات قلم در پایگاه‌داده.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || isDeleting) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      await onDeleteCustomItem(itemToDelete.id);
      setFeedback({ type: 'success', message: `قلم «${itemToDelete.nameFa}» با موفقیت از پایگاه‌داده حذف شد.` });
      setItemToDelete(null);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'خطا در حذف قلم از پایگاه‌داده.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F4C3A]">
            مدیریت اقلام و متریال ساخت باکس اختصاصی
          </h1>
          <p className="text-xs text-[#6A7873] mt-1">
            ویرایش قیمت، وزن و مشخصات زعفران، صنایع دستی، دمنوش‌ها و اکسسوری‌های قابل انتخاب در استودیوی ساخت باکس
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#0F4C3A] border border-[#E0D8C8] px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              title="بارگذاری مجدد از پایگاه‌داده"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">بروزرسانی از دیتابیس</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>افزودن قلم جدید</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between animate-fadeIn ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl border border-[#EAE6DF] shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در میان اقلام داخل باکس..."
            className="w-full bg-[#FAF8F5] text-xs text-[#1C2826] pr-10 pl-4 py-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
          />
          <Search className="w-4 h-4 text-[#8C8375] absolute right-3.5 top-3" />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE6DF] space-y-3">
          <Loader2 className="w-8 h-8 text-[#0F4C3A] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#6A7873]">در حال بارگذاری اقلام از پایگاه‌داده PostgreSQL...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE6DF] space-y-3 text-[#6A7873]">
          <Sliders className="w-10 h-10 text-[#D4AF37] mx-auto opacity-70" />
          <h3 className="font-bold text-sm text-[#0F4C3A]">هنوز قلمی برای ساخت پک اختصاصی تعریف نشده است</h3>
          <p className="text-xs max-w-sm mx-auto">
            برای ایجاد اولین آیتم سفارشی، روی دکمه «افزودن قلم جدید» کلیک نمایید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border border-[#EAE6DF] shadow-xs space-y-3 flex flex-col justify-between hover:border-[#D4AF37] transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#0F4C3A]">{item.nameFa}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.inStock !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {item.inStock !== false ? 'موجود' : 'ناموجود'}
                    </span>
                    <span className="text-[10px] bg-[#F4EFE6] text-[#0F4C3A] font-bold px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#4A5A55] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F4EFE6] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8C8375] block">قیمت:</span>
                  <span className="font-extrabold text-sm text-[#0F4C3A]">
                    {formatToman(item.price)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="bg-[#F4EFE6] hover:bg-[#0F4C3A] hover:text-white text-[#0F4C3A] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="حذف قلم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal (In-App Modal) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="bg-white w-full max-w-md rounded-3xl border border-[#EAE6DF] shadow-2xl p-6 text-right space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#1C2826]">تایید حذف قلم کالا</h3>
                <p className="text-xs text-[#6A7873] mt-0.5">این عملیات از پایگاه‌داده غیرقابل بازگشت است.</p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E0D8C8]/60 space-y-1 text-xs">
              <p className="font-bold text-[#0F4C3A]">{itemToDelete.nameFa}</p>
              <p className="text-[#6A7873]">قیمت: {formatToman(itemToDelete.price)} | دسته‌بندی: {itemToDelete.category}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-[#D0C8B8] font-bold text-xs hover:bg-[#F4EFE6] transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>حذف از پایگاه‌داده</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div
            className="bg-[#FAF8F5] w-full max-w-xl rounded-3xl border-2 border-[#D4AF37]/50 shadow-2xl overflow-hidden text-right relative p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <h2 className="font-extrabold text-base text-[#0F4C3A] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#D4AF37]" />
                {isNew ? 'افزودن متریال / محصول جدید برای باکس' : `ویرایش: ${editingItem.nameFa}`}
              </h2>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-[#0F4C3A] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#0F4C3A] mb-1">نام قلم کالا: *</label>
                <input
                  type="text"
                  required
                  value={nameFa}
                  onChange={(e) => setNameFa(e.target.value)}
                  placeholder="مثال: زعفران سوپر نگین صادراتی (۳ مثقال)"
                  className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">دسته‌بندی:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  >
                    <option value="saffron">زعفران و هل</option>
                    <option value="sweets">شیرینی و گز و نبات</option>
                    <option value="crafts">صنایع دستی و هاون</option>
                    <option value="drinks">دمنوش و چای</option>
                    <option value="scent">عطر و گلاب و شمع</option>
                    <option value="cards">کتاب و دیوان حافظ</option>
                    <option value="nuts">آجیل و خشکبار</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">قیمت (تومان): *</label>
                  <input
                    type="number"
                    required
                    step={10000}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] font-bold text-[#0F4C3A] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">وزن تقریبی (گرم):</label>
                  <input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(Number(e.target.value))}
                    className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">آدرس تصویر (URL):</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none ltr text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F4C3A] mb-1">توضیح کوتاه:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیح خاستگاه، کیفیت یا ظرف..."
                  className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F4C3A]">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 text-[#0F4C3A] rounded border-gray-300"
                  />
                  <span>موجود در انبار و قابل انتخاب در باکس اختصاصی</span>
                </label>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[#EAE6DF]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-[#D0C8B8] font-bold text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  ) : (
                    <Save className="w-4 h-4 text-[#D4AF37]" />
                  )}
                  <span>{isSubmitting ? 'در حال ذخیره...' : 'ذخیره در پایگاه‌داده'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
