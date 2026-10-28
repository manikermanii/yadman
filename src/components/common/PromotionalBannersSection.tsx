import React from 'react';
import { PromotionalBannerItem } from '../../types';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface PromotionalBannersSectionProps {
  banners: PromotionalBannerItem[];
  onNavigateTab?: (targetTab: string) => void;
}

export const PromotionalBannersSection: React.FC<PromotionalBannersSectionProps> = ({
  banners,
  onNavigateTab,
}) => {
  const activeBanners = (banners || []).filter((b) => b.visible);
  if (activeBanners.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6" id="banners-section">
      {activeBanners.map((banner) => {
        const bg = banner.backgroundColor || '#0F4C3A';
        const textColor = banner.textColor || '#FAF8F5';

        return (
          <div
            key={banner.id}
            className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-lg border border-[#D4AF37]/30 flex flex-col md:flex-row items-center justify-between gap-6 text-right transition-transform hover:-translate-y-0.5"
            style={{
              backgroundColor: bg,
              color: textColor,
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

            {/* Optional Banner Image */}
            {banner.imageUrl && (
              <div className="md:w-1/3 w-full h-44 md:h-48 rounded-2xl overflow-hidden shadow-md shrink-0 border border-white/20">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Banner Text Content */}
            <div className="space-y-3 flex-1">
              {banner.badgeText && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#D4AF37] text-[#0F4C3A] shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#0F4C3A]" />
                  <span>{banner.badgeText}</span>
                </div>
              )}

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight">
                {banner.title}
              </h2>

              {banner.subtitle && (
                <p className="text-xs sm:text-sm font-medium opacity-90">
                  {banner.subtitle}
                </p>
              )}

              {banner.description && (
                <p className="text-xs sm:text-sm opacity-80 leading-relaxed max-w-2xl font-light">
                  {banner.description}
                </p>
              )}
            </div>

            {/* Action Button */}
            {banner.buttonText && (
              <button
                type="button"
                onClick={() => {
                  const target = banner.buttonAction || (banner as any).buttonLink;
                  if (onNavigateTab && target) {
                    onNavigateTab(target);
                  }
                }}
                className="shrink-0 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0F4C3A] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{banner.buttonText}</span>
                <ArrowLeft className="w-4 h-4 text-[#0F4C3A]" />
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
};
