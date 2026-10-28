import React from 'react';
import {
  Gift,
  Building2,
  Headphones,
  Sparkles,
  BookOpen,
  Heart,
  Award,
  Stamp,
  ShieldCheck,
  Clock,
  Truck,
  CheckCircle,
  Star,
  ShoppingBag,
  Phone,
  FileText,
  Package,
  Zap,
  Tag,
  Compass,
} from 'lucide-react';

export const AVAILABLE_ICONS: { [key: string]: { label: string; icon: React.FC<{ className?: string }> } } = {
  Gift: { label: 'کادو / پک هدیه', icon: Gift },
  Building2: { label: 'سازمانی / شرکت', icon: Building2 },
  Headphones: { label: 'مشاوره / پشتیبانی', icon: Headphones },
  Sparkles: { label: 'اختصاصی / درخشان', icon: Sparkles },
  BookOpen: { label: 'کتاب / مجله', icon: BookOpen },
  Heart: { label: 'عشق / رضایت', icon: Heart },
  Award: { label: 'کیفیت / افتخار', icon: Award },
  Stamp: { label: 'مهر و موم / اصالت', icon: Stamp },
  ShieldCheck: { label: 'امنیت / تضمین', icon: ShieldCheck },
  Clock: { label: 'زمان / سرعت', icon: Clock },
  Truck: { label: 'ارسال / تحویل', icon: Truck },
  CheckCircle: { label: 'تأیید / چک‌لیست', icon: CheckCircle },
  Star: { label: 'ستاره / برتر', icon: Star },
  ShoppingBag: { label: 'خرید / سبد', icon: ShoppingBag },
  Phone: { label: 'تلفن / تماس', icon: Phone },
  FileText: { label: 'فاکتور / مستند', icon: FileText },
  Package: { label: 'بسته / هاردباکس', icon: Package },
  Zap: { label: 'فوری / اکسپرس', icon: Zap },
  Tag: { label: 'تخفیف / قیمت', icon: Tag },
  Compass: { label: 'راهنما / جهت', icon: Compass },
};

export const renderLucideIcon = (iconName: string, className: string = 'w-4 h-4') => {
  const iconEntry = AVAILABLE_ICONS[iconName];
  if (iconEntry) {
    const IconComp = iconEntry.icon;
    return <IconComp className={className} />;
  }
  return <Gift className={className} />;
};

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, label = 'انتخاب آیکون:' }) => {
  return (
    <div className="space-y-1.5 text-right">
      {label && <label className="block text-[11px] font-bold text-[#4A5A55]">{label}</label>}
      <div className="flex flex-wrap gap-1.5 p-2 bg-[#FAF8F5] rounded-xl border border-[#E0D8C8] max-h-36 overflow-y-auto">
        {Object.entries(AVAILABLE_ICONS).map(([iconKey, { label: iconLabel, icon: IconComp }]) => {
          const isSelected = value === iconKey;
          return (
            <button
              key={iconKey}
              type="button"
              onClick={() => onChange(iconKey)}
              title={iconLabel}
              className={`p-2 rounded-lg flex items-center gap-1 text-xs transition cursor-pointer ${
                isSelected
                  ? 'bg-[#0F4C3A] text-[#FAF8F5] shadow-xs'
                  : 'bg-white text-[#2C3B37] border border-[#EAE6DF] hover:border-[#0F4C3A] hover:bg-[#F4EFE6]'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">{iconLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
