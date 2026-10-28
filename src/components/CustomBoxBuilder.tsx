import React, { useState, useMemo } from 'react';
import { BOX_TYPES, RIBBONS, WAX_SEALS, CUSTOM_ITEMS } from '../data/products';
import { BoxTypeOption, RibbonOption, WaxSealOption, CustomContentItem, VoiceRecordingData, Product } from '../types';
import { formatToman, formatWeight, toPersianDigits } from '../utils/formatters';
import { Sparkles, Plus, Trash2, Check, Stamp, ShoppingBag, Info, Package, AlertCircle } from 'lucide-react';
import { VoiceMessageRecorder } from './common/VoiceMessageRecorder';

const DEFAULT_BOX: BoxTypeOption = {
  id: 'box-cream-hardbox',
  nameFa: 'هاردباکس کرم بافت‌دار مخملی',
  price: 380000,
  material: 'مقوای فشرده ۱۲۰۰ گرمی با روکش کتان متالایز',
  colorHex: '#F5EFE3',
  capacityItems: 4,
  dimensions: '۳۰ × ۲۲ × ۹ سانتی‌متر',
};

const DEFAULT_RIBBON: RibbonOption = {
  id: 'ribbon-emerald',
  nameFa: 'سبز زمردی سلطنتی (ساتن براق)',
  colorHex: '#0B3D32',
};

const DEFAULT_WAX_SEAL: WaxSealOption = {
  id: 'seal-eslimi',
  nameFa: 'طرح اسلیمی و ختایی ایرانی',
  colorHex: '#C9B27C',
  symbol: '⚜️',
  symbolName: 'اسلیمی زرین',
};

interface CustomBoxBuilderProps {
  products?: Product[];
  customItems?: CustomContentItem[];
  onExploreCatalog?: () => void;
  onAddCustomBoxToCart: (customBox: {
    boxType: BoxTypeOption;
    ribbon: RibbonOption;
    waxSeal: WaxSealOption;
    items: CustomContentItem[];
    cardMessage: string;
    cardFont: string;
    totalPrice: number;
    voiceRecording?: VoiceRecordingData;
  }) => void;
}

