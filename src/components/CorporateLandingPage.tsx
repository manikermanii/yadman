import React, { useState } from 'react';
import {
  Building2,
  Stamp,
  Award,
  CheckCircle,
  Send,
  FileText,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  Package,
  Layers,
  UploadCloud,
  ChevronLeft,
  Briefcase,
  Users,
  Clock,
  Download,
  Loader2,
} from 'lucide-react';
import { toPersianDigits, formatToman } from '../utils/formatters';
import { CorporateInquiry, VoiceRecordingData } from '../types';
import { VoiceMessageRecorder } from './common/VoiceMessageRecorder';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';
import corporateHeroBoxImg from '../assets/images/product_tech.jpg';

interface CorporateLandingPageProps {
  onInquirySubmitted?: (inquiry: CorporateInquiry) => void;
  onExploreCatalog?: () => void;
  onOpenConsultation?: (initialType?: 'personal' | 'corporate') => void;
}

export const CorporateLandingPage: React.FC<CorporateLandingPageProps> = ({
  onInquirySubmitted,
  onExploreCatalog,
  onOpenConsultation,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('50');
  const [budgetPerBox, setBudgetPerBox] = useState('6500000');
  const [occasion, setOccasion] = useState('نوروز و سال نو');
  const [deliveryDate, setDeliveryDate] = useState('۱۴۰۳/۱۲/۱۵');
  const [notes, setNotes] = useState('');
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecordingData | null>(null);
  const [customizationTypes, setCustomizationTypes] = useState<string[]>([
    'چاپ لوگو روی هاردباکس',
    'پلاک برنجی با نام سازمان',
    'کارت تبریک اختصاصی با امضا',
  ]);
  const [uploadedLogoName, setUploadedLogoName] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const availableCustomizations = [
    'چاپ لوگو روی هاردباکس',
    'پلاک برنجی با نام سازمان',
    'روبان با رنگ سازمانی شما',
    'مهر مومی با لوگوی اختصاصی',
    'کارت تبریک اختصاصی با امضا',
    'درج کتابچه یا اقلام تبلیغاتی شرکت',
  ];

  const toggleCustomization = (type: string) => {
    if (customizationTypes.includes(type)) {
      setCustomizationTypes(customizationTypes.filter((t) => t !== type));
    } else {
      setCustomizationTypes([...customizationTypes, type]);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedLogoName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      email: email.trim() || undefined,
      estimatedQuantity: `${toPersianDigits(estimatedQuantity)} عدد`,
      budgetPerBox: `${(Number(budgetPerBox) / 1000000).toLocaleString('fa-IR')} میلیون تومان`,
      occasion,
      deliveryDate,
      customizationTypes,
      notes: notes.trim() || 'درخواست ثبت شده از صفحه اختصاصی هدایای سازمانی',
      voiceRecording: voiceRecording || undefined,
    };

    try {
      const response = await api.inquiries.submitCorporate(payload);
      const createdInquiry: CorporateInquiry = {
        id: response?.id || `CORP-${Date.now().toString().slice(-4)}`,
        companyName: payload.companyName,
        contactName: payload.contactName,
        phone: payload.phone,
        email: payload.email,
        estimatedQuantity: payload.estimatedQuantity,
        budgetPerBox: payload.budgetPerBox,
        occasion: payload.occasion,
        deliveryDate: payload.deliveryDate,
        customizationTypes: payload.customizationTypes,
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
      toast.error('ثبت درخواست ناموفق بود', err?.message || 'خطایی در ارتباط با سرور رخ داده است. لطفاً مجدداً تلاش فرمایید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1C2826] min-h-screen pb-16 space-y-16" dir="rtl">
      
      {/* 1. Dedicated B2B Hero Section */}
      <section className="relative overflow-hidden bg-[#0F4C3A] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#17634D]/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-1.5 rounded-full text-xs font-bold border border-[#D4AF37]/30">
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
              <span>راهکارهای جامع هدایای سازمانی و رویدادهای تجاری</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#FAF8F5] leading-tight">
              هدایای سازمانی،
              <span className="block text-[#D4AF37] mt-2">متناسب با هویت و پرستیژ برند شما</span>
            </h1>

            <p className="text-sm sm:text-base text-[#D0E2DB] leading-relaxed max-w-2xl">
              از انتخاب محصولات نفیس و صنایع دستی اصیل تا بسته‌بندی هاردباکس، پلاک فلزی طلایی و روبان با رنگ سازمانی. پک ویژه سازمان خود را متناسب با بودجه، تیراژ و زمان‌بندی مورد نیاز خلق کنید.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('corporate-form');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-[#D4AF37] hover:bg-[#C29F2F] text-[#0F4C3A] font-extrabold px-6 py-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition shadow-lg active:scale-98 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>استعلام سریع قیمت و پیش‌فاکتور</span>
              </button>

              {onOpenConsultation && (
                <button
                  type="button"
                  onClick={() => onOpenConsultation('corporate')}
                  className="bg-[#17634D] hover:bg-[#1C735A] text-white border border-[#D4AF37]/50 font-bold px-6 py-3.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
                  <span>درخواست مشاوره سازمانی</span>
                </button>
              )}

              {onExploreCatalog && (
                <button
                  onClick={onExploreCatalog}
                  className="bg-transparent hover:bg-white/10 text-white font-bold px-6 py-3.5 rounded-xl text-xs sm:text-sm border border-white/30 transition flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-[#D4AF37]" />
                  <span>مشاهده نمونه پک‌ها</span>
                </button>
              )}
            </div>

            {/* Micro Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#1B5E4A] text-xs text-[#D0E2DB]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <span>صدور فاکتور رسمی با شناسه ملی</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <span>ارسال نمونه فیزیکی پیش از تولید</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <span>تخفیف‌های پلکانی تیراژ بالا</span>
              </div>
            </div>
          </div>

          {/* Right Visual / Luxury Box Mockup Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#D4AF37]/40 shadow-2xl bg-[#0B3C2E] p-3 group">
              <img
                src={corporateHeroBoxImg}
                alt="پک سازمانی لوکس هدیه"
                className="w-full h-96 object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay Badge */}
              <div className="absolute top-6 right-6 bg-[#0F4C3A]/90 backdrop-blur-md text-[#FAF8F5] p-3 rounded-2xl border border-[#D4AF37]/50 shadow-lg text-right text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[#D4AF37] font-extrabold">
                  <Sparkles className="w-4 h-4" />
                  <span>سفارشی‌سازی کامل برندینگ</span>
                </div>
                <p className="text-[11px] text-[#D0E2DB]">پلاک طلاکوب + مهر مومی اسلیمی</p>
              </div>

              {/* Logo simulation bubble */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl text-right text-xs space-y-2 border border-[#EAE6DF]">
                <div className="flex items-center justify-between text-[#0F4C3A] font-bold">
                  <span>شبیه‌ساز برندینگ سازمانی شما:</span>
                  <span className="text-[10px] bg-[#0F4C3A]/10 text-[#0F4C3A] px-2 py-0.5 rounded-full">
                    پیش‌نمایش زنده
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="لوگوی شرکت"
                      className="w-10 h-10 object-contain rounded-lg border border-[#EAE6DF] bg-white p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold font-calligraphy text-lg">
                      لوگو
                    </div>
                  )}
                  <div>
                    <span className="font-extrabold text-[#0F4C3A] block">
                      {companyName || 'نام سازمان شما'}
                    </span>
                    <span className="text-[10px] text-[#6A7873]">
                      حک لیزری روی پلاک برنجی ۲۴ عیار
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Corporate Process - 4 Seamless Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-right">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
            مراحل همکاری و تولید اختصاصی
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F4C3A]">
            سفارش سازمانی شما چگونه آماده می‌شود؟
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3 relative group hover:border-[#D4AF37]/60 transition">
            <div className="w-12 h-12 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold text-lg">
              ۱
            </div>
            <h3 className="font-bold text-sm text-[#0F4C3A]">مشاوره و استعلام نیاز</h3>
            <p className="text-xs text-[#6A7873] leading-relaxed">
              ثبت مشخصات، تعداد تقریبی، مناسبت و بودجه مدنظر سازمان شما در فرم هوشمند.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3 relative group hover:border-[#D4AF37]/60 transition">
            <div className="w-12 h-12 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold text-lg">
              ۲
            </div>
            <h3 className="font-bold text-sm text-[#0F4C3A]">طراحی و ارسال نمونه اولیه</h3>
            <p className="text-xs text-[#6A7873] leading-relaxed">
              ارائه پیش‌فاکتور رسمی و ارسال نمونه فیزیکی باکس با پلاک لوگوی شرکت شما برای تایید.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3 relative group hover:border-[#D4AF37]/60 transition">
            <div className="w-12 h-12 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold text-lg">
              ۳
            </div>
            <h3 className="font-bold text-sm text-[#0F4C3A]">تولید و کنترل کیفیت دقیق</h3>
            <p className="text-xs text-[#6A7873] leading-relaxed">
              چیدمان اصولی، پلمپ با مهر مومی دست‌ساز و الصاق کارت‌های تبریک اختصاصی.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3 relative group hover:border-[#D4AF37]/60 transition">
            <div className="w-12 h-12 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold text-lg">
              ۴
            </div>
            <h3 className="font-bold text-sm text-[#0F4C3A]">ارسال در زمان مشخص سراسر کشور</h3>
            <p className="text-xs text-[#6A7873] leading-relaxed">
              تحویل ایمن به نشانی مرکزی شرکت یا ارسال مستقیم به آدرس کارمندان و مشتریان VIP شما.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Tiered Volume Discount Structure */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-3xl border-2 border-[#D4AF37]/30 shadow-md text-right space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-[#0F4C3A] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <span>جدول تخفیف‌های پلکانی و مزایای سازمانی</span>
              </h3>
              <p className="text-xs text-[#6A7873] mt-1">
                تخفیف‌های ویژه بر روی کل فاکتور برای سازمان‌ها و شرکت‌های معتبر
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#0F4C3A] bg-[#0F4C3A]/5 px-3 py-1.5 rounded-xl">
              <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
              <span>پشتیبانی فروش مستقیم: ۰۲۱-۸۸۸۸۰۰۰۰</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#EAE6DF] space-y-2">
              <span className="text-xs text-[#8C8375]">تیراژ ۲۰ الی ۵۰ عدد</span>
              <p className="text-lg font-extrabold text-[#0F4C3A]">۵٪ تخفیف کل</p>
              <ul className="text-xs text-[#3A4A45] space-y-1 pt-2 border-t border-[#EAE6DF]">
                <li>• طراحی رایگان کارت تبریک</li>
                <li>• پلاک فلزی طلایی نام سازمان</li>
              </ul>
            </div>

            <div className="p-5 bg-[#0F4C3A]/5 rounded-2xl border border-[#0F4C3A]/20 space-y-2 relative">
              <span className="absolute top-3 left-3 bg-[#D4AF37] text-[#0F4C3A] text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                پیشنهاد ویژه
              </span>
              <span className="text-xs text-[#0F4C3A] font-bold">تیراژ ۵۱ الی ۱۰۰ عدد</span>
              <p className="text-lg font-extrabold text-[#0F4C3A]">۱۰٪ تخفیف کل</p>
              <ul className="text-xs text-[#3A4A45] space-y-1 pt-2 border-t border-[#0F4C3A]/20">
                <li>• ساخت قالب مهر مومی با لوگو</li>
                <li>• روبان ساتن با رنگ کد سازمانی</li>
                <li>• ارسال رایگان در شهر تهران</li>
              </ul>
            </div>

            <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#D4AF37]/40 space-y-2">
              <span className="text-xs text-[#8C8375]">تیراژ بالاتر از ۱۰۱ عدد</span>
              <p className="text-lg font-extrabold text-[#0F4C3A]">۱۵٪ تخفیف کل</p>
              <ul className="text-xs text-[#3A4A45] space-y-1 pt-2 border-t border-[#EAE6DF]">
                <li>• تولید سفارشی هاردباکس با ابعاد دلخواه</li>
                <li>• ارسال اختصاصی به درب منازل مدیران</li>
                <li>• نمونه فیزیکی رایگان پیش از عقد قرارداد</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Complete B2B Inquiry Form */}
      <section id="corporate-form" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-[#0F4C3A]/20 shadow-xl text-right space-y-6">
          <div className="border-b border-[#EAE6DF] pb-4">
            <span className="text-xs font-bold text-[#D4AF37]">درخواست رسمی پیش‌فاکتور</span>
            <h2 className="text-2xl font-extrabold text-[#0F4C3A] mt-1">
              فرم استعلام قیمت و مشاوره تخصصی هدایای سازمانی
            </h2>
            <p className="text-xs text-[#6A7873] mt-1">
              لطفاً اطلاعات زیر را تکمیل فرمایید تا کارشناس ارشد فروش سازمانی ظرف حداکثر ۲ ساعت با شما تماس حاصل نمایند.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-2xl font-extrabold text-[#0F4C3A]">درخواست سازمانی شما با موفقیت ثبت شد</h3>
              <p className="text-xs text-[#4A5A55] max-w-md mx-auto leading-relaxed">
                همکاران ما در واحد هدایای سازمانی برند هدیه در سریع‌ترین زمان ممکن جهت هماهنگی و ارسال کاتالوگ با شما تماس خواهند گرفت.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-[#0F4C3A] font-bold underline mt-4"
              >
                ثبت استعلام جدید برای بخش یا رویداد دیگر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Row 1: Company & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    نام سازمان / شرکت / برند: *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: شرکت داده‌پردازی آریا"
                    className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    نام و نام خانوادگی رابط / مدیر محترم: *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="مثال: سرکار خانم مهندس تهرانی"
                    className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    شماره همراه یا تلفن مستقیم تماس: *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="۰۹۱۲..."
                    className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    ایمیل اداری جهت دریافت پیش‌فاکتور:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="corporate@company.com"
                    className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Quantity & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    تعداد تقریبی پک هدیه:
                  </label>
                  <select
                    value={estimatedQuantity}
                    onChange={(e) => setEstimatedQuantity(e.target.value)}
                    className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-bold text-[#0F4C3A]"
                  >
                    <option value="20">۲۰ تا ۵۰ عدد (۵٪ تخفیف)</option>
                    <option value="50">۵۰ تا ۱۰۰ عدد (۱۰٪ تخفیف)</option>
                    <option value="100">۱۰۰ تا ۲۵۰ عدد (۱۵٪ تخفیف)</option>
                    <option value="250">۲۵۰ تا ۵۰۰ عدد (تخفیف ویژه VIP)</option>
                    <option value="500">بالاتر از ۵۰۰ عدد (تولید اختصاصی کارگاهی)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">
                    بودجه تقریبی برای هر باکس:
                  </label>
                  <select
                    value={budgetPerBox}
                    onChange={(e) => setBudgetPerBox(e.target.value)}
                    className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-bold text-[#0F4C3A]"
                  >
                    <option value="3500000">۳ الی ۵ میلیون تومان</option>
                    <option value="6500000">۵ الی ۸ میلیون تومان</option>
                    <option value="10000000">۸ الی ۱۵ میلیون تومان</option>
                    <option value="20000000">بالاتر از ۱۵ میلیون تومان (پک‌های سلطنتی VIP)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Occasion & Delivery date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">نوع مناسبت یا رویداد:</label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="مثال: هدایای نوروزی، شب یلدا، روز کارمند، سمینار سالانه"
                    className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F4C3A] mb-1">تاریخ تقریبی تحویل:</label>
                  <input
                    type="text"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    placeholder="۱۴۰۳/۱۲/۲۰"
                    className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Customization checkboxes */}
              <div>
                <label className="block font-bold text-[#0F4C3A] mb-2">
                  خدمات شخصی‌سازی و برندینگ مورد نیاز:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {availableCustomizations.map((type, idx) => {
                    const isChecked = customizationTypes.includes(type);
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] text-[#0F4C3A] font-bold'
                            : 'bg-[#FAF8F5] border-[#E0D8C8] text-[#4A5A55]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCustomization(type)}
                          className="w-4 h-4 text-[#0F4C3A] rounded border-[#E0D8C8]"
                        />
                        <span>{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Logo upload simulator */}
              <div>
                <label className="block font-bold text-[#0F4C3A] mb-1">
                  بارگذاری فایل لوگوی سازمان (اختیاری جهت بررسی کارگاه):
                </label>
                <div className="flex items-center gap-3 bg-[#FAF8F5] p-3 rounded-xl border border-dashed border-[#E0D8C8]">
                  <label className="cursor-pointer bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>انتخاب فایل لوگو</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-[#6A7873]">
                    {uploadedLogoName ? uploadedLogoName : 'فرمت‌های مجاز: PNG, PDF, AI, JPG'}
                  </span>
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label className="block font-bold text-[#0F4C3A] mb-1">
                  توضیحات و نیازمندی‌های خاص:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اگر ترجیح خاصی در مورد نوع صنایع دستی، دمنوش‌ها، نوع چوب صندوقچه یا رنگ روبان دارید ذکر بفرمایید..."
                  className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Voice Message for Corporate Inquiry */}
              <VoiceMessageRecorder
                voiceRecording={voiceRecording}
                onRecordingComplete={(rec) => setVoiceRecording(rec)}
                onRecordingDeleted={() => setVoiceRecording(null)}
                label="ضبط ویس یا نیازمندی‌های صوتی سازمان (اختیاری)"
                helperText="جهت تشریح دقیق‌تر سناریوی هدیه، جزئیات رویداد و تعداد اقلام مورد نیاز، صدای خود را ضبط فرمایید."
              />

              {/* Submit CTA */}
              <button
                type="submit"
                id="corporate-inquiry-submit-btn"
                disabled={isSubmitting}
                className="w-full bg-[#0F4C3A] hover:bg-[#0B3C2E] disabled:opacity-60 text-white py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg active:scale-98 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                    <span>در حال ثبت استعلام در سرور...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#D4AF37]" />
                    <span>ثبت نهایی درخواست مشاوره و استعلام سازمانی</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
};
