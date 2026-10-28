import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { authenticateAdmin, AdminSession } from '../../utils/adminAuthService';
import { YadmanLogo } from '../common/YadmanLogo';

interface AdminLoginPageProps {
  onLoginSuccess: (session: AdminSession) => void;
  onBackToStore: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToStore,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await authenticateAdmin(username, password);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMsg(result.error || 'نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch {
      setErrorMsg('خطایی در اعتبارسنجی رخ داد. لطفا مجددا تلاش فرمایید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FAF8F5] text-[#2C3E35] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden"
      dir="rtl"
    >
      {/* Subtle Luxury Background Ornaments */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#0F4C3A]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Main Login Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200/80 p-8 sm:p-10 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2 -translate-y-[30px]">
            <YadmanLogo variant="header" />
          </div>
          
          <div className="flex items-center justify-center gap-1.5 mb-1 text-[#0F4C3A]">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <h1 className="text-lg sm:text-xl font-bold text-[#0F4C3A]">
              ورود به پنل مدیریت یادمان
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            دسترسی به بخش مدیریت سفارش‌ها، محصولات و وبلاگ
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div
            id="admin-login-error-msg"
            role="alert"
            className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs animate-shake"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Username Field */}
          <div>
            <label
              htmlFor="admin-username-input"
              className="block text-xs font-bold text-[#0F4C3A] mb-1.5"
            >
              نام کاربری مدیر
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="admin-username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoFocus
                autoComplete="username"
                dir="ltr"
                placeholder="ایمیل یا نام کاربری مدیریت"
                className="w-full pl-3.5 pr-10 py-3 bg-stone-50/70 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-[#0F4C3A] focus:ring-2 focus:ring-[#0F4C3A]/10 rounded-xl text-sm font-medium text-stone-800 placeholder-stone-400 transition outline-hidden"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-bold text-[#0F4C3A] mb-1.5"
            >
              رمز عبور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoComplete="current-password"
                dir="ltr"
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 bg-stone-50/70 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-[#0F4C3A] focus:ring-2 focus:ring-[#0F4C3A]/10 rounded-xl text-sm font-medium text-stone-800 placeholder-stone-400 transition outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400 hover:text-stone-600 transition"
                tabIndex={-1}
                aria-label={showPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="admin-login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#0F4C3A] hover:bg-[#145C47] text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>ورود به پنل مدیریت</span>
              </>
            )}
          </button>
        </form>

        {/* Back to storefront link */}
        <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-center">
          <button
            onClick={onBackToStore}
            id="admin-back-to-store-btn"
            type="button"
            className="text-xs text-stone-500 hover:text-[#0F4C3A] font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>بازگشت به وب‌سایت یادمان</span>
          </button>
        </div>
      </div>

      {/* Security Note Footer */}
      <div className="mt-8 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>سامانه مدیریت امن فروشگاه هدیه لوکس یادمان</span>
      </div>
    </div>
  );
};
