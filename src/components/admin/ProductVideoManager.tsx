import React, { useState } from 'react';
import { ProductVideo, VideoPlatform } from '../../types';
import {
  parseExternalVideoUrl,
  SUPPORTED_PLATFORMS,
  normalizeProductVideos,
} from '../../utils/videoService';
import { ProductVideoPlayer } from '../video/ProductVideoPlayer';
import {
  Play,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Video,
  Sparkles,
  Edit2,
  Check,
  X,
  Info,
  Film,
  Eye,
  Layers,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

interface ProductVideoManagerProps {
  videos: ProductVideo[];
  onChange: (videos: ProductVideo[]) => void;
  productTitle: string;
}

export const ProductVideoManager: React.FC<ProductVideoManagerProps> = ({
  videos = [],
  onChange,
  productTitle,
}) => {
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoThumbnail, setNewVideoThumbnail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<ProductVideo | null>(null);

  // Editing existing video
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // Preview Modal
  const [previewVideo, setPreviewVideo] = useState<ProductVideo | null>(null);

  // Real-time URL validation when user types or pastes
  const handleUrlChange = (url: string) => {
    setNewVideoUrl(url);
    setValidationError(null);
    setValidationSuccess(null);

    if (!url.trim()) return;

    const result = parseExternalVideoUrl(url, newVideoTitle, undefined, newVideoThumbnail);
    if (result.success && result.video) {
      setValidationSuccess(result.video);
      setValidationError(null);
      if (!newVideoTitle) {
        setNewVideoTitle(result.video.title || `ویدیوی بررسی ${productTitle}`);
      }
    } else {
      setValidationSuccess(null);
      // Only show error if string looks like an attempt at a link
      if (url.length > 5) {
        setValidationError(result.error || 'لینک ویدیو معتبر نیست.');
      }
    }
  };

  // Add new video to list
  const handleAddVideo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newVideoUrl.trim()) {
      setValidationError('لطفاً لینک ویدیو را وارد فرمایید.');
      return;
    }

    const result = parseExternalVideoUrl(
      newVideoUrl,
      newVideoTitle || `ویدیوی معرفی و بررسی ${productTitle}`,
      `vid-${Date.now()}`,
      newVideoThumbnail.trim() || undefined
    );

    if (!result.success || !result.video) {
      setValidationError(result.error || 'لینک ویدیو معتبر نیست.');
      return;
    }

    const newVideo: ProductVideo = {
      ...result.video,
      sortOrder: videos.length,
      isActive: true,
    };

    const updated = [...videos, newVideo];
    onChange(updated);

    // Reset form
    setNewVideoUrl('');
    setNewVideoTitle('');
    setNewVideoThumbnail('');
    setValidationError(null);
    setValidationSuccess(null);
  };

  // Remove video
  const handleRemoveVideo = (id: string) => {
    const updated = videos
      .filter((v) => v.id !== id)
      .map((v, idx) => ({ ...v, sortOrder: idx }));
    onChange(updated);
  };

  // Toggle active status
  const handleToggleActive = (id: string) => {
    const updated = videos.map((v) =>
      v.id === id ? { ...v, isActive: !v.isActive } : v
    );
    onChange(updated);
  };

  // Move video up/down in sort order
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const copy = [...videos];
    const [movedItem] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, movedItem);

    const updated = copy.map((v, idx) => ({ ...v, sortOrder: idx }));
    onChange(updated);
  };

  // Start editing video
  const handleStartEdit = (video: ProductVideo) => {
    setEditingVideoId(video.id);
    setEditTitle(video.title || '');
    setEditUrl(video.videoUrl);
  };

  // Save edited video
  const handleSaveEdit = (id: string) => {
    const result = parseExternalVideoUrl(editUrl, editTitle, id);
    if (!result.success || !result.video) {
      alert(result.error || 'لینک ویدیو معتبر نیست.');
      return;
    }

    const updated = videos.map((v) => {
      if (v.id === id) {
        return {
          ...v,
          ...result.video,
          title: editTitle.trim() || result.video.title,
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });

    onChange(updated);
    setEditingVideoId(null);
  };

  // Fast sample presets for testing Aparat
  const sampleAparatLinks = [
    {
      title: 'آنباکسینگ زعفران قائنات و هاون برنجی',
      url: 'https://www.aparat.com/v/kL3x9',
      platform: 'aparat' as VideoPlatform,
    },
    {
      title: 'معرفی ست میناکاری و ترمه دست‌بافت',
      url: 'https://www.aparat.com/v/mP8y2',
      platform: 'aparat' as VideoPlatform,
    },
    {
      title: 'ویدیوی بررسی بسته‌بندی هاردباکس لوکس هدیه',
      url: 'https://www.aparat.com/v/tQ5w1',
      platform: 'aparat' as VideoPlatform,
    },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. ARCHITECTURE & SPEED ADVICE BANNER */}
      <div className="p-4 bg-linear-to-r from-[#0F4C3A]/10 via-[#FAF8F5] to-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/40 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0F4C3A] text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Film className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-[#2C3B37]">
          <h4 className="font-extrabold text-[#0F4C3A] text-sm flex items-center gap-2">
            <span>سیستم ویدیوی پرسرعت و سبک محصولات (سرویس‌های هاستینگ خارجی)</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              بهینه‌سازی Core Web Vitals
            </span>
          </h4>
          <p className="text-[#3A4A45] leading-relaxed">
            برای کاهش حجم هاست، پایداری سرور و افزایش چشمگیر سرعت بارگذاری صفحه، فایل‌های ویدیویی روی سرور سایت ذخیره <strong>نمی‌شوند</strong>. کافی است ویدیو را در <strong>آپارات (Aparat)</strong> یا <strong>یوتیوب (YouTube)</strong> بارگذاری کرده و پیوند (URL) آن را در کادر زیر وارد نمایید.
          </p>
        </div>
      </div>

      {/* 2. ADD NEW VIDEO FORM */}
      <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-[#0F4C3A] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>افزودن ویدیوی جدید به محصول</span>
          </h4>
          <span className="text-[11px] text-[#6A7873]">
            پشتیبانی از: آپارات، یوتیوب، ویمیو و لینک مستقیم
          </span>
        </div>

        <div
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddVideo();
            }
          }}
          className="space-y-3"
        >
          
          {/* Video URL Input */}
          <div>
            <label className="block text-xs font-bold text-[#2C3B37] mb-1.5">
              لینک یا شناسه ویدیو <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={newVideoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="مثال: https://www.aparat.com/v/kL3x9 یا https://youtu.be/..."
                className={`w-full bg-[#FAF8F5] text-xs p-3 pl-24 rounded-xl border focus:outline-none transition ${
                  validationError
                    ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30'
                    : validationSuccess
                    ? 'border-emerald-400 focus:border-emerald-600 bg-emerald-50/20'
                    : 'border-[#E0D8C8] focus:border-[#0F4C3A]'
                }`}
                dir="ltr"
              />

              {/* Platform Detection Badge inside input */}
              {validationSuccess && (
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${SUPPORTED_PLATFORMS[validationSuccess.platform].badgeBg}`}>
                    {SUPPORTED_PLATFORMS[validationSuccess.platform].badgeText}
                  </span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
              )}
            </div>

            {/* Validation Feedback */}
            {validationError && (
              <p className="text-rose-600 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationError}</span>
              </p>
            )}

            {validationSuccess && (
              <p className="text-emerald-700 text-[11px] font-bold mt-1.5 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>ویدیو با موفقیت شناسایی شد (پلتفرم: {SUPPORTED_PLATFORMS[validationSuccess.platform].nameFa} | شناسه: {validationSuccess.videoId})</span>
              </p>
            )}
          </div>

          {/* Title & Custom Poster Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2C3B37] mb-1">
                عنوان ویدیوی محصول
              </label>
              <input
                type="text"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="مثال: آنباکسینگ و بررسی جزئیات محتویات باکس"
                className="w-full bg-[#FAF8F5] text-xs p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C3B37] mb-1">
                لینک تصویر پیش‌نمایش / کاور (اختیاری)
              </label>
              <input
                type="text"
                value={newVideoThumbnail}
                onChange={(e) => setNewVideoThumbnail(e.target.value)}
                placeholder="در صورت خالی بودن، تصویر پیش‌فرض خودکار تنظیم می‌شود"
                className="w-full bg-[#FAF8F5] text-xs p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                dir="ltr"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#6A7873]">نمونه لینک‌های تست آپارات:</span>
              {sampleAparatLinks.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewVideoTitle(s.title);
                    handleUrlChange(s.url);
                  }}
                  className="text-[10px] bg-[#F4EFE6] hover:bg-[#EAE6DF] text-[#0F4C3A] px-2 py-1 rounded-lg transition"
                >
                  نمونه {idx + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddVideo}
              className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>افزودن به لیست ویدیوها</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. LIST OF ADDED PRODUCT VIDEOS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-[#0F4C3A] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#D4AF37]" />
            <span>ویدیوهای ثبت‌شده برای این محصول ({videos.length})</span>
          </h4>
          <span className="text-[11px] text-[#8C8375]">
            امکان افزودن چندین ویدیو، جابجایی ترتیب و فعال/غیرفعال‌سازی
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="p-8 bg-[#FAF8F5] rounded-2xl border-2 border-dashed border-[#EAE6DF] text-center space-y-2">
            <Video className="w-10 h-10 text-[#8C8375]/50 mx-auto" />
            <p className="font-bold text-xs text-[#2C3B37]">
              هنوز ویدیویی برای این محصول ثبت نشده است.
            </p>
            <p className="text-[11px] text-[#6A7873] max-w-md mx-auto">
              با افزودن ویدیوی آپارات یا یوتیوب، مشتریان می‌توانند جزئیات بسته‌بندی، متریال و اصالت محتویات را قبل از خرید به وضوح تماشا کنند.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video, index) => {
              const platformMeta = SUPPORTED_PLATFORMS[video.platform] || SUPPORTED_PLATFORMS.aparat;
              const isEditing = editingVideoId === video.id;

              return (
                <div
                  key={video.id || index}
                  className={`bg-white rounded-2xl border p-4 transition shadow-xs ${
                    video.isActive ? 'border-[#EAE6DF]' : 'border-gray-200 bg-gray-50/60 opacity-75'
                  }`}
                >
                  {isEditing ? (
                    /* Inline Edit Mode */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[#6A7873] mb-1">
                            عنوان ویدیو
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-[#FAF8F5] text-xs p-2 rounded-xl border border-[#E0D8C8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#6A7873] mb-1">
                            لینک ویدیو (آپارات یا یوتیوب)
                          </label>
                          <input
                            type="text"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="w-full bg-[#FAF8F5] text-xs p-2 rounded-xl border border-[#E0D8C8]"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingVideoId(null)}
                          className="px-3 py-1.5 rounded-xl text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(video.id)}
                          className="px-3 py-1.5 rounded-xl text-xs bg-[#0F4C3A] text-white font-bold hover:bg-[#0B3C2E] flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ذخیره تغییرات</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode Card */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left info & preview thumbnail */}
                      <div className="flex items-center gap-3">
                        {/* Thumbnail / Poster */}
                        <div
                          onClick={() => setPreviewVideo(video)}
                          className="relative w-24 h-16 rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer group shadow-xs border border-black/10"
                          title="کلیک برای پیش‌نمایش زنده ویدیو"
                        >
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#0F4C3A] flex items-center justify-center text-white">
                              <Film className="w-6 h-6 text-[#D4AF37]" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition">
                            <div className="w-6 h-6 rounded-full bg-white/90 text-[#0F4C3A] flex items-center justify-center shadow">
                              <Play className="w-3 h-3 fill-current translate-x-[-0.5px]" />
                            </div>
                          </div>
                        </div>

                        {/* Text Metadata */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${platformMeta.badgeBg}`}>
                              {platformMeta.badgeText}
                            </span>
                            <h5 className="font-bold text-xs text-[#0F4C3A]">
                              {video.title || 'ویدیوی محصول'}
                            </h5>
                            {!video.isActive && (
                              <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                غیرفعال در سایت
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-[11px] text-[#6A7873]">
                            <span className="font-mono text-[10px] text-[#8C8375]">شناسه: {video.videoId}</span>
                            <span>•</span>
                            <a
                              href={video.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0F4C3A] hover:underline flex items-center gap-0.5"
                            >
                              <span>مشاهده لینک منبع</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Tools */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        
                        {/* Order Buttons */}
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg border border-[#EAE6DF] hover:bg-[#F4EFE6] disabled:opacity-30 transition text-[#3A4A45]"
                          title="انتقال به بالا"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(index, 'down')}
                          disabled={index === videos.length - 1}
                          className="p-1.5 rounded-lg border border-[#EAE6DF] hover:bg-[#F4EFE6] disabled:opacity-30 transition text-[#3A4A45]"
                          title="انتقال به پایین"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Test Live Preview Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewVideo(video)}
                          className="p-1.5 rounded-lg border border-[#EAE6DF] hover:bg-[#0F4C3A]/10 text-[#0F4C3A] transition"
                          title="تست و پیش‌نمایش پلیر"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(video)}
                          className="p-1.5 rounded-lg border border-[#EAE6DF] hover:bg-[#F4EFE6] text-[#3A4A45] transition"
                          title="ویرایش عنوان یا آدرس"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Active Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(video.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                            video.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {video.isActive ? 'فعال' : 'غیرفعال'}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(video.id)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          title="حذف ویدیو"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL: LIVE PREVIEW PLAYER IN ADMIN */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="bg-[#FAF8F5] rounded-3xl w-full max-w-2xl overflow-hidden border border-[#D4AF37]/50 shadow-2xl space-y-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-sm text-[#0F4C3A]">
                  پیش‌نمایش پلیر ویدیوی محصول
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ProductVideoPlayer
              video={previewVideo}
              autoPlayOnMount={true}
              showDetails={true}
            />

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="bg-[#0F4C3A] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                بستن پیش‌نمایش
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
