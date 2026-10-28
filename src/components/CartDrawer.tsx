import React, { useState } from 'react';
import { CartItem } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { X, Trash2, Plus, Minus, ShoppingBag, Stamp, Check, Gift, ArrowLeft, Tag, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  if (!isOpen) return null;

  const isItemOutOfStock = (item: CartItem) => {
    if (item.isCustomBox) return false;
    const p = item.product;
    if (!p) return false;
    return !p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0);
  };

  const hasOutOfStockItems = cartItems.some(isItemOutOfStock);

  const subtotal = cartItems.reduce((acc, item) => {
    const itemPrice = item.unitPrice !== undefined
      ? item.unitPrice
      : item.product
      ? item.product.price
      : item.customBoxDetails
      ? item.customBoxDetails.totalPrice
      : 0;
    return acc + itemPrice * item.quantity;
  }, 0);

  const shippingCost = subtotal >= 3000000 || subtotal === 0 ? 0 : 120000;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError('');
    setCouponSuccessMsg('');

    try {
      const res = await api.coupons.validate(couponCode.trim(), subtotal);
      if (res && res.isValid) {
        setDiscountAmount(res.discountAmount || 0);
        setCouponSuccessMsg(`کد تخفیف با موفقیت اعمال شد (${formatToman(res.discountAmount || 0)} تخفیف)`);
      } else {
        setDiscountAmount(0);
        setCouponError('کد تخفیف وارد شده معتبر نیست یا منقضی شده است.');
      }
    } catch (err: any) {
      setDiscountAmount(0);
      setCouponError(err?.message || 'کد تخفیف وارد شده معتبر نیست یا منقضی شده است.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div
        className="bg-[#FAF8F5] w-full max-w-md h-full flex flex-col shadow-2xl border-r border-[#EAE6DF] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#EAE6DF] flex items-center justify-between bg-[#F4EFE6]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#0F4C3A]" />
            <h2 className="font-extrabold text-[#0F4C3A] text-base">سبد خرید</h2>
            <span className="text-xs bg-[#0F4C3A] text-white px-2 py-0.5 rounded-full font-bold">
              {toPersianDigits(cartItems.length)} مورد
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#3A4A45] hover:text-[#0F4C3A] hover:bg-[#EAE6DF] rounded-full transition"
            id="cart-drawer-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-right">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Gift className="w-16 h-16 text-[#0F4C3A]/30 mx-auto" />
              <h3 className="text-base font-bold text-[#0F4C3A]">سبد خرید شما خالی است</h3>
              <p className="text-xs text-[#6A7873]">
                از بخش پک‌های هدیه یا ساخت پک اختصاصی، محصولات مورد نظر خود را انتخاب کنید.
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-[#0F4C3A] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#0B3C2E] transition"
              >
                <span>مشاهده پک‌ها</span>
                <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const isCustom = Boolean(item.isCustomBox && item.customBoxDetails);
                const isOutOfStock = isItemOutOfStock(item);
                const title = isCustom
                  ? (item.customBoxDetails?.boxType?.nameFa || 'باکس اختصاصی')
                  : (item.product?.titleFa || item.productTitleFa || 'پک هدیه');
                const image = isCustom
                  ? (item.customBoxDetails?.items?.[0]?.image || '')
                  : (item.product?.image || item.productImage || '');
                const price = item.unitPrice !== undefined
                  ? item.unitPrice
                  : isCustom
                  ? (item.customBoxDetails?.totalPrice || 0)
                  : (item.product?.price || 0);

                return (
                  <div
                    key={item.id}
                    className={`p-3 bg-white rounded-2xl border shadow-xs flex items-center gap-3 relative ${
                      isOutOfStock ? 'border-red-300 bg-red-50/20' : 'border-[#EAE6DF]'
                    }`}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className={`w-16 h-16 object-cover rounded-xl border border-[#EAE6DF] shrink-0 ${
                          isOutOfStock ? 'opacity-60 grayscale-50' : ''
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center text-[#0F4C3A] shrink-0">
                        <Gift className="w-6 h-6 text-[#0F4C3A]/40" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        {isCustom && (
                          <span className="text-[9px] bg-[#D4AF37] text-[#0F4C3A] font-bold px-1.5 py-0.2 rounded">
                            باکس اختصاصی
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded border border-red-200">
                            اتمام موجودی در انبار
                          </span>
                        )}
                        {isCustom && item.customBoxDetails?.voiceRecording && (
                          <span className="text-[9px] bg-[#0F4C3A]/10 text-[#0F4C3A] font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                            <span>🎙️</span>
                            <span>پیام صوتی</span>
                          </span>
                        )}
                        <h4 className={`font-bold text-xs truncate ${isOutOfStock ? 'text-red-900 line-through opacity-70' : 'text-[#0F4C3A]'}`}>
                          {title}
                        </h4>
                      </div>

                      {/* Details preview */}
                      <p className="text-[10px] text-[#6A7873] truncate mt-0.5">
                        {isCustom
                          ? `${toPersianDigits(item.customBoxDetails?.items?.length || 0)} آیتم داخلی • روبان: ${
                              item.customBoxDetails?.ribbon?.nameFa || 'پیش‌فرض'
                            }`
                          : `مهر و موم: ${item.product?.waxSeal || 'سلطنتی'}`}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-extrabold text-xs text-[#0F4C3A]">
                          {formatToman(price * item.quantity)}
                        </span>

                        {/* Quantity adjust */}
                        <div className="flex items-center gap-2 bg-[#F4EFE6] px-2 py-1 rounded-lg border border-[#E0D8C8]">
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            disabled={isOutOfStock}
                            className="text-[#0F4C3A] hover:text-[#0B3C2E] disabled:opacity-30 disabled:cursor-not-allowed"
                            title="افزایش تعداد"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-[#1C2826] px-1">
                            {toPersianDigits(item.quantity)}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="text-[#0F4C3A] hover:text-[#0B3C2E]"
                            title="کاهش تعداد"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="absolute top-2 left-2 text-gray-400 hover:text-red-600 p-1"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="کد تخفیف (HEDYEH10)"
                    className="flex-1 bg-white text-xs p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingCoupon}
                    className="bg-[#0F4C3A] text-white px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-[#0B3C2E] disabled:opacity-50 flex items-center gap-1"
                  >
                    {isValidatingCoupon && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>اعمال</span>
                  </button>
                </div>
                {couponSuccessMsg && (
                  <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                    ✓ {couponSuccessMsg}
                  </span>
                )}
                {couponError && (
                  <span className="text-[11px] text-red-600 block mt-1">{couponError}</span>
                )}
              </form>

            </div>
          )}
        </div>

        {/* Bottom Total & Checkout Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-[#EAE6DF] bg-white space-y-3 text-right">
            <div className="space-y-1.5 text-xs text-[#3A4A45]">
              <div className="flex justify-between">
                <span>مبلغ کل سفارش:</span>
                <span className="font-bold text-[#1C2826]">{formatToman(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>تخفیف کد هدیه:</span>
                  <span>- {formatToman(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>هزینه ارسال:</span>
                <span className="font-bold text-[#1C2826]">
                  {shippingCost === 0 ? 'رایگان' : formatToman(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#EAE6DF] text-sm">
                <span className="font-bold text-[#0F4C3A]">مبلغ قابل پرداخت:</span>
                <span className="text-xl font-extrabold text-[#0F4C3A]">
                  {formatToman(grandTotal)}
                </span>
              </div>
            </div>

            {hasOutOfStockItems && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>یک یا چند محصول در سبد خرید ناموجود هستند. لطفاً برای ادامه خرید، اقلام ناموجود را حذف فرمایید.</span>
              </div>
            )}

            <button
              onClick={onCheckout}
              disabled={hasOutOfStockItems}
              id="cart-checkout-btn"
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${
                hasOutOfStockItems
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] active:scale-98 cursor-pointer'
              }`}
            >
              <span>{hasOutOfStockItems ? 'اقلام ناموجود را حذف نمایید' : 'تکمیل خرید و ثبت سفارش'}</span>
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
