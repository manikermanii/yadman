import React, { useState } from 'react';
import {
  Headphones,
  Building2,
  User,
  Sparkles,
  CheckCircle,
  PhoneCall,
  MessageCircle,
  Video,
  Send,
  Clock,
  Gift,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowLeft,
  DollarSign,
  HelpCircle,
  Check,
  Loader2,
} from 'lucide-react';
import {
  ConsultationRequest,
  ConsultationCustomerType,
  ConsultationTopic,
  StoreSettings,
  VoiceRecordingData,
} from '../types';
import { toPersianDigits } from '../utils/formatters';
import { VoiceMessageRecorder } from './common/VoiceMessageRecorder';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

interface ConsultationPageProps {
  initialCustomerType?: ConsultationCustomerType;
  storeSettings: StoreSettings;
  onConsultationSubmitted: (request: ConsultationRequest) => void;
  onExploreCatalog?: () => void;
}

export const ConsultationPage: React.FC<ConsultationPageProps> = ({
  initialCustomerType = 'personal',
  storeSettings,
  onConsultationSubmitted,
  onExploreCatalog,
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customerType, setCustomerType] = useState<ConsultationCustomerType>(initialCustomerType);
  const [companyName, setCompanyName] = useState('');
  const [topic, setTopic] = useState<ConsultationTopic>('box_selection');
  const [approxBudget, setApproxBudget] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');
  const [occasion, setOccasion] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecordingData | null>(null);
  const [preferredContactMethod, setPreferredContactMethod] = useState<'phone' | 'whatsapp' | 'online'>('phone');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<ConsultationRequest | null>(null);

  // Topics definitions
  const topicOptions: { id: ConsultationTopic; label: string; desc: string }[] = [
    { id: 'box_selection', label: 'انتخاب پک هدیه', desc: 'پیشنهاد متناسب با سلیقه و مناسبت' },
    { id: 'corporate_gift', label: 'هدیه سازمانی', desc: 'پک‌های مدیریتی، پرسنلی و رویدادها' },
    { id: 'custom_box', label: 'پک اختصاصی', desc: 'ترکیب آزاد اقلام، هاردباکس و بسته‌بندی' },
    { id: 'bulk_order', label: 'سفارش تعداد بالا', desc: 'تخفیف‌های پلکانی و تولید با تیراژ' },
    { id: 'customization', label: 'شخصی‌سازی', desc: 'چاپ لوگو، مهر مومی و کارت تبریک اختصاصی' },
    { id: 'other', label: 'سایر موضوعات', desc: 'مشاوره عمومی و سوالات خاص' },
  ];

  // Quick budget suggestions
  const budgetSuggestions = [
    'کمتر از ۲ میلیون تومان',
    '۲ تا ۴ میلیون تومان',
    '۴ تا ۷ میلیون تومان',
    '۷ تا ۱۰ میلیون تومان',
    'بیش از ۱۰ میلیون تومان',
    'طبق بودجه مصوب سازمان',
  ];

  // Occasions suggestions
  const occasionSuggestions = [
    'نوروز و سال نو',
    'شب یلدا',
    'روز پزشک / مهندس / معلم',
    'سالگرد تاسیس یا تولد',
    'تقدیر از مدیران و پرسنل',
    'رویداد، همایش یا سمینار',
    'هدیه شخصی یا خانوادگی',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.warning('اطلاعات ناقص', 'لطفاً نام و نام خانوادگی و شماره تماس را وارد فرمایید.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      customerType,
      companyName: customerType === 'corporate' ? companyName.trim() : undefined,
      topic,
      approxBudget: approxBudget.trim() || undefined,
      quantityNeeded: quantityNeeded.trim() || undefined,
      occasion: occasion.trim() || undefined,
      targetDate: targetDate.trim() || undefined,
      description: description.trim() || undefined,
      voiceRecording: voiceRecording || undefined,
      preferredContactMethod,
    };

    try {
      const response = await api.inquiries.submitConsultation(payload);
      const createdRequest: ConsultationRequest = {
        id: response?.id || `CNS-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        customerType: payload.customerType,
        companyName: payload.companyName,
        topic: payload.topic,
        approxBudget: payload.approxBudget,
        quantityNeeded: payload.quantityNeeded,
        occasion: payload.occasion,
        targetDate: payload.targetDate,
        description: payload.description,
        voiceRecording: payload.voiceRecording,
        preferredContactMethod: payload.preferredContactMethod,
        status: (response?.status as any) || 'new',
        createdAt: response?.createdAt || new Date().toISOString(),
        createdAtFa: response?.createdAtFa || 'هم‌اکنون',
      };

      onConsultationSubmitted(createdRequest);
      setSubmittedRequest(createdRequest);
      toast.success('درخواست مشاوره با موفقیت ثبت شد', 'مشاوران یادمان به زودی با شما تماس خواهند گرفت.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Consultation submission error:', err);
      toast.error('ثبت درخواست مشاوره ناموفق بود', err?.message || 'خطایی در ثبت درخواست مشاوره رخ داد. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedRequest(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setCompanyName('');
    setApproxBudget('');
    setQuantityNeeded('');
    setOccasion('');
    setTargetDate('');
    setDescription('');
    setVoiceRecording(null);
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1C2826] min-h-screen pb-16 text-right" dir="rtl">
      
      {/* Hero Header Section */}
      <section className="bg-gradient-to-b from-[#F4EFE6] to-[#FAF8F5] border-b border-[#EAE6DF] pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#0F4C3A]/10 text-[#0F4C3A] px-4 py-1.5 rounded-full text-xs font-bold">
            <Headphones className="w-4 h-4 text-[#D4AF37]" />
            <span>مشاوره تخصصی و طراحی هدیه</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F4C3A] tracking-tight">
            مشاوره انتخاب هدیه
          </h1>

          <p className="text-sm sm:text-base text-[#4A5A55] max-w-2xl mx-auto leading-relaxed">
            کارشناسان هدیه در تمام مراحل همراه شما هستند؛ از انتخاب پک متناسب با بودجه تا طراحی هویت بصری، هاردباکس سفارشی و تحویل به‌موقع.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        
        {/* Areas of Guidance (Explaining the 7 key pillars requested) */}
        <section className="space-y-6">
          <div className="text-center sm:text-right">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F4C3A]">
              زمینه‌های مشاوره و خدمات تخصصی ما
            </h2>
            <p className="text-xs text-[#6A7873] mt-1">
              شما می‌توانید در هر یک از موضوعات زیر از راهنمایی رایگان متخصصان هدیه بهره‌مند شوید:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs flex items-start gap-3.5 hover:border-[#0F4C3A]/30 transition">
              <div className="w-10 h-10 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-[#0F4C3A]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#0F4C3A]">انتخاب پک مناسب</h3>
                <p className="text-xs text-[#5C6B66] leading-relaxed">
                  پیشنهاد بهترین ترکیب محصولات بر اساس سن، جنسیت و سلیقه دریافت‌کننده هدیه.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs flex items-start gap-3.5 hover:border-[#0F4C3A]/30 transition">
              <div className="w-10 h-10 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#0F4C3A]">انتخاب هدیه بر اساس بودجه</h3>
                <p className="text-xs text-[#5C6B66] leading-relaxed">
                  بهینه‌سازی هزینه‌ها و دستیابی به باکیفیت‌ترین بسته‌بندی در چارچوب بودجه شما.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs flex items-start gap-3.5 hover:border-[#0F4C3A]/30 transition">
              <div className="w-10 h-10 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-[#0F4C3A]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#0F4C3A]">سفارش‌های تعداد بالا</h3>
                <p className="text-xs text-[#5C6B66] leading-relaxed">
                  برنامه‌ریزی تیراژ، تخفیف‌های پلکانی و زمان‌بندی دقیق تولید و ارسال.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs flex items-start gap-3.5 hover:border-[#0F4C3A]/30 transition">
              <div className="w-10 h-10 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#0F4C3A]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#0F4C3A]">هدایای سازمانی و مدیریتی</h3>
                <p className="text-xs text-[#5C6B66] leading-relaxed">
                  مشاوره ویژه ولکام پک، سالگردها، هدایای اعضای هیئت مدیره و پرسنل.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs flex items-start gap-3.5 hover:border-[#0F4C3A]/30 transition">
              <div className="w-10 h-10 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#0F4C3A]">شخصی‌سازی پک</h3>
                <p className="text-xs text-[#5C6B66] leading-relaxed">
                  حک نام یا لوگو، انتخاب رنگ اختصاصی روبان، طراحی مهر مومی و خطاطی کارت.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs flex items-start gap-3.5 hover:border-[#0F4C3A]/30 transition">
              <div className="w-10 h-10 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#0F4C3A]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#0F4C3A]">مناسبت‌های مختلف و پک اختصاصی</h3>
                <p className="text-xs text-[#5C6B66] leading-relaxed">
                  طراحی پکیج‌های فصلی نوروز و یلدا و چیدمان دستی محتویات از صفر تا صد.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Consultation Form or Success View */}
        {submittedRequest ? (
          <div className="bg-white rounded-3xl border border-[#EAE6DF] p-8 sm:p-12 shadow-sm text-center space-y-6 max-w-2xl mx-auto animate-fadeIn">
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0F4C3A] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-10 h-10 text-[#0F4C3A]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-[#0F4C3A]">
                درخواست شما با موفقیت ثبت شد.
              </h3>
              <p className="text-sm text-[#4A5A55] leading-relaxed">
                کارشناس اختصاصی هدیه، اطلاعات شما را بررسی کرده و در کوتاه‌ترین زمان ممکن از طریق روش انتخابی با شما تماس خواهد گرفت.
              </p>
            </div>

            {/* Reference Tracking Box */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] inline-block w-full text-center space-y-1">
              <span className="text-xs text-[#6A7873] block">کد پیگیری درخواست مشاوره:</span>
              <span className="text-lg font-mono font-bold text-[#0F4C3A] tracking-wider">
                {submittedRequest.id}
              </span>
            </div>

            {/* Alternative Direct Contact Methods (Placeholder based) */}
            <div className="border-t border-[#EAE6DF] pt-6 space-y-4 text-right">
              <h4 className="text-xs font-bold text-[#0F4C3A]">
                روش‌های ارتباط سریع با مشاوران:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href={`tel:${storeSettings.supportPhone}`}
                  className="bg-[#F4EFE6] hover:bg-[#EAE6DF] p-3 rounded-xl flex items-center gap-2.5 transition text-xs text-[#1C2826] font-medium"
                >
                  <PhoneCall className="w-4 h-4 text-[#0F4C3A]" />
                  <div>
                    <span className="block font-bold">تماس تلفنی</span>
                    <span className="text-[10px] text-[#6A7873]">{storeSettings.supportPhone}</span>
                  </div>
                </a>

                <div className="bg-[#F4EFE6] p-3 rounded-xl flex items-center gap-2.5 text-xs text-[#1C2826] font-medium opacity-90">
                  <MessageCircle className="w-4 h-4 text-[#0F4C3A]" />
                  <div>
                    <span className="block font-bold">واتساپ سازمانی</span>
                    <span className="text-[10px] text-[#6A7873]">پشتیبانی آنلاین</span>
                  </div>
                </div>

                <div className="bg-[#F4EFE6] p-3 rounded-xl flex items-center gap-2.5 text-xs text-[#1C2826] font-medium opacity-90">
                  <Video className="w-4 h-4 text-[#0F4C3A]" />
                  <div>
                    <span className="block font-bold">مشاوره آنلاین</span>
                    <span className="text-[10px] text-[#6A7873]">جلسه تصویری اختصاصی</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={handleResetForm}
                className="bg-[#0F4C3A] text-white hover:bg-[#0B3C2E] font-bold px-6 py-2.5 rounded-full text-xs transition"
              >
                ثبت درخواست جدید
              </button>

              {onExploreCatalog && (
                <button
                  onClick={onExploreCatalog}
                  className="bg-[#F4EFE6] text-[#0F4C3A] hover:bg-[#EAE6DF] font-bold px-6 py-2.5 rounded-full text-xs transition"
                >
                  مشاهده کاتالوگ پک‌ها
                </button>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-md p-6 sm:p-10 max-w-4xl mx-auto">
            
            <div className="border-b border-[#EAE6DF] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0F4C3A]">
                  فرم درخواست مشاوره هدیه
                </h3>
                <p className="text-xs text-[#6A7873] mt-1">
                  لطفاً اطلاعات زیر را تکمیل نمایید تا کارشناس متخصص موضوع شما پیگیری کند.
                </p>
              </div>

              {/* Customer Type Toggle */}
              <div className="inline-flex bg-[#F4EFE6] p-1 rounded-2xl border border-[#EAE6DF]">
                <button
                  type="button"
                  onClick={() => setCustomerType('personal')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    customerType === 'personal'
                      ? 'bg-[#0F4C3A] text-white shadow-xs'
                      : 'text-[#4A5A55] hover:text-[#0F4C3A]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>مشتری شخصی</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerType('corporate')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    customerType === 'corporate'
                      ? 'bg-[#0F4C3A] text-white shadow-xs'
                      : 'text-[#4A5A55] hover:text-[#0F4C3A]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>شرکت / سازمان</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Name, Phone, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C3B37]">
                    نام و نام خانوادگی <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: دکتر علیرضا رستمی"
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3.5 py-2.5 text-xs text-[#1C2826] focus:outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A]"
                    id="consultation-name-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C3B37]">
                    شماره تماس <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3.5 py-2.5 text-xs text-[#1C2826] text-right focus:outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A]"
                    id="consultation-phone-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C3B37]">
                    ایمیل <span className="text-[#8C9B95] font-normal">(اختیاری)</span>
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@example.com"
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3.5 py-2.5 text-xs text-[#1C2826] text-right focus:outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A]"
                  />
                </div>

              </div>

              {/* Conditional Corporate Field */}
              {customerType === 'corporate' && (
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-bold text-[#0F4C3A]">
                    نام سازمان، شرکت یا برند <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required={customerType === 'corporate'}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: شرکت صنایع فولاد / هلدینگ فناوری..."
                    className="w-full bg-white border border-[#E0D8C8] rounded-xl px-3.5 py-2.5 text-xs text-[#1C2826] focus:outline-none focus:border-[#0F4C3A]"
                  />
                </div>
              )}

              {/* Topic Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2C3B37]">
                  موضوع مشاوره <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {topicOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTopic(opt.id)}
                      className={`p-3 rounded-2xl text-right border transition ${
                        topic === opt.id
                          ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] text-[#0F4C3A] font-bold shadow-xs'
                          : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#4A5A55] hover:border-[#0F4C3A]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{opt.label}</span>
                        {topic === opt.id && <Check className="w-3.5 h-3.5 text-[#0F4C3A]" />}
                      </div>
                      <span className="text-[10px] text-[#6A7873] block mt-0.5 font-normal">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C3B37]">
                    بودجه تقریبی (برای هر پک یا مجموع)
                  </label>
                  <input
                    type="text"
                    value={approxBudget}
                    onChange={(e) => setApproxBudget(e.target.value)}
                    placeholder="مثال: ۳ تا ۵ میلیون تومان برای هر پک"
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3.5 py-2.5 text-xs text-[#1C2826] focus:outline-none focus:border-[#0F4C3A]"
                  />
                  {/* Quick pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {budgetSuggestions.slice(0, 3).map((bg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setApproxBudget(bg)}
                        className="text-[10px] bg-[#F4EFE6] text-[#4A5A55] hover:text-[#0F4C3A] px-2 py-0.5 rounded-md transition"
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C3B37]">
                    تعداد مورد نیاز
                  </label>
                  <input
                    type="text"
                    value={quantityNeeded}
                    onChange={(e) => setQuantityNeeded(e.target.value)}
                    placeholder="مثال: ۱ عدد، ۲۰ عدد، یا ۱۰۰ عدد"
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3.5 py-2.5 text-xs text-[#1C2826] focus:outline-none focus:border-[#0F4C3A]"
                  />
                  {/* Quick pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['۱ عدد (شخصی)', '۱۰ تا ۳۰ عدد', '۵۰ تا ۱۰۰ عدد', '۱۰۰ عدد به بالا'].map((qty, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setQuantityNeeded(qty)}
                        className="text-[10px] bg-[#F4EFE6] text-[#4A5A55] hover:text-[#0F4C3A] px-2 py-0.5 rounded-md transition"
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Occasion & Target Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C3B37]">
                    مناسبت یا هدف هدیه
                  </label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="مثال: هدیه سال نو، روز پزشک، قدردانی از همکاران"
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3.5 py-2.5 text-xs text-[#1C2826] focus:outline-none focus:border-[#0F4C3A]"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {occasionSuggestions.slice(0, 3).map((occ, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setOccasion(occ)}
                        className="text-[10px] bg-[#F4EFE6] text-[#4A5A55] hover:text-[#0F4C3A] px-2 py-0.5 rounded-md transition"
                      >
                        {occ}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C3B37]">
                    زمان مورد نیاز (تاریخ تحویل مطلوب)
                  </label>
                  <input
                    type="text"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    placeholder="مثال: تا ۱۰ روز آینده یا پایان ماه"
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl px-3.5 py-2.5 text-xs text-[#1C2826] focus:outline-none focus:border-[#0F4C3A]"
                  />
                </div>

              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2C3B37]">
                  توضیحات تکمیلی، نیازمندی‌ها یا سلیقه خاص
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اگر ترجیح خاصی برای اقلام (زعفران، صنایع دستی، دمنوش، شکلات، پلاک لوگو یا رنگ روبان) دارید بنویسید..."
                  className="w-full bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl p-3.5 text-xs text-[#1C2826] focus:outline-none focus:border-[#0F4C3A] leading-relaxed resize-none"
                />
              </div>

              {/* Voice Message Recorder for Consultation */}
              <VoiceMessageRecorder
                voiceRecording={voiceRecording}
                onRecordingComplete={(rec) => setVoiceRecording(rec)}
                onRecordingDeleted={() => setVoiceRecording(null)}
                label="ضبط پیام یا توضیحات صوتی برای مشاور یادمان"
                helperText="اگر ترجیح می‌دهید به جای نوشتن، نیازمندی‌ها و توضیحات هدیه خود را بیان کنید، صدای خود را ضبط فرمایید."
              />

              {/* Preferred Contact Method */}
              <div className="space-y-2 pt-2 border-t border-[#EAE6DF]">
                <label className="block text-xs font-bold text-[#2C3B37]">
                  روش ارتباطی ترجیحی شما:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  
                  <button
                    type="button"
                    onClick={() => setPreferredContactMethod('phone')}
                    className={`p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition border ${
                      preferredContactMethod === 'phone'
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                        : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#4A5A55] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>تماس تلفنی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredContactMethod('whatsapp')}
                    className={`p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition border ${
                      preferredContactMethod === 'whatsapp'
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                        : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#4A5A55] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساپ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredContactMethod('online')}
                    className={`p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition border ${
                      preferredContactMethod === 'online'
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                        : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#4A5A55] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>مشاوره آنلاین</span>
                  </button>

                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="consultation-form-submit-btn"
                  className="w-full bg-[#0F4C3A] hover:bg-[#0B3C2E] disabled:opacity-60 text-white font-extrabold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition shadow-md active:scale-99 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                      <span>در حال ثبت اطلاعات در پایگاه‌داده...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#D4AF37]" />
                      <span>ثبت درخواست مشاوره تخصصی</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        )}

      </div>
    </div>
  );
};
