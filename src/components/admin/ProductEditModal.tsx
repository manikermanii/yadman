import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Boxes,
  Tag,
  Layers,
  CheckCircle,
  CheckCircle2,
  Check,
  Loader2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Percent,
  Sliders,
  Eye,
  Copy,
  Film,
  Video,
} from 'lucide-react';
import { Product, CategoryId, Category, ProductImage, ProductVariant, ProductStatus, ProductVideo } from '../../types';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { ProductImageGalleryManager } from './ProductImageGalleryManager';
import { ProductVideoManager } from './ProductVideoManager';
import { normalizeProductImages } from '../../utils/imageOptimizer';
import { normalizeProductVideos } from '../../utils/videoService';
import defaultProductImg from '../../assets/images/product_relax_tea.jpg';

interface ProductEditModalProps {
  product: Product | null; // null means create new
  categories?: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<any> | void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  categories = [],
  isOpen,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(product);

  // Tab Selection
  const [activeTab, setActiveTab] = useState<'basic' | 'gallery' | 'videos' | 'specs' | 'variants'>('basic');

  // Available Categories (filtering out 'all' and temporary demo items)
  const availableCategories = (categories || []).filter(
    (c) =>
      c.id !== 'all' &&
      !c.nameFa.includes('تست') &&
      !c.nameFa.includes('آزمایشی') &&
      !c.slug.includes('test')
  );

  // Submission & Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProductTitle, setCreatedProductTitle] = useState('');
  const [createdProductSku, setCreatedProductSku] = useState('');

