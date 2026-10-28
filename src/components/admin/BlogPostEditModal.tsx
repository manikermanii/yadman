import React, { useState, useEffect } from 'react';
import {
  BlogPost,
  BlogCategory,
  BlogAuthor,
  BlogPostStatus,
  Product,
} from '../../types';
import {
  X,
  Save,
  Eye,
  FileText,
  Tag,
  ShoppingBag,
  Sparkles,
  Heading,
  Quote,
  List,
  ListOrdered,
  Table,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface BlogPostEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost | null;
  categories: BlogCategory[];
  authors: BlogAuthor[];
  products: Product[];
  onSave: (savedPost: BlogPost) => Promise<boolean | void> | void;
}

export const BlogPostEditModal: React.FC<BlogPostEditModalProps> = ({
  isOpen,
  onClose,
  post,
  categories,
  authors,
  products,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'taxonomy' | 'products' | 'preview'>('content');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [status, setStatus] = useState<BlogPostStatus>('draft');
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(5);
  const [isFeatured, setIsFeatured] = useState(false);
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([]);

  // SEO State
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogImage, setOgImage] = useState('');

  const [validationError, setValidationError] = useState('');

  // Populate state on edit or reset on new
  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setSlug(post.slug || '');
      setExcerpt(post.excerpt || '');
      setContent(post.content || '');
      setCoverImage(post.coverImage || '');
      setCoverImageAlt(post.coverImageAlt || '');
      setStatus(post.status || 'draft');
      setCategoryId(post.categoryId || (categories[0]?.id ?? ''));
      setAuthorId(post.authorId || (authors[0]?.id ?? ''));
      setTagsInput(post.tags ? post.tags.join(', ') : '');
      setReadingTimeMinutes(post.readingTimeMinutes || 5);
      setIsFeatured(post.isFeatured || false);
      setRelatedProductIds(post.relatedProductIds || []);

      setSeoTitle(post.seoTitle || '');
      setSeoDescription(post.seoDescription || '');
      setFocusKeyword(post.focusKeyword || '');
      setCanonicalUrl(post.canonicalUrl || '');
      setOgImage(post.ogImage || '');
    } else {
      // Defaults for new post
      setTitle('');
      setSlug('');
      setExcerpt('');
      setContent(`<h2>مقدمه</h2>\n<p>متن مقدمه مقاله را در این بخش بنویسید...</p>\n\n<div class="callout callout-emerald">\n  <p><strong>نکته مهم:</strong> یک توصیه کلیدی برای خواننده.</p>\n</div>`);
      setCoverImage('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80');
      setCoverImageAlt('');
      setStatus('draft');
      setCategoryId(categories[0]?.id || '');
      setAuthorId(authors[0]?.id || '');
      setTagsInput('هدیه سازمانی, پک لوکس, تشریفات');
      setReadingTimeMinutes(5);
      setIsFeatured(false);
      setRelatedProductIds(products.slice(0, 2).map((p) => p.id));

      setSeoTitle('');
      setSeoDescription('');
      setFocusKeyword('');
      setCanonicalUrl('');
      setOgImage('');
    }
    setValidationError('');
    setActiveTab('content');
  }, [post, isOpen, categories, authors, products]);

  if (!isOpen) return null;

  // Auto-generate slug from title
  const handleGenerateSlug = () => {
    if (!title.trim()) return;
    const generated = title
      .trim()
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
    setSlug(generated);
  };

  // Insert Rich Block Snippets into Content
  const insertSnippet = (snippet: string) => {
    setContent((prev) => prev + '\n\n' + snippet);
  };

  const handleSave = async (e: React.FormEvent, statusOverride?: BlogPostStatus) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      setValidationError('لطفاً عنوان مقاله را وارد نمایید.');
      setActiveTab('content');
      return;
    }
    if (!slug.trim()) {
      setValidationError('لطفاً نامک (Slug) انگلیسی یا فارسی مقاله را وارد نمایید.');
      setActiveTab('content');
      return;
    }

    const effectiveStatus = statusOverride || status;
    const tags = tagsInput
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const now = new Date().toISOString();

    const savedPost: BlogPost = {
      id: post ? post.id : `post-${Date.now()}`,
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      coverImage: coverImage.trim(),
      coverImageAlt: coverImageAlt.trim() || title.trim(),
      status: effectiveStatus,
      publishedAt: effectiveStatus === 'published' ? (post?.publishedAt || now) : undefined,
      publishedAtFa: post?.publishedAtFa || 'به‌تازگی',
      readingTimeMinutes: Number(readingTimeMinutes) || 5,
      authorId: authorId || (authors[0]?.id ?? ''),
      categoryId: categoryId || (categories[0]?.id ?? ''),
      tags,
      relatedProductIds,
      isFeatured,
      viewsCount: post?.viewsCount || 0,
      likesCount: post?.likesCount || 0,
      seoTitle: seoTitle.trim() || `${title.trim()} | مجله یادمان`,
      seoDescription: seoDescription.trim() || excerpt.trim(),
      focusKeyword: focusKeyword.trim(),
      canonicalUrl: canonicalUrl.trim() || `https://yadman.ir/blog/${slug.trim()}`,
      ogImage: ogImage.trim() || coverImage.trim(),
      createdAt: post?.createdAt || now,
      updatedAt: now,
    };

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const res = await onSave(savedPost);
      if (res !== false) {
        onClose();
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'خطا در ذخیره‌سازی مقاله در پایگاه‌داده.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAuthor = authors.find((a) => a.id === authorId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-right">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-[#EAE6DF] overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        
        {/* Modal Header */}
        <div className="bg-[#0F4C3A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#0F4C3A] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">
                {post ? 'ویرایش مقاله مجله یادمان' : 'ایجاد مقاله جدید'}
              </h2>
              <p className="text-[11px] text-[#A3C4BA]">
                مدیریت محتوای تحریریه، چندرسانه‌ای و بهینه‌سازی سئو
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2 bg-[#FAF8F5] border-b border-[#EAE6DF] text-xs overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'content'
                ? 'bg-[#0F4C3A] text-white shadow-2xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>محتوا و نگارش</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('taxonomy')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'taxonomy'
                ? 'bg-[#0F4C3A] text-white shadow-2xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>دسته‌بندی، نویسنده و برچسب‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#0F4C3A] text-white shadow-2xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>محصولات مرتبط ({toPersianDigits(relatedProductIds.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-[#0F4C3A] text-white shadow-2xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>پیش‌نمایش زنده</span>
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 flex-1 space-y-6">
          
          {/* TAB 1: CONTENT & WRITING */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-1.5">
                  <label className="block text-xs font-bold text-[#0F4C3A]">
                    عنوان مقاله <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: اصول انتخاب هدیه سازمانی فاخر برای مدیران"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#0F4C3A] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#0F4C3A]">
                      نامک آدرس (Slug) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="text-[10px] text-[#0F4C3A] font-bold hover:underline"
                    >
                      تولید خودکار
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="corporate-gift-guide"
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-sm font-mono focus:border-[#0F4C3A] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0F4C3A]">
                  چکیده / خلاصه مقاله (Excerpt)
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="خلاصه‌ای جذاب و ترغیب‌کننده در ۱ تا ۳ جمله که در کارت‌های وبلاگ و شبکه‌های اجتماعی نمایش داده می‌شود."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs focus:border-[#0F4C3A] focus:outline-hidden"
                />
              </div>

              {/* Cover Image & Alt Text */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 space-y-1.5">
                  <label className="block text-xs font-bold text-[#0F4C3A]">
                    آدرس تصویر شاخص مقاله (Cover Image URL)
                  </label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs focus:border-[#0F4C3A] focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="block text-xs font-bold text-[#0F4C3A]">
                    متن جایگزین تصویر (Alt Text)
                  </label>
                  <input
                    type="text"
                    value={coverImageAlt}
                    onChange={(e) => setCoverImageAlt(e.target.value)}
                    placeholder="توصیف تصویر برای سئو و دسترس‌پذیری"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs focus:border-[#0F4C3A] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Rich Content Editor & Snippet Toolbar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-[#0F4C3A]">
                    متن کامل مقاله (پشتیبانی از تگ‌های ساختاریافته HTML و المان‌های تحریریه)
                  </label>
                  
                  {/* Quick Snippet Insert Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-[#6A7873] ml-1">درج سریع:</span>
                    <button
                      type="button"
                      onClick={() => insertSnippet('<h2>عنوان بخش جدید</h2>\n<p>متن این بخش...</p>')}
                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#0F4C3A] font-bold text-[#0F4C3A]"
                    >
                      + تیتر H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet('<h3>زیرتیتر فرعی</h3>')}
                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#0F4C3A] font-bold text-[#0F4C3A]"
                    >
                      + زیرتیتر H3
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet('<div class="callout callout-emerald">\n  <p><strong>نکته کلیدی:</strong> متن کادر سبز زمردی...</p>\n</div>')}
                      className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold"
                    >
                      + کادر سبز
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet('<div class="callout callout-gold">\n  <p><strong>پیشنهاد ویژه:</strong> متن کادر طلایی...</p>\n</div>')}
                      className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold"
                    >
                      + کادر طلایی
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet('<blockquote>«یک نقل‌قول الهام‌بخش درباره هدیه دادن و تشریفات.»</blockquote>')}
                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#0F4C3A] text-[#0F4C3A] font-bold"
                    >
                      + نقل‌قول
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet('<ul>\n  <li>آیتم اول</li>\n  <li>آیتم دوم</li>\n  <li>آیتم سوم</li>\n</ul>')}
                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#0F4C3A] text-[#0F4C3A] font-bold"
                    >
                      + لیست
                    </button>
                  </div>
                </div>

                <textarea
                  rows={14}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<h2>عنوان بخش</h2><p>متن مقاله...</p>"
                  className="w-full px-4 py-3 rounded-2xl border border-[#EAE6DF] text-xs font-mono leading-relaxed focus:border-[#0F4C3A] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TAXONOMY, AUTHOR & TAGS */}
          {activeTab === 'taxonomy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0F4C3A]">
                    دسته‌بندی مقاله
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs bg-white focus:border-[#0F4C3A] focus:outline-hidden"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameFa} ({cat.slug})
                      </option>
                    ))}
                  </select>
                  {selectedCategory?.descriptionFa && (
                    <p className="text-[11px] text-[#6A7873]">{selectedCategory.descriptionFa}</p>
                  )}
                </div>

                {/* Author Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0F4C3A]">
                    نویسنده مقاله
                  </label>
                  <select
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs bg-white focus:border-[#0F4C3A] focus:outline-hidden"
                  >
                    {authors.map((auth) => (
                      <option key={auth.id} value={auth.id}>
                        {auth.name} — {auth.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0F4C3A]">
                    وضعیت انتشار
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs bg-white font-bold text-[#0F4C3A] focus:border-[#0F4C3A] focus:outline-hidden"
                  >
                    <option value="published">✓ منتشر شده (نمایش عمومی در سایت)</option>
                    <option value="draft">✎ پیش‌نویس (عدم نمایش عمومی)</option>
                    <option value="scheduled">⏱ زمان‌بندی شده</option>
                    <option value="archived">📦 آرشیو شده</option>
                  </select>
                </div>

                {/* Reading Time */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0F4C3A]">
                    مدت زمان تقریبی مطالعه (دقیقه)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={readingTimeMinutes}
                    onChange={(e) => setReadingTimeMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs focus:border-[#0F4C3A] focus:outline-hidden"
                  />
                </div>

              </div>

              {/* Tags Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#0F4C3A]">
                  برچسب‌ها (با ویرگول یا کاما جدا کنید)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="هدایای سازمانی, نوروز, زعفران, جعبه هدیه"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EAE6DF] text-xs focus:border-[#0F4C3A] focus:outline-hidden"
                />
              </div>

              {/* Featured Flag */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#0F4C3A]">مقاله ویژه / برگزیده صفحه اصلی مجله</h4>
                  <p className="text-[11px] text-[#6A7873]">
                    این مقاله در بالای صفحه مجله یادمان با سایز بزرگ و طراحی برجسته نمایش داده می‌شود.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 accent-[#0F4C3A] rounded cursor-pointer"
                />
              </div>

            </div>
          )}

          {/* TAB 3: RELATED PRODUCTS SELECTION */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DF]">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0F4C3A]">
                    انتخاب پک‌ها و محصولات مرتبط از فروشگاه
                  </h3>
                  <p className="text-[11px] text-[#6A7873]">
                    محصولات انتخاب شده در انتهای مقاله برای هدایت خوانندگان به خرید نمایش داده می‌شوند.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0F4C3A] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#EAE6DF]">
                  {toPersianDigits(relatedProductIds.length)} محصول انتخاب شده
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                {products.map((prod) => {
                  const isSelected = relatedProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setRelatedProductIds((prev) =>
                          isSelected ? prev.filter((id) => id !== prod.id) : [...prev, prod.id]
                        );
                      }}
                      className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] ring-1 ring-[#0F4C3A]'
                          : 'bg-white border-[#EAE6DF] hover:border-[#0F4C3A]/40'
                      }`}
                    >
                      <img
                        src={prod.image}
                        alt={prod.titleFa}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="overflow-hidden space-y-0.5 flex-1">
                        <p className={`font-bold text-xs truncate ${isSelected ? 'text-[#0F4C3A]' : 'text-[#2C3B37]'}`}>
                          {prod.titleFa}
                        </p>
                        <span className="text-[10px] text-[#6A7873]">{prod.boxType}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6 bg-[#FAF8F5] p-6 rounded-3xl border border-[#EAE6DF]">
              <div className="space-y-4">
                <span className="text-xs font-bold bg-[#0F4C3A] text-white px-3 py-1 rounded-full">
                  {selectedCategory?.nameFa || 'دسته‌بندی'}
                </span>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F4C3A]">
                  {title || 'عنوان مقاله'}
                </h1>

                <p className="text-sm text-[#4A5A55] border-r-4 border-[#D4AF37] pr-4 bg-white/80 py-2 rounded-l-xl">
                  {excerpt || 'چکیده مقاله'}
                </p>

                {coverImage && (
                  <div className="aspect-16/9 rounded-2xl overflow-hidden shadow-sm">
                    <img
                      src={coverImage}
                      alt={coverImageAlt || title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF]">
                  <div
                    className="article-content text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-[#EAE6DF] flex items-center justify-between">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#EAE6DF] text-xs font-bold text-[#6A7873] hover:bg-[#F4EFE6] transition disabled:opacity-50"
            >
              انصراف
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSave(e, 'draft')}
                className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] hover:border-[#0F4C3A] text-[#0F4C3A] text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>ذخیره به عنوان پیش‌نویس</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#0F4C3A] hover:bg-[#155A45] text-white text-xs font-extrabold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting
                    ? 'در حال ذخیره‌سازی...'
                    : post
                    ? 'ذخیره تغییرات مقاله'
                    : 'انتشار و ذخیره مقاله'}
                </span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
