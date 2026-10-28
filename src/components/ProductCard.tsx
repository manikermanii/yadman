import React from 'react';
import { Product } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { Star, Eye, ShoppingBag, Stamp, Check, Heart, Film, Play } from 'lucide-react';
import { giftRelaxTeaImg } from '../data/products';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const hasVideos = Boolean(product.videos && product.videos.some((v) => v.isActive !== false));

  return (
    <div className="group bg-[#FAF8F5] rounded-xl sm:rounded-2xl border border-[#EAE6DF] hover:border-[#D4AF37]/60 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden relative">
      
      {/* Top Image Box */}
      <div
        className="relative aspect-[4/3] w-full bg-[#F4EFE6] overflow-hidden cursor-pointer flex items-center justify-center p-1.5 sm:p-2"
        onClick={() => onQuickView(product)}
      >
        <img
          src={product.image || giftRelaxTeaImg}
          alt={product.titleFa}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== giftRelaxTeaImg) {
              target.src = giftRelaxTeaImg;
            }
          }}
        />

        {/* Badge Overlay */}
        {product.badge && (
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-[#0F4C3A] text-[#FAF8F5] text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs border border-[#D4AF37]/40 leading-none">
            {product.badge}
          </span>
        )}

        {/* Wax Seal Overlay Badge */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#FAF8F5]/90 backdrop-blur-2xs px-1.5 py-0.5 rounded-md border border-[#EAE6DF] flex items-center gap-1 shadow-2xs">
          <Stamp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#0F4C3A]" />
          <span className="text-[8px] sm:text-[9px] text-[#0F4C3A] font-semibold leading-none">{product.waxSeal}</span>
        </div>

        {/* Video Indicator Pill */}
        {hasVideos && (
          <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black/75 backdrop-blur-2xs px-1.5 py-0.5 rounded-md border border-[#D4AF37]/40 flex items-center gap-1 text-white shadow-2xs">
            <Play className="w-2.5 h-2.5 text-[#D4AF37] fill-current" />
            <span className="text-[8px] font-bold text-[#FAF8F5] leading-none">ویدیو</span>
          </div>
        )}

        {/* Wishlist Heart Button */}
        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className={`absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 p-1.5 rounded-full backdrop-blur-2xs transition shadow-2xs ${
              isWishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-[#0F4C3A] hover:text-rose-500'
            }`}
            title={isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          >
            <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>
        )}

        {/* Quick View Hover Button Overlay */}
        <div className="absolute inset-0 bg-[#0F4C3A]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            id={`quick-view-btn-${product.id}`}
            className="pointer-events-auto bg-[#FAF8F5] text-[#0F4C3A] hover:bg-[#D4AF37] hover:text-[#0F4C3A] p-2 rounded-full shadow-md transition-all transform translate-y-2 group-hover:translate-y-0"
            title="مشاهده جزئیات و سفارشی‌سازی"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between text-right space-y-2">
        
        <div>
          {/* Rating & Reviews */}
          <div className="flex items-center justify-between text-[10px] text-[#8C8375] mb-1 gap-1">
            <span className="text-[9px] sm:text-[10px] text-[#0F4C3A] font-medium bg-[#0F4C3A]/5 px-1.5 py-0.5 rounded-md truncate max-w-[60%]">
              {product.boxType.length > 18 ? `${product.boxType.slice(0, 18)}...` : product.boxType}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
              <span className="font-bold text-[#1C2826] text-[10px] sm:text-[11px]">{toPersianDigits(product.rating)}</span>
              <span className="text-[9px]">({toPersianDigits(product.reviewsCount)})</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onQuickView(product)}
            className="font-bold text-xs sm:text-sm text-[#0F4C3A] hover:text-[#D4AF37] cursor-pointer line-clamp-1 transition-colors leading-snug"
          >
            {product.titleFa}
          </h3>

          {/* Ribbon Color Preview */}
          <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-[11px] text-[#3A4A45]">
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: product.ribbonColorHex }}
              title={product.ribbonColor}
            />
            <span className="text-[10px] text-[#6A7873] truncate">
              روبان: {product.ribbonColor}
            </span>
          </div>
        </div>

        {/* Included Items Preview Pills */}
        <div className="flex flex-wrap gap-1 my-0.5">
          {product.itemsIncluded.slice(0, 2).map((item, idx) => (
            <span
              key={idx}
              className="text-[9px] sm:text-[10px] bg-[#F4EFE6] text-[#2C3B37] px-1.5 py-0.5 rounded-md line-clamp-1"
            >
              ✓ {item}
            </span>
          ))}
          {product.itemsIncluded.length > 2 && (
            <span className="text-[9px] text-[#0F4C3A] font-bold px-0.5 py-0.5">
              +{toPersianDigits(product.itemsIncluded.length - 2)}
            </span>
          )}
        </div>

        {/* Pricing & Add Button */}
        <div className="pt-2 border-t border-[#EAE6DF] flex items-center justify-between gap-1.5">
          
          <div className="text-right min-w-0">
            {product.oldPrice && (
              <span className="text-[9px] sm:text-[10px] text-[#8C8375] line-through block leading-tight">
                {formatToman(product.oldPrice)}
              </span>
            )}
            <span className="text-xs sm:text-sm font-extrabold text-[#0F4C3A] block truncate">
              {formatToman(product.price)}
            </span>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            id={`add-to-cart-btn-${product.id}`}
            className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-[#FAF8F5] px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-2xs shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>افزودن</span>
          </button>

        </div>

      </div>

    </div>
  );
};
