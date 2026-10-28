import React, { useState } from 'react';
import { Building2, Stamp, Award, CheckCircle, Send, FileText, PhoneCall, Sparkles, Loader2 } from 'lucide-react';
import { VoiceRecordingData, CorporateInquiry, CorporateSectionConfig } from '../types';
import { VoiceMessageRecorder } from './common/VoiceMessageRecorder';
import { renderLucideIcon } from './admin/homepage/IconSelector';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

interface CorporateGiftSectionProps {
  onInquirySubmitted?: (inquiry: any) => void;
  onOpenConsultation?: (initialType?: 'personal' | 'corporate') => void;
  config?: CorporateSectionConfig;
}

export const CorporateGiftSection: React.FC<CorporateGiftSectionProps> = ({
  onInquirySubmitted,
  onOpenConsultation,
  config,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('50');
  const [budgetPerBox, setBudgetPerBox] = useState('5000000');
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecordingData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (config && config.visible === false) {
    return null;
  }

  const badgeText = config?.badgeText || 'هدایای سازمانی';
  const title = config?.title || 'هدایای سازمانی و مدیریتی با لوگوی اختصاصی شما';
  const description =
    config?.description ||
    'ارائه پک‌های هدیه سازمانی برای شرکت‌ها و سازمان‌ها. امکان درج لوگو، مهر مومی اختصاصی و سفارشی‌سازی محتوای هر پک.';

  const features =
    config?.features && config.features.length > 0
      ? config.features
      : [
          {
            id: '1',
            title: 'برندینگ اختصاصی',
            description: 'امکان حک لوگو روی پلاک برنجی، مهر مومی اختصاصی و درج کارت تبریک با لوگوی سازمان.',
            iconName: 'Stamp',
          },
          {
            id: '2',
            title: 'تخفیف سفارش‌های عمده',
            description: 'تخفیف ویژه برای سفارش‌های با تیراژ بالا به همراه صدور فاکتور رسمی.',
            iconName: 'Award',
          },
          {
            id: '3',
            title: 'ارسال نمونه پیش از سفارش',
            description: 'امکان آماده‌سازی و ارسال نمونه اولیه برای بررسی قبل از ثبت نهایی سفارش.',
            iconName: 'FileText',
          },
        ];

  const discountTableTitle = config?.discountTableTitle || 'جدول تخفیف سفارش‌های سازمانی:';
  const discountTiers =
    config?.discountTiers && config.discountTiers.length > 0
      ? config.discountTiers
      : [
          { id: '1', quantityRange: 'سفارش‌های ۲۰ تا ۵۰ عدد', discountText: '۵٪ تخفیف + پلاک اختصاصی' },
          { id: '2', quantityRange: 'سفارش‌های ۵۱ تا ۱۰۰ عدد', discountText: '۱۰٪ تخفیف + مهر مومی اختصاصی' },
          { id: '3', quantityRange: 'سفارش‌های بالاتر از ۱۰۱ عدد', discountText: '۱۵٪ تخفیف + ارسال رایگان' },
        ];

  const contactTitle = config?.contactTitle || 'ارتباط با واحد هدایای سازمانی:';
  const contactPhone = config?.contactPhone || '۰۲۱-۸۸۸۸۰۰۰۰ (داخلی ۱۰۴)';
  const contactEmail = config?.contactEmail || 'corporate@yadman.ir';
  const showForm = config ? config.showForm !== false : true;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !phone.trim()) {
      toast.warning('اطلاعات ناقص', 'لطفاً نام شرکت و شماره تماس را وارد فرمایید.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyName: companyName.trim(),
      contactName: (contactName || 'مسئول خرید / روابط عمومی').trim(),
      phone: phone.trim(),
      estimatedQuantity: `${estimatedQuantity} عدد`,
      budgetPerBox: `${(Number(budgetPerBox) / 1000000).toLocaleString('fa-IR')} میلیون تومان`,
      notes: 'درخواست ثبت شده از فرم استعلام وب‌سایت',
      voiceRecording: voiceRecording || undefined,
    };

    try {
      const response = await api.inquiries.submitCorporate(payload);
      const createdInquiry: CorporateInquiry = {
        id: response?.id || `CORP-${Date.now().toString().slice(-4)}`,
        companyName: payload.companyName,
        contactName: payload.contactName,
        phone: payload.phone,
        estimatedQuantity: payload.estimatedQuantity,
        budgetPerBox: payload.budgetPerBox,
        notes: payload.notes,
        voiceRecording: payload.voiceRecording,
        status: (response?.status as any) || 'new',
        createdAt: response?.createdAt || new Date().toISOString(),
        createdAtFa: response?.createdAtFa || 'هم‌اکنون',
      };

      if (onInquirySubmitted) {
        onInquirySubmitted(createdInquiry);
      }

      setSubmitted(true);
      toast.success('درخواست استعلام سازمانی با موفقیت ثبت شد', 'کارشناسان یادمان به زودی با شما تماس خواهند گرفت.');
    } catch (err: any) {
      console.error('Corporate inquiry submission error:', err);
      toast.error('ثبت درخواست ناموفق بود', err?.message || 'خطایی در ثبت استعلام رخ داد. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8 border-t border-[#EAE6DF]" id="corporate-section">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          {badgeText && (
            <div className="inline-flex items-center gap-2 bg-[#0F4C3A]/10 text-[#0F4C3A] px-4 py-1.5 rounded-full text-xs font-bold">
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
              <span>{badgeText}</span>
            </div>
          )}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F4C3A]">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#3A4A45] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat) => (
            <div
              key={feat.id}
              className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs text-right space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0F4C3A]/10 flex items-center justify-center text-[#0F4C3A]">
                {renderLucideIcon(feat.iconName, 'w-6 h-6 text-[#0F4C3A]')}
              </div>
              <h3 className="font-extrabold text-base text-[#0F4C3A]">{feat.title}</h3>
              <p className="text-xs text-[#4A5A55] leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>

        {/* Volume Discount Table & Form Section */}
        <div className={`grid grid-cols-1 ${showForm ? 'lg:grid-cols-12' : ''} gap-8 bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#D4AF37]/30 shadow-xl`}>
          
          {/* Table & Corporate Info */}
          <div className={`${showForm ? 'lg:col-span-5' : 'max-w-2xl mx-auto w-full'} space-y-6 text-right`}>
            <h3 className="font-bold text-lg text-[#0F4C3A] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              <span>{discountTableTitle}</span>
            </h3>

            <div className="space-y-3 text-xs">
              {discountTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex justify-between items-center p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF]"
                >
                  <span className="font-semibold text-[#1C2826]">{tier.quantityRange}</span>
                  <span className="font-bold text-[#0F4C3A]">{tier.discountText}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#0F4C3A]/5 rounded-2xl border border-[#0F4C3A]/20 text-xs text-[#0F4C3A] space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
                <span>{contactTitle}</span>
              </div>
              <p className="text-[#3A4A45] leading-relaxed">
                تلفن: {contactPhone}
                <br />
                ایمیل: {contactEmail}
              </p>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="lg:col-span-7 bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE6DF] text-right">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle className="w-16 h-16 text-[#0F4C3A] mx-auto animate-bounce" />
                  <h3 className="text-xl font-bold text-[#0F4C3A]">درخواست شما با موفقیت ثبت شد</h3>
                  <p className="text-xs text-[#3A4A45] max-w-md mx-auto">
                    همکاران ما در واحد هدایای سازمانی به زودی برای هماهنگی و ارسال کاتالوگ با شما تماس خواهند گرفت.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-[#0F4C3A] font-bold underline cursor-pointer"
                  >
                    ارسال درخواست جدید
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-bold text-base text-[#0F4C3A] mb-4">
                    فرم استعلام قیمت و مشاوره سازمانی
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                        نام سازمان / شرکت:
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="مثال: هولدینگ بین‌المللی پارس"
                        className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                        نام و نام خانوادگی رابط:
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="مثال: مهندس محمودی"
                        className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                        شماره تماس همراه / ثابت:
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="۰۹۱۲..."
                        className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                        تعداد تقریبی باکس مورد نیاز:
                      </label>
                      <select
                        value={estimatedQuantity}
                        onChange={(e) => setEstimatedQuantity(e.target.value)}
                        className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                      >
                        <option value="20">۲۰ تا ۵۰ عدد</option>
                        <option value="50">۵۰ تا ۱۰۰ عدد</option>
                        <option value="100">۱۰۰ تا ۵۰۰ عدد</option>
                        <option value="500">بیشتر از ۵۰۰ عدد</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
                      بودجه مد نظر برای هر باکس (تومان):
                    </label>
                    <select
                      value={budgetPerBox}
                      onChange={(e) => setBudgetPerBox(e.target.value)}
                      className="w-full bg-white text-xs p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                    >
                      <option value="3000000">۳ تا ۵ میلیون تومان</option>
                      <option value="5000000">۵ تا ۸ میلیون تومان</option>
                      <option value="8000000">۸ تا ۱۵ میلیون تومان</option>
                      <option value="15000000">بالاتر از ۱۵ میلیون تومان (VIP)</option>
                    </select>
                  </div>

                  {/* Voice Message Recorder */}
                  <VoiceMessageRecorder
                    voiceRecording={voiceRecording}
                    onRecordingComplete={(rec) => setVoiceRecording(rec)}
                    onRecordingDeleted={() => setVoiceRecording(null)}
                    label="ضبط توضیحات یا نیازمندی‌های صوتی (اختیاری)"
                    helperText="می‌توانید جزئیات سفارش سازمانی خود را به صورت پیام صوتی ارسال کنید."
                    compact={true}
                  />

                  <button
                    type="submit"
                    id="corporate-submit-btn"
                    disabled={isSubmitting}
                    className="w-full bg-[#0F4C3A] hover:bg-[#0B3C2E] disabled:opacity-60 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                        <span>در حال ثبت درخواست...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#D4AF37]" />
                        <span>ثبت درخواست مشاوره</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
