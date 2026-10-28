import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { CheckCircle2, Stamp, Download, Printer, Home, ShieldCheck, Heart } from 'lucide-react';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  onClose,
  cartItems,
}) => {
  const [stamped, setStamped] = useState(false);
  const [orderNumber] = useState(() => `HD-${Math.floor(100000 + Math.random() * 900000)}`);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setStamped(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setStamped(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => {
    const itemPrice = item.product
      ? item.product.price
      : item.customBoxDetails
      ? item.customBoxDetails.totalPrice
      : 0;
    return acc + itemPrice * item.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="bg-[#FAF8F5] w-full max-w-2xl rounded-3xl border-2 border-[#D4AF37]/60 shadow-2xl overflow-hidden p-6 sm:p-8 text-right space-y-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Stamp Animation Badge */}
        <div className="text-center space-y-3 relative">
          <div className="relative inline-block">
            <div
              className={`w-20 h-20 rounded-full bg-[#0F4C3A] text-[#FAF8F5] flex items-center justify-center mx-auto shadow-xl transition-all duration-700 ${
                stamped ? 'scale-100 rotate-0' : 'scale-150 rotate-12 opacity-0'
              }`}
            >
              <Stamp className="w-10 h-10 text-[#D4AF37]" />
            </div>
            {stamped && (
              <span className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-[#0F4C3A] p-1 rounded-full text-xs font-bold shadow-md">
                <CheckCircle2 className="w-5 h-5 text-[#0F4C3A]" />
              </span>
            )}
          </div>

          <h2 className="text-2xl font-extrabold text-[#0F4C3A]">
            سفارش شما با موفقیت ثبت و مهر و موم گردید
          </h2>
          <p className="text-xs text-[#4A5A55]">
            رسید رسمی و شناسنامه هدیه آماده شد. همکاران ما فرآیند بسته‌بندی دستی و خطاطی کارت تبریک را آغاز کرده‌اند.
          </p>
        </div>

        {/* Order Details Badge */}
        <div className="bg-[#F4EFE6] p-4 rounded-2xl border border-[#E0D8C8] space-y-2 text-xs text-[#2C3B37]">
          <div className="flex justify-between border-b border-[#E0D8C8] pb-2">
            <span className="text-[#6A7873]">کد پیگیری اختصاصی:</span>
            <span className="font-bold text-[#0F4C3A] font-mono text-sm">{orderNumber}</span>
          </div>
          <div className="flex justify-between border-b border-[#E0D8C8] pb-2">
            <span className="text-[#6A7873]">زمان تحویل پیش‌بینی شده:</span>
            <span className="font-bold text-[#0F4C3A]">۴۸ ساعت آینده (ارسال VIP)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6A7873]">نوع بسته‌بندی:</span>
            <span className="font-bold text-[#0F4C3A]">هاردباکس کرم/سبز با مهر مومی اختصاصی</span>
          </div>
        </div>

        {/* Items Brief */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs text-[#0F4C3A]">اقلام سفارش داده شده:</h4>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {cartItems.map((item, idx) => {
              const name = item.product
                ? item.product.titleFa
                : item.customBoxDetails?.boxType.nameFa;
              const price = item.product
                ? item.product.price
                : item.customBoxDetails?.totalPrice || 0;
              return (
                <div
                  key={idx}
                  className="flex justify-between text-xs p-2 bg-white rounded-xl border border-[#EAE6DF]"
                >
                  <span className="font-semibold text-[#1C2826]">{name}</span>
                  <span className="font-bold text-[#0F4C3A]">
                    {toPersianDigits(item.quantity)} عدد × {formatToman(price)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Price & Footer Actions */}
        <div className="pt-4 border-t border-[#EAE6DF] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-right">
            <span className="text-xs text-[#8C8375] block">مبلغ کل پرداخت شده:</span>
            <span className="text-xl font-extrabold text-[#0F4C3A]">{formatToman(subtotal)}</span>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#0F4C3A] text-[#0F4C3A] text-xs font-bold hover:bg-[#0F4C3A] hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور</span>
            </button>
            <button
              onClick={onClose}
              id="order-success-home-btn"
              className="flex-1 sm:flex-none bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4 text-[#D4AF37]" />
              <span>بازگشت به فروشگاه</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
