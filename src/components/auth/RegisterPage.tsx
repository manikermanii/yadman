import React, { useState, useEffect } from 'react';
import { Lock, Phone, Mail, Eye, EyeOff, User, Building2, ShieldCheck, AlertCircle, ArrowRight, X } from 'lucide-react';
import { User as UserType, AccountType } from '../../types';
import { api } from '../../services/api';
import { authToast } from '../../context/ToastContext';
import {
  isValidMobileNumber,
  isValidEmail,
  checkPasswordStrength,
  normalizePhoneNumber,
} from '../../utils/authService';

export interface RegisterPageProps {
  users?: UserType[];
  onSuccess?: (newUser: UserType) => void;
  onRegisterSuccess?: (newUser: UserType) => void;
  onSwitchToLogin?: () => void;
  onNavigateLogin?: () => void;
  onClose?: () => void;
  onNavigateHome?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  users = [],
  onSuccess,
  onRegisterSuccess,
  onSwitchToLogin,
  onNavigateLogin,
  onClose,
  onNavigateHome,
}) => {
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  
  // Corporate specific fields
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [corporatePhone, setCorporatePhone] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(password);

  const handleSuccessCallback = (user: UserType) => {
    if (onSuccess) onSuccess(user);
    else if (onRegisterSuccess) onRegisterSuccess(user);
  };

  const handleLoginCallback = () => {
    if (onSwitchToLogin) onSwitchToLogin();
    else if (onNavigateLogin) onNavigateLogin();
  };

  const handleCloseCallback = () => {
    if (onClose) onClose();
    else if (onNavigateHome) onNavigateHome();
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseCallback();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Validate Full Name
    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMessage('لطفاً نام و نام خانوادگی کامل خود را وارد کنید.');
      return;
    }

    // 2. Validate Mobile Phone
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!isValidMobileNumber(normalizedPhone)) {
      setErrorMessage('شماره موبایل وارد شده معتبر نیست. لطفاً یک شماره موبایل معتبر ۱۱ رقمی (مثال: ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.');
      return;
    }

    // 3. Validate Email (if entered)
    if (email.trim() && !isValidEmail(email)) {
      setErrorMessage('فرمت آدرس ایمیل معتبر نیست.');
      return;
    }

    // 4. Validate Corporate Fields
    if (accountType === 'corporate') {
      if (!companyName.trim()) {
        setErrorMessage('لطفاً نام شرکت یا سازمان خود را وارد کنید.');
        return;
      }
    }

    // 5. Validate Password
    if (!password || password.length < 6) {
      setErrorMessage('رمز عبور باید حداقل ۶ نویسه باشد.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.auth.register({
        fullName: fullName.trim(),
        name: fullName.trim(),
        phoneNumber: normalizedPhone,
        phone: normalizedPhone,
        email: email.trim() || undefined,
        password,
        companyName: accountType === 'corporate' ? companyName.trim() : undefined,
      });

      if (!result || !result.user) {
        setIsLoading(false);
        setErrorMessage('خطایی در ساخت حساب رخ داد.');
        authToast.registerError('خطایی در ساخت حساب رخ داد.');
        return;
      }

      setIsLoading(false);
      authToast.registerSuccess();
      handleSuccessCallback(result.user);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || 'خطایی در ساخت حساب رخ داد. لطفاً دوباره امتحان کنید.';
      setErrorMessage(msg);
      authToast.registerError(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseCallback();
        }
      }}
      dir="rtl"
    >
      <div className="max-w-xl w-full my-auto space-y-6 bg-[#FAF8F5] p-6 sm:p-8 rounded-3xl border border-[#EAE6DF] shadow-2xl relative overflow-hidden text-right animate-scaleIn max-h-[92vh] overflow-y-auto">
        
        {/* Decorative Luxury Accents */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-[#0F4C3A]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar with Close Button */}
        <div className="flex items-center justify-between border-b border-[#EAE6DF]/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F4C3A] text-[#D4AF37] flex items-center justify-center font-bold text-sm shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#0F4C3A]">عضویت و ایجاد حساب کاربری</span>
          </div>

          <button
            type="button"
            onClick={handleCloseCallback}
            id="close-register-modal-btn"
            className="p-1.5 text-[#6A7873] hover:text-[#0F4C3A] hover:bg-[#F4EFE6] rounded-full transition"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F4C3A]">به یادمان بپیوندید</h1>
          <p className="text-xs text-[#6A7873]">
            شخصی‌سازی روبان و مهر موم، پیگیری لحظه‌ای سفارش‌ها و بهره‌مندی از تخفیف‌های ویژه
          </p>
        </div>

        {/* Account Type Selector (B2C vs B2B) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#1C2826]">
            نوع حساب کاربری <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType('personal')}
              className={`p-3 rounded-2xl border text-right transition flex items-center gap-2.5 cursor-pointer ${
                accountType === 'personal'
                  ? 'bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-xs'
                  : 'bg-[#F4EFE6]/70 text-[#1C2826] border-[#E0D8C8] hover:bg-[#EAE6DF]'
              }`}
            >
              <div className={`p-1.5 rounded-xl shrink-0 ${accountType === 'personal' ? 'bg-white/15' : 'bg-[#FAF8F5]'}`}>
                <User className={`w-4 h-4 ${accountType === 'personal' ? 'text-[#D4AF37]' : 'text-[#0F4C3A]'}`} />
              </div>
              <div>
                <p className="text-xs font-bold">مشتری شخصی</p>
                <p className={`text-[10px] ${accountType === 'personal' ? 'text-[#D0E2DB]' : 'text-[#6A7873]'}`}>
                  خرید پک‌های مناسبتی
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAccountType('corporate')}
              className={`p-3 rounded-2xl border text-right transition flex items-center gap-2.5 cursor-pointer ${
                accountType === 'corporate'
                  ? 'bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-xs'
                  : 'bg-[#F4EFE6]/70 text-[#1C2826] border-[#E0D8C8] hover:bg-[#EAE6DF]'
              }`}
            >
              <div className={`p-1.5 rounded-xl shrink-0 ${accountType === 'corporate' ? 'bg-white/15' : 'bg-[#FAF8F5]'}`}>
                <Building2 className={`w-4 h-4 ${accountType === 'corporate' ? 'text-[#D4AF37]' : 'text-[#0F4C3A]'}`} />
              </div>
              <div>
                <p className="text-xs font-bold">حساب سازمانی (B2B)</p>
                <p className={`text-[10px] ${accountType === 'corporate' ? 'text-[#D0E2DB]' : 'text-[#6A7873]'}`}>
                  شرکت‌ها و فاکتور رسمی
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#1C2826]">
              نام و نام خانوادگی <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: سهراب پارسا"
                className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] focus:bg-[#FAF8F5] rounded-xl py-2.5 pr-4 pl-10 text-xs sm:text-sm text-[#1C2826] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] transition"
                required
                autoFocus
              />
              <User className="w-4 h-4 text-[#6A7873] absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Contact Fields: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1C2826]">
                شماره موبایل <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  dir="ltr"
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] focus:bg-[#FAF8F5] rounded-xl py-2.5 pr-4 pl-10 text-xs sm:text-sm text-[#1C2826] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] transition text-left"
                  required
                />
                <Phone className="w-4 h-4 text-[#6A7873] absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1C2826]">
                ایمیل <span className="text-[10px] text-[#6A7873] font-normal">(اختیاری)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] focus:bg-[#FAF8F5] rounded-xl py-2.5 pr-4 pl-10 text-xs sm:text-sm text-[#1C2826] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] transition text-left"
                />
                <Mail className="w-4 h-4 text-[#6A7873] absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Corporate Extra Fields (if Corporate selected) */}
          {accountType === 'corporate' && (
            <div className="p-3.5 bg-[#F4EFE6]/60 rounded-2xl border border-[#D4AF37]/40 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F4C3A]">
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                <span>اطلاعات شرکت و سازمان</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#1C2826]">
                    نام شرکت / برند <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: شرکت داده‌پرداز پایا"
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#1C2826]">
                    سمت سازمانی <span className="text-[10px] text-[#6A7873] font-normal">(اختیاری)</span>
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثال: مدیر روابط عمومی / منابع انسانی"
                    className="w-full bg-[#FAF8F5] border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#1C2826]">
                  تلفن تماس ثابت یا داخلی سازمانی <span className="text-[10px] text-[#6A7873] font-normal">(اختیاری)</span>
                </label>
                <input
                  type="text"
                  value={corporatePhone}
                  onChange={(e) => setCorporatePhone(e.target.value)}
                  placeholder="مثال: ۰۲۱۸۸۷۷۶۶۵۵ داخلی ۱۰۴"
                  dir="ltr"
                  className="w-full bg-[#FAF8F5] border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                />
              </div>
            </div>
          )}

          {/* Password Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1C2826]">
                رمز عبور <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ نویسه"
                  dir="ltr"
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] focus:bg-[#FAF8F5] rounded-xl py-2 pr-3 pl-8 text-xs sm:text-sm text-[#1C2826] focus:outline-none text-left"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2.5 top-2.5 text-[#6A7873] hover:text-[#0F4C3A]"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1C2826]">
                تکرار رمز عبور <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار همان رمز"
                  dir="ltr"
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] focus:bg-[#FAF8F5] rounded-xl py-2 pr-3 pl-8 text-xs sm:text-sm text-[#1C2826] focus:outline-none text-left"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-2.5 top-2.5 text-[#6A7873] hover:text-[#0F4C3A]"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Strength Meter */}
          {password && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#6A7873]">امنیت رمز عبور:</span>
                <span className="font-bold text-[#0F4C3A]">{passwordStrength.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-[#E0D8C8]/60 rounded-full overflow-hidden">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full rounded-full transition-all ${
                      passwordStrength.score >= step ? passwordStrength.color : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>در حال ساخت حساب...</span>
              </span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>ایجاد حساب کاربری</span>
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="pt-3 border-t border-[#EAE6DF] text-center space-y-2">
          <p className="text-xs text-[#6A7873]">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <button
              type="button"
              onClick={handleLoginCallback}
              className="text-[#0F4C3A] hover:text-[#D4AF37] font-bold underline underline-offset-4 transition"
            >
              وارد شوید
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
