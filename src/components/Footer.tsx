import React from 'react';
import { Phone, Mail, MapPin, Instagram, Send, MessageCircle, Linkedin } from 'lucide-react';
import { YadmanLogo } from './common/YadmanLogo';
import { FooterConfig } from '../types';
import { renderLucideIcon } from './admin/homepage/IconSelector';

interface FooterProps {
  onOpenAdmin?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateTab?: (tab: string) => void;
  config?: FooterConfig;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onNavigateToBlog,
  onNavigateTab,
  config,
}) => {
  if (config && config.visible === false) {
    return null;
  }

  const showGuarantees = config ? config.showGuarantees !== false : true;
  const guarantees =
    config?.guarantees && config.guarantees.length > 0
      ? config.guarantees
      : [
          {
            id: '1',
            title: 'مهر و موم دست‌ساز',
            description: 'بسته‌بندی اختصاصی با مهر و موم مومی',
            iconName: 'Stamp',
          },
          {
            id: '2',
            title: 'تضمین اصالت',
            description: 'زعفران سوپر نگین و صنایع دستی اصیل',
            iconName: 'ShieldCheck',
          },
          {
            id: '3',
            title: 'کارت تبریک اختصاصی',
            description: 'چاپ متن دلخواه روی کارت تبریک',
            iconName: 'Heart',
          },
          {
            id: '4',
            title: 'پشتیبانی و مشاوره',
            description: 'پاسخگویی روزهای کاری از ۸ تا ۲۱',
            iconName: 'Phone',
          },
        ];

  const description =
    config?.description ||
    'یادمان؛ طراحی و ارائه‌دهنده پک‌های هدیه فاخر، هدایای سازمانی و محصولات اصیل ایرانی با بسته‌بندی‌های خاص و مهر و موم مومی.';

  const quickLinksTitle = config?.quickLinksTitle || 'دسترسی سریع';
  const quickLinks =
    config?.quickLinks && config.quickLinks.length > 0
      ? config.quickLinks
      : [
          { id: '1', label: 'پک‌های هدیه کاتالوگ', target: 'catalog' },
          { id: '2', label: 'ساخت پک اختصاصی', target: 'builder' },
          { id: '3', label: 'هدایای سازمانی (B2B)', target: 'corporate' },
          { id: '4', label: 'مشاوره انتخاب هدیه', target: 'consultation' },
          { id: '5', label: 'مجله و مقالات یادمان', target: 'blog' },
        ];

  const contactTitle = config?.contactTitle || 'ارتباط با مجموعه یادمان';
  const address = config?.address || 'تهران، خیابان فرشته، مجتمع تشریفاتی یادمان، پلاک ۱۲';
  const phone = config?.phone || '۰۲۱-۸۸۸۸۰۰۰۰';
  const email = config?.email || 'info@yadman.ir';
  const copyrightText = config?.copyrightText || '© ۱۴۰۵ تمامی حقوق برای برند «یادمان» محفوظ است.';

  const handleLinkClick = (target: string) => {
    if (target === 'blog' && onNavigateToBlog) {
      onNavigateToBlog();
    } else if (onNavigateTab) {
      onNavigateTab(target);
    }
  };

  return (
    <footer className="bg-[#0F4C3A] text-[#FAF8F5] pt-12 pb-8 border-t-4 border-[#D4AF37]" id="footer-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Guarantees Row */}
        {showGuarantees && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-[#1B5E4A] text-center">
            {guarantees.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#D4AF37] mx-auto">
                  {renderLucideIcon(item.iconName, 'w-5 h-5 text-[#D4AF37]')}
                </div>
                <h4 className="font-bold text-xs text-[#FAF8F5]">{item.title}</h4>
                <p className="text-[11px] text-[#C0D8D0]">{item.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main Footer Links & Branding */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-right">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <YadmanLogo variant="footer" />
            <p className="text-xs text-[#C0D8D0] leading-relaxed max-w-sm">
              {description}
            </p>

            {/* Social Links */}
            {(config?.socialInstagram || config?.socialTelegram || config?.socialWhatsapp || config?.socialLinkedin) && (
              <div className="flex items-center gap-2 pt-2">
                {config.socialInstagram && (
                  <a
                    href={config.socialInstagram.startsWith('http') ? config.socialInstagram : `https://instagram.com/${config.socialInstagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-[#D4AF37] hover:text-[#0F4C3A] flex items-center justify-center text-[#FAF8F5] transition"
                    title="اینستاگرام"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {config.socialTelegram && (
                  <a
                    href={config.socialTelegram.startsWith('http') ? config.socialTelegram : `https://t.me/${config.socialTelegram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-[#D4AF37] hover:text-[#0F4C3A] flex items-center justify-center text-[#FAF8F5] transition"
                    title="تلگرام"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                )}
                {config.socialWhatsapp && (
                  <a
                    href={config.socialWhatsapp.startsWith('http') ? config.socialWhatsapp : `https://wa.me/${config.socialWhatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-[#D4AF37] hover:text-[#0F4C3A] flex items-center justify-center text-[#FAF8F5] transition"
                    title="واتس‌اپ"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                {config.socialLinkedin && (
                  <a
                    href={config.socialLinkedin.startsWith('http') ? config.socialLinkedin : `https://linkedin.com/${config.socialLinkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-[#D4AF37] hover:text-[#0F4C3A] flex items-center justify-center text-[#FAF8F5] transition"
                    title="لینکدین"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-bold text-xs text-[#D4AF37]">{quickLinksTitle}</h4>
            <ul className="space-y-2 text-xs text-[#C0D8D0]">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => handleLinkClick(link.target)}
                    className="hover:text-[#D4AF37] transition text-right cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-4 space-y-3 text-xs text-[#C0D8D0]">
            <h4 className="font-bold text-xs text-[#D4AF37]">{contactTitle}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>تلفن پشتیبانی: {phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{email}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-[#1B5E4A] text-center text-[11px] text-[#A0C0B5]">
          <p>{copyrightText}</p>
        </div>

      </div>
    </footer>
  );
};
