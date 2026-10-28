import React, { useState } from 'react';
import { ProductReview, Product } from '../../types';
import { toPersianDigits } from '../../utils/formatters';
import { api } from '../../services/api';
import {
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  ThumbsUp,
  ShieldCheck,
  Mic,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AudioPlayer } from '../common/AudioPlayer';

interface AdminReviewsProps {
  reviews: ProductReview[];
  setReviews?: React.Dispatch<React.SetStateAction<ProductReview[]>>;
  products: Product[];
  onSaveReviews?: (updated: ProductReview[]) => void;
  onUpdateStatus?: (id: string, newStatus: 'approved' | 'rejected') => Promise<void> | void;
  onDeleteReview?: (id: string) => Promise<void> | void;
  isLoading?: boolean;
  isProcessing?: boolean;
  error?: string | null;
  feedbackMessage?: { type: 'success' | 'error'; message: string } | null;
  onRefresh?: () => void;
}

export const AdminReviews: React.FC<AdminReviewsProps> = ({
  reviews,
  setReviews,
  products,
  onSaveReviews,
  onUpdateStatus,
  onDeleteReview,
  isLoading = false,
  isProcessing = false,
  error = null,
  feedbackMessage = null,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'approved' | 'rejected' | 'delete' | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<ProductReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredReviews = reviews.filter((r) => {
    const matchStatus = filterStatus === 'all' ? true : r.status === filterStatus;
    const author = r.authorName || '';
    const comment = r.comment || '';
    const company = r.companyName || '';
    const productTitle = (r as any).product?.titleFa || (r as any).productTitle || '';
    const matchSearch =
      author.includes(searchTerm) ||
      comment.includes(searchTerm) ||
      company.includes(searchTerm) ||
      productTitle.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    if (activeReviewId || isProcessing) return;
    setActiveReviewId(id);
    setActiveAction(newStatus);
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(id, newStatus);
      } else {
        const updated = reviews.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
        setReviews?.(updated);
        onSaveReviews?.(updated);
      }
    } catch (err) {
      console.error('Error updating review status in UI:', err);
    } finally {
      setActiveReviewId(null);
      setActiveAction(null);
    }
  };

  const handleDeleteClick = (review: ProductReview) => {
    setLocalFeedback(null);
    setReviewToDelete(review);
  };

  const handleConfirmDelete = async () => {
    if (!reviewToDelete || isDeleting || isProcessing) return;
    const id = reviewToDelete.id;
    setIsDeleting(true);
    setActiveReviewId(id);
    setActiveAction('delete');
    try {
      if (onDeleteReview) {
        await onDeleteReview(id);
      } else {
        await api.reviews.deleteAdmin(id);
        if (onRefresh) {
          await onRefresh();
        }
      }
      setLocalFeedback({
        type: 'success',
        message: 'دیدگاه با موفقیت حذف شد',
      });
      setReviewToDelete(null);
    } catch (err: any) {
      console.error('Error deleting review in UI:', err);
      const serverErrMsg =
        err?.message ||
        'خطا در حذف دیدگاه از سرور.';
      setLocalFeedback({
        type: 'error',
        message: serverErrMsg,
      });
      // On failure, keep the review and show the server error
      setReviewToDelete(null);
    } finally {
      setIsDeleting(false);
      setActiveReviewId(null);
      setActiveAction(null);
    }
  };

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6 text-right">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F4C3A] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
            <span>مدیریت و تایید نظرات و تجربیات خریداران</span>
          </h2>
          <p className="text-xs text-[#6A7873] mt-1">
            بررسی و انتشار نظرات مشتریان، تایید خریداران واقعی و پایش امتیاز محصولات متصل به پایگاه‌داده
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading || isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#0F4C3A] text-xs font-bold rounded-xl border border-[#EAE6DF] transition disabled:opacity-50"
              title="تازه‌سازی لیست از پایگاه‌داده"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
              <span>تازه‌سازی</span>
            </button>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE6DF] overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-[#0F4C3A] text-white shadow-xs'
                  : 'text-[#6A7873] hover:text-[#0F4C3A]'
              }`}
            >
              همه ({toPersianDigits(reviews.length)})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[#6A7873] hover:text-amber-700'
              }`}
            >
              در انتظار تایید ({toPersianDigits(pendingCount)})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterStatus === 'approved'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#6A7873] hover:text-emerald-700'
              }`}
            >
              منتشر شده ({toPersianDigits(approvedCount)})
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterStatus === 'rejected'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-[#6A7873] hover:text-rose-700'
              }`}
            >
              رد شده ({toPersianDigits(rejectedCount)})
            </button>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {(feedbackMessage || localFeedback) && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border shadow-xs transition-all ${
            (feedbackMessage || localFeedback)?.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {(feedbackMessage || localFeedback)?.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{(feedbackMessage || localFeedback)?.message}</span>
          </div>
          {localFeedback && (
            <button
              onClick={() => setLocalFeedback(null)}
              className="text-gray-400 hover:text-gray-600 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Backend Error Banner */}
      {error && !feedbackMessage && !localFeedback && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-bold shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-[#8C8375] shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="جستجو در متن نظر، نام نویسنده، شرکت یا عنوان محصول..."
          className="w-full text-xs bg-transparent focus:outline-none text-[#1C2826]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-[11px] text-[#8C8375] hover:text-[#0F4C3A] px-2 py-0.5"
          >
            پاک کردن
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading && reviews.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#EAE6DF] text-[#6A7873] text-xs flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#0F4C3A]" />
            <span>در حال بارگذاری لیست دیدگاه‌ها از پایگاه‌داده...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#EAE6DF] text-[#6A7873] text-xs">
            {reviews.length === 0
              ? 'هیچ دیدگاهی در پایگاه‌داده ثبت نشده است.'
              : 'نظری مطابق با فیلتر یا جستجوی انتخابی یافت نشد.'}
          </div>
        ) : (
          filteredReviews.map((review) => {
            const product = products.find((p) => p.id === review.productId);
            const displayProductTitle =
              (review as any).product?.titleFa ||
              (review as any).productTitle ||
              (product ? product.titleFa : 'محصول هدیه یادمان');
            const isThisReviewProcessing = activeReviewId === review.id || isProcessing;

            return (
              <div
                key={review.id}
                className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs hover:border-[#D4AF37]/50 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE6DF] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold text-sm shrink-0">
                      {review.authorName ? review.authorName[0] : 'ی'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-[#0F4C3A] text-sm">
                          {review.authorName || 'کاربر گرامی'}
                        </span>
                        {review.voiceRecording && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] bg-[#0F4C3A]/10 text-[#0F4C3A] font-bold px-1.5 py-0.5 rounded-full"
                            title="دارای پیام صوتی"
                          >
                            <Mic className="w-3 h-3 text-[#D4AF37]" />
                            <span>صوت</span>
                          </span>
                        )}
                        {review.companyName && (
                          <span className="text-[11px] text-[#6A7873] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EAE6DF]">
                            {review.companyName}
                          </span>
                        )}
                        {(review.isVerifiedBuyer || review.isVerifiedPurchase) && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            خریدار تایید شده
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#8C8375] block mt-0.5">
                        {review.createdAtFa || 'تاریخ ثبت نشده'}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars & Status */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[#D4AF37]" dir="ltr">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'fill-[#D4AF37]' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        review.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : review.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {review.status === 'approved'
                        ? 'منتشر شده'
                        : review.status === 'pending'
                        ? 'در انتظار بررسی'
                        : 'رد شده'}
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs text-[#2C3B37] leading-relaxed pr-2 whitespace-pre-wrap">
                  {review.comment}
                </p>

                {/* Voice Recording Player */}
                {review.voiceRecording && (
                  <div className="pt-2">
                    <AudioPlayer
                      recording={review.voiceRecording}
                      title={`پیام صوتی ${review.authorName}`}
                      compact={true}
                    />
                  </div>
                )}

                {/* Associated Product & Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EAE6DF] text-xs">
                  <div className="text-[11px] text-[#6A7873] flex items-center gap-2">
                    <span>محصول مربوطه:</span>
                    <span className="font-bold text-[#0F4C3A]">
                      {displayProductTitle}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#8C8375] mr-3">
                      <ThumbsUp className="w-3 h-3" />
                      {toPersianDigits(review.likesCount || 0)} پسند
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approve Button */}
                    {review.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'approved')}
                        disabled={isThisReviewProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                      >
                        {activeReviewId === review.id && activeAction === 'approved' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        <span>تایید و انتشار</span>
                      </button>
                    )}

                    {/* Reject Button */}
                    {review.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'rejected')}
                        disabled={isThisReviewProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                      >
                        {activeReviewId === review.id && activeAction === 'rejected' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>عدم انتشار</span>
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteClick(review)}
                      disabled={isThisReviewProcessing || isDeleting || isProcessing}
                      className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title="حذف دیدگاه"
                      aria-label="حذف دیدگاه"
                    >
                      {activeReviewId === review.id && activeAction === 'delete' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => {
            if (!isDeleting && !isProcessing) {
              setReviewToDelete(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#EAE6DF] space-y-4 text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1C2826]">
                  آیا از حذف این دیدگاه مطمئن هستید؟
                </h3>
                <p className="text-xs text-[#6A7873] leading-relaxed">
                  این دیدگاه به طور دائم از پایگاه‌داده حذف خواهد شد و این عملیات قابل بازگشت نیست.
                </p>
              </div>
            </div>

            {/* Review Preview */}
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF] space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[#6A7873]">
                <span className="font-semibold text-[#0F4C3A]">{reviewToDelete.authorName}</span>
                <span className="text-[11px]">{toPersianDigits(reviewToDelete.rating)} از ۵ ستاره</span>
              </div>
              <p className="text-[#2C3B37] line-clamp-3 text-[11px] leading-relaxed">
                {reviewToDelete.comment}
              </p>
            </div>

            {/* Modal Buttons: Cancel and Delete */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EAE6DF]">
              <button
                type="button"
                aria-label="Cancel"
                onClick={() => setReviewToDelete(null)}
                disabled={isDeleting || isProcessing}
                className="px-4 py-2 text-xs font-bold text-[#6A7873] hover:text-[#1C2826] bg-[#FAF8F5] hover:bg-[#F2EFE9] rounded-xl border border-[#EAE6DF] transition disabled:opacity-50 cursor-pointer"
              >
                <span>انصراف</span>
                <span className="sr-only">Cancel</span>
              </button>
              <button
                type="button"
                aria-label="Delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting || isProcessing}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting || (activeReviewId === reviewToDelete.id && activeAction === 'delete') ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال حذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                    <span className="sr-only">Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

