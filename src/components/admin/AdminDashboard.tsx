import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Building2,
  PackageCheck,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ArrowLeft,
  Stamp,
  Sparkles,
  DollarSign,
  PlusCircle,
  Eye,
  RefreshCw,
  Loader2,
  Users,
} from 'lucide-react';
import { Order, CorporateInquiry, Product, AdminSection } from '../../types';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { api } from '../../services/api';

interface AdminDashboardProps {
  orders: Order[];
  inquiries: CorporateInquiry[];
  products: Product[];
  onNavigateSection: (section: AdminSection) => void;
  onViewOrder: (order: Order) => void;
  onViewInquiry: (inquiry: CorporateInquiry) => void;
  onAddNewProduct: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  inquiries,
  products,
  onNavigateSection,
  onViewOrder,
  onViewInquiry,
  onAddNewProduct,
}) => {
  // Server-aggregated statistics state
  const [serverStats, setServerStats] = useState<{
    products: number;
    categories: number;
    users: number;
    orders: number;
    totalRevenue?: number;
    pendingOrders?: number;
    preparingOrders?: number;
    inquiries?: number;
    newInquiries?: number;
    consultations?: number;
    reviews?: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const res = await api.admin.getStats();
      if (res) {
        setServerStats(res);
      }
    } catch (err: any) {
      console.warn('Could not fetch server stats for dashboard:', err);
      setStatsError(err?.message || 'خطا در واکشی آمار تجمیعی سرور');
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Calculations using PostgreSQL server-aggregated data as single source of truth
  const totalRevenue = serverStats?.totalRevenue !== undefined ? serverStats.totalRevenue : 0;
  const totalOrdersCount = serverStats?.orders !== undefined ? serverStats.orders : 0;
  const pendingOrdersCount = serverStats?.pendingOrders !== undefined ? serverStats.pendingOrders : 0;
  const preparingOrdersCount = serverStats?.preparingOrders !== undefined
    ? serverStats.preparingOrders
    : orders.filter((o) => o.status === 'preparing' || o.status === 'packaged').length;

  const newInquiriesCount = serverStats?.newInquiries !== undefined ? serverStats.newInquiries : 0;
  const totalInquiriesCount = serverStats?.inquiries !== undefined ? serverStats.inquiries : 0;
  const totalProductsCount = serverStats?.products !== undefined ? serverStats.products : 0;
  const totalUsersCount = serverStats?.users !== undefined ? serverStats.users : 0;

  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / Math.max(1, totalOrdersCount)) : 0;

  const recentOrders = orders.slice(0, 5);
  const recentInquiries = inquiries.slice(0, 4);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> در انتظار بررسی</span>;
      case 'preparing':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3" /> در حال آماده‌سازی</span>;
      case 'packaged':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Stamp className="w-3 h-3 text-[#D4AF37]" /> مهر و موم شده</span>;
      case 'shipped':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Truck className="w-3 h-3" /> ارسال شده</span>;
      case 'delivered':
        return <span className="bg-[#0F4C3A]/10 text-[#0F4C3A] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> تحویل شده</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> لغو شده</span>;
      default:
        return null;
    }
  };

  const getInquiryBadge = (status: CorporateInquiry['status']) => {
    switch (status) {
      case 'new':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">استعلام جدید</span>;
      case 'contacted':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">تماس گرفته شد</span>;
      case 'sample_sent':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">ارسال نمونه</span>;
      case 'approved':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">تایید قرارداد</span>;
      case 'closed':
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">بسته شده</span>;
    }
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Top Banner & Quick Shortcuts */}
      <div className="bg-[#0F4C3A] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-[#D4AF37]/30">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-[#FAF8F5]/15 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مدیریت کارگاه و فروشگاه یادمان</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              خوش‌آمدید به سامانه مدیریت هدایای فاخر
            </h1>
            <p className="text-xs sm:text-sm text-[#C0D8D0] leading-relaxed">
              سفارش‌های جدید را بررسی و پس از بسته‌بندی دست‌ساز و الصاق مهر و موم مومی، وضعیت ارسال را به‌روزرسانی فرمایید.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <button
              onClick={() => onNavigateSection('orders')}
              className="flex-1 md:flex-none bg-[#FAF8F5] text-[#0F4C3A] font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-[#F4EFE6] transition shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              <span>مشاهده سفارش‌ها ({toPersianDigits(totalOrdersCount)})</span>
            </button>
            <button
              onClick={() => fetchStats()}
              disabled={isLoadingStats}
              className="flex-1 md:flex-none bg-[#17634D] hover:bg-[#1C735A] text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
              title="بارگذاری مجدد آمار از پایگاه‌داده"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span>بروزرسانی از دیتابیس</span>
            </button>
            <button
              onClick={() => onNavigateSection('homepage')}
              className="flex-1 md:flex-none bg-[#17634D] hover:bg-[#1C735A] text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>تنظیمات بنر صفحه اصلی</span>
            </button>
            <button
              onClick={onAddNewProduct}
              className="flex-1 md:flex-none bg-[#D4AF37] text-[#0F4C3A] font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-[#C29F2F] transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن پک هدیه جدید</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Server-Error UI for Statistics */}
      {isLoadingStats && (
        <div className="flex items-center gap-2 text-xs text-[#0F4C3A] bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37] shrink-0" />
          <span>در حال دریافت آخرین آمار و ارقام از پایگاه‌داده...</span>
        </div>
      )}

      {statsError && (
        <div className="flex items-center justify-between gap-3 text-xs text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{statsError}</span>
          </div>
          <button
            onClick={() => fetchStats()}
            className="text-xs font-bold text-red-800 underline hover:text-red-950 cursor-pointer"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6A7873]">مجموع فروش فروشگاه</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0F4C3A] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0F4C3A]">
              {formatToman(totalRevenue)}
            </div>
            <span className="text-[11px] text-[#8C8375] block mt-0.5">
              میانگین هر سفارش: {formatToman(avgOrderValue)}
            </span>
          </div>
        </div>

        {/* Card 2: Orders Count & Pending */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6A7873]">سفارش‌های فعال</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#1C2826]">
              {toPersianDigits(totalOrdersCount)} <span className="text-xs font-normal text-[#6A7873]">سفارش</span>
            </div>
            <span className="text-[11px] text-amber-700 font-bold block mt-0.5">
              {toPersianDigits(pendingOrdersCount)} مورد در انتظار اقدام
            </span>
          </div>
        </div>

        {/* Card 3: In Preparation & Wax Sealing */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6A7873]">در خط بسته‌بندی و مهر</span>
            <div className="w-9 h-9 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center">
              <Stamp className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0F4C3A]">
              {toPersianDigits(preparingOrdersCount)} <span className="text-xs font-normal text-[#6A7873]">پک</span>
            </div>
            <span className="text-[11px] text-[#6A7873] block mt-0.5">
              آماده‌سازی خطاطی و مهر مومی
            </span>
          </div>
        </div>

        {/* Card 4: Corporate Leads */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6A7873]">درخواست‌های سازمانی</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#1C2826]">
              {toPersianDigits(totalInquiriesCount)} <span className="text-xs font-normal text-[#6A7873]">شرکت</span>
            </div>
            <span className="text-[11px] text-purple-700 font-bold block mt-0.5">
              {toPersianDigits(newInquiriesCount)} استعلام جدید
            </span>
          </div>
        </div>

      </div>

      {/* Main 2-Column Content: Recent Orders & Corporate Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Main Column: Recent Orders (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#EAE6DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#0F4C3A]" />
              <h2 className="font-extrabold text-base text-[#0F4C3A]">آخرین سفارش‌های ثبت شده</h2>
            </div>
            <button
              onClick={() => onNavigateSection('orders')}
              className="text-xs font-bold text-[#0F4C3A] hover:text-[#D4AF37] flex items-center gap-1 transition"
            >
              <span>مشاهده همه</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#F4EFE6] text-[#6A7873]">
                  <th className="pb-3 pr-2">کد سفارش</th>
                  <th className="pb-3">مشتری</th>
                  <th className="pb-3">محتوای هدیه</th>
                  <th className="pb-3">مبلغ کل</th>
                  <th className="pb-3">وضعیت</th>
                  <th className="pb-3 pl-2">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFE6]">
                {recentOrders.map((order) => {
                  const firstItem = order.items[0];
                  const itemName = firstItem?.product?.titleFa || firstItem?.customBoxDetails?.boxType.nameFa || 'پک هدیه';
                  const extraCount = order.items.length - 1;

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF8F5] transition">
                      <td className="py-3.5 pr-2 font-mono font-bold text-[#0F4C3A]">
                        {order.id}
                      </td>
                      <td className="py-3.5">
                        <div className="font-bold text-[#1C2826]">{order.customer.fullName}</div>
                        <span className="text-[10px] text-[#8C8375]">{order.customer.city}</span>
                      </td>
                      <td className="py-3.5 max-w-[180px] truncate">
                        <span className="text-[#2C3B37]">{itemName}</span>
                        {extraCount > 0 && (
                          <span className="text-[10px] text-[#8C8375] mr-1">
                            (+{toPersianDigits(extraCount)} مورد دیگر)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 font-bold text-[#0F4C3A]">
                        {formatToman(order.totalPrice)}
                      </td>
                      <td className="py-3.5">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3.5 pl-2">
                        <button
                          onClick={() => onViewOrder(order)}
                          className="bg-[#F4EFE6] hover:bg-[#0F4C3A] hover:text-white text-[#0F4C3A] p-2 rounded-xl transition flex items-center gap-1 text-[11px] font-bold"
                          title="مشاهده جزئیات و چاپ فاکتور"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>بررسی</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Corporate Leads & Products Summary */}
        <div className="space-y-6">
          
          {/* Corporate Leads Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0F4C3A]" />
                <h3 className="font-extrabold text-sm text-[#0F4C3A]">استعلام‌های سازمانی اخیر</h3>
              </div>
              <button
                onClick={() => onNavigateSection('inquiries')}
                className="text-xs font-bold text-[#0F4C3A] hover:text-[#D4AF37] flex items-center gap-1 transition"
              >
                <span>همه</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => onViewInquiry(inquiry)}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F4EFE6] border border-[#EAE6DF] transition cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-[#0F4C3A] line-clamp-1">
                      {inquiry.companyName}
                    </span>
                    {getInquiryBadge(inquiry.status)}
                  </div>
                  <div className="flex justify-between text-[11px] text-[#6A7873]">
                    <span>تعداد: {inquiry.estimatedQuantity}</span>
                    <span>{inquiry.createdAtFa}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Product Status Card */}
          <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#EAE6DF] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F4C3A] flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#D4AF37]" />
                وضعیت پک‌های فروشگاه
              </span>
              <span className="font-bold text-[#1C2826]">
                {toPersianDigits(totalProductsCount)} پک در سیستم
              </span>
            </div>
            <p className="text-[#6A7873] leading-relaxed text-[11px]">
              پک‌های ناموجود به صورت خودکار با برچسب اتمام موجودی در ویترین نمایش داده می‌شوند.
            </p>
            <button
              onClick={() => onNavigateSection('products')}
              className="w-full bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white py-2 rounded-xl font-bold transition text-center block"
            >
              مدیریت و ویرایش پک‌ها
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
