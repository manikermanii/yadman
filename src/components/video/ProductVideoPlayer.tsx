import React, { useState } from 'react';
import { ProductVideo } from '../../types';
import { SUPPORTED_PLATFORMS, isWhitelistedEmbedUrl } from '../../utils/videoService';
import {
  Play,
  ExternalLink,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Film,
  Maximize2,
  Volume2,
} from 'lucide-react';

interface ProductVideoPlayerProps {
  video: ProductVideo;
  fallbackThumbnail?: string;
  autoPlayOnMount?: boolean;
  className?: string;
  showDetails?: boolean;
}

export const ProductVideoPlayer: React.FC<ProductVideoPlayerProps> = ({
  video,
  fallbackThumbnail,
  autoPlayOnMount = false,
  className = '',
  showDetails = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlayOnMount);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const platformInfo = SUPPORTED_PLATFORMS[video.platform] || SUPPORTED_PLATFORMS.aparat;
  const posterImage = video.thumbnailUrl || fallbackThumbnail;

  const isSafeEmbed = isWhitelistedEmbedUrl(video.embedUrl, video.platform);

  const handlePlayClick = () => {
    setHasError(false);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsIframeLoaded(false);
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-[#121B18] shadow-lg border border-[#D4AF37]/30 ${className}`}>
      
      {/* 16:9 Aspect Ratio Container for Zero CLS (Layout Shift Prevention) */}
      <div className="relative w-full aspect-video overflow-hidden bg-black/90 flex items-center justify-center">
        
        {/* State 1: Lightweight Thumbnail & Luxury Click-To-Play Preview */}
        {!isPlaying ? (
          <div
            className="absolute inset-0 w-full h-full cursor-pointer group select-none"
            onClick={handlePlayClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePlayClick();
              }
            }}
            aria-label={`پخش ویدیوی ${video.title || 'محصول'}`}
          >
            {/* Background Poster Image */}
            {posterImage ? (
              <img
                src={posterImage}
                alt={video.title || 'پیش‌نمایش ویدیوی محصول'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-85 group-hover:brightness-95"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // If external thumbnail fails, fallback to general placeholder
                  if (fallbackThumbnail && e.currentTarget.src !== fallbackThumbnail) {
                    e.currentTarget.src = fallbackThumbnail;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-[#0F4C3A] via-[#1A2E28] to-[#0A1814] flex items-center justify-center">
                <Film className="w-16 h-16 text-[#D4AF37]/40" />
              </div>
            )}

            {/* Dark Gradient Overlay for Readability */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/20" />

            {/* Top Badges (Platform & Quality Tag) */}
            <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 bg-[#0F4C3A]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#D4AF37]/40 text-[#FAF8F5] text-[11px] font-bold shadow-md">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>ویدیوی معرفی و آنباکسینگ</span>
              </div>

              <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs ${platformInfo.badgeBg}`}>
                {platformInfo.badgeText}
              </div>
            </div>

            {/* Center Luxury Play Button (Hover Ripple & Gold Accent) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Subtle Pulse Ring */}
                <div className="absolute w-20 h-20 rounded-full bg-[#D4AF37]/20 animate-ping pointer-events-none" />
                <div className="absolute w-16 h-16 rounded-full bg-[#0F4C3A]/60 backdrop-blur-xs pointer-events-none" />

                {/* Primary Button Target */}
                <button
                  type="button"
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-linear-to-br from-[#D4AF37] to-[#AA820A] text-[#0F4C3A] flex items-center justify-center shadow-2xl transition-all duration-300 transform group-hover:scale-110 active:scale-95 border-2 border-white/40 cursor-pointer"
                  title="کلیک برای پخش ویدیو"
                  tabIndex={-1}
                >
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-[-1px]" />
                </button>
              </div>
            </div>

            {/* Bottom Title & Click Prompt Bar */}
            <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-linear-to-t from-black/95 to-transparent text-right">
              <p className="text-white font-bold text-xs sm:text-sm drop-shadow-sm line-clamp-1">
                {video.title || 'مشاهده ویدیوی بررسی و اصالت پک هدیه'}
              </p>
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#D4AF37]">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  <span>برای پخش همراه با صدا کلیک کنید</span>
                </span>
                <span className="text-white/70 text-[10px]">
                  پخش سبک و پرسرعت
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* State 2: Active Video Player (Loaded Asynchronously upon Click) */
          <div className="relative w-full h-full bg-black">
            
            {/* Loading Spinner until Iframe loads */}
            {!isIframeLoaded && !hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0A1814] text-white z-10">
                <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
                <span className="text-xs text-[#A3C4BA]">در حال اتصال به {platformInfo.nameFa}...</span>
              </div>
            )}

            {/* Error Fallback */}
            {hasError || !isSafeEmbed ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#121B18] text-[#FAF8F5] gap-3">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <p className="text-xs font-bold">
                  خطا در بارگذاری پلیر خارجی ویدیو
                </p>
                <p className="text-[11px] text-[#A3C4BA] max-w-xs">
                  می‌توانید ویدیو را مستقیماً در سایت منبع مشاهده نمایید.
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <span>مشاهده در {platformInfo.nameFa}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بازگشت به تصویر</span>
                  </button>
                </div>
              </div>
            ) : video.platform === 'direct' ? (
              /* Direct HTML5 Video Player */
              <video
                src={video.embedUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                onLoadedData={() => setIsIframeLoaded(true)}
                onError={() => setHasError(true)}
              >
                مرورگر شما از پخش مستقیم ویدیو پشتیبانی نمی‌کند.
              </video>
            ) : (
              /* External Iframe Player (Aparat, YouTube, Vimeo) */
              <iframe
                src={video.embedUrl}
                title={video.title || 'ویدیوی معرفی محصول'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                onLoad={() => setIsIframeLoaded(true)}
                onError={() => setHasError(true)}
              />
            )}

            {/* Quick Controls overlay on top when video is playing */}
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] flex items-center gap-1 shadow-md transition"
                title="توقف و بستن پلیر"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">بستن پلیر</span>
              </button>
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-[#D4AF37] text-[10px] flex items-center gap-1 shadow-md transition"
                title={`مشاهده مستقیم در ${platformInfo.nameFa}`}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Optional Video Meta Info Bar below player */}
      {showDetails && (
        <div className="p-3 bg-[#0F4C3A]/90 text-white flex items-center justify-between text-xs border-t border-[#1B5E4A]">
          <div className="flex items-center gap-2 overflow-hidden">
            <Film className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span className="font-bold truncate text-[#FAF8F5]">
              {video.title || 'ویدیوی بررسی و بسته‌بندی پک'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4AF37] hover:text-white flex items-center gap-1 transition text-[11px] font-semibold"
            >
              <span>مشاهده در {platformInfo.nameFa}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
