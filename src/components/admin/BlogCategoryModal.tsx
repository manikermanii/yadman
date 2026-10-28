import React, { useState, useEffect } from 'react';
import { BlogCategory } from '../../types';
import { X, Save, Tag } from 'lucide-react';

interface BlogCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: BlogCategory | null;
  onSave: (savedCategory: BlogCategory) => Promise<boolean | void> | void;
}

export const BlogCategoryModal: React.FC<BlogCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSave,
}) => {
  const [nameFa, setNameFa] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setNameFa(category.nameFa);
      setSlug(category.slug);
      setDescriptionFa(category.descriptionFa || '');
      setSortOrder(category.sortOrder || 1);
    } else {
      setNameFa('');
      setSlug('');
      setDescriptionFa('');
      setSortOrder(1);
    }
    setSubmitError(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!nameFa.trim() || !slug.trim()) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const res = await onSave({
        id: category ? category.id : `cat-${Date.now()}`,
        nameFa: nameFa.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
        descriptionFa: descriptionFa.trim(),
        sortOrder: Number(sortOrder) || 1,
      });
      if (res !== false) {
        onClose();
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'خطا در ذخیره دسته‌بندی.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#EAE6DF] overflow-hidden animate-fadeIn">
        <div className="bg-[#0F4C3A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-bold text-sm sm:text-base">
              {category ? 'ویرایش دسته‌بندی وبلاگ' : 'افزودن دسته‌بندی جدید'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0F4C3A]">نام دسته‌بندی (فارسی)</label>
            <input
              type="text"
              required
              value={nameFa}
              onChange={(e) => setNameFa(e.target.value)}
              placeholder="مثال: هدایای سازمانی و B2B"
              className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs focus:border-[#0F4C3A] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0F4C3A]">نامک یکتا (Slug انگلیسی)</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="corporate-gifts"
              dir="ltr"
              className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs font-mono focus:border-[#0F4C3A] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0F4C3A]">توضیحات دسته‌بندی</label>
            <textarea
              rows={3}
              value={descriptionFa}
              onChange={(e) => setDescriptionFa(e.target.value)}
              placeholder="توضیحات کوتاه درباره موضوعات این دسته‌بندی..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs focus:border-[#0F4C3A] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0F4C3A]">ترتیب نمایش</label>
            <input
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs focus:border-[#0F4C3A] focus:outline-hidden"
            />
          </div>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
              {submitError}
            </div>
          )}

          <div className="pt-4 border-t border-[#EAE6DF] flex items-center justify-between">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#6A7873] hover:bg-[#FAF8F5] rounded-xl disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#0F4C3A] text-white text-xs font-bold rounded-xl hover:bg-[#155A45] shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'در حال ذخیره...' : 'ذخیره دسته‌بندی'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
