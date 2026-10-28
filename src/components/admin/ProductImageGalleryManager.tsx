import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Star,
  Trash2,
  MoveRight,
  MoveLeft,
  Edit3,
  Check,
  X,
  Maximize2,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  Layers,
  AlertCircle,
  FileImage,
} from 'lucide-react';
import { ProductImage } from '../../types';
import {
  createProductImageFromUrl,
  formatImageSize,
  generateDefaultAltText,
} from '../../utils/imageOptimizer';
import giftYaldaImg from '../../assets/images/product_yalda.jpg';
import giftNutsImg from '../../assets/images/product_nuts.jpg';
import giftRelaxTeaImg from '../../assets/images/product_relax_tea.jpg';
import giftIsfahanImg from '../../assets/images/product_isfahan.jpg';
import giftTechImg from '../../assets/images/product_tech.jpg';
import giftHafezImg from '../../assets/images/product_hafez.jpg';
import giftEspressoImg from '../../assets/images/product_espresso.jpg';
import giftBaristaImg from '../../assets/images/product_barista.jpg';
import { api } from '../../services/api';

interface ProductImageGalleryManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  productTitle: string;
}

export const ProductImageGalleryManager: React.FC<ProductImageGalleryManagerProps> = ({
  images,
  onChange,
  productTitle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedImageForAlt, setSelectedImageForAlt] = useState<ProductImage | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // URL Input Form
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customUrlAlt, setCustomUrlAlt] = useState('');

  // Preset Library
  const [showPresets, setShowPresets] = useState(false);
  const presetImages = [
    { label: 'پک آیین شب یلدا', url: giftYaldaImg },
    { label: 'پک آجیل چهارمغز پذیرایی', url: giftNutsImg },
    { label: 'پک دمنوش و فنجان آرامش', url: giftRelaxTeaImg },
    { label: 'صندوقچه میناکاری و گز اصفهان', url: giftIsfahanImg },
    { label: 'ولکام پک مدیریتی و دیجیتال', url: giftTechImg },
    { label: 'ست تاشو دیوان حافظ و جام مسی', url: giftHafezImg },
    { label: 'پک کپسول قهوه و مینی‌پرسو', url: giftEspressoImg },
    { label: 'ست باریستا موکاپات و فرنچ‌پرس', url: giftBaristaImg },
  ];

  // Drag & drop file handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFilesSelected(e.target.files);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleFilesSelected = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setUploadError(null);
    setProcessingProgress(`در حال آپلود و پردازش ${files.length} تصویر...`);

    try {
      const hasExistingPrimary = images.some((img) => img.isPrimary);
      const fileArray = Array.from(files);
      const newImages: ProductImage[] = [];
      const failedFiles: string[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        if (!file.type.startsWith('image/')) {
          failedFiles.push(`${file.name} (فرمت فایل مجاز نیست)`);
          continue;
        }

        let fileUrl = '';
        try {
          const uploadRes = await api.upload.singleImage(file, 'products');
          if (uploadRes?.url) {
            fileUrl = uploadRes.url;
          } else {
            failedFiles.push(file.name);
          }
        } catch (uploadErr: any) {
          console.error('Upload API failed for file:', file.name, uploadErr);
          const msg = uploadErr?.message || 'خطا در ارتباط با سرور آپلود';
          failedFiles.push(`${file.name} (${msg})`);
        }

        if (fileUrl) {
          const isPrimary = !hasExistingPrimary && images.length === 0 && newImages.length === 0;
          const sortOrder = images.length + newImages.length;
          const altText = generateDefaultAltText(productTitle || 'پک هدیه', sortOrder, isPrimary);

          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            url: fileUrl,
            thumbnailUrl: fileUrl,
            altText,
            sortOrder,
            isPrimary,
          });
        }
      }

      if (failedFiles.length > 0) {
        setUploadError(`آپلود ${failedFiles.length} فایل ناموفق بود:\n${failedFiles.join('\n')}\nلطفاً پس از بررسی مجدداً تلاش فرمایید.`);
      }

      if (newImages.length > 0) {
        // If there is no existing primary image, ensure first new image becomes cover
        if (!hasExistingPrimary && !newImages.some((img) => img.isPrimary)) {
          newImages[0].isPrimary = true;
        }
        const updated = [...images, ...newImages].map((img, idx) => ({
          ...img,
          sortOrder: idx,
        }));
        onChange(updated);
      }
    } catch (err: any) {
      console.error('Failed to process image batch:', err);
      setUploadError('خطا در بارگذاری تصاویر. لطفاً دوباره تلاش نمایید.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress('');
    }
  };

  // Replace single image
  const triggerReplace = (imageId: string) => {
    setReplaceTargetId(imageId);
    if (replaceInputRef.current) {
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replaceTargetId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsProcessing(true);
    setUploadError(null);
    try {
      if (!file.type.startsWith('image/')) {
        setUploadError(`فرمت فایل "${file.name}" معتبر نیست. لطفاً یک تصویر انتخاب کنید.`);
        return;
      }

      let fileUrl = '';
      try {
        const uploadRes = await api.upload.singleImage(file, 'products');
        if (uploadRes?.url) {
          fileUrl = uploadRes.url;
        } else {
          setUploadError(`آپلود تصویر "${file.name}" با خطا مواجه شد.`);
        }
      } catch (uploadErr: any) {
        console.error('Replace upload failed:', uploadErr);
        setUploadError(`خطا در آپلود تصویر جایگزین: ${uploadErr?.message || 'عدم دسترسی به سرور'}. لطفاً دوباره امتحان کنید.`);
      }

      if (fileUrl) {
        const updated = images.map((img) =>
          img.id === replaceTargetId
            ? {
                ...img,
                url: fileUrl,
                thumbnailUrl: fileUrl,
              }
            : img
        );
        onChange(updated);
      }
    } catch (err) {
      console.error('Replace error:', err);
      setUploadError('خطا در پردازش تصویر جایگزین.');
    } finally {
      setIsProcessing(false);
      setReplaceTargetId(null);
      e.target.value = '';
    }
  };

  // Set primary / cover image
  const handleSetPrimary = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onChange(updated);
  };

  // Reorder images
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    // update sort orders
    const reordered = newImages.map((img, idx) => ({
      ...img,
      sortOrder: idx,
    }));
    onChange(reordered);
  };

  // Remove image
  const handleRemove = (id: string) => {
    const remaining = images.filter((img) => img.id !== id);
    // If we removed the primary image, promote the first remaining image
    if (remaining.length > 0 && !remaining.some((img) => img.isPrimary)) {
      remaining[0].isPrimary = true;
    }
    const updated = remaining.map((img, idx) => ({
      ...img,
      sortOrder: idx,
    }));
    onChange(updated);
  };

  // Add from URL
  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customUrl.trim()) return;

    const trimmedUrl = customUrl.trim();
    if (trimmedUrl.toLowerCase().startsWith('data:image/') || trimmedUrl.toLowerCase().includes(';base64,')) {
      setUploadError('ارسال مستقیم داده‌های Base64 به عنوان نشانی تصویر مجاز نمی‌باشد. لطفاً فایل را از طریق دکمه آپلود ارسال فرمایید یا نشانی اینترنتی معتبر وارد کنید.');
      return;
    }

    const hasExistingPrimary = images.some((img) => img.isPrimary);
    const isPrimary = !hasExistingPrimary;
    const newImage = createProductImageFromUrl(
      trimmedUrl,
      productTitle || 'پک هدیه',
      images.length,
      isPrimary,
      customUrlAlt.trim() || undefined
    );

    const updated = [...images, newImage];
    onChange(updated);
    setCustomUrl('');
    setCustomUrlAlt('');
    setShowUrlInput(false);
  };

  // Add preset asset
  const handleAddPreset = (presetUrl: string, label: string) => {
    const hasExistingPrimary = images.some((img) => img.isPrimary);
    const isPrimary = !hasExistingPrimary;
    const newImage = createProductImageFromUrl(
      presetUrl,
      productTitle || label,
      images.length,
      isPrimary,
      `پک هدیه ${productTitle || label} - ${label}`
    );
    onChange([...images, newImage]);
  };

  // Save ALT text
  const handleSaveAltText = (newAlt: string) => {
    if (!selectedImageForAlt) return;
    const updated = images.map((img) =>
      img.id === selectedImageForAlt.id ? { ...img, altText: newAlt } : img
    );
    onChange(updated);
    setSelectedImageForAlt(null);
  };

  const primaryImage = images.find((img) => img.isPrimary) || images[0];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        id="batch-product-image-input"
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={handleReplaceFile}
        className="hidden"
      />

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-700 dark:text-red-300 text-sm flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">خطا در ذخیره‌سازی تصویر</p>
              <p className="text-xs text-red-600 dark:text-red-300 whitespace-pre-line leading-relaxed">{uploadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-200 transition-colors p-1"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0F4C3A]" />
            <h3 className="font-extrabold text-sm text-[#0F4C3A]">
              مدیریت گالری تصاویر نامحدود محصول
            </h3>
            <span className="bg-[#0F4C3A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {images.length} تصویر بارگذاری‌شده
            </span>
          </div>
          <p className="text-[11px] text-[#6A7873] mt-1">
            بدون محدودیت در تعداد تصاویر (۱، ۵، ۲۰ یا بیشتر). بهینه‌سازی و فشرده‌سازی خودکار جهت بارگذاری سریع فروشگاه.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="px-3 py-1.5 rounded-xl border border-[#E0D8C8] bg-white hover:border-[#0F4C3A] text-xs font-bold text-[#0F4C3A] flex items-center gap-1.5 transition"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>افزودن با لینک مستقیم</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="px-3 py-1.5 rounded-xl border border-[#E0D8C8] bg-white hover:border-[#0F4C3A] text-xs font-bold text-[#0F4C3A] flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>کتابخانه آماده</span>
          </button>
        </div>
      </div>

      {/* Direct URL Input Accordion */}
      {showUrlInput && (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddUrl();
            }
          }}
          className="bg-white p-4 rounded-2xl border border-[#0F4C3A]/30 shadow-sm space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#0F4C3A]">
            <span>افزودن تصویر از آدرس اینترنتی (CDN / URL):</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="url"
              required
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/images/gift-box-cover.jpg"
              className="bg-[#FAF8F5] text-xs p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
              dir="ltr"
            />
            <input
              type="text"
              value={customUrlAlt}
              onChange={(e) => setCustomUrlAlt(e.target.value)}
              placeholder="متن جایگزین (ALT) تصویر برای موتورهای جستجو..."
              className="bg-[#FAF8F5] text-xs p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            className="bg-[#0F4C3A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#0B3C2E] transition cursor-pointer"
          >
            افزودن این لینک به گالری
          </button>
        </div>
      )}

      {/* Preset Library Accordion */}
      {showPresets && (
        <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-[#0F4C3A]">
            <span>تصاویر نمونه و استودیویی فاخر برای تست یا استفاده سریع:</span>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {presetImages.map((preset, idx) => (
              <div
                key={idx}
                className="group relative bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] overflow-hidden p-2 text-center hover:border-[#0F4C3A] transition cursor-pointer"
                onClick={() => handleAddPreset(preset.url, preset.label)}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="w-full h-20 object-cover rounded-lg mb-2"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] font-bold text-[#2C3B37] line-clamp-1">
                  {preset.label}
                </span>
                <span className="mt-1 inline-block text-[9px] bg-[#0F4C3A] text-white px-2 py-0.5 rounded-md">
                  + افزودن به تصاویر
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        id="product-image-dropzone"
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 scale-[1.01]'
            : 'border-[#D4AF37]/50 bg-white hover:bg-[#FAF8F5] hover:border-[#0F4C3A]'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3 pointer-events-none">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0F4C3A]/10 flex items-center justify-center text-[#0F4C3A]">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#0F4C3A]">
              تصاویر را به اینجا بکشید یا برای انتخاب کلیک کنید
            </h4>
            <p className="text-xs text-[#6A7873] mt-1">
              امکان انتخاب هم‌زمان چندین تصویر (JPG, PNG, WebP) بدون محدودیت تعداد
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-[#8C8375] pt-1">
            <span className="bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#EAE6DF]">
              ✓ فشرده‌سازی خودکار
            </span>
            <span className="bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#EAE6DF]">
              ✓ تولید ابعاد ریسپانسیو و تامبنیل
            </span>
            <span className="bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#EAE6DF]">
              ✓ تولید خودکار تگ ALT سئو
            </span>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 z-10">
            <RefreshCw className="w-7 h-7 text-[#0F4C3A] animate-spin" />
            <p className="text-xs font-bold text-[#0F4C3A]">{processingProgress}</p>
          </div>
        )}
      </div>

      {/* Gallery Grid Section */}
      {images.length === 0 ? (
        <div className="bg-[#FAF8F5] border-2 border-dashed border-[#D1C9BE] rounded-2xl p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#F4EFE6] text-[#8C8375] flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#1C2826]">هنوز تصویری اضافه نشده است</p>
          <p className="text-xs text-[#6A7873] max-w-md mx-auto leading-relaxed">
            تصاویر مورد نظر خود را در کادر بالا بکشید یا برای انتخاب فایل کلیک کنید. اولین تصویر بارگذاری‌شده به‌صورت خودکار به عنوان تصویر اصلی (کاور) انتخاب خواهد شد.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#0F4C3A]">
              گالری تصاویر ({images.length} تصویر) — تصویر با ستاره طلایی، تصویر اصلی ویترین است:
            </span>
            <span className="text-[11px] text-[#6A7873]">
              با دکمه‌های چپ و راست می‌توانید ترتیب نمایش تصاویر را تنظیم کنید
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={`group bg-white rounded-2xl border-2 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative ${
                  img.isPrimary
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30'
                    : 'border-[#EAE6DF] hover:border-[#0F4C3A]/50'
                }`}
              >
                {/* Image Container */}
                <div className="relative aspect-4/3 bg-[#F4EFE6] overflow-hidden">
                  <img
                    src={img.thumbnailUrl || img.url}
                    alt={img.altText || productTitle}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />

                  {/* Primary Cover Badge */}
                  {img.isPrimary && (
                    <div className="absolute top-2.5 right-2.5 bg-[#0F4C3A] text-[#D4AF37] text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-[#D4AF37]/40">
                      <Star className="w-3 h-3 fill-[#D4AF37]" />
                      <span>تصویر اصلی (Cover)</span>
                    </div>
                  )}

                  {/* Index Pill */}
                  <div className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                    #{idx + 1}
                  </div>

                  {/* Overlay Quick Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(img.url)}
                      className="p-2 bg-white text-[#0F4C3A] rounded-xl hover:bg-[#D4AF37] transition shadow-md"
                      title="بزرگنمایی تصویر"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerReplace(img.id)}
                      className="p-2 bg-white text-[#0F4C3A] rounded-xl hover:bg-[#0F4C3A] hover:text-white transition shadow-md"
                      title="جایگزینی تصویر جدید"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageForAlt(img)}
                      className="p-2 bg-white text-[#0F4C3A] rounded-xl hover:bg-[#0F4C3A] hover:text-white transition shadow-md"
                      title="ویرایش متن ALT سئو"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(img.id)}
                      className="p-2 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition shadow-md"
                      title="حذف این تصویر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Info & Controls */}
                <div className="p-3 space-y-2.5 text-right flex-1 flex flex-col justify-between">
                  {/* ALT text snippet */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[#8C8375] mb-1">
                      <span className="font-bold text-[#0F4C3A]">متن ALT سئو:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedImageForAlt(img)}
                        className="text-[#0F4C3A] hover:underline font-semibold"
                      >
                        ویرایش
                      </button>
                    </div>
                    <p className="text-[11px] text-[#2C3B37] line-clamp-1 bg-[#FAF8F5] p-1.5 rounded-lg border border-[#EAE6DF]">
                      {img.altText || generateDefaultAltText(productTitle, idx, img.isPrimary)}
                    </p>
                  </div>

                  {/* Metadata Dimensions & Size */}
                  <div className="flex items-center justify-between text-[9px] text-[#8C8375] border-t border-[#EAE6DF] pt-2">
                    <span>
                      {img.width && img.height ? `${img.width} × ${img.height} px` : 'ابعاد بهینه‌شده'}
                    </span>
                    <span>{formatImageSize(img.sizeBytes) || 'WebP'}</span>
                  </div>

                  {/* Action Bar (Set Cover, Move Left/Right) */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {!img.isPrimary ? (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        className="text-[10px] font-bold text-[#0F4C3A] hover:bg-[#0F4C3A]/10 px-2 py-1 rounded-lg transition flex items-center gap-1"
                      >
                        <Star className="w-3 h-3 text-[#D4AF37]" />
                        <span>انتخاب به عنوان کاور</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>کاور اصلی محصول</span>
                      </span>
                    )}

                    {/* Reordering arrows */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'right')}
                        className="p-1 text-gray-400 hover:text-[#0F4C3A] disabled:opacity-30 disabled:hover:text-gray-400 rounded transition"
                        title="انتقال به جلو"
                      >
                        <MoveRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMove(idx, 'left')}
                        className="p-1 text-gray-400 hover:text-[#0F4C3A] disabled:opacity-30 disabled:hover:text-gray-400 rounded transition"
                        title="انتقال به عقب"
                      >
                        <MoveLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALT Text Editing Modal */}
      {selectedImageForAlt && (
        <AltTextEditModal
          image={selectedImageForAlt}
          productTitle={productTitle}
          onClose={() => setSelectedImageForAlt(null)}
          onSave={handleSaveAltText}
        />
      )}

      {/* Full Resolution Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-4 left-4 p-2 bg-black/60 text-white hover:bg-black rounded-full transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalUrl}
              alt="Preview"
              className="max-h-[85vh] w-auto object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface AltTextEditModalProps {
  image: ProductImage;
  productTitle: string;
  onClose: () => void;
  onSave: (newAlt: string) => void;
}

const AltTextEditModal: React.FC<AltTextEditModalProps> = ({
  image,
  productTitle,
  onClose,
  onSave,
}) => {
  const [altText, setAltText] = useState(
    image.altText || generateDefaultAltText(productTitle, image.sortOrder, image.isPrimary)
  );

  const handleAutoSuggest = () => {
    setAltText(generateDefaultAltText(productTitle, image.sortOrder, image.isPrimary));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-[#EAE6DF] text-right space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
          <div className="flex items-center gap-2">
            <FileImage className="w-5 h-5 text-[#0F4C3A]" />
            <h3 className="font-extrabold text-sm text-[#0F4C3A]">
              ویرایش متن جایگزین تصویر (Image ALT Text)
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-[#FAF8F5] p-3 rounded-2xl border border-[#EAE6DF]">
          <img
            src={image.thumbnailUrl || image.url}
            alt="Preview"
            className="w-16 h-16 object-cover rounded-xl border border-[#EAE6DF]"
            referrerPolicy="no-referrer"
          />
          <div className="text-xs text-[#6A7873] space-y-1">
            <div className="font-bold text-[#0F4C3A]">
              {image.isPrimary ? 'تصویر اصلی محصول' : `تصویر شماره #${image.sortOrder + 1}`}
            </div>
            <div>ابعاد: {image.width && image.height ? `${image.width}×${image.height} پیکسل` : 'بهینه‌شده'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-[#0F4C3A]">متن ALT سئو برای موتورهای جستجو:</label>
            <button
              type="button"
              onClick={handleAutoSuggest}
              className="text-[#0F4C3A] text-[11px] font-bold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>پیشنهاد خودکار هوشمند</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="توضیح کوتاه و دقیق در مورد محتوای تصویر برای گوگل و افراد نابینا..."
            className="w-full bg-[#FAF8F5] text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none leading-relaxed"
          />
          <p className="text-[10px] text-[#8C8375]">
            توصیه: نام محصول و ویژگی‌های منحصربه‌فرد این نما (مثلاً زاویه، محتویات، رنگ روبان) را در متن ALT ذکر کنید.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE6DF]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-[#6A7873] hover:text-[#1C2826]"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => onSave(altText)}
            className="bg-[#0F4C3A] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#0B3C2E] transition shadow-xs"
          >
            ذخیره متن ALT
          </button>
        </div>
      </div>
    </div>
  );
};