  // --- 1. Basic Info & Pricing ---
  const [titleFa, setTitleFa] = useState(product?.titleFa || '');
  const [titleEn, setTitleEn] = useState(product?.titleEn || '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState<CategoryId>(() => {
    if (product?.category) return product.category;
    if (availableCategories.length > 0) return availableCategories[0].id as CategoryId;
    return '' as CategoryId;
  });

  // Ensure category is synced when categories load or product changes
  useEffect(() => {
    if (!product && availableCategories.length > 0) {
      if (!category || !availableCategories.some((c) => c.id === category)) {
        setCategory(availableCategories[0].id as CategoryId);
      }
    }
  }, [availableCategories, product, category]);
  const [status, setStatus] = useState<ProductStatus>(product?.status || 'active');
  const [badge, setBadge] = useState(product?.badge || '');

  // Pricing & Inventory
  const [price, setPrice] = useState<number | string>(product ? product.price : '');
  const [oldPrice, setOldPrice] = useState<number | undefined>(product?.oldPrice);
  const [inStock, setInStock] = useState<boolean>(product ? product.inStock : true);
  const [stockQuantity, setStockQuantity] = useState<number | string>(product ? product.stockQuantity : '');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(product?.lowStockThreshold ?? 5);
  const [sku, setSku] = useState(product?.sku || `HD-${Date.now().toString().slice(-6)}`);

  // Tags
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  // --- 2. Unlimited Gallery Images ---
  const [images, setImages] = useState<ProductImage[]>(() => {
    if (!product) return [];
    return normalizeProductImages(product.images, product.image, product.additionalImages, product.titleFa);
  });

  // --- 2.5 External Product Videos (Aparat, YouTube, etc.) ---
  const [videos, setVideos] = useState<ProductVideo[]>(() =>
    normalizeProductVideos(product?.videos)
  );

  // --- 3. Specifications & Included Items ---
  const [itemsIncluded, setItemsIncluded] = useState<string[]>(product?.itemsIncluded || []);
  const [newItemText, setNewItemText] = useState('');

  // --- Filtering Attributes ---
  const [occasions, setOccasions] = useState<string[]>(product?.occasions || []);
  const [newOccasionInput, setNewOccasionInput] = useState('');
  const [giftType, setGiftType] = useState<string>(product?.giftType || '');
  const [boxPackagingType, setBoxPackagingType] = useState<string>(
    product?.boxPackagingType || ''
  );
  const [suitableFor, setSuitableFor] = useState<string[]>(product?.suitableFor || []);
  const [newSuitableInput, setNewSuitableInput] = useState('');
  const [brandOrigin, setBrandOrigin] = useState<string>(product?.brandOrigin || '');
  const [salesCount, setSalesCount] = useState<number>(product?.salesCount || 0);

  const [boxType, setBoxType] = useState(product?.boxType || '');
  const [dimensions, setDimensions] = useState(product?.dimensions || '');
  const [weightGrams, setWeightGrams] = useState<number | string>(product?.weightGrams ?? '');
  const [materials, setMaterials] = useState(product?.materials || '');
  const [shippingInfo, setShippingInfo] = useState(product?.shippingInfo || '');
  const [customizationOptions, setCustomizationOptions] = useState(product?.customizationOptions || '');
  const [ribbonColor, setRibbonColor] = useState(product?.ribbonColor || '');
  const [ribbonColorHex, setRibbonColorHex] = useState(product?.ribbonColorHex || '');
  const [waxSeal, setWaxSeal] = useState(product?.waxSeal || '');

  // --- 4. Variants ---
  const [hasVariants, setHasVariants] = useState<boolean>(Boolean(product?.hasVariants));
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [newVarTitle, setNewVarTitle] = useState('');
  const [newVarPrice, setNewVarPrice] = useState<number | string>(product?.price || '');
  const [newVarStock, setNewVarStock] = useState<number | string>('');

  // --- 5. SEO & Metadata ---
  const [slug, setSlug] = useState(product?.slug || '');
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription || '');
  const [canonicalUrl, setCanonicalUrl] = useState(product?.canonicalUrl || '');
  const [ogImage, setOgImage] = useState(product?.ogImage || '');

  // Calculate discount percent
  const numPrice = Number(price) || 0;
  const discountPercent =
    oldPrice && numPrice > 0 && oldPrice > numPrice ? Math.round(((oldPrice - numPrice) / oldPrice) * 100) : 0;

  // Auto-sync SEO slug if empty
  useEffect(() => {
    if (!slug && titleFa) {
      setSlug(titleFa.trim().toLowerCase().replace(/[\s_]+/g, '-'));
    }
  }, [titleFa, slug]);

  // Handle Tags
  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Handle Items Included
  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    setItemsIncluded([...itemsIncluded, newItemText.trim()]);
    setNewItemText('');
  };

  const handleRemoveItem = (index: number) => {
    setItemsIncluded(itemsIncluded.filter((_, idx) => idx !== index));
  };

  // Handle Variants
  const handleAddVariant = () => {
    if (!newVarTitle.trim()) return;
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      titleFa: newVarTitle.trim(),
      sku: `${sku}-V${variants.length + 1}`,
      price: Number(newVarPrice) || Number(price) || 0,
      stockQuantity: Number(newVarStock) || 0,
      attributes: { option: newVarTitle.trim() },
      inStock: (Number(newVarStock) || 0) > 0,
    };
    setVariants([...variants, newVariant]);
    setNewVarTitle('');
    setNewVarPrice(price || '');
    setNewVarStock('');
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError(null);

    if (!titleFa.trim() || titleFa.trim().length < 2) {
      setFormError('لطفاً عنوان فارسی پک هدیه را وارد نمایید (حداقل ۲ نویسه).');
      setActiveTab('basic');
      return;
    }

    if (!sku.trim()) {
      setFormError('لطفاً کد کالا (SKU) را وارد نمایید.');
      setActiveTab('basic');
      return;
    }

    if (!category || category === 'all') {
      setFormError('لطفاً یک دسته‌بندی معتبر برای پک هدیه انتخاب نمایید.');
      setActiveTab('basic');
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      setFormError('لطفاً مبلغ قیمت فروش را به عدد صحیح معتبر وارد فرمایید.');
      setActiveTab('basic');
      return;
    }

    // Determine primary cover image if any image exists
    const primaryImgObj = images.find((img) => img.isPrimary) || (images.length > 0 ? images[0] : null);
    const mainImageUrl = primaryImgObj ? primaryImgObj.url : (product?.image || '');

    // Validate that no Base64 image data is submitted
    if (mainImageUrl && (mainImageUrl.toLowerCase().startsWith('data:image/') || mainImageUrl.toLowerCase().includes(';base64,'))) {
      setFormError('تصویر اصلی حاوی داده خام Base64 است. لطفاً ابتدا تصویر را آپلود فرمایید.');
      setActiveTab('gallery');
      return;
    }

    const hasBase64Image = images.some(
      (img) => img.url.toLowerCase().startsWith('data:image/') || img.url.toLowerCase().includes(';base64,')
    );
    if (hasBase64Image) {
      setFormError('یک یا چند تصویر در گالری حاوی داده خام Base64 است. لطفاً ابتدا تصاویر را آپلود فرمایید.');
      setActiveTab('gallery');
      return;
    }

    const finalSlug = slug.trim() || titleFa.trim().toLowerCase().replace(/[\s_]+/g, '-');

    const savedProduct: Product = {
      id: product?.id || `gift-${Date.now()}`,
      titleFa: titleFa.trim(),
      titleEn: titleEn.trim() || undefined,
      sku: sku.trim() || `HD-${Date.now().toString().slice(-4)}`,
      category,
      price: Number(price) || 0,
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      rating: product?.rating || 0,
      reviewsCount: product?.reviewsCount || (isEditing ? 12 : 0),
      shortDescription: shortDescription.trim() || description.slice(0, 120),
      description: description.trim(),
      image: mainImageUrl,
      images: images,
      additionalImages: images.map((img) => img.url),
      videos: normalizeProductVideos(videos),
      itemsIncluded,
      occasions,
      giftType: giftType.trim() || undefined,
      boxPackagingType: boxPackagingType.trim() || undefined,
      suitableFor,
      brandOrigin: brandOrigin.trim() || undefined,
      salesCount: Number(salesCount) || 0,
      boxType: boxType.trim() || '',
      ribbonColor: ribbonColor.trim() || '',
      ribbonColorHex: ribbonColorHex.trim() || '',
      waxSeal: waxSeal.trim() || '',
      badge: badge.trim() || undefined,
      weightGrams: Number(weightGrams) || 0,
      dimensions: dimensions.trim() || undefined,
      materials: materials.trim() || undefined,
      shippingInfo: shippingInfo.trim() || undefined,
      customizationOptions: customizationOptions.trim() || undefined,
      inStock: status === 'out_of_stock' ? false : inStock,
      stockQuantity: Number(stockQuantity) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      status,
      tags,
      hasVariants,
      variants: hasVariants ? variants : undefined,
      featured: product?.featured ?? true,
      isB2BRecommended: product?.isB2BRecommended ?? (category === 'corporate' || category === 'vip'),
      slug: finalSlug,
      seoTitle: seoTitle.trim() || `${titleFa} | خرید آنلاین پک هدیه یادمان`,
      seoDescription: seoDescription.trim() || (shortDescription || description).slice(0, 160),
      canonicalUrl: canonicalUrl.trim() || `https://yadman.ir/products/${finalSlug}`,
      ogImage: ogImage.trim() || mainImageUrl,
      updatedAt: new Date().toISOString(),
      createdAt: product?.createdAt || new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      await onSave(savedProduct);
      setCreatedProductTitle(titleFa.trim());
      setCreatedProductSku(sku.trim());
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Save product error:', err);
      setFormError(err?.message || 'خطا در ثبت و انتشار پک هدیه در سرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn" dir="rtl">
      <div
        className="bg-[#FAF8F5] w-full max-w-5xl rounded-3xl border-2 border-[#D4AF37]/50 shadow-2xl overflow-hidden my-4 text-right relative max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#0F4C3A] text-white flex items-center justify-between border-b border-[#1B5E4A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/40 text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold">
                {isEditing ? `ویرایش پک هدیه: ${product?.titleFa}` : 'افزودن پک هدیه جدید به ویترین و انبار'}
              </h2>
              <p className="text-[11px] text-[#A3C4BA] mt-0.5">
                مدیریت کامل اطلاعات محصول، گالری تصاویر نامحدود، مشخصات فنی، اقلام پک، سئو و انبارداری
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A3C4BA] hover:text-white hover:bg-[#17634D] rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 sm:p-14 text-center space-y-6 flex flex-col items-center justify-center min-h-[380px] animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-[#0F4C3A]/10 border-2 border-[#D4AF37]/40 flex items-center justify-center text-[#0F4C3A] shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-[#0F4C3A]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-[#0F4C3A]">
                {isEditing ? 'تغییرات پک هدیه با موفقیت ذخیره شد' : 'پک هدیه با موفقیت ایجاد و منتشر شد'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6A7873] max-w-md mx-auto leading-relaxed">
                پک هدیه <strong className="text-[#1C2826]">«{createdProductTitle || titleFa}»</strong> با کد کالا{' '}
                <span className="font-mono text-[#0F4C3A] font-bold dir-ltr inline-block">{createdProductSku || sku}</span> با موفقیت در پایگاه‌داده ذخیره شد و در لیست محصولات قرار گرفت.
              </p>
            </div>

            <button
              type="button"
              id="product-create-continue-btn"
              onClick={onClose}
              className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-8 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>متوجه شدم / ادامه</span>
            </button>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-[#F4EFE6] px-4 sm:px-6 py-2.5 border-b border-[#EAE6DF] overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTab === 'basic'
                    ? 'bg-[#0F4C3A] text-white shadow-xs'
                    : 'text-[#6A7873] hover:text-[#0F4C3A]'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>اطلاعات پایه و قیمت</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTab === 'gallery'
                    ? 'bg-[#0F4C3A] text-white shadow-xs'
                    : 'text-[#6A7873] hover:text-[#0F4C3A]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>تصاویر محصول ({images.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTab === 'videos'
                    ? 'bg-[#0F4C3A] text-white shadow-xs'
                    : 'text-[#6A7873] hover:text-[#0F4C3A]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>ویدیوهای محصول ({videos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTab === 'specs'
                    ? 'bg-[#0F4C3A] text-white shadow-xs'
                    : 'text-[#6A7873] hover:text-[#0F4C3A]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>اقلام، ابعاد و مشخصات فنی</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('variants')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTab === 'variants'
                    ? 'bg-[#0F4C3A] text-white shadow-xs'
                    : 'text-[#6A7873] hover:text-[#0F4C3A]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>تنوع و سایزبندی {hasVariants && `(${variants.length})`}</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-right">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-rose-400 hover:text-rose-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
          
          {/* TAB 1: BASIC INFO & PRICING */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Titles & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    نام فارسی پک هدیه: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={titleFa}
                    onChange={(e) => setTitleFa(e.target.value)}
                    placeholder="مثال: پک سلطنتی زعفران و هل قائنات"
                    className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-bold text-[#0F4C3A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    دسته‌بندی اصلی:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryId)}
                    className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-bold text-[#0F4C3A]"
                  >
                    {availableCategories.length === 0 ? (
                      <option value="">(ابتدا دسته‌بندی ایجاد نمایید)</option>
                    ) : (
                      availableCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameFa}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    نام انگلیسی محصول:
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. Royal Saffron & Cardamom Gift Box"
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-english-serif"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    کد کالا (SKU): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    وضعیت نمایش محصول:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-bold text-[#0F4C3A]"
                  >
                    <option value="active">فعال و قابل خرید در فروشگاه</option>
                    <option value="draft">پیش‌نویس (عدم نمایش در فروشگاه)</option>
                    <option value="out_of_stock">ناموجود (نمایش به عنوان ناموجود)</option>
                    <option value="archived">بایگانی شده / غیرفعال</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Stock Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE6DF] space-y-4">
                <h4 className="font-extrabold text-[#0F4C3A] text-sm flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-[#D4AF37]" />
                  <span>قیمت‌گذاری و موجودی انبار</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      قیمت فروش (تومان): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="مثال: ۳۵۰۰۰۰۰"
                      className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-extrabold text-[#0F4C3A]"
                    />
                    <span className="text-[10px] text-[#6A7873] block mt-1">
                      {numPrice > 0 ? formatToman(numPrice) : '—'}
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      قیمت قبل از تخفیف (تومان):
                    </label>
                    <input
                      type="number"
                      value={oldPrice || ''}
                      onChange={(e) => setOldPrice(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="اختیاری"
                      className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                    />
                    {oldPrice && numPrice > 0 && (
                      <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                        تخفیف: {toPersianDigits(discountPercent)}٪ ({formatToman(oldPrice - numPrice)})
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      تعداد موجود در انبار:
                    </label>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="مثال: ۱۰"
                      className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      حد آستانه هشدار کسری:
                    </label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F4C3A]"></div>
                    <span className="ms-3 text-xs font-bold text-[#0F4C3A]">
                      وضعیت در انبار: {inStock ? 'موجود و قابل تحویل' : 'اتمام موجودی'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Descriptions & Badge */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      توضیح کوتاه (خلاصه معرفی در کارت‌ها و پیش‌نمایش):
                    </label>
                    <input
                      type="text"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="یک جمله جذاب و رسا درباره محتوا و حس و حال پک..."
                      className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      بج و نشان ویژه (اختیاری):
                    </label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="مثال: پرفروش، ویژه یلدا، سازمانی"
                      className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    توضیحات کامل محصول و داستان هدیه:
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیح مفصل درباره اصالت متریال، خواص زعفران، هنر دست و حس ارزشمندی این هدیه..."
                    className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Tags Manager */}
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>برچسب‌ها و تگ‌های محصول:</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="bg-[#FAF8F5] border border-[#EAE6DF] text-[#0F4C3A] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-gray-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="برچسب جدید (Enter یا کلیک بر دکمه)..."
                      className="flex-1 bg-white p-2 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-[#0F4C3A] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#0B3C2E] transition"
                    >
                      افزودن تگ
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: UNLIMITED GALLERY IMAGES */}
          {activeTab === 'gallery' && (
            <div className="animate-fadeIn">
              <ProductImageGalleryManager
                images={images}
                onChange={setImages}
                productTitle={titleFa || 'پک هدیه'}
              />
            </div>
          )}

          {/* TAB 2.5: EXTERNAL PRODUCT VIDEOS (APARAT, YOUTUBE, ETC.) */}
          {activeTab === 'videos' && (
            <div className="animate-fadeIn">
              <ProductVideoManager
                videos={videos}
                onChange={setVideos}
                productTitle={titleFa || 'پک هدیه'}
              />
            </div>
          )}

          {/* TAB 3: SPECIFICATIONS & INCLUDED ITEMS */}
          {activeTab === 'specs' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Items Included Manager */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE6DF] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-[#0F4C3A] text-sm flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-[#D4AF37]" />
                    <span>اقلام موجود در داخل پک هدیه ({itemsIncluded.length} قلم):</span>
                  </h4>
                  <span className="text-[11px] text-[#6A7873]">
                    این اقلام به صورت چک‌لیست در صفحه محصول نمایش داده می‌شوند
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {itemsIncluded.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE6DF]"
                    >
                      <div className="flex items-center gap-2 text-xs text-[#2C3B37]">
                        <span className="w-5 h-5 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    placeholder="قلم جدید (مثلا: شیشه گلاب دوآتیشه قمصر ۲۵۰ میلی‌لیتر)..."
                    className="flex-1 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-[#0F4C3A] text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#0B3C2E] transition flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن قلم به پک</span>
                  </button>
                </div>
              </div>

              {/* Filtering & Classification Attributes */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] space-y-4">
                <h4 className="font-extrabold text-[#0F4C3A] text-sm flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#D4AF37]" />
                  <span>ویژگی‌ها و برچسب‌های فیلترینگ کاتالوگ فروشگاه:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-[#0F4C3A] text-xs mb-1">نوع هدیه:</label>
                    <select
                      value={giftType}
                      onChange={(e) => setGiftType(e.target.value)}
                      className="w-full bg-white p-2 rounded-xl border border-[#E0D8C8] text-xs font-bold"
                    >
                      <option value="">انتخاب نوع هدیه (اختیاری)</option>
                      <option value="سازمانی">سازمانی</option>
                      <option value="شخصی">شخصی</option>
                      <option value="مدیریتی">مدیریتی</option>
                      <option value="اقتصادی">اقتصادی</option>
                      <option value="لوکس و VIP">لوکس و VIP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F4C3A] text-xs mb-1">نوع بسته‌بندی:</label>
                    <select
                      value={boxPackagingType}
                      onChange={(e) => setBoxPackagingType(e.target.value)}
                      className="w-full bg-white p-2 rounded-xl border border-[#E0D8C8] text-xs font-bold"
                    >
                      <option value="">انتخاب نوع بسته‌بندی (اختیاری)</option>
                      <option value="هاردباکس">هاردباکس</option>
                      <option value="صندوقچه چوبی">صندوقچه چوبی</option>
                      <option value="چرم و مخمل">چرم و مخمل</option>
                      <option value="کرافت مینیمال">کرافت مینیمال</option>
                      <option value="جعبه کشویی">جعبه کشویی</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F4C3A] text-xs mb-1">خاستگاه و برند:</label>
                    <select
                      value={brandOrigin}
                      onChange={(e) => setBrandOrigin(e.target.value)}
                      className="w-full bg-white p-2 rounded-xl border border-[#E0D8C8] text-xs font-bold"
                    >
                      <option value="">انتخاب خاستگاه و برند (اختیاری)</option>
                      <option value="قائنات">قائنات</option>
                      <option value="اصفهان">اصفهان</option>
                      <option value="کاشان">کاشان</option>
                      <option value="تبریز">تبریز</option>
                      <option value="شیراز">شیراز</option>
                      <option value="گیلان">گیلان</option>
                      <option value="یزد">یزد</option>
                    </select>
                  </div>
                </div>

                {/* Occasions Tag Editor */}
                <div>
                  <label className="block font-bold text-[#0F4C3A] text-xs mb-1">مناسبت‌های قابل استفاده:</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {occasions.map((occ, idx) => (
                      <span
                        key={idx}
                        className="bg-white border border-[#D4AF37]/50 text-[#0F4C3A] text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <span>{occ}</span>
                        <button
                          type="button"
                          onClick={() => setOccasions(occasions.filter((o) => o !== occ))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOccasionInput}
                      onChange={(e) => setNewOccasionInput(e.target.value)}
                      placeholder="مناسبت جدید (مثال: شب یلدا، روز مادر)..."
                      className="flex-1 bg-white p-1.5 rounded-xl border border-[#E0D8C8] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newOccasionInput.trim() && !occasions.includes(newOccasionInput.trim())) {
                          setOccasions([...occasions, newOccasionInput.trim()]);
                          setNewOccasionInput('');
                        }
                      }}
                      className="bg-[#0F4C3A] text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                    >
                      افزودن مناسبت
                    </button>
                  </div>
                </div>
              </div>

              {/* Physical Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">نوع جعبه و هاردباکس:</label>
                  <input
                    type="text"
                    value={boxType}
                    onChange={(e) => setBoxType(e.target.value)}
                    placeholder="نوع و جنس جعبه (مثال: هاردباکس کرم بافت‌دار)..."
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">ابعاد جعبه (طول × عرض × ارتفاع):</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="۳۲ × ۲۲ × ۹ سانتی‌متر"
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">وزن ناخالص تقریبی (گرم):</label>
                  <input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="وزن تقریبی به گرم (مثال: ۱۲۰۰)"
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">جنس و متریال سازنده:</label>
                  <input
                    type="text"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="چوب گردو، مقوای متالیک، مس میناکاری..."
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">طرح مهر مومی پیش‌فرض:</label>
                  <input
                    type="text"
                    value={waxSeal}
                    onChange={(e) => setWaxSeal(e.target.value)}
                    placeholder="طرح مهر مومی (مثال: طرح اسلیمی و ختایی ایرانی)..."
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">شرایط و مدت زمان ارسال:</label>
                  <textarea
                    rows={2}
                    value={shippingInfo}
                    onChange={(e) => setShippingInfo(e.target.value)}
                    placeholder="شرایط و مدت زمان ارسال (مثال: ارسال همان روز در تهران)..."
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">امکانات سفارشی‌سازی و چاپ سازمانی:</label>
                  <textarea
                    rows={2}
                    value={customizationOptions}
                    onChange={(e) => setCustomizationOptions(e.target.value)}
                    placeholder="امکانات سفارشی‌سازی (مثال: امکان حک لیزری لوگو سازمانی)..."
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: PRODUCT VARIANTS */}
          {activeTab === 'variants' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE6DF] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-[#0F4C3A] text-sm flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#D4AF37]" />
                      <span>تنوع محصول (رنگ، سایز، نوع بسته‌بندی، نوع روبان)</span>
                    </h4>
                    <p className="text-[11px] text-[#6A7873] mt-0.5">
                      در صورتی که این محصول در اندازه‌ها یا رنگ‌های متفاوتی عرضه می‌شود، تنوع‌های آن را فعال کنید.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(e) => setHasVariants(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F4C3A]"></div>
                    <span className="ms-3 text-xs font-bold text-[#0F4C3A]">
                      {hasVariants ? 'دارای تنوع فعال' : 'تک‌محصول بدون تنوع'}
                    </span>
                  </label>
                </div>

                {hasVariants && (
                  <div className="space-y-4 pt-2 border-t border-[#EAE6DF]">
                    <div className="space-y-2">
                      {variants.map((v, idx) => (
                        <div
                          key={v.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-[#0F4C3A] text-white text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-[#0F4C3A] text-xs">{v.titleFa}</div>
                              <div className="text-[10px] text-[#6A7873] font-mono">SKU: {v.sku}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div className="font-extrabold text-[#0F4C3A]">
                              {formatToman(v.price || numPrice)}
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              موجودی: {toPersianDigits(v.stockQuantity)} عدد
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Variant Form */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#D4AF37]/50 space-y-3">
                      <span className="font-bold text-[#0F4C3A] text-xs block">افزودن تنوع جدید:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={newVarTitle}
                            onChange={(e) => setNewVarTitle(e.target.value)}
                            placeholder="عنوان تنوع (مثال: سایز بزرگ با روبان زرشکی)..."
                            className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#E0D8C8] focus:outline-none text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={newVarPrice}
                            onChange={(e) => setNewVarPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="قیمت این تنوع (تومان)"
                            className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#E0D8C8] focus:outline-none text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={newVarStock}
                            onChange={(e) => setNewVarStock(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="موجودی انبار"
                            className="w-full bg-[#FAF8F5] p-2 rounded-xl border border-[#E0D8C8] focus:outline-none text-xs"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="bg-[#0F4C3A] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#0B3C2E] transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ثبت این تنوع</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#EAE6DF]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs text-[#6A7873] hover:text-[#1C2826] font-medium"
            >
              انصراف و بستن
            </button>

            <button
              type="submit"
              id="submit-product-form-btn"
              disabled={isSubmitting}
              className="bg-[#0F4C3A] hover:bg-[#0B3C2E] disabled:opacity-60 disabled:cursor-not-allowed text-white px-7 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>در حال ذخیره و ثبت در پایگاه‌داده...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isEditing ? 'ذخیره تغییرات پک هدیه' : 'انتشار و ایجاد پک هدیه جدید'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </>
    )}
      </div>
    </div>
  );
};
