import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Trash2, CheckCircle2, AlertCircle, RefreshCw, Eye, Sparkles } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (dataUrlOrUrl: string) => void;
  altText?: string;
  onAltTextChange?: (alt: string) => void;
  defaultImage?: string;
  aspectRatioHint?: string;
  recommendedSize?: string;
  id?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  description,
  value,
  onChange,
  altText = '',
  onAltTextChange,
  defaultImage,
  aspectRatioHint = '16:9 یا مستطیل افقی',
  recommendedSize = 'حداکثر ۱۰ مگابایت (فرمت‌های JPG، PNG، WebP)',
  id = 'image-upload',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeText?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and load image file
  const handleFileProcess = (file: File) => {
    setErrorMessage(null);

    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

    if (!allowedMime.includes(file.type.toLowerCase()) && !validExts.includes(ext)) {
      setErrorMessage('فرمت فایل نامعتبر است. لطفاً فقط از فرمت‌های JPG، PNG یا WebP استفاده کنید.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('حجم تصویر بیش از ۱۰ مگابایت است. لطفاً فایل کم‌حجم‌تری انتخاب فرمایید.');
      return;
    }

    const sizeStr =
      file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(2) + ' مگابایت'
        : (file.size / 1024).toFixed(0) + ' کیلوبایت';

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setErrorMessage('خطا در خواندن فایل تصویر.');
        return;
      }

      const img = new Image();
      img.onload = () => {
        setImageMeta({ width: img.naturalWidth, height: img.naturalHeight, sizeText: sizeStr });
        onChange(dataUrl);
      };
      img.onerror = () => {
        setErrorMessage('فایل تصویر معتبر نیست.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setErrorMessage('بارگذاری فایل ناموفق بود.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setErrorMessage(null);
    onChange(urlInput.trim());
  };

  const handleResetToDefault = () => {
    if (defaultImage) {
      onChange(defaultImage);
      setImageMeta(null);
      setErrorMessage(null);
    }
  };

  const handleRemove = () => {
    onChange('');
    setImageMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-extrabold text-[#0F4C3A]">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-[#6A7873] mt-0.5">{description}</p>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#F4EFE6] p-1 rounded-xl text-[11px]">
          <button
            type="button"
            onClick={() => setActiveInputMode('upload')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeInputMode === 'upload'
                ? 'bg-white text-[#0F4C3A] shadow-xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            آپلود فایل
          </button>
          <button
            type="button"
            onClick={() => setActiveInputMode('url')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              activeInputMode === 'url'
                ? 'bg-white text-[#0F4C3A] shadow-xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            آدرس اینترنتی (URL)
          </button>
        </div>
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Current Preview or Upload Area */}
      {value ? (
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EAE6DF] space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-[#D4AF37]/30 max-h-56 bg-black/5 flex items-center justify-center">
            <img
              src={value}
              alt={altText || label}
              className="max-h-56 w-full object-cover sm:object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-[#0F4C3A] shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصویر فعال</span>
            </div>
          </div>

          {/* Image Stats & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#EAE6DF] text-xs">
            <div className="text-[11px] text-[#6A7873]">
              {imageMeta ? (
                <span>
                  ابعاد: {imageMeta.width} × {imageMeta.height} پیکسل
                  {imageMeta.sizeText && ` | حجم: ${imageMeta.sizeText}`}
                </span>
              ) : (
                <span>نسبت پیشنهادی: {aspectRatioHint}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-white border border-[#EAE6DF] hover:border-[#0F4C3A] text-[#0F4C3A] rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>تغییر تصویر</span>
              </button>

              {defaultImage && value !== defaultImage && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                  title="بازگردانی به تصویر پیش‌فرض"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>پیش‌فرض</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        activeInputMode === 'upload' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-[#0F4C3A] bg-[#0F4C3A]/5'
                : 'border-[#E0D8C8] hover:border-[#0F4C3A] bg-[#FAF8F5]'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#0F4C3A]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#0F4C3A]">
                کلیک کنید یا تصویر را به اینجا بکشید
              </span>
              <p className="text-[10px] text-[#6A7873]">{recommendedSize}</p>
            </div>
            {defaultImage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetToDefault();
                }}
                className="text-[11px] text-[#D4AF37] font-bold underline hover:text-[#0F4C3A] mt-1"
              >
                استفاده از تصویر پیش‌فرض یادمان
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              className="flex-1 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-mono text-left focus:outline-none focus:border-[#0F4C3A]"
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="bg-[#0F4C3A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#0B3C2E] transition cursor-pointer"
            >
              ثبت لینک
            </button>
          </div>
        )
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
        className="hidden"
        id={id}
      />

      {/* Alt Text Input */}
      {onAltTextChange && (
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[#4A5A55]">
            متن جایگزین تصویر (Alt Text برای سئو و دسترس‌پذیری):
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => onAltTextChange(e.target.value)}
            placeholder="توضیح کوتاه درباره محتوای تصویر برای موتورهای جستجو..."
            className="w-full bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#E0D8C8] text-xs focus:border-[#0F4C3A] focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
