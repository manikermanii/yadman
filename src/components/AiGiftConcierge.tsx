import React, { useState } from 'react';
import { Sparkles, Gift, Heart, ArrowLeft, Star, ShoppingBag, CheckCircle } from 'lucide-react';
import { giftRelaxTeaImg } from '../data/products';
import { Product } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';

interface AiGiftConciergeProps {
  products?: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const AiGiftConcierge: React.FC<AiGiftConciergeProps> = ({
  products = [],
  onSelectProduct,
  onAddToCart,
}) => {
  const [recipient, setRecipient] = useState('manager');
  const [occasion, setOccasion] = useState('thanks');
  const [maxBudget, setMaxBudget] = useState(6000000);
  const [preference, setPreference] = useState('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendedList, setRecommendedList] = useState<Product[] | null>(null);
  const [aiAdvice, setAiAdvice] = useState('');

  const recipientOptions = [
    { id: 'manager', label: 'مدیر / رئیس سازمان' },
    { id: 'spouse', label: 'همسر / پارتنر' },
    { id: 'parents', label: 'پدر / مادر' },
    { id: 'friend', label: 'دوست صمیمی' },
    { id: 'colleague', label: 'همکار / مشتری' },
  ];

  const occasionOptions = [
    { id: 'norouz', label: 'عید نوروز' },
    { id: 'thanks', label: 'تشکر و قدردانی' },
    { id: 'birthday', label: 'تولد' },
    { id: 'anniversary', label: 'سالگرد ازدواج' },
    { id: 'promotion', label: 'ارتقای شغلی' },
  ];

  const preferenceOptions = [
    { id: 'all', label: 'ترکیب همه موارد' },
    { id: 'saffron', label: 'زعفران و هل' },
    { id: 'handicraft', label: 'صنایع دستی و هنر' },
    { id: 'perfume', label: 'عطر و گلاب معطر' },
  ];

  const handleRunAi = () => {
    setIsAnalyzing(true);
    setRecommendedList(null);

    setTimeout(() => {
      // Filter logic
      let matched = products.filter((p) => p.price <= maxBudget);
      if (preference !== 'all') {
        const prefMatch = matched.filter((p) => p.category === preference);
        if (prefMatch.length > 0) matched = prefMatch;
      }

      if (matched.length === 0) matched = products.slice(0, 3);

      // Generate Persian AI Advice
      let adviceText = '';
      if (recipient === 'manager' || recipient === 'colleague') {
        adviceText = `برای ${recipientOptions.find(r => r.id === recipient)?.label} در مناسبت ${occasionOptions.find(o => o.id === occasion)?.label}، پک‌های دارای زعفران نگین و صنایع دستی انتخابی شایسته هستند.`;
      } else if (recipient === 'spouse' || recipient === 'parents') {
        adviceText = `پیشنهاد ما، پک‌های دارای عطر، گلاب و کارت تبریک اختصاصی است.`;
      } else {
        adviceText = `ترکیب خشکبار، نبات زعفرانی و صنایع دستی انتخابی مناسب برای این مناسبت است.`;
      }

      setAiAdvice(adviceText);
      setRecommendedList(matched.slice(0, 3));
      setIsAnalyzing(false);
    }, 1000);
  };

  return (
    <section className="bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#0F4C3A]/10 text-[#0F4C3A] px-3.5 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>پیشنهاد هوشمند هدیه</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#0F4C3A]">
            پیشنهاد هوشمند هدیه
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5A55] max-w-xl mx-auto">
            مشخصات مخاطب و مناسبت را وارد کنید تا مناسب‌ترین پک‌های هدیه به شما پیشنهاد داده شوند.
          </p>
        </div>

        {/* Input Controls Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAE6DF] shadow-md space-y-6 text-right">
          
          {/* Recipient */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#0F4C3A]">
              ۱. هدیه برای چه کسی آماده می‌شود؟
            </label>
            <div className="flex flex-wrap gap-2">
              {recipientOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setRecipient(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition border ${
                    recipient === item.id
                      ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white shadow-xs'
                      : 'border-[#EAE6DF] bg-[#FAF8F5] text-[#2C3B37] hover:border-[#0F4C3A]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div className="space-y-2 pt-2 border-t border-[#EAE6DF]">
            <label className="block text-xs font-bold text-[#0F4C3A]">
              ۲. مناسبت اهدای هدیه:
            </label>
            <div className="flex flex-wrap gap-2">
              {occasionOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setOccasion(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition border ${
                    occasion === item.id
                      ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white shadow-xs'
                      : 'border-[#EAE6DF] bg-[#FAF8F5] text-[#2C3B37] hover:border-[#0F4C3A]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Slider */}
          <div className="space-y-2 pt-2 border-t border-[#EAE6DF]">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-[#0F4C3A]">
                ۳. حداکثر بودجه مد نظر شما:
              </label>
              <span className="font-extrabold text-[#0F4C3A] text-sm bg-[#0F4C3A]/10 px-3 py-1 rounded-lg">
                تا {formatToman(maxBudget)}
              </span>
            </div>
            <input
              type="range"
              min={3000000}
              max={10000000}
              step={500000}
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-[#0F4C3A] cursor-pointer"
            />
          </div>

          {/* Preferences */}
          <div className="space-y-2 pt-2 border-t border-[#EAE6DF]">
            <label className="block text-xs font-bold text-[#0F4C3A]">
              ۴. اولویت نوع اقلام:
            </label>
            <div className="flex flex-wrap gap-2">
              {preferenceOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPreference(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition border ${
                    preference === item.id
                      ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white shadow-xs'
                      : 'border-[#EAE6DF] bg-[#FAF8F5] text-[#2C3B37] hover:border-[#0F4C3A]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleRunAi}
            disabled={isAnalyzing}
            id="ai-generate-suggestions-btn"
            className="w-full bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md active:scale-98"
          >
            <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
            <span>{isAnalyzing ? 'در حال تحلیل هوشمند و انتخاب بهترین باکس‌ها...' : 'تحلیل هوشمند و دریافت پیشنهاد'}</span>
          </button>

        </div>

        {/* AI Results Output */}
        {recommendedList && (
          <div className="space-y-6 animate-fadeIn text-right">
            
            {/* AI Advice Banner */}
            <div className="p-5 bg-[#FAF8F5] border-2 border-[#D4AF37]/50 rounded-2xl text-xs text-[#0F4C3A] space-y-1 shadow-sm">
              <span className="font-bold text-sm flex items-center gap-1.5 text-[#0F4C3A]">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                تحلیل هوشمند AI:
              </span>
              <p className="text-[#2C3B37] leading-relaxed pt-1 font-medium">{aiAdvice}</p>
            </div>

            {/* Recommended Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {recommendedList.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE6DF] p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition space-y-2"
                >
                  <div className="w-full h-28 sm:h-32 bg-[#F4EFE6] rounded-lg overflow-hidden border border-[#EAE6DF] flex items-center justify-center p-1.5">
                    <img
                      src={product.image || giftRelaxTeaImg}
                      alt={product.titleFa}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== giftRelaxTeaImg) {
                          target.src = giftRelaxTeaImg;
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] bg-[#0F4C3A]/10 text-[#0F4C3A] font-bold px-1.5 py-0.5 rounded leading-none">
                      پیشنهاد ویژه
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-[#0F4C3A] line-clamp-1">{product.titleFa}</h4>
                    <p className="text-[10px] text-[#6A7873] line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>

                  <div className="pt-2 border-t border-[#EAE6DF] flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs sm:text-sm text-[#0F4C3A] truncate">{formatToman(product.price)}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => onSelectProduct(product)}
                        className="px-2 py-1 rounded-lg border border-[#0F4C3A] text-[#0F4C3A] text-[11px] font-semibold hover:bg-[#0F4C3A] hover:text-white transition"
                      >
                        جزئیات
                      </button>
                      <button
                        onClick={() => onAddToCart(product)}
                        className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white p-1.5 rounded-lg text-xs"
                        title="افزودن به سبد"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
