import React from 'react';
import {
  Headphones,
  Building2,
  CheckCircle,
  ArrowLeft,
  Clock,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import { ConsultationSectionConfig } from '../types';

interface ConsultationSectionProps {
  onOpenConsultation: (initialType?: 'personal' | 'corporate') => void;
  config?: ConsultationSectionConfig;
}

export const ConsultationSection: React.FC<ConsultationSectionProps> = ({
  onOpenConsultation,
  config,
}) => {
  if (config && config.visible === false) {
    return null;
  }

  const badgeText = config?.badgeText || 'مشاوره تخصصی و همراهی اختصاصی';
  const title = config?.title || 'برای انتخاب بهترین هدیه، با ما مشورت کنید';
  const description =
    config?.description ||
    'اگر برای انتخاب پک مناسب، تعداد سفارش، بودجه یا شخصی‌سازی هدیه نیاز به راهنمایی دارید، کارشناسان ما در کنار شما هستند.';

  const primaryButtonText = config?.primaryButtonText || 'دریافت مشاوره';
  const secondaryButtonText = config?.secondaryButtonText || 'مشاوره سازمانی';

  const cardTitle = config?.cardTitle || 'چگونه به شما کمک می‌کنیم؟';
  const cardSubtitle = config?.cardSubtitle || 'همراهی در تمام مراحل انتخاب و ارسال';
  const cardBadge = config?.cardBadgeText || (config as any)?.cardBadge || 'خدمت اختصاصی';
  const cardItems =
    config?.cardItems && config.cardItems.length > 0
      ? config.cardItems
      : [
          'پیشنهاد پک بر اساس بودجه، مناسبت و گیرنده',
          'امکان تغییر اقلام و شخصی‌سازی بسته‌بندی',
          'هماهنگی سفارش‌های تعداد بالا و سازمانی',
          'ارسال نمونه برای خریدهای شرکتی قبل از تایید نهایی',
        ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="consultation-section">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F4C3A] via-[#135844] to-[#0A382B] text-[#FAF8F5] p-8 sm:p-12 lg:p-14 shadow-lg border border-[#D4AF37]/30">
        
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#1C735A]/30 rounded-full blur-2xl pointer-events-none translate-x-1/3 translate-y-1/3" />
        
        {/* Persian Motif Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-right">
          
          {/* Main Content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#E6CA65] shadow-xs">
              <Headphones className="w-4 h-4 text-[#D4AF37]" />
              <span>{badgeText}</span>
            </div>

            {/* Title & Description */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                {title}
              </h2>
              <p className="text-sm sm:text-base text-[#D0E2DB] leading-relaxed max-w-2xl font-light">
                {description}
              </p>
            </div>

            {/* Highlight Badges / Value Props */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-[#0B3A2C]/60 backdrop-blur-xs p-3 rounded-2xl border border-[#D4AF37]/20 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-xs text-[#FAF8F5] font-medium">مشاوره متناسب با بودجه</span>
              </div>

              <div className="bg-[#0B3A2C]/60 backdrop-blur-xs p-3 rounded-2xl border border-[#D4AF37]/20 flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-xs text-[#FAF8F5] font-medium">سفارش‌های عمده و سازمانی</span>
              </div>

              <div className="bg-[#0B3A2C]/60 backdrop-blur-xs p-3 rounded-2xl border border-[#D4AF37]/20 flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-xs text-[#FAF8F5] font-medium">پاسخ‌گویی سریع و دقیق</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {primaryButtonText && (
                <button
                  onClick={() => onOpenConsultation('personal')}
                  id="consultation-section-main-cta"
                  className="bg-[#D4AF37] hover:bg-[#C29F2F] text-[#0F4C3A] font-extrabold px-6 py-3.5 rounded-full text-sm flex items-center gap-2.5 transition shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
                >
                  <span>{primaryButtonText}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              {secondaryButtonText && (
                <button
                  onClick={() => onOpenConsultation('corporate')}
                  id="consultation-section-corp-cta"
                  className="bg-[#17634D]/80 hover:bg-[#1C735A] text-white border border-[#D4AF37]/40 font-bold px-5 py-3.5 rounded-full text-sm flex items-center gap-2 transition active:scale-98 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>{secondaryButtonText}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Card / Interactive Teaser Box */}
          <div className="lg:col-span-5">
            <div className="bg-[#FAF8F5] text-[#1C2826] rounded-3xl p-6 sm:p-7 shadow-xl border border-[#EAE6DF] space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold">
                    <HeartHandshake className="w-5 h-5 text-[#0F4C3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0F4C3A]">{cardTitle}</h3>
                    <p className="text-[11px] text-[#6A7873]">{cardSubtitle}</p>
                  </div>
                </div>
                {cardBadge && (
                  <span className="text-[10px] bg-[#0F4C3A]/10 text-[#0F4C3A] px-2 py-0.5 rounded-full font-bold">
                    {cardBadge}
                  </span>
                )}
              </div>

              <ul className="space-y-2.5 text-xs text-[#3A4A45]">
                {cardItems.map((itemText, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>{itemText}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-[#EAE6DF]/80 flex items-center justify-between text-[11px] text-[#6A7873]">
                <span>پاسخ‌گویی در کمتر از ۲ ساعت</span>
                <span className="font-bold text-[#0F4C3A]">کاملاً رایگان</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
