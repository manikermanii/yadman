import React, { useState, useEffect } from 'react';
import { Lock, Phone, Mail, KeyRound, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, X } from 'lucide-react';
import { User as UserType } from '../../types';
import {
  hashPassword,
  checkPasswordStrength,
  normalizePhoneNumber,
} from '../../utils/authService';

export interface ForgotPasswordPageProps {
  users?: UserType[];
  onSuccess?: (updatedUser: UserType) => void;
  onPasswordResetComplete?: (updatedUser: UserType) => void;
  onSwitchToLogin?: () => void;
  onNavigateLogin?: () => void;
  onClose?: () => void;
  onNavigateHome?: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  users = [],
  onSuccess,
  onPasswordResetComplete,
  onSwitchToLogin,
  onNavigateLogin,
  onClose,
  onNavigateHome,
}) => {
  // Steps: 1: 'request_otp', 2: 'verify_otp', 3: 'new_password', 4: 'success'
  const [step, setStep] = useState<'request_otp' | 'verify_otp' | 'new_password' | 'success'>('request_otp');

  const [identifier, setIdentifier] = useState('');
  const [targetUser, setTargetUser] = useState<UserType | null>(null);

  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [otpNotification, setOtpNotification] = useState<string | null>(null);

  // New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(newPassword);

  const handleLoginCallback = () => {
    if (onSwitchToLogin) onSwitchToLogin();
    else if (onNavigateLogin) onNavigateLogin();
  };

  const handleCloseCallback = () => {
    if (onClose) onClose();
    else if (onNavigateHome) onNavigateHome();
  };

  const handleSuccessCallback = (user: UserType) => {
    if (onSuccess) onSuccess(user);
    else if (onPasswordResetComplete) onPasswordResetComplete(user);
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

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (isTimerRunning && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, countdown]);

  // Step 1: Send OTP
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const rawId = identifier.trim();
    if (!rawId) {
      setErrorMessage('لطفاً شماره موبایل یا ایمیل خود را وارد کنید.');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(rawId);
    const matchedUser = (users || []).find(
      (u) =>
        normalizePhoneNumber(u.phoneNumber) === normalizedPhone ||
        (u.email && u.email.toLowerCase() === rawId.toLowerCase())
    );

    if (!matchedUser) {
      setErrorMessage('کاربری با این شماره یا ایمیل یافت نشد.');
      return;
    }

    setIsLoading(true);

    // Generate 5-digit verification code
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedOtp(code);
    setTargetUser(matchedUser);

    setTimeout(() => {
      setIsLoading(false);
      setStep('verify_otp');
      setCountdown(120);
      setIsTimerRunning(true);
      setOtpNotification(`کد تایید ۵ رقمی بازیابی: ${code}`);
    }, 600);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (enteredOtp.trim() !== generatedOtp) {
      setErrorMessage('کد تایید وارد شده نادرست است.');
      return;
    }

    setStep('new_password');
    setOtpNotification(null);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (countdown > 0) return;
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedOtp(code);
    setCountdown(120);
    setIsTimerRunning(true);
    setOtpNotification(`کد تایید جدید: ${code}`);
  };

  // Step 3: Save New Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('رمز عبور جدید باید حداقل ۶ نویسه باشد.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('رمز عبور جدید و تکرار آن یکسان نیستند.');
      return;
    }

    if (!targetUser) return;

    setIsLoading(true);

    try {
      const { hash, salt } = await hashPassword(newPassword);

      const updatedUser: UserType = {
        ...targetUser,
        passwordHash: hash,
        passwordSalt: salt,
      };

      setIsLoading(false);
      setStep('success');
      handleSuccessCallback(updatedUser);
    } catch {
      setIsLoading(false);
      setErrorMessage('خطایی در تغییر رمز رخ داد.');
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
      <div className="max-w-md w-full my-auto space-y-6 bg-[#FAF8F5] p-6 sm:p-8 rounded-3xl border border-[#EAE6DF] shadow-2xl relative overflow-hidden text-right animate-scaleIn">
        
        {/* Subtle Accents */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-[#0F4C3A]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Bar with Close Button */}
        <div className="flex items-center justify-between border-b border-[#EAE6DF]/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F4C3A] text-[#D4AF37] flex items-center justify-center font-bold text-sm shadow-xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#0F4C3A]">بازیابی رمز عبور</span>
          </div>

          <button
            type="button"
            onClick={handleCloseCallback}
            id="close-forgot-modal-btn"
            className="p-1.5 text-[#6A7873] hover:text-[#0F4C3A] hover:bg-[#F4EFE6] rounded-full transition"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F4C3A]">
            {step === 'request_otp' && 'فراموشی رمز عبور'}
            {step === 'verify_otp' && 'تایید شماره یا ایمیل'}
            {step === 'new_password' && 'تعیین رمز جدید'}
            {step === 'success' && 'تغییر موفقیت‌آمیز'}
          </h1>
          <p className="text-xs text-[#6A7873]">
            {step === 'request_otp' && 'شماره موبایل یا ایمیل حساب کاربری خود را وارد کنید'}
            {step === 'verify_otp' && 'کد تایید ۵ رقمی ارسال شده را وارد نمایید'}
            {step === 'new_password' && 'رمز عبور جدید و امن خود را تعیین فرمایید'}
            {step === 'success' && 'رمز عبور با موفقیت به‌روزرسانی شد'}
          </p>
        </div>

        {/* Demo Simulated SMS / OTP Banner */}
        {otpNotification && (
          <div className="bg-[#0F4C3A] text-[#FAF8F5] p-3 rounded-2xl border border-[#D4AF37]/40 text-xs flex items-center justify-between gap-2 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span className="font-bold">{otpNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setEnteredOtp(generatedOtp)}
              className="bg-[#D4AF37] hover:bg-[#C29F2F] text-[#0F4C3A] text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer"
            >
              درج خودکار کد
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: REQUEST OTP */}
        {step === 'request_otp' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1C2826]">
                شماره موبایل یا ایمیل حساب <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="مثال: ۰۹۱۲۱۱۱2233"
                  dir="ltr"
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] focus:bg-[#FAF8F5] rounded-xl py-2.5 pr-4 pl-10 text-xs sm:text-sm text-[#1C2826] focus:outline-none text-left"
                  required
                  autoFocus
                />
                <Phone className="w-4 h-4 text-[#6A7873] absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? 'در حال ارسال کد...' : 'ارسال کد تایید بازیابی'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 'verify_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1C2826]">
                کد تایید ۵ رقمی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="• • • • •"
                maxLength={5}
                dir="ltr"
                className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] focus:bg-[#FAF8F5] rounded-xl py-2.5 px-4 text-center tracking-[0.5em] text-lg font-bold text-[#0F4C3A] focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#6A7873]">
              {countdown > 0 ? (
                <span>
                  ارسال مجدد کد تا: <strong className="text-[#0F4C3A]">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#0F4C3A] hover:text-[#D4AF37] font-bold flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>ارسال مجدد کد</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              تایید کد و ادامه
            </button>
          </form>
        )}

        {/* STEP 3: SET NEW PASSWORD */}
        {step === 'new_password' && (
          <form onSubmit={handleSaveNewPassword} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1C2826]">
                رمز عبور جدید <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۶ نویسه"
                  dir="ltr"
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] focus:bg-[#FAF8F5] rounded-xl py-2 pr-4 pl-10 text-xs sm:text-sm text-[#1C2826] focus:outline-none text-left"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-2.5 text-[#6A7873] hover:text-[#0F4C3A]"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1C2826]">
                تکرار رمز عبور جدید <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="تکرار رمز جدید"
                  dir="ltr"
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] focus:bg-[#FAF8F5] rounded-xl py-2 pr-4 pl-10 text-xs sm:text-sm text-[#1C2826] focus:outline-none text-left"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-2.5 text-[#6A7873] hover:text-[#0F4C3A]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password strength meter */}
            {newPassword && (
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#6A7873]">امنیت رمز عبور:</span>
                  <span className="font-bold text-[#0F4C3A]">{passwordStrength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-[#E0D8C8]/60 rounded-full overflow-hidden">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-full rounded-full transition-all ${
                        passwordStrength.score >= s ? passwordStrength.color : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? 'در حال ذخیره‌سازی...' : 'ذخیره رمز عبور جدید'}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F4C3A]">رمز عبور شما با موفقیت تغییر یافت</h3>
            <p className="text-xs text-[#6A7873]">
              اکنون می‌توانید با رمز عبور جدید وارد حساب کاربری خود شوید.
            </p>
            <button
              type="button"
              onClick={handleLoginCallback}
              className="w-full bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer"
            >
              ورود به حساب کاربری
            </button>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-[#EAE6DF] text-center space-y-2">
          <button
            type="button"
            onClick={handleLoginCallback}
            className="text-xs text-[#0F4C3A] hover:text-[#D4AF37] font-bold transition"
          >
            بازگشت به صفحه ورود
          </button>
        </div>

      </div>
    </div>
  );
};
