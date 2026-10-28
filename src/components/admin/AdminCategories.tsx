import React, { useState, useEffect } from 'react';
import { Category, CategoryId } from '../../types';
import { toPersianDigits } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Tag, Check, CheckCircle2, X, Sparkles, Layers, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

interface AdminCategoriesProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  onSaveCategories: (updated: Category[]) => void;
  onRefresh?: () => Promise<void> | void;
  isLoading?: boolean;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  setCategories,
  onSaveCategories,
  onRefresh,
  isLoading = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successCatName, setSuccessCatName] = useState('');

  // Deletion state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states
  const [nameFa, setNameFa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Load fresh categories from PostgreSQL when opening the section
  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setNameFa('');
    setNameEn('');
    setSlug('');
    setDescriptionFa('');
    setIsFeatured(false);
    setSubmitError(null);
    setIsSuccess(false);
    setSuccessCatName('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setNameFa(cat.nameFa);
    setNameEn(cat.nameEn);
    setSlug(cat.slug);
    setDescriptionFa(cat.descriptionFa);
    setIsFeatured(!!cat.isFeatured);
    setSubmitError(null);
    setIsSuccess(false);
    setSuccessCatName('');
    setIsModalOpen(true);
  };

  const handleRequestDelete = (cat: Category) => {
    if (cat.id === 'all') {
      alert('دسته «همه مجموعه‌ها» قابل حذف نمی‌باشد.');
      return;
    }
    setCategoryToDelete(cat);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.categories.deleteAdmin(categoryToDelete.id);
      const updated = categories.filter((c) => c.id !== categoryToDelete.id);
      setCategories(updated);
      onSaveCategories(updated);
      setCategoryToDelete(null);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'خطا در حذف دسته‌بندی از سرور');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFa || !slug) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editingCategory) {
        const payload = {
          nameFa,
          nameEn: nameEn || '',
          slug,
          descriptionFa,
          isFeatured,
        };
        const updatedFromApi = await api.categories.updateAdmin(editingCategory.id, payload);
        const updated = categories.map((c) =>
          c.id === editingCategory.id ? { ...c, ...payload, ...updatedFromApi } : c
        );
        setCategories(updated);
        onSaveCategories(updated);
      } else {
        const newId = `cat_${Date.now()}` as CategoryId;
        const payload: Partial<Category> = {
          id: newId,
          nameFa,
          nameEn: nameEn || 'Custom Category',
          slug,
          descriptionFa,
          isFeatured,
          iconName: 'Gift',
        };
        const createdFromApi = await api.categories.createAdmin(payload);
        const newCat: Category = {
          ...payload,
          ...createdFromApi,
          id: createdFromApi?.id || newId,
          nameFa: createdFromApi?.nameFa || nameFa,
          nameEn: createdFromApi?.nameEn || nameEn || 'Custom Category',
          slug: createdFromApi?.slug || slug,
          descriptionFa: createdFromApi?.descriptionFa || descriptionFa,
          isFeatured: Boolean(createdFromApi?.isFeatured ?? isFeatured),
          iconName: createdFromApi?.iconName || 'Gift',
        };
        const updated = [...categories, newCat];
        setCategories(updated);
        onSaveCategories(updated);
      }

      setSuccessCatName(nameFa);
      setIsSuccess(true);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'خطا در ذخیره دسته‌بندی در پایگاه‌داده');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F4C3A] flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#D4AF37]" />
            <span>مدیریت دسته‌بندی‌های محصولات</span>
          </h2>
          <p className="text-xs text-[#6A7873] mt-1">
            تعریف، ویرایش و ساماندهی دسته‌های هدیه شخصی و هدایای سازمانی با قابلیت سئو
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#0F4C3A] border border-[#E0D8C8] px-3.5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
              title="بارگذاری مجدد دسته‌بندی‌ها از پایگاه‌داده"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
              <span className="hidden sm:inline">بروزرسانی از دیتابیس</span>
            </button>
          )}

          <button
            onClick={openCreateModal}
            id="btn-add-category"
            className="flex items-center justify-center gap-2 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>افزودن دسته‌بندی جدید</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#EAE6DF] text-center space-y-3 text-[#6A7873]">
          <Tag className="w-10 h-10 text-[#D4AF37] mx-auto opacity-70" />
          <h3 className="font-bold text-sm text-[#0F4C3A]">هنوز دسته‌بندی جدیدی اضافه نشده است</h3>
          <p className="text-xs max-w-sm mx-auto">
            برای ایجاد اولین دسته‌بندی محصولات، بر روی دکمه «افزودن دسته‌بندی جدید» کلیک کنید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs hover:border-[#D4AF37]/50 transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F4C3A] text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    {cat.nameFa}
                  </span>
                  {cat.isFeatured && (
                    <span className="bg-[#0F4C3A]/10 text-[#0F4C3A] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      ویژه
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#6A7873] font-english-serif tracking-wider">
                  {cat.nameEn}
                </p>

                <p className="text-xs text-[#3A4A45] line-clamp-2 leading-relaxed">
                  {cat.descriptionFa || 'بدون توضیحات تکمیلی'}
                </p>

                <div className="text-[10px] text-[#8C8375] bg-[#FAF8F5] p-2 rounded-lg border border-[#EAE6DF] font-mono">
                  slug: /{cat.slug}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#EAE6DF]">
                <span className="text-[11px] text-[#6A7873]">
                  ترتیب نمایش: {toPersianDigits(idx + 1)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-[#0F4C3A] hover:bg-[#F4EFE6] rounded-lg transition"
                    title="ویرایش"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {cat.id !== 'all' && (
                    <button
                      onClick={() => handleRequestDelete(cat)}
                      className="p-1.5 text-[#800020] hover:bg-red-50 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] w-full max-w-lg rounded-2xl border border-[#D4AF37]/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <h3 className="font-extrabold text-[#0F4C3A] text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>{editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#6A7873] hover:text-[#0F4C3A] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSuccess ? (
              <div className="p-6 text-center space-y-5 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-[#0F4C3A]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#0F4C3A] mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-[#0F4C3A]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#0F4C3A] text-base">
                    {editingCategory ? 'دسته‌بندی با موفقیت به‌روزرسانی شد' : 'دسته‌بندی جدید با موفقیت ایجاد شد'}
                  </h4>
                  <p className="text-xs text-[#6A7873]">
                    دسته‌بندی «{successCatName || nameFa}» با موفقیت در پایگاه‌داده ثبت گردید و در دسترس است.
                  </p>
                </div>
                <button
                  type="button"
                  id="category-success-close-btn"
                  onClick={() => {
                    setIsSuccess(false);
                    setIsModalOpen(false);
                  }}
                  className="px-6 py-2.5 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  متوجه شدم / بستن
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    نام دسته‌بندی (فارسی):
                  </label>
                  <input
                    type="text"
                    required
                    value={nameFa}
                    onChange={(e) => setNameFa(e.target.value)}
                    placeholder="مثال: پک‌های هدایای یلدا"
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    نام انگلیسی (جهت نمایش سئو و متادیتا):
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Yalda Special Gift Boxes"
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-english-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    نامک پیوند یکتا (Slug URL):
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="e.g. yalda-gifts"
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    توضیحات دسته‌بندی و متای سئو:
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionFa}
                    onChange={(e) => setDescriptionFa(e.target.value)}
                    placeholder="توضیح کوتاه درباره محتوای این دسته از هدایا..."
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="cat-featured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#0F4C3A] rounded border-[#E0D8C8]"
                  />
                  <label htmlFor="cat-featured" className="text-xs text-[#1C2826] font-semibold">
                    نمایش به عنوان دسته ویژه در صفحه اصلی و منوی ناوبری
                  </label>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-[#EAE6DF]">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs text-[#6A7873] hover:text-[#1C2826] font-medium disabled:opacity-50"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingCategory ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-2xl border border-red-200 shadow-2xl p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <h3 className="font-extrabold text-[#800020] text-base flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <span>حذف دسته‌بندی</span>
              </h3>
              <button
                onClick={() => !isDeleting && setCategoryToDelete(null)}
                disabled={isDeleting}
                className="p-1 text-[#6A7873] hover:text-[#1C2826] rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-[#1C2826] leading-relaxed">
              آیا از حذف دسته‌بندی{' '}
              <strong className="text-[#0F4C3A]">«{categoryToDelete.nameFa}»</strong> اطمینان دارید؟
              <p className="text-xs text-[#6A7873] mt-2">
                این عملیات دسته‌بندی را از پایگاه‌داده حذف می‌کند. (فقط در صورتی که هیچ محصولی به آن متصل نباشد امکان‌پذیر است)
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[#EAE6DF]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-xs text-[#6A7873] hover:text-[#1C2826] font-medium disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'در حال حذف...' : 'تأیید و حذف'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
