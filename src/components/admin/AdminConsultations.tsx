import React, { useState } from 'react';
import {
  Headphones,
  Phone,
  Clock,
  Search,
  Trash2,
  Save,
  AlertCircle,
  Building2,
  User,
  X,
  Edit,
  Mic,
  CheckCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { ConsultationRequest, ConsultationStatus, ConsultationTopic } from '../../types';
import { toPersianDigits } from '../../utils/formatters';
import { AudioPlayer } from '../common/AudioPlayer';

interface AdminConsultationsProps {
  consultations: ConsultationRequest[];
  isLoading?: boolean;
  feedbackMessage?: { type: 'success' | 'error'; message: string } | null;
  onClearFeedback?: () => void;
  onRefresh?: () => void;
  onUpdateConsultationStatus: (
    id: string,
    newStatus: ConsultationStatus,
    adminNotes?: string,
    assignedConsultant?: string
  ) => Promise<boolean | void> | void;
  onDeleteConsultation: (id: string) => Promise<boolean | void> | void;
}

export const AdminConsultations: React.FC<AdminConsultationsProps> = ({
  consultations = [],
  isLoading = false,
  feedbackMessage,
  onClearFeedback,
  onRefresh,
  onUpdateConsultationStatus,
  onDeleteConsultation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal / Detail state
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRequest | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [tempStatus, setTempStatus] = useState<ConsultationStatus>('new');
  const [tempConsultant, setTempConsultant] = useState('');
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Delete Confirmation Modal
  const [consultationToDelete, setConsultationToDelete] = useState<ConsultationRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filtering
  const filteredConsultations = consultations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.occasion && c.occasion.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.customerType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleOpenDetail = (consultation: ConsultationRequest) => {
    setSelectedConsultation(consultation);
    setTempNotes(consultation.adminNotes || '');
    setTempStatus(consultation.status);
    setTempConsultant(consultation.assignedConsultant || '');
  };

  const handleSaveModal = async () => {
    if (!selectedConsultation) return;
    setIsSavingModal(true);
    try {
      await onUpdateConsultationStatus(
        selectedConsultation.id,
        tempStatus,
        tempNotes,
        tempConsultant
      );
      setSelectedConsultation(null);
    } catch {
      // Feedback handled by parent
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!consultationToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteConsultation(consultationToDelete.id);
      setConsultationToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'خطا در حذف درخواست مشاوره از پایگاه‌داده.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTopicLabel = (topic: ConsultationTopic) => {
    switch (topic) {
      case 'box_selection':
        return 'انتخاب پک هدیه';
      case 'corporate_gift':
        return 'هدیه سازمانی';
      case 'custom_box':
        return 'پک اختصاصی';
      case 'bulk_order':
        return 'سفارش تعداد بالا';
      case 'customization':
        return 'شخصی‌سازی و برندینگ';
      case 'other':
      default:
        return 'سایر موضوعات';
    }
  };

  const getStatusBadge = (status: ConsultationStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>جدید</span>
          </span>
        );
      case 'in_review':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>در حال بررسی</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>تماس گرفته شد</span>
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>تکمیل شده</span>
          </span>
        );
      case 'cancelled':
      default:
        return (
          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span>لغو شده</span>
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
            درخواست‌های مشاوره و راهنمایی هدیه
          </h1>
          <p className="text-xs text-[#6A7873] mt-1">
            بررسی و تخصیص کارشناس برای درخواست‌های مشاوره انتخاب پک، بودجه و مناسبت‌ها
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 bg-white border border-[#EAE6DF] hover:bg-[#FAF8F5] text-[#0F4C3A] rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="تازه‌سازی درخواست‌های مشاوره از پایگاه‌داده"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
              <span className="hidden sm:inline">تازه‌سازی</span>
            </button>
          )}

          <div className="text-xs text-[#6A7873] bg-white px-4 py-2.5 rounded-2xl border border-[#EAE6DF] font-bold shadow-xs">
            مجموع درخواست‌ها:{' '}
            <span className="text-[#0F4C3A] font-extrabold mr-1">
              {toPersianDigits(consultations.length)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام متقاضی، تلفن، شرکت یا توضیحات..."
              className="w-full bg-[#FAF8F5] text-xs text-[#1C2826] pr-10 pl-4 py-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
            />
            <Search className="w-4 h-4 text-[#8C8375] absolute right-3.5 top-3" />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#FAF8F5] text-xs font-bold text-[#0F4C3A] px-3 py-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="new">جدید (New)</option>
              <option value="in_review">در حال بررسی</option>
              <option value="contacted">تماس گرفته شد</option>
              <option value="completed">تکمیل شده</option>
              <option value="cancelled">لغو شده</option>
            </select>
          </div>

          {/* Customer Type Filter */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#FAF8F5] text-xs font-bold text-[#0F4C3A] px-3 py-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
            >
              <option value="all">همه نوع مشتریان</option>
              <option value="personal">مشتری شخصی</option>
              <option value="corporate">شرکت / سازمان</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE6DF] shadow-xs space-y-3">
          <Loader2 className="w-8 h-8 text-[#0F4C3A] animate-spin mx-auto" />
          <p className="text-xs text-[#6A7873] font-bold">در حال بارگذاری درخواست‌های مشاوره از پایگاه‌داده...</p>
        </div>
      )}

      {/* Consultations Table */}
      {!isLoading && (
        <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-xs overflow-hidden">
          {filteredConsultations.length === 0 ? (
            <div className="p-12 text-center text-[#8C9B95] space-y-2">
              <Headphones className="w-10 h-10 mx-auto text-[#0F4C3A]/30" />
              <p className="text-sm font-bold">هیچ درخواست مشاوره‌ای با مشخصات انتخابی یافت نشد.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-xs font-bold text-[#4A5A55]">
                    <th className="py-3.5 px-4">کد و متقاضی</th>
                    <th className="py-3.5 px-4">نوع مشتری</th>
                    <th className="py-3.5 px-4">موضوع مشاوره</th>
                    <th className="py-3.5 px-4">بودجه و تعداد</th>
                    <th className="py-3.5 px-4">مناسبت و زمان</th>
                    <th className="py-3.5 px-4">وضعیت</th>
                    <th className="py-3.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF] text-xs">
                  {filteredConsultations.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF8F5]/80 transition">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="font-bold text-[#0F4C3A]">{c.fullName}</div>
                          {c.voiceRecording && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] bg-[#0F4C3A]/10 text-[#0F4C3A] font-bold px-1.5 py-0.5 rounded-full"
                              title="دارای پیام صوتی ضبط‌شده"
                            >
                              <Mic className="w-3 h-3 text-[#D4AF37]" />
                              <span>صوت</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6A7873] font-mono mt-0.5" dir="ltr">
                          {c.phone}
                        </div>
                        <div className="text-[10px] text-[#8C9B95] mt-0.5 flex items-center gap-1">
                          <span className="font-mono">{c.id}</span> • <span>{c.createdAtFa}</span>
                        </div>
                      </td>

                      {/* Customer Type */}
                      <td className="py-3.5 px-4">
                        {c.customerType === 'corporate' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-[#0F4C3A]/10 text-[#0F4C3A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <Building2 className="w-3 h-3" />
                              <span>سازمانی</span>
                            </span>
                            {c.companyName && (
                              <span className="text-[11px] text-[#2C3B37] block font-semibold">
                                {c.companyName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <User className="w-3 h-3" />
                            <span>شخصی</span>
                          </span>
                        )}
                      </td>

                      {/* Topic */}
                      <td className="py-3.5 px-4 font-medium text-[#2C3B37]">
                        <div>{getTopicLabel(c.topic)}</div>
                        {c.preferredContactMethod && (
                          <span className="text-[10px] text-[#8C9B95]">
                            ارتباط:{' '}
                            {c.preferredContactMethod === 'phone'
                              ? 'تلفنی'
                              : c.preferredContactMethod === 'whatsapp'
                              ? 'واتساپ'
                              : 'آنلاین'}
                          </span>
                        )}
                      </td>

                      {/* Budget & Quantity */}
                      <td className="py-3.5 px-4 text-[#4A5A55]">
                        <div>{c.approxBudget || 'تعیین نشده'}</div>
                        <div className="text-[11px] text-[#6A7873] mt-0.5">
                          تعداد: {c.quantityNeeded || 'نامشخص'}
                        </div>
                      </td>

                      {/* Occasion & Date */}
                      <td className="py-3.5 px-4 text-[#4A5A55]">
                        <div>{c.occasion || 'عمومی'}</div>
                        {c.targetDate && (
                          <div className="text-[10px] text-[#8C9B95] mt-0.5">
                            موعد: {c.targetDate}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(c)}
                            className="bg-[#0F4C3A] text-white hover:bg-[#0B3C2E] px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>بررسی و پیگیری</span>
                          </button>

                          <button
                            onClick={() => {
                              setConsultationToDelete(c);
                              setDeleteError(null);
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف درخواست مشاوره"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {consultationToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#EAE6DF] shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-extrabold text-base text-[#1C2826]">حذف درخواست مشاوره</h3>
              </div>
              <button
                type="button"
                onClick={() => setConsultationToDelete(null)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4A5A55] leading-relaxed">
              آیا از حذف درخواست مشاوره{' '}
              <strong className="text-[#0F4C3A]">«{consultationToDelete.fullName}»</strong> (کد:{' '}
              {consultationToDelete.id}) از پایگاه‌داده PostgreSQL اطمینان دارید؟
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConsultationToDelete(null)}
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

      {/* Details & Status Edit Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAE6DF] space-y-6 text-right max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-[#0F4C3A]">
                    جزئیات درخواست مشاوره {selectedConsultation.fullName}
                  </h3>
                  <span className="font-mono text-xs bg-[#F4EFE6] text-[#0F4C3A] px-2 py-0.5 rounded-md font-bold">
                    {selectedConsultation.id}
                  </span>
                </div>
                <span className="text-[11px] text-[#6A7873] block mt-0.5">
                  ثبت شده در: {selectedConsultation.createdAtFa}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConsultation(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] text-xs">
              <div>
                <span className="text-[#8C9B95] block">متقاضی:</span>
                <span className="font-bold text-[#1C2826]">{selectedConsultation.fullName}</span>
              </div>

              <div>
                <span className="text-[#8C9B95] block">شماره تماس:</span>
                <a
                  href={`tel:${selectedConsultation.phone}`}
                  className="font-bold text-[#0F4C3A] font-mono text-sm block"
                  dir="ltr"
                >
                  {selectedConsultation.phone}
                </a>
              </div>

              {selectedConsultation.email && (
                <div>
                  <span className="text-[#8C9B95] block">ایمیل:</span>
                  <span className="font-mono text-[#2C3B37]" dir="ltr">
                    {selectedConsultation.email}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[#8C9B95] block">نوع مشتری:</span>
                <span className="font-bold text-[#2C3B37]">
                  {selectedConsultation.customerType === 'corporate'
                    ? `سازمانی (${selectedConsultation.companyName || 'نام سازمان ثبت نشده'})`
                    : 'مشتری شخصی'}
                </span>
              </div>

              <div>
                <span className="text-[#8C9B95] block">موضوع مشاوره:</span>
                <span className="font-bold text-[#2C3B37]">
                  {getTopicLabel(selectedConsultation.topic)}
                </span>
              </div>

              <div>
                <span className="text-[#8C9B95] block">روش ارتباطی ترجیحی:</span>
                <span className="font-semibold text-[#0F4C3A]">
                  {selectedConsultation.preferredContactMethod === 'phone'
                    ? 'تماس تلفنی'
                    : selectedConsultation.preferredContactMethod === 'whatsapp'
                    ? 'پیام‌رسان واتساپ'
                    : 'جلسه آنلاین تصویری'}
                </span>
              </div>

              <div>
                <span className="text-[#8C9B95] block">بودجه تقریبی:</span>
                <span className="font-bold text-[#2C3B37]">
                  {selectedConsultation.approxBudget || 'نامشخص'}
                </span>
              </div>

              <div>
                <span className="text-[#8C9B95] block">تعداد مورد نیاز:</span>
                <span className="font-bold text-[#2C3B37]">
                  {selectedConsultation.quantityNeeded || 'نامشخص'}
                </span>
              </div>

              <div>
                <span className="text-[#8C9B95] block">مناسبت / رویداد:</span>
                <span className="font-bold text-[#2C3B37]">
                  {selectedConsultation.occasion || 'عمومی'}
                </span>
              </div>

              <div>
                <span className="text-[#8C9B95] block">زمان تحویل مدنظر:</span>
                <span className="font-bold text-[#2C3B37]">
                  {selectedConsultation.targetDate || 'نامشخص'}
                </span>
              </div>
            </div>

            {/* Description / Customer message */}
            {selectedConsultation.description && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#2C3B37]">توضیحات و نیازمندی متقاضی:</span>
                <div className="p-3.5 rounded-2xl bg-white border border-[#EAE6DF] text-xs text-[#3A4A45] leading-relaxed">
                  {selectedConsultation.description}
                </div>
              </div>
            )}

            {/* Voice Recording Player */}
            {selectedConsultation.voiceRecording && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#0F4C3A] flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-[#D4AF37]" />
                  <span>پیام صوتی ضبط‌شده توسط متقاضی مشاوره:</span>
                </span>
                <AudioPlayer
                  recording={selectedConsultation.voiceRecording}
                  title={`پیام صوتی ${selectedConsultation.fullName}`}
                />
              </div>
            )}

            {/* Status & Assignment Controls */}
            <div className="space-y-4 border-t border-[#EAE6DF] pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C3B37]">
                    تغییر وضعیت درخواست:
                  </label>
                  <select
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value as ConsultationStatus)}
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3.5 py-2 text-xs text-[#1C2826] font-bold focus:outline-none focus:border-[#0F4C3A]"
                  >
                    <option value="new">جدید (New)</option>
                    <option value="in_review">در حال بررسی (In Review)</option>
                    <option value="contacted">تماس گرفته شد (Contacted)</option>
                    <option value="completed">تکمیل شده (Completed)</option>
                    <option value="cancelled">لغو شده (Cancelled)</option>
                  </select>
                </div>

                {/* Assigned Consultant */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C3B37]">
                    مشاور مسئول پیگیری:
                  </label>
                  <input
                    type="text"
                    value={tempConsultant}
                    onChange={(e) => setTempConsultant(e.target.value)}
                    placeholder="مثال: خانم شمس یا مهندس رضایی"
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3.5 py-2 text-xs text-[#1C2826] focus:outline-none focus:border-[#0F4C3A]"
                  />
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2C3B37]">
                  یادداشت‌های داخلی و نتیجه پیگیری:
                </label>
                <textarea
                  rows={3}
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="ثبت خلاصه مکالمه، تاریخ ارسال نمونه، یا لینک پیش‌فاکتور..."
                  className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl p-3 text-xs text-[#1C2826] focus:outline-none focus:border-[#0F4C3A] leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedConsultation(null)}
                disabled={isSavingModal}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#6A7873] hover:bg-[#F4EFE6] transition cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleSaveModal}
                disabled={isSavingModal}
                className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSavingModal ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                ) : (
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                )}
                <span>{isSavingModal ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
