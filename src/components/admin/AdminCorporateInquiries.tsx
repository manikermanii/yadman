import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Clock,
  Send,
  Search,
  Trash2,
  Save,
  MessageSquare,
  AlertCircle,
  Mic,
  CheckCircle,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { CorporateInquiry, CorporateInquiryStatus } from '../../types';
import { toPersianDigits } from '../../utils/formatters';
import { AudioPlayer } from '../common/AudioPlayer';

interface AdminCorporateInquiriesProps {
  inquiries: CorporateInquiry[];
  isLoading?: boolean;
  feedbackMessage?: { type: 'success' | 'error'; message: string } | null;
  onClearFeedback?: () => void;
  onRefresh?: () => void;
  onUpdateInquiryStatus: (id: string, newStatus: CorporateInquiryStatus, adminNotes?: string) => Promise<boolean | void> | void;
  onDeleteInquiry: (id: string) => Promise<boolean | void> | void;
}

export const AdminCorporateInquiries: React.FC<AdminCorporateInquiriesProps> = ({
  inquiries = [],
  isLoading = false,
  feedbackMessage,
  onClearFeedback,
  onRefresh,
  onUpdateInquiryStatus,
  onDeleteInquiry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<CorporateInquiry | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [tempStatus, setTempStatus] = useState<CorporateInquiryStatus>('new');
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Delete confirmation modal state
  const [inquiryToDelete, setInquiryToDelete] = useState<CorporateInquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredInquiries = inquiries.filter((inq) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      inq.companyName.toLowerCase().includes(q) ||
      inq.contactName.toLowerCase().includes(q) ||
      inq.phone.includes(q) ||
      (inq.email && inq.email.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = (inquiry: CorporateInquiry) => {
    setSelectedInquiry(inquiry);
    setTempNotes(inquiry.adminNotes || '');
    setTempStatus(inquiry.status);
  };

  const handleSaveModal = async () => {
    if (!selectedInquiry) return;
    setIsSavingModal(true);
    try {
      await onUpdateInquiryStatus(selectedInquiry.id, tempStatus, tempNotes);
      setSelectedInquiry(null);
    } catch {
      // Error handled by parent feedback
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!inquiryToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteInquiry(inquiryToDelete.id);
      setInquiryToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'خطا در حذف استعلام سازمانی از پایگاه‌داده.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: CorporateInquiryStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> استعلام جدید
          </span>
        );
      case 'contacted':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Phone className="w-3 h-3" /> تماس گرفته شد
          </span>
        );
      case 'sample_sent':
        return (
          <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Send className="w-3 h-3" /> ارسال نمونه
          </span>
        );
      case 'approved':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> تایید و قرارداد
          </span>
        );
      case 'closed':
      default:
        return (
          <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            بسته شده
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
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
          {onClearFeedback && (
            <button
              onClick={onClearFeedback}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F4C3A]">
            استعلام‌ها و درخواست‌های سازمانی (B2B)
          </h1>
          <p className="text-xs text-[#6A7873] mt-1">
            پیگیری درخواست‌های استعلام پیش‌فاکتور، ارسال نمونه، درج لوگو و هدایای مدیریتی با اتصال به PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 bg-white border border-[#EAE6DF] hover:bg-[#FAF8F5] text-[#0F4C3A] rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="تازه‌سازی اطلاعات از پایگاه‌داده"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
              <span className="hidden sm:inline">تازه‌سازی</span>
            </button>
          )}
          <div className="text-xs text-[#6A7873] bg-white px-4 py-2.5 rounded-2xl border border-[#EAE6DF] font-bold shadow-xs">
            مجموع استعلام‌ها:{' '}
            <span className="text-[#0F4C3A] font-extrabold mr-1">
              {toPersianDigits(inquiries.length)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-3xl border border-[#EAE6DF] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس نام سازمان، رابط، شماره تماس یا ایمیل..."
            className="w-full bg-[#FAF8F5] text-xs text-[#1C2826] pr-10 pl-4 py-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
          />
          <Search className="w-4 h-4 text-[#8C8375] absolute right-3.5 top-3" />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#FAF8F5] text-xs font-bold text-[#0F4C3A] px-3 py-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="new">استعلام‌های جدید</option>
            <option value="contacted">تماس گرفته شده</option>
            <option value="sample_sent">ارسال نمونه</option>
            <option value="approved">تایید و قرارداد</option>
            <option value="closed">بسته شده</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE6DF] shadow-xs space-y-3">
          <Loader2 className="w-8 h-8 text-[#0F4C3A] animate-spin mx-auto" />
          <p className="text-xs text-[#6A7873] font-bold">در حال بارگذاری استعلام‌های سازمانی از پایگاه‌داده...</p>
        </div>
      )}

      {/* Inquiries Cards Grid */}
      {!isLoading && filteredInquiries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE6DF] shadow-xs space-y-2 text-[#8C8375]">
          <Building2 className="w-10 h-10 mx-auto text-[#0F4C3A]/30" />
          <p className="text-sm font-bold">هیچ استعلام سازمانی مطابق با جستجوی شما یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-white rounded-3xl p-5 border border-[#EAE6DF] shadow-xs space-y-4 hover:border-[#D4AF37] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-[#0F4C3A]">{inq.companyName}</h3>
                      {inq.voiceRecording && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] bg-[#0F4C3A]/10 text-[#0F4C3A] font-bold px-1.5 py-0.5 rounded-full"
                          title="دارای پیام صوتی ضبط‌شده"
                        >
                          <Mic className="w-3 h-3 text-[#D4AF37]" />
                          <span>صوت</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6A7873]">{inq.contactName}</span>
                  </div>
                </div>
                {getStatusBadge(inq.status)}
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 gap-2 bg-[#FAF8F5] p-3 rounded-2xl text-xs border border-[#EAE6DF]">
                <div>
                  <span className="text-[#8C8375] block text-[10px]">تعداد برآوردی:</span>
                  <span className="font-bold text-[#1C2826]">{inq.estimatedQuantity}</span>
                </div>
                <div>
                  <span className="text-[#8C8375] block text-[10px]">بودجه هر پک:</span>
                  <span className="font-bold text-[#0F4C3A]">{inq.budgetPerBox}</span>
                </div>
              </div>

              {inq.notes && (
                <p className="text-xs text-[#3A4A45] line-clamp-2 leading-relaxed bg-[#FAF8F5]/60 p-2.5 rounded-xl border border-[#EAE6DF]">
                  « {inq.notes} »
                </p>
              )}

              {/* Contact Actions & Detail Trigger */}
              <div className="pt-2 border-t border-[#F4EFE6] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${inq.phone}`}
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition text-xs font-bold flex items-center gap-1"
                    title="تماس تلفنی"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{inq.phone}</span>
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenDetail(inq)}
                    className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>پیگیری و ثبت یادداشت</span>
                  </button>
                  <button
                    onClick={() => {
                      setInquiryToDelete(inq);
                      setDeleteError(null);
                    }}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="حذف استعلام"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {inquiryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#EAE6DF] shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-extrabold text-base text-[#1C2826]">حذف استعلام سازمانی</h3>
              </div>
              <button
                type="button"
                onClick={() => setInquiryToDelete(null)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4A5A55] leading-relaxed">
              آیا از حذف استعلام سازمان{' '}
              <strong className="text-[#0F4C3A]">«{inquiryToDelete.companyName}»</strong> (رابط:{' '}
              {inquiryToDelete.contactName}) از پایگاه‌داده PostgreSQL اطمینان دارید؟ این عملیات
              غیرقابل بازگشت است.
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInquiryToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'در حال حذف...' : 'بله، حذف کن'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Detail & Status Update Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div
            className="bg-[#FAF8F5] w-full max-w-2xl rounded-3xl border-2 border-[#D4AF37]/50 shadow-2xl overflow-hidden text-right relative p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-[#0F4C3A]" />
                <div>
                  <h2 className="font-extrabold text-base text-[#0F4C3A]">
                    پیگیری استعلام: {selectedInquiry.companyName}
                  </h2>
                  <span className="text-xs text-[#6A7873]">
                    رابط: {selectedInquiry.contactName} • ثبت شده در: {selectedInquiry.createdAtFa}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-[#0F4C3A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-[#EAE6DF]">
                <div>
                  <span className="text-[#6A7873] block mb-1">شماره تماس:</span>
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="font-bold text-[#0F4C3A] font-mono text-sm"
                  >
                    {selectedInquiry.phone}
                  </a>
                </div>
                <div>
                  <span className="text-[#6A7873] block mb-1">تعداد و بودجه تخمینی:</span>
                  <span className="font-bold">
                    {selectedInquiry.estimatedQuantity} (هر پک {selectedInquiry.budgetPerBox})
                  </span>
                </div>
              </div>

              {/* Voice Recording Player */}
              {selectedInquiry.voiceRecording && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#0F4C3A] flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-[#D4AF37]" />
                    <span>پیام صوتی ضبط‌شده توسط رابط سازمان:</span>
                  </span>
                  <AudioPlayer
                    recording={selectedInquiry.voiceRecording}
                    title={`پیام صوتی ${selectedInquiry.companyName} (${selectedInquiry.contactName})`}
                  />
                </div>
              )}

              {selectedInquiry.notes && (
                <div className="space-y-1">
                  <span className="font-bold text-[#6A7873] block">توضیحات و نیازمندی متنی:</span>
                  <div className="p-3 bg-white rounded-xl border border-[#EAE6DF] text-[#3A4A45] leading-relaxed">
                    {selectedInquiry.notes}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#0F4C3A] mb-1.5">
                  وضعیت پیگیری سازمانی:
                </label>
                <select
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value as CorporateInquiryStatus)}
                  className="w-full bg-white font-bold text-[#0F4C3A] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                >
                  <option value="new">⏳ استعلام جدید (در انتظار تماس اول)</option>
                  <option value="contacted">📞 تماس اولیه و مشاوره انجام شد</option>
                  <option value="sample_sent">🎁 ارسال نمونه پک و کاتالوگ سازمانی</option>
                  <option value="approved">✅ تایید پیش‌فاکتور و عقد قرارداد</option>
                  <option value="closed">🔒 بسته شده / عدم تمایل</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0F4C3A] mb-1.5">
                  یادداشت‌های داخلی و گزارش مذاکره:
                </label>
                <textarea
                  rows={4}
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="گزارش گفتگو با مدیر روابط عمومی یا تدارکات سازمان، تاریخ جلسه و توافقات قیمت..."
                  className="w-full bg-white p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#EAE6DF]">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                disabled={isSavingModal}
                className="px-4 py-2 rounded-xl border border-[#D0C8B8] font-bold text-xs hover:bg-[#F4EFE6] transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={isSavingModal}
                className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSavingModal ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                ) : (
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                )}
                <span>{isSavingModal ? 'در حال ذخیره...' : 'ذخیره تغییرات استعلام'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
