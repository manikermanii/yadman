import React, { useState } from 'react';
import { HomepageCMSConfig, Product, BlogPost } from '../../../types';
import { renderLucideIcon } from './IconSelector';
import {
  X,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  Gift,
  Building2,
  Headphones,
  Sparkles,
  ArrowLeft,
  Search,
  ShoppingBag,
  Heart,
  Star,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface HomepageLivePreviewModalProps {
  config: HomepageCMSConfig;
  products: Product[];
  blogPosts: BlogPost[];
  onClose: () => void;
  onSave?: () => void;
}

export const HomepageLivePreviewModal: React.FC<HomepageLivePreviewModalProps> = ({
  config,
  products,
  blogPosts,
  onClose,
  onSave,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const {
    header,
    hero,
    products: productsConfig,
    banners,
    consultation,
    corporate,
    blog: blogConfig,
    footer,
    sectionOrder,
  } = config;

  // Filter products for showcase
  const displayedProducts = (
    productsConfig?.productIds && productsConfig.productIds.length > 0
      ? products.filter((p) => productsConfig.productIds.includes(p.id))
      : products
  ).slice(0, productsConfig?.displayLimit || 6);

  // Filter blog posts
  const displayedPosts = (
    blogConfig?.selectedPostIds && blogConfig.selectedPostIds.length > 0
      ? blogPosts.filter((p) => blogConfig.selectedPostIds?.includes(p.id))
      : blogPosts
  ).slice(0, blogConfig?.displayLimit || 3);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 text-right"
      dir="rtl"
    >
      {/* Top Modal Controls */}
      <div className="w-full max-w-7xl bg-[#0F4C3A] text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-xl mb-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>پیش‌نمایش زنده صفحه اصلی (Live Preview)</span>
          </span>
          <span className="hidden sm:inline text-xs text-[#E0D8C8] bg-white/10 px-2.5 py-0.5 rounded-full">
            پیش‌نویس تنظیمات فعال
          </span>
        </div>

        {/* Viewport Selectors */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              deviceMode === 'desktop' ? 'bg-[#D4AF37] text-[#0F4C3A]' : 'text-white/70 hover:text-white'
            }`}
            title="نمای دسکتاپ"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden md:inline">رایانه</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              deviceMode === 'tablet' ? 'bg-[#D4AF37] text-[#0F4C3A]' : 'text-white/70 hover:text-white'
            }`}
            title="نمای تبلت"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden md:inline">تبلت</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              deviceMode === 'mobile' ? 'bg-[#D4AF37] text-[#0F4C3A]' : 'text-white/70 hover:text-white'
            }`}
            title="نمای موبایل"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">موبایل</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onSave && (
            <button
              type="button"
              onClick={() => {
                onSave();
                onClose();
              }}
              className="bg-[#D4AF37] text-[#0F4C3A] px-3.5 py-1.5 rounded-xl font-extrabold text-xs hover:bg-[#b8952b] transition shadow-xs cursor-pointer"
            >
              ذخیره و اعمال نهایی
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
            title="بستن پیش‌نمایش"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Simulator Container */}
      <div className="w-full flex-1 overflow-hidden flex items-center justify-center">
        <div
          className={`h-full bg-[#FAF8F5] text-[#2C3B37] rounded-2xl shadow-2xl overflow-y-auto transition-all duration-300 border border-[#EAE6DF] ${
            deviceMode === 'desktop'
              ? 'w-full max-w-7xl'
              : deviceMode === 'tablet'
              ? 'w-[768px] max-w-full'
              : 'w-[390px] max-w-full'
          }`}
        >
          {/* 1. SIMULATED HEADER */}
          {header && (
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EAE6DF]">
              {/* Top Announcement Bar */}
              {header.showAnnouncement && header.announcementText && (
                <div className="bg-[#0F4C3A] text-[#FAF8F5] text-[11px] py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
                  <span>{header.announcementText}</span>
                  {header.showPhone && header.phoneText && (
                    <span className="hidden sm:inline border-r border-white/30 pr-2 mr-2 text-[10px]">
                      {header.phoneText}
                    </span>
                  )}
                </div>
              )}

              {/* Main Nav Bar */}
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                  {header.logoImage ? (
                    <img
                      src={header.logoImage}
                      alt={header.logoAlt || header.websiteName || 'یادمان'}
                      className="h-9 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#0F4C3A] text-[#D4AF37] flex items-center justify-center font-bold">
                        ی
                      </div>
                      <span className="font-extrabold text-lg text-[#0F4C3A]">
                        {header.websiteName || 'یادمان'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nav Links */}
                <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-[#4A5A55]">
                  {(header.navItems || [])
                    .filter((item) => item.visible)
                    .map((item) => (
                      <span
                        key={item.id}
                        className="hover:text-[#0F4C3A] transition cursor-pointer flex items-center gap-1"
                      >
                        {renderLucideIcon(item.iconName, 'w-3.5 h-3.5')}
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#D4AF37] text-[#0F4C3A] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    ))}
                </nav>

                {/* Header Actions */}
                <div className="flex items-center gap-2 text-xs">
                  {header.showSearch && (
                    <div className="hidden sm:flex items-center bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3 py-1.5 text-[#6A7873] text-[11px] w-48 truncate">
                      <Search className="w-3.5 h-3.5 ml-1.5 text-gray-400" />
                      <span className="truncate">{header.searchPlaceholder}</span>
                    </div>
                  )}
                  <span className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E0D8C8] text-[#0F4C3A]">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </header>
          )}

          {/* 2. DYNAMIC SECTIONS IN CONFIGURED ORDER */}
          {(sectionOrder || []).map((sec) => {
            if (!sec.enabled) return null;

            // SECTION: HERO
            if (sec.id === 'hero' && hero) {
              return (
                <section key="hero" className="py-8 sm:py-14 px-4 max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Right text column in RTL */}
                    <div className="space-y-4 text-right">
                      {hero.showBadge && hero.badgeText && (
                        <div className="inline-flex items-center gap-2 bg-[#0F4C3A]/10 text-[#0F4C3A] px-3 py-1 rounded-full text-xs font-extrabold border border-[#0F4C3A]/20">
                          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{hero.badgeText}</span>
                        </div>
                      )}

                      <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F4C3A] leading-tight">
                        {hero.mainTitle}{' '}
                        {hero.highlightedTitle && (
                          <span className="text-[#D4AF37] block sm:inline">
                            {hero.highlightedTitle}
                          </span>
                        )}
                      </h1>

                      <p className="text-xs sm:text-sm text-[#4A5A55] leading-relaxed max-w-xl">
                        {hero.description}
                      </p>

                      {/* CTA Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {hero.showPrimaryButton && hero.primaryButtonText && (
                          <button className="bg-[#0F4C3A] text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-xs">
                            {hero.primaryButtonText}
                          </button>
                        )}
                        {hero.showSecondaryButton && hero.secondaryButtonText && (
                          <button className="bg-[#F4EFE6] text-[#0F4C3A] border border-[#E0D8C8] px-5 py-2.5 rounded-xl font-extrabold text-xs">
                            {hero.secondaryButtonText}
                          </button>
                        )}
                        {hero.showTertiaryButton && hero.tertiaryButtonText && (
                          <button className="text-[#0F4C3A] font-bold text-xs underline underline-offset-4 pr-2">
                            {hero.tertiaryButtonText}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Left image column */}
                    <div className="relative">
                      <div className="rounded-3xl overflow-hidden shadow-xl border border-[#D4AF37]/30 max-h-96">
                        <img
                          src={hero.heroImage}
                          alt={hero.heroImageAlt || 'Hero'}
                          className="w-full h-full object-cover max-h-96"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Floating Card */}
                      {hero.showFloatingCard && (
                        <div className="absolute -bottom-4 -right-4 sm:bottom-4 sm:right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#D4AF37]/40 shadow-lg max-w-xs space-y-1">
                          <span className="font-extrabold text-xs text-[#0F4C3A] block">
                            {hero.floatingCardTitle}
                          </span>
                          <p className="text-[10px] text-[#6A7873]">
                            {hero.floatingCardText}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 Benefits Row */}
                  {hero.showBenefits && (hero.benefits || []).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 pt-8 border-t border-[#EAE6DF]">
                      {(hero.benefits || [])
                        .filter((b) => b.visible)
                        .map((b) => (
                          <div
                            key={b.id}
                            className="bg-white p-3.5 rounded-2xl border border-[#EAE6DF] space-y-1"
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#0F4C3A]/10 flex items-center justify-center text-[#0F4C3A] mb-1">
                              {renderLucideIcon(b.iconName, 'w-4 h-4 text-[#0F4C3A]')}
                            </div>
                            <span className="font-extrabold text-xs text-[#0F4C3A] block">
                              {b.title}
                            </span>
                            <p className="text-[10px] text-[#6A7873] leading-relaxed">
                              {b.description}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              );
            }

            // SECTION: PRODUCT SHOWCASE
            if (sec.id === 'product_showcase' && productsConfig && productsConfig.visible !== false) {
              return (
                <section key="products" className="py-10 bg-white border-y border-[#EAE6DF] px-4">
                  <div className="max-w-7xl mx-auto space-y-6">
                    <div className="text-center space-y-1 max-w-2xl mx-auto">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F4C3A]">
                        {productsConfig.title}
                      </h2>
                      <p className="text-xs text-[#6A7873]">{productsConfig.description}</p>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {displayedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-[#FAF8F5] rounded-xl sm:rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-2xs space-y-1.5 pb-2.5"
                        >
                          <div className="aspect-[4/3] bg-black/5 overflow-hidden">
                            <img
                              src={p.image}
                              alt={p.titleFa || 'پک هدیه'}
                              className="w-full h-full object-contain p-1"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="px-2.5 space-y-0.5">
                            <h3 className="font-extrabold text-xs text-[#1C2826] truncate">
                              {p.titleFa}
                            </h3>
                            <span className="text-[11px] sm:text-xs font-bold text-[#D4AF37] block">
                              {p.price.toLocaleString('fa-IR')} تومان
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {productsConfig.showViewAllButton && (
                      <div className="text-center pt-2">
                        <button className="bg-[#0F4C3A] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs">
                          {productsConfig.viewAllButtonText}
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            // SECTION: BANNERS
            if (sec.id === 'banners' && banners && banners.length > 0) {
              const activeBanners = banners.filter((b) => b.visible);
              if (activeBanners.length === 0) return null;

              return (
                <section key="banners" className="py-8 px-4 max-w-7xl mx-auto space-y-4">
                  {activeBanners.map((b) => (
                    <div
                      key={b.id}
                      className="p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-6"
                      style={{
                        backgroundColor: b.backgroundColor || '#0F4C3A',
                        color: b.textColor || '#FAF8F5',
                      }}
                    >
                      <div className="space-y-2 max-w-2xl text-right">
                        {b.badgeText && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D4AF37] text-[#0F4C3A]">
                            {b.badgeText}
                          </span>
                        )}
                        <h3 className="text-lg sm:text-xl font-extrabold">{b.title}</h3>
                        {b.subtitle && <p className="text-xs opacity-90">{b.subtitle}</p>}
                        <p className="text-xs opacity-80 leading-relaxed">{b.description}</p>
                      </div>

                      <button className="shrink-0 bg-[#D4AF37] text-[#0F4C3A] px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-xs">
                        {b.buttonText}
                      </button>
                    </div>
                  ))}
                </section>
              );
            }

            // SECTION: CONSULTATION
            if (sec.id === 'consultation' && consultation && consultation.visible !== false) {
              return (
                <section key="consultation" className="py-10 bg-[#FAF8F5] px-4 max-w-7xl mx-auto">
                  <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#EAE6DF] shadow-xs grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4 text-right">
                      {consultation.badgeText && (
                        <span className="text-[11px] font-extrabold text-[#D4AF37] bg-[#0F4C3A]/5 px-3 py-1 rounded-full border border-[#0F4C3A]/15 inline-block">
                          {consultation.badgeText}
                        </span>
                      )}
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F4C3A]">
                        {consultation.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#4A5A55] leading-relaxed">
                        {consultation.description}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {consultation.primaryButtonText && (
                          <button className="bg-[#0F4C3A] text-white px-5 py-2.5 rounded-xl font-bold text-xs">
                            {consultation.primaryButtonText}
                          </button>
                        )}
                        {consultation.secondaryButtonText && (
                          <button className="bg-[#F4EFE6] text-[#0F4C3A] border border-[#E0D8C8] px-5 py-2.5 rounded-xl font-bold text-xs">
                            {consultation.secondaryButtonText}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Card in Consultation */}
                    <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#D4AF37]/40 space-y-3">
                      <span className="font-extrabold text-sm text-[#0F4C3A] block">
                        {consultation.cardTitle}
                      </span>
                      <p className="text-xs text-[#6A7873]">{consultation.cardSubtitle}</p>
                      <div className="space-y-2 pt-2">
                        {(consultation.cardItems || []).map((ci, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-[#2C3B37]">
                            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                            <span>{ci}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );
            }

            // SECTION: CORPORATE
            if (sec.id === 'corporate' && corporate && corporate.visible !== false) {
              return (
                <section key="corporate" className="py-10 bg-white border-y border-[#EAE6DF] px-4">
                  <div className="max-w-7xl mx-auto space-y-6">
                    <div className="text-center space-y-1 max-w-2xl mx-auto">
                      <span className="text-xs font-bold text-[#D4AF37]">{corporate.badgeText}</span>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F4C3A]">
                        {corporate.title}
                      </h2>
                      <p className="text-xs text-[#6A7873]">{corporate.description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {(corporate.features || []).map((f) => (
                        <div
                          key={f.id}
                          className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] space-y-2"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#0F4C3A]/10 flex items-center justify-center text-[#0F4C3A]">
                            {renderLucideIcon(f.iconName, 'w-4 h-4')}
                          </div>
                          <h3 className="font-extrabold text-xs text-[#0F4C3A]">{f.title}</h3>
                          <p className="text-[11px] text-[#6A7873] leading-relaxed">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }

            // SECTION: BLOG
            if (sec.id === 'blog' && blogConfig && blogConfig.visible !== false) {
              return (
                <section key="blog" className="py-10 px-4 max-w-7xl mx-auto space-y-6">
                  <div className="text-center space-y-1 max-w-2xl mx-auto">
                    <span className="text-xs font-bold text-[#D4AF37]">{blogConfig.badgeText}</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F4C3A]">
                      {blogConfig.title}
                    </h2>
                    <p className="text-xs text-[#6A7873]">{blogConfig.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {displayedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden shadow-2xs space-y-2 pb-3"
                      >
                        <div className="h-36 bg-black/5 overflow-hidden">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="px-3 space-y-1">
                          <h3 className="font-extrabold text-xs text-[#1C2826] line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="text-[11px] text-[#6A7873] line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            return null;
          })}

          {/* 3. SIMULATED FOOTER */}
          {footer && footer.visible !== false && (
            <footer className="bg-[#0F4C3A] text-[#FAF8F5] pt-10 pb-6 px-4 mt-12 border-t border-[#D4AF37]/30">
              <div className="max-w-7xl mx-auto space-y-8">
                {/* 4 Guarantee Badges */}
                {footer.showGuarantees && (footer.guarantees || []).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-8 border-b border-white/10">
                    {(footer.guarantees || []).map((g) => (
                      <div key={g.id} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                          {renderLucideIcon(g.iconName, 'w-4 h-4')}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block text-white">{g.title}</span>
                          <span className="text-[10px] text-white/70 block">{g.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Main Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                  <div className="space-y-2">
                    <span className="font-extrabold text-sm text-[#D4AF37] block">برند یادمان</span>
                    <p className="text-[11px] text-white/80 leading-relaxed">
                      {footer.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-extrabold text-sm text-[#D4AF37] block">
                      {footer.quickLinksTitle || 'دسترسی سریع'}
                    </span>
                    <div className="space-y-1 text-[11px] text-white/80">
                      {(footer.quickLinks || []).map((l) => (
                        <span key={l.id} className="block hover:text-[#D4AF37] cursor-pointer">
                          • {l.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-extrabold text-sm text-[#D4AF37] block">
                      {footer.contactTitle || 'ارتباط با ما'}
                    </span>
                    <div className="space-y-1 text-[11px] text-white/80">
                      <p>تلفن: {footer.phone}</p>
                      <p>ایمیل: {footer.email}</p>
                      <p>نشانی: {footer.address}</p>
                    </div>
                  </div>
                </div>

                {/* Copyright */}
                <div className="pt-4 border-t border-white/10 text-center text-[10px] text-white/60">
                  {footer.copyrightText}
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};
