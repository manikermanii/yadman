import React from 'react';
import { HERO_BANNER_IMAGE } from '../data/products';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { HeroConfig } from '../types';
import { renderLucideIcon } from './admin/homepage/IconSelector';

interface HeroProps {
  onExploreCatalog: () => void;
  onOpenBuilder: () => void;
  onOpenAiConcierge: () => void;
  heroImage?: string;
  config?: HeroConfig;
  onNavigateTab?: (tabId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreCatalog,
  onOpenBuilder,
  onOpenAiConcierge,
  heroImage,
  config,
  onNavigateTab,
}) => {
  // Resolve action helper
  const handleAction = (actionType?: string, defaultFn?: () => void) => {
    if (!actionType) {
      if (defaultFn) defaultFn();
      return;
    }
    if (actionType === 'catalog') onExploreCatalog();
    else if (actionType === 'builder') onOpenBuilder();
    else if (actionType === 'corporate' || actionType === 'consultation') {
      if (onNavigateTab) onNavigateTab(actionType);
      else onOpenAiConcierge();
    } else if (onNavigateTab) {
      onNavigateTab(actionType);
    } else if (defaultFn) {
      defaultFn();
    }
  };

  const showBadge = config ? config.showBadge : true;
  const badgeText = config?.badgeText || 'پک‌های هدیه لوکس و سازمانی';
  const mainTitle = config?.mainTitle || 'هدیه‌ای برای ماندن در یاد';
  const highlightedTitle = config?.highlightedTitle || 'با سلیقه شما';
  const description =
    config?.description ||
    'پک‌های هدیه باکیفیت برای مناسبت‌های شخصی و سازمانی؛ با امکان انتخاب محصولات و شخصی‌سازی بسته‌بندی.';

  const activeHeroImage = config?.heroImage || heroImage || HERO_BANNER_IMAGE;
  const heroImageAlt = config?.heroImageAlt || 'پک هدیه اختصاصی یادمان';

  const showPrimaryButton = config ? config.showPrimaryButton : true;
  const primaryButtonText = config?.primaryButtonText || 'مشاهده پک‌ها';

  const showSecondaryButton = config ? config.showSecondaryButton : true;
  const secondaryButtonText = config?.secondaryButtonText || 'سفارش سازمانی';

  const showTertiaryButton = config ? config.showTertiaryButton : true;
  const tertiaryButtonText = config?.tertiaryButtonText || 'ساخت پک اختصاصی';

  const showFloatingCard = config ? config.showFloatingCard : true;
  const floatingCardTitle = config?.floatingCardTitle || 'بسته‌بندی اختصاصی';
  const floatingCardText =
    config?.floatingCardText || 'هر پک با دقت بسته‌بندی و آماده ارسال می‌شود.';

  const showBenefits = config ? config.showBenefits : true;
  const benefits = config?.benefits && config.benefits.length > 0
    ? config.benefits.filter((b) => b.visible)
    : [
        {
          id: '1',
          title: 'کیفیت تضمین‌شده',
          description: 'انتخاب محصولات باکیفیت برای هر پک',
          iconName: 'Award',
          visible: true,
        },
        {
          id: '2',
          title: 'بسته‌بندی اختصاصی',
          description: 'امکان شخصی‌سازی بسته‌بندی',
          iconName: 'Stamp',
          visible: true,
        },
        {
          id: '3',
          title: 'ارسال مطمئن',
          description: 'بسته‌بندی ایمن و ارسال به سراسر کشور',
          iconName: 'ShieldCheck',
          visible: true,
        },
        {
          id: '4',
          title: 'پشتیبانی سفارش',
          description: 'همراه شما از انتخاب تا تحویل',
          iconName: 'Heart',
          visible: true,
        },
      ];

  return (
    <section className="relative overflow-hidden bg-[#FAF8F5] py-8 lg:py-14 border-b border-[#EAE6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Text Content - Right side in RTL */}
          <div className="lg:col-span-7 space-y-6 text-right">
            
            {/* Top Badge */}
            {showBadge && (
              <div className="inline-flex items-center gap-2 bg-[#0F4C3A]/10 border border-[#0F4C3A]/20 px-3.5 py-1.5 rounded-full text-[#0F4C3A] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{badgeText}</span>
              </div>
            )}

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F4C3A] leading-tight tracking-tight">
              {mainTitle}{' '}
              {highlightedTitle && (
                <span className="text-gold-shimmer block mt-2 font-extrabold">
                  {highlightedTitle}
                </span>
              )}
            </h1>

            {/* Subtext */}
            <p className="text-[#3A4A45] text-sm sm:text-base leading-relaxed max-w-2xl font-light">
              {description}
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {showPrimaryButton && primaryButtonText && (
                <button
                  onClick={() => handleAction(config?.primaryButtonAction, onExploreCatalog)}
                  id="hero-explore-btn"
                  className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] px-6 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <span>{primaryButtonText}</span>
                  <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
                </button>
              )}

              {showSecondaryButton && secondaryButtonText && (
                <button
                  onClick={() => handleAction(config?.secondaryButtonAction, onOpenAiConcierge)}
                  id="hero-builder-btn"
                  className="bg-[#F4EFE6] hover:bg-[#EAE2D2] text-[#0F4C3A] border border-[#D4AF37]/50 px-6 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <span>{secondaryButtonText}</span>
                </button>
              )}

              {showTertiaryButton && tertiaryButtonText && (
                <button
                  onClick={() => handleAction(config?.tertiaryButtonAction, onOpenBuilder)}
                  id="hero-ai-btn"
                  className="text-xs text-[#0F4C3A] underline underline-offset-4 hover:text-[#D4AF37] px-3 py-2 font-medium cursor-pointer"
                >
                  {tertiaryButtonText}
                </button>
              )}
            </div>

            {/* Key Value Props / Benefits */}
            {showBenefits && benefits.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#EAE6DF]/80">
                {benefits.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-xs text-[#1C2826]">
                    <div className="w-8 h-8 rounded-full bg-[#0F4C3A]/10 flex items-center justify-center shrink-0 text-[#0F4C3A]">
                      {renderLucideIcon(b.iconName, 'w-4 h-4 text-[#0F4C3A]')}
                    </div>
                    <div>
                      <span className="font-bold block">{b.title}</span>
                      <span className="text-[10px] text-[#6A7873]">{b.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Hero Image Showcase - Left side in RTL */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/30 group">
              <img
                src={activeHeroImage}
                alt={heroImageAlt}
                className="w-full h-[380px] sm:h-[460px] object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F4C3A]/70 via-transparent to-transparent opacity-80" />

              {/* Float Card Overlay */}
              {showFloatingCard && (
                <div className="absolute bottom-4 right-4 left-4 bg-[#FAF8F5]/95 backdrop-blur-md p-4 rounded-xl border border-[#D4AF37]/40 shadow-lg text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#0F4C3A] ring-2 ring-[#D4AF37]" />
                      <span className="text-xs font-bold text-[#0F4C3A]">{floatingCardTitle}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#3A4A45] mt-1">
                    {floatingCardText}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
