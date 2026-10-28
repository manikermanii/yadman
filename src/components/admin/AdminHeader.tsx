import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Building2,
  Sliders,
  Settings,
  Store,
  ShieldCheck,
  Tag,
  Boxes,
  Ticket,
  MessageSquare,
  Globe,
  Headphones,
  Users,
  BookOpen,
  LogOut,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminSection } from '../../types';
import { toPersianDigits } from '../../utils/formatters';
import { YadmanLogo } from '../common/YadmanLogo';

interface AdminHeaderProps {
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  onExitAdmin: () => void;
  onLogout?: () => void;
  pendingOrdersCount: number;
  newInquiriesCount: number;
  newConsultationsCount?: number;
  pendingReviewsCount?: number;
  lowStockCount?: number;
  usersCount?: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeSection,
  setActiveSection,
  onExitAdmin,
  onLogout,
  pendingOrdersCount,
  newInquiriesCount,
  newConsultationsCount = 0,
  pendingReviewsCount = 0,
  lowStockCount = 0,
  usersCount = 0,
}) => {
  const navTabs: { id: AdminSection; label: string; icon: any; badge?: number; badgeType?: 'warning' | 'info' | 'danger' }[] = [
    { id: 'dashboard', label: 'داشبورد و آمار', icon: LayoutDashboard },
    { id: 'orders', label: 'مدیریت سفارش‌ها', icon: ShoppingBag, badge: pendingOrdersCount },
    { id: 'users', label: 'کاربران و مشتریان', icon: Users, badge: usersCount },
    { id: 'consultations', label: 'درخواست‌های مشاوره', icon: Headphones, badge: newConsultationsCount },
    { id: 'products', label: 'پک‌های هدیه', icon: Package },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: Tag },
    { id: 'blog', label: 'وبلاگ و مجله', icon: BookOpen },
    { id: 'inventory', label: 'موجودی انبار', icon: Boxes, badge: lowStockCount, badgeType: 'warning' },
    { id: 'inquiries', label: 'استعلام سازمانی', icon: Building2, badge: newInquiriesCount },
    { id: 'custom_items', label: 'اقلام سفارشی', icon: Sliders },
    { id: 'discounts', label: 'تخفیف‌ها', icon: Ticket },
    { id: 'reviews', label: 'نظرات مشتریان', icon: MessageSquare, badge: pendingReviewsCount },
    { id: 'homepage', label: 'تنظیمات صفحه اصلی', icon: ImageIcon },
    { id: 'settings', label: 'تنظیمات برند', icon: Settings },
  ];

  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Check scroll position and overflow
  const checkScroll = useCallback(() => {
    if (!navRef.current) return;
    const el = navRef.current;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (maxScroll <= 2) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    // In modern browsers with RTL (dir="rtl"):
    // scrollLeft starts at 0 (rightmost) and decreases to negative values (e.g. -maxScroll),
    // or in some implementations increases from 0 to maxScroll.
    const scrollPos = Math.abs(el.scrollLeft);

    // Can scroll toward the right if not at the start
    setCanScrollRight(scrollPos > 6);
    // Can scroll toward the left if not at the end
    setCanScrollLeft(scrollPos < maxScroll - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScroll]);

  // Smooth scroll active tab into view on section change
  useEffect(() => {
    const activeEl = document.getElementById(`admin-tab-${activeSection}`);
    if (activeEl && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      if (activeRect.left < navRect.left || activeRect.right > navRect.right) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeSection]);

  // Horizontal scroll buttons
  const handleScrollLeft = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: -260, behavior: 'smooth' });
      setTimeout(checkScroll, 320);
    }
  };

  const handleScrollRight = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: 260, behavior: 'smooth' });
      setTimeout(checkScroll, 320);
    }
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !navRef.current) return; // Only primary mouse button
    isDownRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.pageX;
    startScrollLeftRef.current = navRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current || !navRef.current) return;
    const deltaX = e.pageX - startXRef.current;
    if (Math.abs(deltaX) > 4) {
      hasMovedRef.current = true;
    }
    // Update scroll position directly
    navRef.current.scrollLeft = startScrollLeftRef.current - deltaX;
  };

  const handleMouseUp = () => {
    if (isDownRef.current) {
      isDownRef.current = false;
      setIsDragging(false);
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 50);
    }
  };

  const handleMouseLeave = () => {
    if (isDownRef.current) {
      isDownRef.current = false;
      setIsDragging(false);
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 50);
    }
  };

  // Mouse wheel horizontal scroll conversion
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (navRef.current && (e.deltaY !== 0 || e.deltaX !== 0)) {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      navRef.current.scrollLeft += delta;
    }
  };

  return (
    <header className="bg-[#0F4C3A] text-[#FAF8F5] border-b border-[#1B5E4A] sticky top-0 z-40 shadow-md">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] flex items-center justify-center shadow-sm">
              <YadmanLogo variant="admin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-[#FAF8F5]">
                  پنل مدیریت جامع یادمان
                </span>
                <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D4AF37]/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  مدیریت فروشگاه و سازمانی
                </span>
              </div>
              <span className="text-[11px] text-[#A3C4BA] block font-english-serif tracking-widest uppercase">
                Yadman Luxury Gifts & B2B Solutions
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              id="admin-exit-to-store-btn"
              title="مشاهده سایت عمومی بدون خروج از مدیریت"
              className="bg-[#D4AF37] hover:bg-[#C29F2F] text-[#0F4C3A] font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-98"
            >
              <Store className="w-4 h-4 text-[#0F4C3A]" />
              <span className="hidden sm:inline">مشاهده فروشگاه</span>
            </a>

            {onLogout && (
              <button
                onClick={onLogout}
                id="admin-logout-btn"
                title="خروج از حساب مدیریت"
                className="bg-rose-900/60 hover:bg-rose-800 text-rose-100 hover:text-white border border-rose-600/40 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-98 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300" />
                <span>خروج از پنل</span>
              </button>
            )}
          </div>

        </div>

        {/* Horizontally Scrollable Navigation Container with Arrow Navigation Buttons */}
        <div className="relative mt-2.5 pt-2.5 border-t border-[#17634D] flex items-center">
          
          {/* Right Scroll Arrow Button */}
          <div className="flex items-center pl-1.5 shrink-0 z-10">
            <button
              type="button"
              onClick={handleScrollRight}
              aria-label="اسکرول منو به راست"
              title="مشاهده گزینه‌های سمت راست"
              className="p-1.5 rounded-full bg-[#17634D] hover:bg-[#1C735A] text-[#FAF8F5] shadow-md border border-[#1B5E4A] hover:border-[#D4AF37]/60 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>

          {/* Nav Tabs List - completely hidden scrollbar */}
          <nav
            ref={navRef}
            onScroll={checkScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            className={`flex-1 flex items-center gap-1.5 overflow-x-auto flex-nowrap scrollbar-none no-scrollbar py-0.5 px-1 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (hasMovedRef.current) return;
                    setActiveSection(tab.id);
                  }}
                  id={`admin-tab-${tab.id}`}
                  className={`shrink-0 relative px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#FAF8F5] text-[#0F4C3A] shadow-sm'
                      : 'text-[#D0E2DB] hover:bg-[#17634D] hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-[#A3C4BA]'}`} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none shrink-0 ${
                        isActive
                          ? 'bg-[#0F4C3A] text-white'
                          : tab.badgeType === 'warning'
                          ? 'bg-amber-400 text-amber-950'
                          : 'bg-[#D4AF37] text-[#0F4C3A]'
                      }`}
                    >
                      {toPersianDigits(tab.badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Left Scroll Arrow Button */}
          <div className="flex items-center pr-1.5 shrink-0 z-10">
            <button
              type="button"
              onClick={handleScrollLeft}
              aria-label="اسکرول منو به چپ"
              title="مشاهده گزینه‌های سمت چپ"
              className="p-1.5 rounded-full bg-[#17634D] hover:bg-[#1C735A] text-[#FAF8F5] shadow-md border border-[#1B5E4A] hover:border-[#D4AF37]/60 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
