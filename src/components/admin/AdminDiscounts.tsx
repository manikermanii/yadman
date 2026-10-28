import React, { useState, useEffect, useCallback } from 'react';
import { Coupon } from '../../types';
import { toPersianDigits, formatToman } from '../../utils/formatters';
import { api } from '../../services/api';
import {
  Ticket,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  RotateCcw,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

interface AdminDiscountsProps {
  coupons?: Coupon[];
  setCoupons?: React.Dispatch<React.SetStateAction<Coupon[]>>;
  onSaveCoupons?: (updated: Coupon[]) => void;
}

export const AdminDiscounts: React.FC<AdminDiscountsProps> = ({
  coupons: initialCoupons,
  setCoupons,
  onSaveCoupons,
}) => {
  const [coupons, setCouponsState] = useState<Coupon[]>(initialCoupons || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number | string>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | string>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | string>('');
  const [usageLimit, setUsageLimit] = useState<number | string>(100);
  const [startDateFa, setStartDateFa] = useState('');
  const [expiresAtFa, setExpiresAtFa] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch all coupons from PostgreSQL
  const loadCouponsFromDb = useCallback(async () => {
    setIsLoading(true);
    try {
      const serverCoupons = await api.coupons.getAllAdmin();
      if (Array.isArray(serverCoupons)) {
        setCouponsState(serverCoupons);
        setCoupons?.(serverCoupons);
        onSaveCoupons?.(serverCoupons);
      }
    } catch (err: any) {
      console.error('Failed to fetch coupons from database:', err);
      setFeedbackMessage({
        type: 'error',
        message: err?.message || 'خطا در واکشی لیست کدهای تخفیف از پایگاه‌داده.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [setCoupons, onSaveCoupons]);

  useEffect(() => {
    loadCouponsFromDb();
  }, [loadCouponsFromDb]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setType('percentage');
    setValue(10);
    setMinOrderAmount(0);
    setMaxDiscountAmount('');
    setUsageLimit(100);
    setStartDateFa('');
    setExpiresAtFa('');
    setDescription('');
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cp: Coupon) => {
    setEditingCoupon(cp);
    setCode(cp.code);
    setType(cp.type);
    setValue(cp.value);
    setMinOrderAmount(cp.minOrderAmount ?? 0);
    setMaxDiscountAmount(cp.maxDiscountAmount ?? '');
    setUsageLimit(cp.usageLimit ?? 100);
    setStartDateFa(cp.startDateFa || '');
    setExpiresAtFa(cp.expiresAtFa || '');
    setDescription(cp.description || '');
    setIsActive(cp.isActive !== false);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    if (togglingId || isSubmitting || isDeleting) return;
    setTogglingId(coupon.id);
    setFeedbackMessage(null);
    try {
      const newStatus = !coupon.isActive;
      const updated = await api.coupons.updateAdmin(coupon.id, { isActive: newStatus });
      await loadCouponsFromDb();
      setFeedbackMessage({
        type: 'success',
        message: updated.isActive
          ? `کد تخفیف «${coupon.code}» با موفقیت فعال شد.`
          : `کد تخفیف «${coupon.code}» با موفقیت غیرفعال شد.`,
      });
    } catch (err: any) {
      console.error('Failed to toggle coupon status:', err);
      setFeedbackMessage({
        type: 'error',
        message: err?.message || 'خطا در تغییر وضعیت کد تخفیف در پایگاه‌داده.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setFeedbackMessage(null);
    setCouponToDelete(coupon);
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.coupons.deleteAdmin(couponToDelete.id);
      setCouponToDelete(null);
      await loadCouponsFromDb();
      setFeedbackMessage({
        type: 'success',
        message: `کد تخفیف «${couponToDelete.code}» با موفقیت حذف شد.`,
      });
    } catch (err: any) {
      console.error('Failed to delete coupon:', err);
      setFeedbackMessage({
        type: 'error',
        message: err?.message || 'خطا در حذف کد تخفیف از پایگاه‌داده.',
      });
      setCouponToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 2) {
      setModalError('کد تخفیف باید حداقل ۲ کاراکتر باشد.');
      return;
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      setModalError('مقدار تخفیف باید عددی بزرگتر از صفر باشد.');
      return;
    }

    if (type === 'percentage' && numValue > 100) {
      setModalError('درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.');
      return;
    }

    const numMinOrder = Number(minOrderAmount || 0);
    if (isNaN(numMinOrder) || numMinOrder < 0) {
      setModalError('حداقل مبلغ سفارش نمی‌تواند عدد منفی باشد.');
      return;
    }

    const numMaxDiscount = maxDiscountAmount ? Number(maxDiscountAmount) : undefined;
    if (numMaxDiscount !== undefined && (isNaN(numMaxDiscount) || numMaxDiscount <= 0)) {
      setModalError('حداکثر سقف تخفیف باید عددی بزرگتر از صفر باشد.');
      return;
    }

    const numUsageLimit = Number(usageLimit || 100);
    if (isNaN(numUsageLimit) || numUsageLimit < 1) {
      setModalError('سقف دفعات استفاده باید حداقل ۱ باشد.');
      return;
    }

    const cleanStartDate = startDateFa.trim();
    const cleanExpiresDate = expiresAtFa.trim();

    const payload = {
      code: cleanCode,
      type,
      value: numValue,
      minOrderAmount: numMinOrder,
      maxDiscountAmount: numMaxDiscount,
      usageLimit: numUsageLimit,
      startDateFa: cleanStartDate || undefined,
      expiresAtFa: cleanExpiresDate || undefined,
      description: description.trim(),
      isActive,
    };

    setIsSubmitting(true);
    try {
      if (editingCoupon) {
        await api.coupons.updateAdmin(editingCoupon.id, payload);
        setIsModalOpen(false);
        await loadCouponsFromDb();
        setFeedbackMessage({
          type: 'success',
          message: `کد تخفیف «${cleanCode}» با موفقیت ویرایش شد.`,
        });
      } else {
        await api.coupons.createAdmin(payload);
        setIsModalOpen(false);
        await loadCouponsFromDb();
        setFeedbackMessage({
          type: 'success',
          message: `کد تخفیف «${cleanCode}» با موفقیت در پایگاه‌داده ایجاد شد.`,
        });
      }
    } catch (err: any) {
      console.error('Failed to save coupon in database:', err);
      setModalError(err?.message || 'خطا در ذخیره کد تخفیف در پایگاه‌داده.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F4C3A] flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#D4AF37]" />
            <span>مدیریت کدهای تخفیف و جشنواره‌ها</span>
          </h2>
          <p className="text-xs text-[#6A7873] mt-1">
            تعریف و ویرایش کدهای تخفیف، تعیین سقف تخفیف، محدودیت سفارش و تاریخ اعتبار متصل به پایگاه‌داده
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCouponsFromDb}
            disabled={isLoading || isSubmitting || isDeleting}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#0F4C3A] text-xs font-bold rounded-xl border border-[#EAE6DF] transition disabled:opacity-50 cursor-pointer"
            title="تازه‌سازی لیست از پایگاه‌داده"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
            <span>تازه‌سازی</span>
          </button>

          <button
            onClick={openCreateModal}
            disabled={isSubmitting || isDeleting}
            id="btn-add-coupon"
            className="flex items-center justify-center gap-2 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>ایجاد کد تخفیف جدید</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border shadow-xs transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.message}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-gray-400 hover:text-gray-600 text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-[#FAF8F5] text-[#6A7873] border-b border-[#EAE6DF]">
              <tr>
                <th className="p-4 font-semibold">کد تخفیف</th>
                <th className="p-4 font-semibold">نوع و مقدار تخفیف</th>
                <th className="p-4 font-semibold">حداقل مبلغ خرید</th>
                <th className="p-4 font-semibold text-center">دفعات مصرف</th>
                <th className="p-4 font-semibold">مهلت اعتبار</th>
                <th className="p-4 font-semibold text-center">وضعیت</th>
                <th className="p-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {isLoading && coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#6A7873]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#0F4C3A]" />
                      <span>در حال بارگذاری کدهای تخفیف از پایگاه‌داده...</span>
                    </div>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#6A7873] space-y-2">
                    <Ticket className="w-10 h-10 text-[#D4AF37] mx-auto opacity-70 mb-2" />
                    <div className="font-bold text-sm text-[#0F4C3A]">هنوز کد تخفیفی در پایگاه‌داده ایجاد نشده است</div>
                    <div className="text-xs">برای ایجاد اولین کد تخفیف، روی دکمه «ایجاد کد تخفیف جدید» کلیک کنید.</div>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-[#FAF8F5]/60 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-[#0F4C3A] bg-[#0F4C3A]/10 px-3 py-1 rounded-lg border border-[#0F4C3A]/20">
                          {coupon.code}
                        </span>
                      </div>
                      {coupon.description && (
                        <span className="text-[10px] text-[#6A7873] block mt-1">
                          {coupon.description}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-[#0F4C3A]">
                        {coupon.type === 'percentage'
                          ? `${toPersianDigits(coupon.value)} درصد`
                          : formatToman(coupon.value)}
                      </span>
                      {coupon.maxDiscountAmount && coupon.type === 'percentage' && (
                        <span className="text-[10px] text-[#8C8375] block mt-0.5">
                          (حداکثر تا {formatToman(coupon.maxDiscountAmount)})
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-[#2C3B37] font-medium">
                      {coupon.minOrderAmount ? formatToman(coupon.minOrderAmount) : 'بدون محدودیت'}
                    </td>

                    <td className="p-4 text-center text-[#2C3B37]">
                      <span className="font-bold">{toPersianDigits(coupon.usageCount ?? 0)}</span>
                      <span className="text-[#8C8375]"> / {toPersianDigits(coupon.usageLimit ?? 100)}</span>
                    </td>

                    <td className="p-4 text-[#6A7873] font-medium">
                      {coupon.startDateFa && coupon.expiresAtFa ? (
                        <div className="space-y-0.5 text-[11px]">
                          <div>از: {coupon.startDateFa}</div>
                          <div>تا: {coupon.expiresAtFa}</div>
                        </div>
                      ) : coupon.expiresAtFa ? (
                        <span>تا {coupon.expiresAtFa}</span>
                      ) : (
                        'نامحدود'
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        disabled={togglingId === coupon.id || isSubmitting || isDeleting}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition cursor-pointer disabled:opacity-50 ${
                          coupon.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={coupon.isActive ? 'کلیک جهت غیرفعال‌سازی' : 'کلیک جهت فعال‌سازی'}
                      >
                        {togglingId === coupon.id ? (
                          <Loader2 className="w-3 h-3 animate-spin inline-block" />
                        ) : coupon.isActive ? (
                          'فعال'
                        ) : (
                          'غیرفعال'
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(coupon)}
                          disabled={isSubmitting || isDeleting}
                          className="p-1.5 text-[#0F4C3A] hover:bg-[#F4EFE6] rounded-lg transition disabled:opacity-50 cursor-pointer"
                          title="ویرایش"
                          aria-label="ویرایش"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(coupon)}
                          disabled={isSubmitting || isDeleting}
                          className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg transition disabled:opacity-50 cursor-pointer"
                          title="حذف کد تخفیف"
                          aria-label="حذف کد تخفیف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {couponToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !isDeleting && setCouponToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#EAE6DF] space-y-4 text-right animate-in zoom-in-95 duration-150"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1C2826]">
                  آیا از حذف این کد تخفیف مطمئن هستید؟
                </h3>
                <p className="text-xs text-[#6A7873] leading-relaxed">
                  کد تخفیف <span className="font-mono font-bold text-[#0F4C3A]">«{couponToDelete.code}»</span> به طور دائم از پایگاه‌داده حذف خواهد شد و این عملیات قابل بازگشت نیست.
                </p>
              </div>
            </div>

            {/* Coupon preview */}
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF] space-y-1 text-xs">
              <div className="flex justify-between items-center text-[#6A7873]">
                <span className="font-semibold text-[#0F4C3A]">
                  تخفیف: {couponToDelete.type === 'percentage' ? `${toPersianDigits(couponToDelete.value)} درصد` : formatToman(couponToDelete.value)}
                </span>
                <span className="text-[11px]">
                  سقف استفاده: {toPersianDigits(couponToDelete.usageLimit ?? 100)} بار
                </span>
              </div>
              {couponToDelete.description && (
                <p className="text-[#6A7873] text-[11px]">{couponToDelete.description}</p>
              )}
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EAE6DF]">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-[#6A7873] hover:text-[#1C2826] bg-[#FAF8F5] hover:bg-[#F2EFE9] rounded-xl border border-[#EAE6DF] transition disabled:opacity-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال حذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف کد تخفیف</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !isSubmitting && setIsModalOpen(false)}
        >
          <div
            className="bg-[#FAF8F5] w-full max-w-lg rounded-2xl border border-[#D4AF37]/40 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 my-8"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <h3 className="font-extrabold text-[#0F4C3A] text-base flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#D4AF37]" />
                <span>{editingCoupon ? 'ویرایش کد تخفیف' : 'ایجاد کد تخفیف جدید'}</span>
              </h3>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                disabled={isSubmitting}
                className="p-1 text-[#6A7873] hover:text-[#0F4C3A] rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Error Alert */}
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                  کد تخفیف (لاتین): <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. YADMAN20"
                  className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">نوع تخفیف:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none cursor-pointer"
                  >
                    <option value="percentage">درصدی (%)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    مقدار تخفیف ({type === 'percentage' ? 'درصد' : 'تومان'}): <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={type === 'percentage' ? 100 : undefined}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    حداقل مبلغ سفارش (تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="0 برای نامحدود"
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    حداکثر سقف تخفیف (تومان):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="اختیاری (مخصوص درصدی)"
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    سقف دفعات استفاده:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    تاریخ شروع (شمسی):
                  </label>
                  <input
                    type="text"
                    value={startDateFa}
                    onChange={(e) => setStartDateFa(e.target.value)}
                    placeholder="اختیاری - ۱۴۰۵/۰۱/۰۱"
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                    تاریخ انقضا (شمسی):
                  </label>
                  <input
                    type="text"
                    value={expiresAtFa}
                    onChange={(e) => setExpiresAtFa(e.target.value)}
                    placeholder="اختیاری - ۱۴۰۵/۱۲/۲۹"
                    className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F4C3A] mb-1">توضیح کد تخفیف:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: تخفیف ویژه اعضای خبرنامه یا کمپین نوروزی"
                  className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="coupon-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#0F4C3A] rounded border-[#E0D8C8] cursor-pointer"
                />
                <label htmlFor="coupon-active" className="text-xs text-[#1C2826] font-semibold cursor-pointer">
                  کد تخفیف فعال و قابل اعمال در سبد خرید باشد
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#EAE6DF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs text-[#6A7873] hover:text-[#1C2826] font-medium rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <span>{editingCoupon ? 'ذخیره تغییرات' : 'ثبت کد تخفیف'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