export const CustomBoxBuilder: React.FC<CustomBoxBuilderProps> = ({
  products = [],
  customItems = [],
  onExploreCatalog,
  onAddCustomBoxToCart,
}) => {
  const boxTypesList = useMemo(() => {
    return Array.isArray(BOX_TYPES) && BOX_TYPES.length > 0 ? BOX_TYPES : [DEFAULT_BOX];
  }, []);

  const ribbonsList = useMemo(() => {
    return Array.isArray(RIBBONS) && RIBBONS.length > 0 ? RIBBONS : [DEFAULT_RIBBON];
  }, []);

  const waxSealsList = useMemo(() => {
    return Array.isArray(WAX_SEALS) && WAX_SEALS.length > 0 ? WAX_SEALS : [DEFAULT_WAX_SEAL];
  }, []);

  // Available selectable items: either customItems, CUSTOM_ITEMS, or converted from products
  const availableItems: CustomContentItem[] = useMemo(() => {
    const rawList = Array.isArray(customItems) && customItems.length > 0 
      ? customItems 
      : (Array.isArray(CUSTOM_ITEMS) ? CUSTOM_ITEMS : []);
    const validCustom = rawList.filter(
      (item): item is CustomContentItem => Boolean(item && item.id && typeof item.price === 'number')
    );
    if (validCustom.length > 0) {
      return validCustom;
    }
    // Fallback: convert individual active products if present
    if (Array.isArray(products) && products.length > 0) {
      return products.slice(0, 12).map((p) => ({
        id: p?.id || `product-${Math.random()}`,
        nameFa: p?.titleFa || 'محصول هدیه',
        category: 'crafts' as const,
        price: typeof p?.price === 'number' ? p.price : 0,
        image: p?.image || '',
        weightGrams: p?.weightGrams || 200,
        description: p?.shortDescription || p?.description || '',
        inStock: p?.inStock !== false,
      }));
    }
    return [];
  }, [customItems, products]);

  const [selectedBox, setSelectedBox] = useState<BoxTypeOption>(boxTypesList[0] || DEFAULT_BOX);
  const [selectedRibbon, setSelectedRibbon] = useState<RibbonOption>(ribbonsList[0] || DEFAULT_RIBBON);
  const [selectedWaxSeal, setSelectedWaxSeal] = useState<WaxSealOption>(waxSealsList[0] || DEFAULT_WAX_SEAL);

  const [selectedItems, setSelectedItems] = useState<CustomContentItem[]>(() => {
    if (availableItems && availableItems.length >= 2) {
      return [availableItems[0], availableItems[1]].filter(Boolean);
    }
    return [];
  });

  const [cardMessage, setCardMessage] = useState(
    'پیشکش به پاس مهربانی و همراهی ارزشمندتان. روزگارتان عطرآگین باد.'
  );
  const [cardFont] = useState('Amiri');
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecordingData | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  // Safe Current Objects
  const currentBox = selectedBox || boxTypesList[0] || DEFAULT_BOX;
  const currentRibbon = selectedRibbon || ribbonsList[0] || DEFAULT_RIBBON;
  const currentWaxSeal = selectedWaxSeal || waxSealsList[0] || DEFAULT_WAX_SEAL;

  // Safe Calculations
  const itemsPrice = (selectedItems || []).reduce((acc, item) => acc + (item?.price || 0), 0);
  const boxPrice = currentBox?.price || 0;
  const totalPrice = boxPrice + itemsPrice;
  const totalWeight = (selectedItems || []).reduce((acc, item) => acc + (item?.weightGrams || 0), 300);

  const maxCapacity = currentBox?.capacityItems || 4;
  const isFull = (selectedItems || []).length >= maxCapacity;

  const handleAddItem = (item: CustomContentItem) => {
    if (!item || isFull) return;
    setSelectedItems((prev) => [...prev, item]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleCompleteBox = () => {
    if (!selectedItems || selectedItems.length === 0) return;
    onAddCustomBoxToCart({
      boxType: currentBox,
      ribbon: currentRibbon,
      waxSeal: currentWaxSeal,
      items: selectedItems,
      cardMessage: cardMessage || '',
      cardFont: cardFont || 'Amiri',
      totalPrice: totalPrice || 0,
      voiceRecording: voiceRecording || undefined,
    });
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 2500);
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-right">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Title Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#0F4C3A]/10 text-[#0F4C3A] px-3.5 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>پک اختصاصی</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F4C3A]">
            ساخت پک هدیه اختصاصی
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5A55]">
            جعبه، رنگ روبان، مهر و موم و محصولات داخل آن را به سلیقه خود انتخاب کنید.
          </p>
        </div>

        {/* Builder Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Live Custom Box Preview & Summary Sticky (LGs) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            
            {/* Box Preview Card */}
            <div className="bg-[#FAF8F5] rounded-3xl border-2 border-[#D4AF37]/50 p-6 shadow-xl space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-black/20"
                    style={{ backgroundColor: currentRibbon?.colorHex || '#0B3D32' }}
                  />
                  <span className="font-bold text-[#0F4C3A] text-sm">پیش‌نمایش هدیه سفارشی</span>
                </div>
                <span className="text-xs text-[#0F4C3A] bg-[#0F4C3A]/10 font-bold px-2.5 py-1 rounded-lg">
                  گنجایش: {toPersianDigits(selectedItems?.length || 0)} از {toPersianDigits(maxCapacity || 4)}
                </span>
              </div>

              {/* Visual Box Rendering */}
              <div
                className="rounded-2xl p-6 border text-right space-y-4 shadow-inner relative transition-colors"
                style={{ backgroundColor: '#F4EFE6' }}
              >
                {/* Wax Seal Stamp Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#D4AF37]/40 shadow-xs">
                  <Stamp className="w-3.5 h-3.5 text-[#0F4C3A]" />
                  <span className="text-[10px] font-bold text-[#0F4C3A]">
                    {currentWaxSeal?.nameFa || 'مهر مومی'}
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-[#6A7873] block">جنس بسته‌بندی:</span>
                  <h3 className="font-extrabold text-[#0F4C3A] text-base">
                    {currentBox?.nameFa || 'هاردباکس کرم بافت‌دار مخملی'}
                  </h3>
                </div>

                {/* Selected Items List in Box */}
                <div className="space-y-2 pt-2 border-t border-[#EAE6DF]">
                  <span className="text-[11px] font-bold text-[#0F4C3A] block">اقلام درون باکس:</span>
                  {(!selectedItems || selectedItems.length === 0) ? (
                    <p className="text-xs text-[#8C8375] italic py-2">
                      هنوز آیتمی به باکس اضافه نکرده‌اید. از فهرست مقابل انتخاب کنید.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                      {selectedItems.map((item, idx) => {
                        if (!item) return null;
                        return (
                          <div
                            key={item.id ? `${item.id}-${idx}` : idx}
                            className="flex items-center justify-between bg-white/80 p-2 rounded-xl text-xs border border-[#EAE6DF]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-[#0F4C3A] text-white w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                {toPersianDigits(idx + 1)}
                              </span>
                              <span className="font-semibold text-[#1C2826] line-clamp-1">{item.nameFa || 'آیتم هدیه'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#0F4C3A] font-bold">{formatToman(item.price || 0)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                title="حذف از باکس"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Card Message Preview */}
                {cardMessage && (
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#D4AF37]/30 text-xs text-[#2C3B37] space-y-1">
                    <span className="text-[10px] text-[#8C8375] block">متن کارت تبریک:</span>
                    <p className="font-calligraphy text-sm leading-relaxed text-[#0F4C3A]">
                      « {cardMessage} »
                    </p>
                  </div>
                )}

              </div>

              {/* Price & Weight Breakdown */}
              <div className="space-y-2 pt-2 text-xs text-[#3A4A45]">
                <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                  <span>قیمت جعبه و بسته‌بندی:</span>
                  <span className="font-bold text-[#1C2826]">{formatToman(boxPrice)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                  <span>مجموع اقلام داخلی:</span>
                  <span className="font-bold text-[#1C2826]">{formatToman(itemsPrice)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                  <span>وزن تقریبی بسته:</span>
                  <span className="font-bold text-[#1C2826]">{formatWeight(totalWeight)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-sm font-bold text-[#0F4C3A]">مجموع کل:</span>
                  <span className="text-xl font-extrabold text-[#0F4C3A]">{formatToman(totalPrice)}</span>
                </div>
              </div>

              {/* Complete CTA Button */}
              <button
                type="button"
                onClick={handleCompleteBox}
                disabled={!selectedItems || selectedItems.length === 0}
                id="builder-complete-btn"
                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                  !selectedItems || selectedItems.length === 0
                    ? 'bg-[#EAE6DF] text-[#8C8375] cursor-not-allowed'
                    : 'bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] cursor-pointer'
                }`}
              >
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                <span>افزودن این باکس اختصاصی به سبد خرید</span>
              </button>

              {successNotice && (
                <div className="p-3 bg-[#0F4C3A] text-white text-xs rounded-xl text-center font-bold animate-fadeIn flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span>باکس سفارشی شما با موفقیت به سبد خرید افزوده شد!</span>
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Customization Steps */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Select Box Type */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#0F4C3A]">
                <span className="w-6 h-6 rounded-full bg-[#0F4C3A] text-white text-xs font-bold flex items-center justify-center">
                  ۱
                </span>
                <h3 className="font-extrabold text-base">انتخاب نوع و جنس جعبه اصلی</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {boxTypesList.map((box) => {
                  const isSelected = currentBox?.id === box?.id;
                  return (
                    <button
                      key={box?.id || Math.random()}
                      type="button"
                      onClick={() => setSelectedBox(box)}
                      className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between space-y-2 cursor-pointer ${
                        isSelected
                          ? 'border-[#0F4C3A] bg-[#0F4C3A]/5 ring-2 ring-[#0F4C3A]'
                          : 'border-[#EAE6DF] bg-[#FAF8F5] hover:border-[#0F4C3A]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-[#6A7873]">{box?.material || ''}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#0F4C3A]" />}
                        </div>
                        <h4 className="font-bold text-xs text-[#0F4C3A]">{box?.nameFa || ''}</h4>
                      </div>
                      <div className="pt-2 border-t border-[#EAE6DF] flex justify-between items-center text-[11px]">
                        <span className="text-[#8C8375]">تا {toPersianDigits(box?.capacityItems || 4)} آیتم</span>
                        <span className="font-bold text-[#0F4C3A]">{formatToman(box?.price || 0)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Ribbon & Wax Seal */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-6">
              
              {/* Ribbon Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#0F4C3A]">
                  <span className="w-6 h-6 rounded-full bg-[#0F4C3A] text-white text-xs font-bold flex items-center justify-center">
                    ۲
                  </span>
                  <h3 className="font-extrabold text-base">انتخاب رنگ روبان و مهر مومی</h3>
                </div>

                <span className="text-xs font-bold text-[#0F4C3A] block">رنگ روبان مخمل / ابریشم:</span>
                <div className="flex flex-wrap gap-2">
                  {ribbonsList.map((ribbon) => (
                    <button
                      key={ribbon?.id || Math.random()}
                      type="button"
                      onClick={() => setSelectedRibbon(ribbon)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition border cursor-pointer ${
                        currentRibbon?.id === ribbon?.id
                          ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white shadow-xs'
                          : 'border-[#EAE6DF] bg-[#FAF8F5] text-[#2C3B37] hover:border-[#0F4C3A]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: ribbon?.colorHex || '#0B3D32' }}
                      />
                      <span>{ribbon?.nameFa || ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wax Seal Selection */}
              <div className="space-y-3 pt-4 border-t border-[#EAE6DF]">
                <span className="text-xs font-bold text-[#0F4C3A] block">طرح مهر مومی دست‌ساز:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {waxSealsList.map((seal) => (
                    <button
                      key={seal?.id || Math.random()}
                      type="button"
                      onClick={() => setSelectedWaxSeal(seal)}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                        currentWaxSeal?.id === seal?.id
                          ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] ring-1 ring-[#0F4C3A]'
                          : 'border-[#EAE6DF] bg-[#FAF8F5] text-[#2C3B37] hover:border-[#0F4C3A]'
                      }`}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-xs"
                        style={{ backgroundColor: seal?.colorHex || '#C9B27C' }}
                      >
                        {seal?.symbol || '⚜️'}
                      </span>
                      <span className="text-[11px] font-bold">{seal?.nameFa || ''}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Step 3: Add Items to Box */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#0F4C3A]">
                  <span className="w-6 h-6 rounded-full bg-[#0F4C3A] text-white text-xs font-bold flex items-center justify-center">
                    ۳
                  </span>
                  <h3 className="font-extrabold text-base">انتخاب محتویات داخل باکس هدیه</h3>
                </div>
                <span className="text-xs text-[#8C8375]">
                  {isFull ? (
                    <span className="text-amber-700 font-bold">ظرفیت جعبه تکمیل شده است</span>
                  ) : (
                    <span>میتوانید {toPersianDigits(Math.max(0, (maxCapacity || 4) - (selectedItems?.length || 0)))} آیتم دیگر اضافه کنید</span>
                  )}
                </span>
              </div>

              {(!availableItems || availableItems.length === 0) ? (
                <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D1C9BE] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#0F4C3A]/10 flex items-center justify-center mx-auto text-[#0F4C3A]">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[#0F4C3A] text-sm">در حال حاضر هنوز آیتمی در پایگاه داده ثبت نشده است</h4>
                  <p className="text-xs text-[#6A7873] max-w-md mx-auto leading-relaxed">
                    محصولات و اقلام هدیه پس از ثبت در پنل مدیریت در این بخش نمایش داده می‌شوند.
                  </p>
                  {onExploreCatalog && (
                    <button
                      type="button"
                      onClick={onExploreCatalog}
                      className="inline-flex items-center gap-1.5 bg-[#0F4C3A] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#0B3C2E] transition-all cursor-pointer shadow-xs"
                    >
                      <span>مشاهده کاتالوگ پک‌های آماده</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {availableItems.map((item) => (
                    <div
                      key={item?.id || Math.random()}
                      className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE6DF] flex items-center justify-between gap-3 hover:border-[#D4AF37] transition"
                    >
                      {item?.image ? (
                        <img
                          src={item.image}
                          alt={item.nameFa || 'محصول هدیه'}
                          className="w-14 h-14 object-cover rounded-xl border border-[#EAE6DF] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#EAE6DF] flex items-center justify-center text-[#8C8375] shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 text-right min-w-0">
                        <h4 className="font-bold text-xs text-[#0F4C3A] truncate">{item?.nameFa || 'محصول هدیه'}</h4>
                        <p className="text-[10px] text-[#6A7873] truncate mt-0.5">{item?.description || ''}</p>
                        <span className="text-xs font-extrabold text-[#1C2826] block mt-1">
                          {formatToman(item?.price || 0)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddItem(item)}
                        disabled={isFull}
                        className={`p-2 rounded-xl text-xs transition cursor-pointer ${
                          isFull
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white shadow-xs'
                        }`}
                        title="افزودن به باکس"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Calligraphy Note */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#0F4C3A]">
                <span className="w-6 h-6 rounded-full bg-[#0F4C3A] text-white text-xs font-bold flex items-center justify-center">
                  ۴
                </span>
                <h3 className="font-extrabold text-base">متن کارت تبریک اختصاصی</h3>
              </div>

              <textarea
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                rows={3}
                placeholder="متن پیام تبریک دلخواه شما..."
                className="w-full bg-[#FAF8F5] text-sm font-calligraphy text-[#1C2826] p-4 rounded-2xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none leading-relaxed"
              />
              <p className="text-[11px] text-[#8C8375] flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#0F4C3A]" />
                <span>این کارت تبریک چاپ شده و داخل جعبه قرار می‌گیرد.</span>
              </p>

              {/* Voice Greeting Option */}
              <div className="pt-3 border-t border-[#EAE6DF]">
                <VoiceMessageRecorder
                  voiceRecording={voiceRecording}
                  onRecordingComplete={(rec) => setVoiceRecording(rec)}
                  onRecordingDeleted={() => setVoiceRecording(null)}
                  label="ضبط پیام صوتی همراه با هدیه (اختیاری)"
                  helperText="می‌توانید یک تبریک صوتی گرم ضبط کنید تا به صورت QR Code اختصاصی روی کارت چاپ شده و توسط گیرنده شنیده شود."
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

