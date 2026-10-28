import React, { useState } from 'react';
import {
  X,
  Printer,
  Stamp,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  User,
  Package,
  Feather,
  Save,
  QrCode,
  Tag,
  Mic,
  Loader2,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { AudioPlayer } from '../common/AudioPlayer';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrder: (updatedOrder: Order) => Promise<void> | void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateOrder,
}) => {
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'pending');
  const [adminNotes, setAdminNotes] = useState(order?.adminNotes || '');
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  React.useEffect(() => {
    if (order) {
      setStatus(order.status);
      setAdminNotes(order.adminNotes || '');
      setTrackingNumber(order.trackingNumber || '');
      setSaveError(null);
      setIsSaved(false);
    }
  }, [order?.id, order?.status]);

  if (!isOpen || !order) return null;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const updated: Order = {
        ...order,
        status,
        adminNotes,
        trackingNumber,
      };
      await onUpdateOrder(updated);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err?.message || 'خطا در ثبت تغییرات در پایگاه‌داده.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div
        className="bg-[#FAF8F5] w-full max-w-4xl rounded-3xl border-2 border-[#D4AF37]/50 shadow-2xl overflow-hidden my-8 text-right relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-[#0F4C3A] text-white flex items-center justify-between border-b border-[#1B5E4A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] text-[#0F4C3A] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold">شناسنامه و جزئیات سفارش</h2>
                <span className="font-mono bg-[#17634D] text-[#D4AF37] px-2.5 py-0.5 rounded-full text-xs font-bold border border-[#D4AF37]/30">
                  {order.id}
                </span>
              </div>
              <span className="text-xs text-[#A3C4BA]">
                ثبت شده در: {order.createdAtFa}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#17634D] hover:bg-[#1C735A] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#D4AF37]" />
              <span>چاپ فاکتور و برگه ارسال</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#A3C4BA] hover:text-white hover:bg-[#17634D] rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#1C2826]">
          
          {/* Status & Workflow Bar */}
          <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F4C3A] mb-1.5">
                  وضعیت فرآیند سفارش و بسته‌بندی:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="bg-[#F4EFE6] border border-[#E0D8C8] text-[#0F4C3A] font-bold text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0F4C3A]"
                >
                  <option value="pending">⏳ در انتظار بررسی و تایید</option>
                  <option value="preparing">🎨 در حال آماده‌سازی و خطاطی کارت</option>
                  <option value="packaged">✨ بسته‌بندی دستی و الصاق مهر و موم مومی</option>
                  <option value="shipped">🚚 تحویل به پیک / شرکت پستی (ارسال شده)</option>
                  <option value="delivered">✅ تحویل نهایی به گیرنده</option>
                  <option value="cancelled">❌ لغو سفارش</option>
                </select>
              </div>

              <div className="flex-1 max-w-xs">
                <label className="block text-xs font-bold text-[#0F4C3A] mb-1.5">
                  کد رهگیری پستی / بارنامه:
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="مثال: TPX-9482019"
                  className="w-full bg-[#F4EFE6] text-xs font-mono font-bold p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  ) : (
                    <Save className="w-4 h-4 text-[#D4AF37]" />
                  )}
                  <span>{isSaving ? 'در حال ذخیره...' : isSaved ? 'ذخیره شد ✓' : 'ذخیره تغییرات'}</span>
                </button>
              </div>
            </div>

            {saveError && (
              <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-xs font-bold mt-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
          </div>

          {/* 2-Column Info: Customer & Delivery details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Information */}
            <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-2">
                <User className="w-4 h-4 text-[#D4AF37]" />
                اطلاعات خریدار و سفارش‌دهنده
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6A7873]">نام و نام‌خانوادگی:</span>
                  <span className="font-bold">{order.customer.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A7873]">شماره تماس:</span>
                  <a href={`tel:${order.customer.phoneNumber}`} className="font-bold text-[#0F4C3A] font-mono hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {order.customer.phoneNumber}
                  </a>
                </div>
                {order.customer.email && (
                  <div className="flex justify-between">
                    <span className="text-[#6A7873]">ایمیل:</span>
                    <span className="font-mono text-[11px]">{order.customer.email}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#F4EFE6] pt-2">
                  <span className="text-[#6A7873]">روش پرداخت:</span>
                  <span className="font-bold text-[#0F4C3A]">
                    {order.paymentMethod === 'online'
                      ? 'درگاه آنلاین (پرداخت موفق)'
                      : order.paymentMethod === 'card_to_card'
                      ? 'کارت به کارت'
                      : 'فاکتور رسمی سازمانی'}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Recipient Information */}
            <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-2">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                مشخصات گیرنده و مقصد ارسال
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6A7873]">تحویل‌گیرنده هدیه:</span>
                  <span className="font-bold text-[#0F4C3A]">
                    {order.customer.recipientName || order.customer.fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A7873]">استان و شهر:</span>
                  <span className="font-bold">{order.customer.province} - {order.customer.city}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[#6A7873] block">نشانی پستی دقیق:</span>
                  <p className="p-2 bg-[#FAF8F5] rounded-xl text-[11px] border border-[#EAE6DF] leading-relaxed">
                    {order.customer.address}
                    {order.customer.postalCode && (
                      <span className="block mt-1 font-mono text-[#8C8375]">
                        کد پستی: {order.customer.postalCode}
                      </span>
                    )}
                  </p>
                </div>
                {order.customer.deliveryDate && (
                  <div className="flex justify-between items-center text-[#0F4C3A] font-bold">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> تاریخ درخواستی تحویل:</span>
                    <span>{order.customer.deliveryDate}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Order Level Voice Recording (if customer recorded instructions during checkout) */}
          {order.voiceRecording && (
            <div className="bg-white p-5 rounded-2xl border border-[#0F4C3A]/20 shadow-xs space-y-2">
              <h3 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-2">
                <Mic className="w-4 h-4 text-[#D4AF37]" />
                پیام صوتی ضبط‌شده توسط مشتری (توضیحات و هماهنگی سفارش)
              </h3>
              <AudioPlayer
                recording={order.voiceRecording}
                title={`پیام صوتی سفارش ${order.id} - ${order.customer.fullName}`}
              />
            </div>
          )}

          {/* Items & Customization Details Table */}
          <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2 border-b border-[#F4EFE6] pb-2">
              <Stamp className="w-4 h-4 text-[#D4AF37]" />
              اقلام هدیه و مشخصات شخصی‌سازی (روبان، مهر، کارت تبریک)
            </h3>

            <div className="space-y-4">
              {order.items.map((item, idx) => {
                const isCustom = item.isCustomBox && item.customBoxDetails;
                const title = item.product?.titleFa || item.customBoxDetails?.boxType.nameFa || 'باکس هدیه';
                const image = item.product?.image;
                const ribbon = item.ribbonColor || item.customBoxDetails?.ribbon.nameFa || item.product?.ribbonColor || 'سبز زمردی';
                const waxSeal = item.waxSeal || item.customBoxDetails?.waxSeal.nameFa || item.product?.waxSeal || 'طرح اسلیمی';
                const cardMsg = item.cardMessage || item.customBoxDetails?.cardMessage;
                const price = item.product?.price || item.customBoxDetails?.totalPrice || 0;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {image ? (
                          <img
                            src={image}
                            alt={title}
                            className="w-14 h-14 rounded-xl object-cover border border-[#EAE6DF]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold text-xs">
                            باکس
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-sm text-[#0F4C3A]">{title}</h4>
                          <span className="text-xs text-[#6A7873]">
                            تعداد: {toPersianDigits(item.quantity)} عدد × {formatToman(price)}
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-xs text-[#8C8375] block">مبلغ کل این قلم:</span>
                        <span className="font-bold text-sm text-[#0F4C3A]">
                          {formatToman(price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Custom Packaging Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#EAE6DF] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8C8375]">رنگ روبان:</span>
                        <span className="font-bold text-[#1C2826] bg-white px-2 py-0.5 rounded-lg border border-[#EAE6DF]">
                          {ribbon}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#8C8375]">مهر و موم مومی:</span>
                        <span className="font-bold text-[#0F4C3A] bg-white px-2 py-0.5 rounded-lg border border-[#EAE6DF]">
                          {waxSeal}
                        </span>
                      </div>
                    </div>

                    {/* Custom Box Included Items List */}
                    {isCustom && item.customBoxDetails && (
                      <div className="p-3 bg-white rounded-xl border border-[#EAE6DF] space-y-1.5">
                        <span className="text-[11px] font-bold text-[#0F4C3A] block">
                          اقلام چیده شده در باکس اختصاصی:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.customBoxDetails.items.map((subItem) => (
                            <span
                              key={subItem.id}
                              className="text-[10px] bg-[#F4EFE6] text-[#2C3B37] px-2 py-1 rounded-lg border border-[#E0D8C8]"
                            >
                              ✓ {subItem.nameFa}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Box Voice Message */}
                    {isCustom && item.customBoxDetails?.voiceRecording && (
                      <div className="p-3 bg-white rounded-xl border border-[#0F4C3A]/20 space-y-1.5">
                        <span className="text-[11px] font-bold text-[#0F4C3A] flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>پیام صوتی ضبط‌شده برای این باکس اختصاصی:</span>
                        </span>
                        <AudioPlayer
                          recording={item.customBoxDetails.voiceRecording}
                          title={`پیام صوتی باکس اختصاصی (${title})`}
                          compact={true}
                        />
                      </div>
                    )}

                    {/* Calligraphy Card Message */}
                    {cardMsg && (
                      <div className="p-3 bg-white rounded-xl border border-[#D4AF37]/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#0F4C3A] flex items-center gap-1">
                            <Feather className="w-3 h-3 text-[#D4AF37]" />
                            متن کارت تبریک اختصاصی (جهت خطاطی یا چاپ):
                          </span>
                          <span className="text-[10px] text-[#8C8375]">چاپ اختصاصی</span>
                        </div>
                        <p className="text-xs text-[#0F4C3A] font-calligraphy text-sm leading-relaxed p-2 bg-[#FAF8F5] rounded-lg">
                          « {cardMsg} »
                        </p>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-[#EAE6DF] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6A7873]">جمع اقلام:</span>
                <span className="font-bold">{formatToman(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>تخفیف اعمال شده:</span>
                  <span>- {formatToman(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6A7873]">هزینه ارسال اختصاصی:</span>
                <span className="font-bold">
                  {order.shippingCost === 0 ? 'رایگان' : formatToman(order.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#0F4C3A] pt-2 border-t border-[#EAE6DF]">
                <span>مبلغ کل فاکتور:</span>
                <span>{formatToman(order.totalPrice)}</span>
              </div>
            </div>

          </div>

          {/* Admin Internal Workshop Notes */}
          <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-2">
            <label className="block text-xs font-bold text-[#0F4C3A]">
              یادداشت‌های داخلی کارگاه و بسته‌بندی:
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="یادداشت‌های خصوصی بین همکاران کارگاه (مشتری این بخش را نمی‌بیند)..."
              className="w-full bg-[#FAF8F5] text-xs p-3 rounded-xl border border-[#EAE6DF] focus:border-[#0F4C3A] focus:outline-none"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F4EFE6] border-t border-[#EAE6DF] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#D0C8B8] text-[#2C3B37] text-xs font-bold hover:bg-white transition"
          >
            بستن پنجره
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
            ) : (
              <Save className="w-4 h-4 text-[#D4AF37]" />
            )}
            <span>{isSaving ? 'در حال ذخیره...' : isSaved ? 'تغییرات ذخیره شد ✓' : 'ذخیره وضعیت و یادداشت'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
