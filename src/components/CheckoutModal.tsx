import React, { useState, useEffect } from 'react';
import { CartItem, Order, CustomerInfo, ShippingMethod, PaymentMethod, Coupon, User as UserType, VoiceRecordingData } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { VoiceMessageRecorder } from './common/VoiceMessageRecorder';
import { api } from '../services/api';
import {
  X,
  CheckCircle,
  Truck,
  CreditCard,
  Building2,
  ShieldCheck,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Lock,
  ArrowRight,
  ArrowLeft,
  Gift,
  Printer,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  coupons?: Coupon[];
  onOrderPlaced: (order: Order) => void;
  onClearCart: () => void;
  currentUser?: UserType | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  coupons = [],
  onOrderPlaced,
  onClearCart,
  currentUser,
}) => {
  const defaultAddr = currentUser?.addresses.find((a) => a.isDefault) || currentUser?.addresses[0];

  const [step, setStep] = useState<'info' | 'shipping' | 'payment' | 'success'>('info');

  // Customer & Recipient Form
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [province, setProvince] = useState(defaultAddr?.province || 'تهران');
  const [city, setCity] = useState(defaultAddr?.city || 'تهران');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || '');
  const [address, setAddress] = useState(defaultAddr?.address || '');
  const [recipientName, setRecipientName] = useState(defaultAddr?.recipientName || '');
  const [recipientPhone, setRecipientPhone] = useState(defaultAddr?.phoneNumber || '');
  const [deliveryDate, setDeliveryDate] = useState('۱۴۰۳/۱۲/۱۵');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecordingData | null>(null);

  // Update fields if currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.fullName);
      if (!phoneNumber) setPhoneNumber(currentUser.phoneNumber);
      if (!email && currentUser.email) setEmail(currentUser.email);
      if (defaultAddr && !address) {
        setAddress(defaultAddr.address);
        setProvince(defaultAddr.province);
        setCity(defaultAddr.city);
        if (defaultAddr.postalCode) setPostalCode(defaultAddr.postalCode);
      }
    }
  }, [currentUser]);

  // Shipping & Payment
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('express_courier');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Placed Order Receipt State
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => {
    const itemPrice = item.product
      ? item.product.price
      : item.customBoxDetails
      ? item.customBoxDetails.totalPrice
      : 0;
    return acc + itemPrice * item.quantity;
  }, 0);

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
      if (appliedCoupon.maxDiscountAmount && discountAmount > appliedCoupon.maxDiscountAmount) {
        discountAmount = appliedCoupon.maxDiscountAmount;
      }
    } else {
      discountAmount = appliedCoupon.value;
    }
  }

  // Shipping cost
  const shippingCost =
    subtotal >= 3000000 || shippingMethod === 'in_person'
      ? 0
      : shippingMethod === 'express_courier'
      ? 150000
      : shippingMethod === 'chapar_vip'
      ? 180000
      : 95000;

  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;
    setCouponError('');

    try {
      const res: any = await api.coupons.validate(cleanCode, subtotal);
      if (res && res.isValid && res.coupon) {
        setAppliedCoupon({
          id: res.coupon.id,
          code: res.coupon.code,
          type: (res.coupon.discountPercent ?? res.coupon.type === 'percentage') ? 'percentage' : 'fixed',
          value: res.coupon.discountPercent ?? res.coupon.discountAmount ?? res.coupon.value ?? 0,
          minOrderAmount: res.coupon.minOrderAmount || undefined,
          maxDiscountAmount: res.coupon.maxDiscount ?? res.coupon.maxDiscountAmount ?? undefined,
          usageLimit: res.coupon.usageLimit || 100,
          usageCount: res.coupon.usedCount ?? res.coupon.usageCount ?? 0,
          isActive: res.coupon.isActive ?? true,
        });
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponError('کد تخفیف وارد شده معتبر نیست یا منقضی شده است.');
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err?.message || 'کد تخفیف وارد شده معتبر نمی‌باشد.');
    }
  };

  const handlePlaceOrder = async () => {
    if (isProcessing) return; // Prevent double submission
    setIsProcessing(true);
    setOrderError(null);

    // Reject out-of-stock items
    const outOfStockItem = cartItems.find(
      (it) => it.product && (!it.product.inStock || (it.product.stockQuantity !== undefined && it.product.stockQuantity <= 0))
    );
    if (outOfStockItem) {
      setOrderError(`محصول «${outOfStockItem.product?.titleFa}» در حال حاضر ناموجود است. لطفاً آن را از سبد خرید حذف نمایید.`);
      setIsProcessing(false);
      return;
    }

    const customer: CustomerInfo = {
      fullName: fullName || 'مشتری گرامی',
      phoneNumber: phoneNumber || '09120000000',
      email: email || undefined,
      province,
      city,
      postalCode: postalCode || '1999999999',
      address: address || 'تهران، خیابان ولیعصر',
      recipientName: recipientName || undefined,
      recipientPhone: recipientPhone || undefined,
      deliveryDate: deliveryDate || undefined,
      specialInstructions: specialInstructions || undefined,
      voiceRecording: voiceRecording || undefined,
    };

    // Prepare payload for backend - financial values are strictly recalculated by server
    const orderPayload = {
      customer: {
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email || '',
        province: customer.province,
        city: customer.city,
        address: customer.address,
        postalCode: customer.postalCode,
        recipientName: customer.recipientName,
        recipientPhone: customer.recipientPhone,
        deliveryDate: customer.deliveryDate,
        specialInstructions: customer.specialInstructions,
        giftCardMessage: customer.specialInstructions,
        voiceRecording: customer.voiceRecording,
      },
      items: cartItems.map((it) => ({
        id: it.id,
        productId: (it as any).productId || it.product?.id,
        quantity: it.quantity,
        isCustomBox: Boolean(it.isCustomBox),
        customBoxDetails: it.customBoxDetails,
        cardMessage: it.cardMessage,
        voiceRecording: it.voiceRecording,
        recipientName: it.recipientName,
        deliveryDate: it.deliveryDate,
        ribbonColor: it.ribbonColor,
        waxSeal: it.waxSeal,
      })),
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      shippingMethod,
      paymentMethod,
    };

    try {
      const createdOrder: any = await api.orders.create(orderPayload);
      
      // Adapt backend order response to frontend Order type
      const normalizedOrder: Order = {
        id: createdOrder.orderNumber || createdOrder.id,
        userId: createdOrder.userId || currentUser?.id,
        customer,
        items: [...cartItems],
        subtotal: createdOrder.subtotal ?? subtotal,
        shippingCost: createdOrder.shippingCost ?? shippingCost,
        discountAmount: createdOrder.discountAmount ?? discountAmount,
        couponCode: createdOrder.couponCode || (appliedCoupon ? appliedCoupon.code : undefined),
        totalPrice: createdOrder.totalAmount ?? createdOrder.totalPrice ?? grandTotal,
        status: (createdOrder.status?.toLowerCase() as any) || 'pending',
        shippingMethod,
        paymentMethod,
        paymentStatus: (createdOrder.paymentStatus?.toLowerCase() as any) || 'pending',
        voiceRecording: voiceRecording || undefined,
        createdAt: createdOrder.createdAt || new Date().toISOString(),
        createdAtFa: 'امروز، ساعت ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        trackingNumber: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
        adminNotes: createdOrder.adminNotes || 'سفارش ثبت شده آنلاین. آماده‌سازی بسته‌بندی هاردباکس و خطاطی کارت.',
      };

      setPlacedOrder(normalizedOrder);
      onOrderPlaced(normalizedOrder);
      onClearCart();
      setStep('success');
    } catch (err: any) {
      console.error('Order creation failed:', err);
      setOrderError(err.message || 'خطا در ثبت سفارش. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn" dir="rtl">
      <div
        className="bg-[#FAF8F5] w-full max-w-3xl rounded-3xl border-2 border-[#D4AF37]/50 shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#0F4C3A] text-white p-5 flex items-center justify-between border-b border-[#1B5E4A]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-extrabold text-base sm:text-lg">
              {step === 'success' ? 'رسید نهایی و ثبت سفارش' : 'تکمیل سفارش و پرداخت امن'}
            </h2>
          </div>
          {step !== 'success' && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#A3C4BA] hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'success' && (
          <div className="flex items-center justify-between bg-[#F4EFE6] px-6 py-3 border-b border-[#EAE6DF] text-xs font-bold text-[#6A7873]">
            <button
              onClick={() => setStep('info')}
              className={`flex items-center gap-1.5 ${step === 'info' ? 'text-[#0F4C3A]' : ''}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'info' ? 'bg-[#0F4C3A] text-white' : 'bg-[#EAE6DF]'}`}>
                ۱
              </span>
              <span>مشخصات و آدرس</span>
            </button>
            <span>›</span>
            <button
              onClick={() => {
                if (fullName && phoneNumber && address) setStep('shipping');
              }}
              className={`flex items-center gap-1.5 ${step === 'shipping' ? 'text-[#0F4C3A]' : ''}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'shipping' ? 'bg-[#0F4C3A] text-white' : 'bg-[#EAE6DF]'}`}>
                ۲
              </span>
              <span>شیوه ارسال</span>
            </button>
            <span>›</span>
            <button
              onClick={() => {
                if (fullName && phoneNumber && address) setStep('payment');
              }}
              className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-[#0F4C3A]' : ''}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'payment' ? 'bg-[#0F4C3A] text-white' : 'bg-[#EAE6DF]'}`}>
                ۳
              </span>
              <span>بازبینی و پرداخت</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 flex-1 text-right text-xs">
          
          {/* STEP 1: Customer & Recipient Info */}
          {step === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F4C3A] mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  <span>اطلاعات خریدار / سفارش‌دهنده:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      نام و نام خانوادگی خریدار: *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: دکتر علیرضا رستمی"
                      className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      شماره موبایل (جهت دریافت پیامک رهگیری): *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="۰۹۱۲..."
                      className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">ایمیل (اختیاری):</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-[#0F4C3A] mb-1">استان:</label>
                      <input
                        type="text"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#0F4C3A] mb-1">شهر:</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    نشانی دقیق پستی تحویل هدیه: *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="خیابان، کوچه، پلاک، واحد..."
                    className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Recipient Special Options */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#D4AF37]/30 space-y-4">
                <h3 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#D4AF37]" />
                  <span>آیا این هدیه مستقیماً به دست شخص دیگری می‌رسد؟ (اختیاری)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      نام تحویل‌گیرنده هدیه:
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="مثال: سرکار خانم دکتر تهرانی"
                      className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F4C3A] mb-1">
                      تاریخ مورد نظر برای تحویل هدیه:
                    </label>
                    <input
                      type="text"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      placeholder="۱۴۰۳/۱۲/۱۵"
                      className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    توضیحات و نیازمندی‌های خاص برای سفیر تحویل:
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="مثال: تحویل محرمانه بدون فاکتور قیمت در لابی، تماس قبل از رسیدن"
                    className="w-full bg-white p-2.5 rounded-xl border border-[#E0D8C8] focus:outline-none"
                  />
                </div>

                {/* Voice Message Recorder in Checkout */}
                <div className="pt-2">
                  <VoiceMessageRecorder
                    voiceRecording={voiceRecording}
                    onRecordingComplete={(rec) => setVoiceRecording(rec)}
                    onRecordingDeleted={() => setVoiceRecording(null)}
                    label="ضبط پیام صوتی برای تحویل یا متن کارت (اختیاری)"
                    helperText="اگر ترجیح می‌دهید پیام تبریک یا راهنمای تحویل را صوتی بفرمایید، ضبط کنید."
                    compact={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping Method */}
          {step === 'shipping' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#D4AF37]" />
                <span>انتخاب شیوه ارسال بسته هدیه:</span>
              </h3>

              <div className="space-y-3">
                <label
                  onClick={() => setShippingMethod('express_courier')}
                  className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    shippingMethod === 'express_courier'
                      ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] ring-1 ring-[#0F4C3A]'
                      : 'bg-white border-[#E0D8C8] hover:border-[#0F4C3A]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'express_courier'}
                      onChange={() => setShippingMethod('express_courier')}
                      className="mt-1 text-[#0F4C3A]"
                    />
                    <div>
                      <span className="font-bold text-[#0F4C3A] block text-sm">
                        پیک اختصاصی و VIP هدیه (ویژه شهر تهران)
                      </span>
                      <span className="text-[11px] text-[#6A7873] block mt-0.5">
                        تحویل در ساعت مشخص با خودرو و سفیر رسمی برند با بسته‌بندی ضدضربه
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-[#0F4C3A]">
                    {subtotal >= 3000000 ? 'رایگان' : '۱۵۰,۰۰۰ تومان'}
                  </span>
                </label>

                <label
                  onClick={() => setShippingMethod('chapar_vip')}
                  className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    shippingMethod === 'chapar_vip'
                      ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] ring-1 ring-[#0F4C3A]'
                      : 'bg-white border-[#E0D8C8] hover:border-[#0F4C3A]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'chapar_vip'}
                      onChange={() => setShippingMethod('chapar_vip')}
                      className="mt-1 text-[#0F4C3A]"
                    />
                    <div>
                      <span className="font-bold text-[#0F4C3A] block text-sm">
                        چاپار اکسپرس / تیپاکس هوایی سراسر کشور
                      </span>
                      <span className="text-[11px] text-[#6A7873] block mt-0.5">
                        تحویل ۲۴ الی ۴۸ ساعته به تمامی مراکز استان‌ها و شهرستان‌ها با بیمه کامل ارزش محموله
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-[#0F4C3A]">
                    {subtotal >= 3000000 ? 'رایگان' : '۱۸۰,۰۰۰ تومان'}
                  </span>
                </label>

                <label
                  onClick={() => setShippingMethod('post_pishtaz')}
                  className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    shippingMethod === 'post_pishtaz'
                      ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] ring-1 ring-[#0F4C3A]'
                      : 'bg-white border-[#E0D8C8] hover:border-[#0F4C3A]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'post_pishtaz'}
                      onChange={() => setShippingMethod('post_pishtaz')}
                      className="mt-1 text-[#0F4C3A]"
                    />
                    <div>
                      <span className="font-bold text-[#0F4C3A] block text-sm">
                        پست پیشتاز جمهوری اسلامی ایران
                      </span>
                      <span className="text-[11px] text-[#6A7873] block mt-0.5">
                        تحویل ۳ الی ۴ روز کاری به کلیه نقاط ایران با کد رهگیری ۲۴ رقمی
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-[#0F4C3A]">
                    {subtotal >= 3000000 ? 'رایگان' : '۹۵,۰۰۰ تومان'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Payment & Summary */}
          {step === 'payment' && (
            <div className="space-y-6">
              {/* Order Items Review */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] space-y-3">
                <h3 className="font-extrabold text-sm text-[#0F4C3A]">خلاصه اقلام فاکتور ({toPersianDigits(cartItems.length)} مورد)</h3>
                
                <div className="divide-y divide-[#EAE6DF] max-h-40 overflow-y-auto pr-1">
                  {cartItems.map((item) => {
                    const isCustom = item.isCustomBox && item.customBoxDetails;
                    const title = isCustom ? item.customBoxDetails!.boxType.nameFa : item.product!.titleFa;
                    const price = isCustom ? item.customBoxDetails!.totalPrice : item.product!.price;

                    return (
                      <div key={item.id} className="py-2 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-[#0F4C3A]">{title}</span>
                          <span className="text-[10px] text-[#6A7873] mr-2">
                            ({toPersianDigits(item.quantity)} عدد)
                          </span>
                        </div>
                        <span className="font-bold text-[#0F4C3A]">{formatToman(price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="p-4 bg-white rounded-2xl border border-[#EAE6DF] space-y-2">
                <label className="block font-bold text-[#0F4C3A]">کد تخفیف دارید؟</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. HEDYEH10"
                    className="flex-1 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] focus:outline-none uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-[#0F4C3A] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#0B3C2E]"
                  >
                    اعمال کد
                  </button>
                </div>
                {appliedCoupon && (
                  <span className="text-[11px] text-emerald-700 font-bold block">
                    ✓ کد تخفیف {appliedCoupon.code} با موفقیت اعمال شد.
                  </span>
                )}
                {couponError && <span className="text-[11px] text-red-600 block">{couponError}</span>}
              </form>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                  <span>انتخاب درگاه و شیوه پرداخت:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setPaymentMethod('online')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                      paymentMethod === 'online'
                        ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] ring-1 ring-[#0F4C3A]'
                        : 'bg-white border-[#E0D8C8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="text-[#0F4C3A]"
                    />
                    <div>
                      <span className="font-bold text-[#0F4C3A] block">درگاه آنلاین بانکی شاپرک</span>
                      <span className="text-[10px] text-[#6A7873]">کلیه کارت‌های شتاب بانکی با رمز پویا</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('corporate_invoice')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                      paymentMethod === 'corporate_invoice'
                        ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] ring-1 ring-[#0F4C3A]'
                        : 'bg-white border-[#E0D8C8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'corporate_invoice'}
                      onChange={() => setPaymentMethod('corporate_invoice')}
                      className="text-[#0F4C3A]"
                    />
                    <div>
                      <span className="font-bold text-[#0F4C3A] block">فاکتور رسمی سازمانی</span>
                      <span className="text-[10px] text-[#6A7873]">ویژه شرکت‌ها با شناسه ملی و پرداخت حسابداری</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] space-y-2 text-xs">
                <div className="flex justify-between text-[#4A5A55]">
                  <span>جمع کل فاکتور:</span>
                  <span className="font-bold text-[#1C2826]">{formatToman(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>تخفیف اعمال شده:</span>
                    <span>- {formatToman(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#4A5A55]">
                  <span>هزینه حمل و بیمه:</span>
                  <span className="font-bold text-[#1C2826]">
                    {shippingCost === 0 ? 'رایگان (طرح ویژه)' : formatToman(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#EAE6DF] text-sm">
                  <span className="font-extrabold text-[#0F4C3A]">مبلغ نهایی قابل پرداخت:</span>
                  <span className="text-xl font-extrabold text-[#0F4C3A]">{formatToman(grandTotal)}</span>
                </div>
              </div>

              {orderError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{orderError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success & Official Invoice */}
          {step === 'success' && placedOrder && (
            <div className="space-y-6 text-center py-4">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-[#0F4C3A]">
                  سفارش شما با موفقیت ثبت و تایید گردید!
                </h3>
                <p className="text-xs text-[#6A7873]">
                  پیامک تایید سفارش و کد پیگیری به شماره {placedOrder.customer.phoneNumber} ارسال گردید.
                </p>
              </div>

              {/* Invoice Box */}
              <div className="bg-white p-6 rounded-3xl border-2 border-[#D4AF37]/40 shadow-lg text-right space-y-4 max-w-xl mx-auto">
                <div className="flex justify-between items-center border-b border-[#EAE6DF] pb-3">
                  <div>
                    <span className="text-[10px] text-[#8C8375] block">شناسه سفارش:</span>
                    <span className="font-mono font-extrabold text-base text-[#0F4C3A]">
                      {placedOrder.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8C8375] block">کد رهگیری پستی:</span>
                    <span className="font-mono font-bold text-xs text-emerald-700">
                      {placedOrder.trackingNumber}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8C8375] block">خریدار محترم:</span>
                    <span className="font-bold text-[#0F4C3A]">{placedOrder.customer.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[#8C8375] block">مبلغ پرداخت شده:</span>
                    <span className="font-bold text-[#0F4C3A]">{formatToman(placedOrder.totalPrice)}</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-[#8C8375] block">نشانی تحویل:</span>
                  <span className="text-[#2C3B37] leading-relaxed">{placedOrder.customer.address}</span>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] text-[11px] text-[#0F4C3A] flex items-center justify-between">
                  <span>وضعیت سفارش:</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                    در حال آماده‌سازی و خطاطی کارت
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-8 py-3 rounded-xl font-bold text-xs transition shadow-md"
                >
                  بازگشت به صفحه اصلی فروشگاه
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions for Steps */}
        {step !== 'success' && (
          <div className="p-4 sm:p-5 border-t border-[#EAE6DF] bg-white flex items-center justify-between">
            {step === 'info' ? (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#6A7873] hover:text-[#1C2826] font-medium"
              >
                بازگشت به سبد خرید
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(step === 'payment' ? 'shipping' : 'info')}
                className="flex items-center gap-1 text-xs text-[#0F4C3A] font-bold"
              >
                <ArrowRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>
            )}

            {step === 'info' && (
              <button
                type="button"
                disabled={!fullName || !phoneNumber || !address}
                onClick={() => setStep('shipping')}
                className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                  fullName && phoneNumber && address
                    ? 'bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white shadow-md'
                    : 'bg-[#EAE6DF] text-[#8C8375] cursor-not-allowed'
                }`}
              >
                <span>ادامه به شیوه ارسال</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {step === 'shipping' && (
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <span>ادامه به پرداخت</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {step === 'payment' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePlaceOrder}
                id="btn-confirm-and-pay"
                className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-8 py-3.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 shadow-lg active:scale-98 transition"
              >
                <Lock className="w-4 h-4 text-[#D4AF37]" />
                <span>{isProcessing ? 'در حال اتصال به شاپرک...' : `پرداخت نهایی ${formatToman(grandTotal)}`}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
