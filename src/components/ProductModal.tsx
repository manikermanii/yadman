import React, { useState, useEffect } from 'react';
import { Product, RibbonOption, WaxSealOption, ProductReview, ProductImage, ProductVideo, VoiceRecordingData } from '../types';
import { RIBBONS, WAX_SEALS, giftRelaxTeaImg } from '../data/products';
import { formatToman, toPersianDigits, formatWeight } from '../utils/formatters';
import { normalizeProductImages } from '../utils/imageOptimizer';
import { normalizeProductVideos, generateVideoObjectSchema, SUPPORTED_PLATFORMS } from '../utils/videoService';
import { ProductVideoPlayer } from './video/ProductVideoPlayer';
import { VoiceMessageRecorder } from './common/VoiceMessageRecorder';
import { AudioPlayer } from './common/AudioPlayer';
import { api } from '../services/api';
import {
  X,
  Star,
  ShoppingBag,
  Stamp,
  Gift,
  Check,
  Sparkles,
  Feather,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageSquare,
  Send,
  Heart,
  Boxes,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Play,
  Film,
  Video,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  reviews?: ProductReview[];
  onAddReview?: (review: ProductReview) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onAddToCartWithOptions: (
    product: Product,
    selectedRibbon: RibbonOption,
    selectedWaxSeal: WaxSealOption,
    cardMessage: string,
    recipientName: string
  ) => void;
  currentUser?: { fullName?: string; name?: string; companyName?: string } | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  reviews = [],
  onAddReview,
  isWishlisted = false,
  onToggleWishlist,
  onAddToCartWithOptions,
  currentUser,
}) => {
  const [mediaMode, setMediaMode] = useState<'image' | 'video'>('image');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [activeModalTab, setActiveModalTab] = useState<'customize' | 'videos' | 'specs' | 'reviews'>('customize');
  const [selectedRibbon, setSelectedRibbon] = useState<RibbonOption>(
    RIBBONS.find((r) => r.colorHex === product?.ribbonColorHex) || RIBBONS[0]
  );
  const [selectedWaxSeal, setSelectedWaxSeal] = useState<WaxSealOption>(WAX_SEALS[0]);
  const [cardMessage, setCardMessage] = useState(
    'با بهترین آرزوها و صمیمانه‌ترین درودها برای شما، امیدوارم روزهایتان معطر به شادی و برکت باشد.'
  );
  const [recipientName, setRecipientName] = useState('');
  const [addedAnimation, setAddedAnimation] = useState(false);

  // New review form states
  const [reviewAuthor, setReviewAuthor] = useState(currentUser?.fullName || currentUser?.name || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewVoiceRecording, setReviewVoiceRecording] = useState<VoiceRecordingData | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [dbProductReviews, setDbProductReviews] = useState<ProductReview[]>([]);

  // Fetch approved reviews from database for this product
  useEffect(() => {
    if (product?.id) {
      api.reviews.getProductReviews(product.id)
        .then((data) => {
          if (Array.isArray(data)) {
            setDbProductReviews(data);
          }
        })
        .catch(() => {});
    }
  }, [product?.id]);

  useEffect(() => {
    if ((currentUser?.fullName || currentUser?.name) && !reviewAuthor) {
      setReviewAuthor(currentUser.fullName || currentUser.name || '');
    }
  }, [currentUser]);

  // Sync active media index when product changes
  useEffect(() => {
    if (product) {
      setMediaMode('image');
      setActiveImageIndex(0);
      setActiveVideoIndex(0);
      setActiveModalTab('customize');
      setSelectedRibbon(RIBBONS.find((r) => r.colorHex === product.ribbonColorHex) || RIBBONS[0]);
    }
  }, [product?.id]);

  if (!product) return null;

  // Normalized product images gallery
  const productImages = normalizeProductImages(
    product.images,
    product.image,
    product.additionalImages,
    product.titleFa
  );

  // Normalized active product videos
  const activeVideos = normalizeProductVideos(product.videos).filter((v) => v.isActive !== false);

  const currentImage = productImages[activeImageIndex] || productImages[0] || {
    url: product.image,
    altText: product.titleFa,
  };

  const currentVideo = activeVideos[activeVideoIndex] || activeVideos[0];

  // Combine dbProductReviews and any passed in reviews that are approved for this product (avoiding duplicates by id)
  const combinedReviews = [...dbProductReviews];
  reviews
    .filter((r) => r.productId === product.id && r.status === 'approved')
    .forEach((r) => {
      if (!combinedReviews.some((cr) => cr.id === r.id)) {
        combinedReviews.push(r);
      }
    });

  const productReviews = combinedReviews;

  const handleAdd = () => {
    onAddToCartWithOptions(
      product,
      selectedRibbon,
      selectedWaxSeal,
      cardMessage,
      recipientName
    );
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 700);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim() || isSubmittingReview) return;

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const createdReview = await api.reviews.create({
        productId: product.id,
        authorName: reviewAuthor.trim(),
        companyName: currentUser?.companyName || undefined,
        rating: reviewRating,
        comment: reviewComment.trim(),
        voiceRecording: reviewVoiceRecording || undefined,
      });

      if (onAddReview && createdReview) {
        onAddReview(createdReview);
      }

      setReviewSubmitted(true);
      setReviewVoiceRecording(null);
    } catch (err: any) {
      console.error('Failed to submit customer review:', err);
      setReviewError(err?.message || 'خطا در ثبت دیدگاه در پایگاه‌داده. لطفاً دوباره تلاش فرمایید.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Structured Data Schema for Google (Product + VideoObject)
  const schemaData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.titleFa,
    image: productImages.map((img) => img.url),
    description: product.description,
    sku: product.sku || product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IRR',
      price: product.price * 10, // Tomans to Rials
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: product.canonicalUrl || `https://yadman.ir/products/${product.slug || product.id}`,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 5.0,
      reviewCount: productReviews.length || product.reviewsCount || 1,
    },
  };

  // Inject VideoObject structured data if product has videos
  if (activeVideos.length > 0) {
    schemaData.subjectOf = activeVideos.map((v) =>
      generateVideoObjectSchema(v, product.titleFa, product.description)
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn" dir="rtl">
      
      {/* Dynamic JSON-LD Schema Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div
        className="relative bg-[#FAF8F5] w-full max-w-4xl rounded-3xl border border-[#D4AF37]/40 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE6DF] bg-[#F4EFE6]/60">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0F4C3A]" />
            <h2 className="font-bold text-[#0F4C3A] text-base sm:text-lg">
              جزئیات و سفارشی‌سازی پک هدیه
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {product && onToggleWishlist && (
              <button
                onClick={() => onToggleWishlist(product)}
                className={`p-2 rounded-full transition flex items-center justify-center ${
                  isWishlisted
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-white text-[#0F4C3A] hover:bg-rose-50 hover:text-rose-500 border border-[#EAE6DF]'
                }`}
                title={isWishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                id="modal-wishlist-toggle-btn"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#3A4A45] hover:text-[#0F4C3A] hover:bg-[#EAE6DF] rounded-full transition"
              id="modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation inside Modal */}
        <div className="flex items-center gap-2 px-6 py-2 bg-[#FAF8F5] border-b border-[#EAE6DF] text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveModalTab('customize')}
            className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
              activeModalTab === 'customize'
                ? 'bg-[#0F4C3A] text-white shadow-xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            سفارشی‌سازی و خرید
          </button>
          
          {activeVideos.length > 0 && (
            <button
              onClick={() => {
                setActiveModalTab('videos');
                setMediaMode('video');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeModalTab === 'videos'
                  ? 'bg-[#0F4C3A] text-white shadow-xs'
                  : 'text-[#6A7873] hover:text-[#0F4C3A]'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>ویدیوهای معرفی ({toPersianDigits(activeVideos.length)})</span>
            </button>
          )}

          <button
            onClick={() => setActiveModalTab('specs')}
            className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
              activeModalTab === 'specs'
                ? 'bg-[#0F4C3A] text-white shadow-xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            مشخصات فنی و اصالت
          </button>
          <button
            onClick={() => setActiveModalTab('reviews')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1 whitespace-nowrap ${
              activeModalTab === 'reviews'
                ? 'bg-[#0F4C3A] text-white shadow-xs'
                : 'text-[#6A7873] hover:text-[#0F4C3A]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>نظرات خریداران ({toPersianDigits(productReviews.length || product.reviewsCount)})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8 text-right">
          
          {/* Left Column (Image & Multi-Media Gallery with Videos) */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Main Active Media Container (Image or Fast External Video Player) */}
            <div className="relative rounded-2xl overflow-hidden border border-[#EAE6DF] bg-[#121B18] shadow-md group aspect-4/3 sm:aspect-square flex items-center justify-center">
              {mediaMode === 'video' && currentVideo ? (
                <div className="w-full h-full flex flex-col justify-center bg-black">
                  <ProductVideoPlayer
                    video={currentVideo}
                    fallbackThumbnail={currentImage.url}
                    autoPlayOnMount={true}
                    showDetails={true}
                    className="rounded-none border-0 shadow-none h-full"
                  />
                </div>
              ) : (
                <>
                  <img
                    src={currentImage.url || giftRelaxTeaImg}
                    alt={currentImage.altText || product.titleFa}
                    className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-102"
                    loading="eager"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== giftRelaxTeaImg) {
                        target.src = giftRelaxTeaImg;
                      }
                    }}
                  />

                  {product.badge && (
                    <div className="absolute top-3 right-3 bg-[#0F4C3A] text-[#FAF8F5] text-xs font-bold px-3 py-1 rounded-full border border-[#D4AF37]/40 shadow-sm">
                      {product.badge}
                    </div>
                  )}

                  {/* Stock Status Badge */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-[#0F4C3A] border border-[#EAE6DF]">
                    {product.inStock ? '✓ موجود در انبار مرکزی' : 'ناموجود'}
                  </div>

                  {/* Gallery Navigation Arrows if multiple images */}
                  {productImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1))
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-[#0F4C3A] shadow-md transition opacity-0 group-hover:opacity-100"
                        title="تصویر قبلی"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-[#0F4C3A] shadow-md transition opacity-0 group-hover:opacity-100"
                        title="تصویر بعدی"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Combined Media Thumbnails Strip (Images + Video Badges) */}
            {(productImages.length > 1 || activeVideos.length > 0) && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                
                {/* 1. Image Thumbnails */}
                {productImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => {
                      setMediaMode('image');
                      setActiveImageIndex(idx);
                    }}
                    className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      mediaMode === 'image' && activeImageIndex === idx
                        ? 'border-[#0F4C3A] ring-2 ring-[#0F4C3A]/20 scale-105'
                        : 'border-[#EAE6DF] opacity-70 hover:opacity-100'
                    }`}
                    title={`مشاهده تصویر ${idx + 1}`}
                  >
                    <img
                      src={img.thumbnailUrl || img.url || giftRelaxTeaImg}
                      alt={img.altText || `${product.titleFa} - تصویر ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== giftRelaxTeaImg) {
                          target.src = giftRelaxTeaImg;
                        }
                      }}
                    />
                  </button>
                ))}

                {/* 2. Video Thumbnails with distinct Play Badge & Platform Tag */}
                {activeVideos.map((video, vIdx) => {
                  const platformMeta = SUPPORTED_PLATFORMS[video.platform] || SUPPORTED_PLATFORMS.aparat;
                  const isCurrentVideoActive = mediaMode === 'video' && activeVideoIndex === vIdx;

                  return (
                    <button
                      key={video.id || vIdx}
                      type="button"
                      onClick={() => {
                        setMediaMode('video');
                        setActiveVideoIndex(vIdx);
                      }}
                      className={`relative shrink-0 w-16 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-black group ${
                        isCurrentVideoActive
                          ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 scale-105'
                          : 'border-[#0F4C3A]/60 opacity-85 hover:opacity-100'
                      }`}
                      title={`پخش ویدیوی: ${video.title || 'محصول'}`}
                    >
                      {video.thumbnailUrl || currentImage.url ? (
                        <img
                          src={video.thumbnailUrl || currentImage.url}
                          alt={video.title || 'ویدیو'}
                          className="w-full h-full object-cover filter brightness-75 group-hover:brightness-90"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#0F4C3A] flex items-center justify-center">
                          <Film className="w-5 h-5 text-[#D4AF37]" />
                        </div>
                      )}

                      {/* Video Play Badge Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#0F4C3A] flex items-center justify-center shadow-md">
                          <Play className="w-3 h-3 fill-current translate-x-[-0.5px]" />
                        </div>
                      </div>

                      {/* Platform Micro-pill */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-[#FAF8F5] text-center font-bold py-0.5">
                        {platformMeta.nameFa}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Included Items Checklist */}
            <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] space-y-2 text-xs">
              <h4 className="font-bold text-[#0F4C3A] flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#D4AF37]" />
                <span>محتویات داخل این پک:</span>
              </h4>
              <ul className="space-y-1.5 text-[#2C3B37] pr-1">
                {product.itemsIncluded.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quality Guarantees */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-[#6A7873]">
              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>ضمانت اصالت زعفران و هنر دست</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#D4AF37]" />
                <span>بسته‌بندی ایمن دو لایه با ضربه‌گیر</span>
              </div>
            </div>
          </div>

          {/* Right Column Content */}
          <div className="md:col-span-7 space-y-6">
            
            {activeModalTab === 'customize' && (
              <>
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8C8375]">
                    <div className="flex items-center text-[#D4AF37]">
                      <Star className="w-4 h-4 fill-[#D4AF37]" />
                      <span className="font-bold mr-1 text-[#1C2826]">{toPersianDigits(product.rating)}</span>
                    </div>
                    <span>•</span>
                    <span>{toPersianDigits(productReviews.length || product.reviewsCount)} نظر ثبت شده</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold font-mono">SKU: {product.sku || product.id}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F4C3A] mt-1.5">{product.titleFa}</h1>
                  <p className="text-xs text-[#4A5A55] leading-relaxed mt-2">{product.description}</p>
                </div>

                {/* Ribbon Customization */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-[#0F4C3A]">انتخاب رنگ روبان و پاپیون ساتن:</label>
                    <span className="text-[#6A7873] font-semibold">{selectedRibbon.nameFa}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {RIBBONS.map((ribbon) => (
                      <button
                        key={ribbon.id}
                        type="button"
                        onClick={() => setSelectedRibbon(ribbon)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-right transition ${
                          selectedRibbon.id === ribbon.id
                            ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] text-[#0F4C3A] font-bold ring-1 ring-[#0F4C3A]'
                            : 'bg-white border-[#E0D8C8] text-[#2C3B37] hover:border-[#0F4C3A]/40'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: ribbon.colorHex }}
                        />
                        <span className="truncate text-[11px]">{ribbon.nameFa}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wax Seal Customization */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-[#0F4C3A] flex items-center gap-1.5">
                      <Stamp className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>انتخاب طرح مهر مومی برجسته درب باکس:</span>
                    </label>
                    <span className="text-[#6A7873] font-semibold">{selectedWaxSeal.nameFa}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {WAX_SEALS.map((seal) => (
                      <button
                        key={seal.id}
                        type="button"
                        onClick={() => setSelectedWaxSeal(seal)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-right transition ${
                          selectedWaxSeal.id === seal.id
                            ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] text-[#0F4C3A] font-bold ring-1 ring-[#0F4C3A]'
                            : 'bg-white border-[#E0D8C8] text-[#2C3B37] hover:border-[#0F4C3A]/40'
                        }`}
                      >
                        <span className="text-base">{seal.symbol}</span>
                        <span className="truncate text-[11px]">{seal.nameFa}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gift Card Message & Calligraphy Preview */}
                <div className="space-y-2 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF]">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0F4C3A]">
                    <span className="flex items-center gap-1">
                      <Feather className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>متن کارت تبریک و دست‌نوشته:</span>
                    </span>
                    <span className="text-[10px] text-[#6A7873]">خطاطی رایگان با قلم و مرکب</span>
                  </div>

                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="نام تحویل‌گیرنده عزیز (مثال: استاد علوی، مهتاب جان...)"
                    className="w-full bg-white text-xs p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none"
                  />

                  <textarea
                    rows={2}
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder="متن دلخواه تبریک شما..."
                    className="w-full bg-white text-xs p-2.5 rounded-xl border border-[#E0D8C8] focus:border-[#0F4C3A] focus:outline-none leading-relaxed"
                  />

                  {cardMessage && (
                    <div className="bg-[#F4EFE6] p-3 rounded-xl border border-[#D4AF37]/30 text-center">
                      <span className="text-[10px] text-[#8C8375] block mb-1">پیش‌نمایش خط نستعلیق روی کارت:</span>
                      <p className="font-calligraphy text-base sm:text-lg text-[#0F4C3A] leading-relaxed">
                        {cardMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* Price & Add to Cart Footer */}
                <div className="pt-4 border-t border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    {product.oldPrice && (
                      <span className="text-xs text-[#8C8375] line-through block">
                        {formatToman(product.oldPrice)}
                      </span>
                    )}
                    <span className="text-2xl font-extrabold text-[#0F4C3A]">
                      {formatToman(product.price)}
                    </span>
                  </div>

                  <button
                    onClick={handleAdd}
                    id="modal-add-to-cart-action-btn"
                    className={`px-8 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
                      addedAnimation
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white'
                    }`}
                  >
                    {addedAnimation ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>به سبد خرید افزوده شد!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                        <span>افزودن این هدیه به سبد خرید</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {activeModalTab === 'videos' && (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#D4AF37]" />
                    <span>ویدیوهای معرفی، آنباکسینگ و بررسی پک ({toPersianDigits(activeVideos.length)} ویدیو)</span>
                  </h3>
                  <span className="text-[10px] text-[#6A7873]">
                    پخش بهینه‌سازی‌شده و بدون کسر ترافیک سرور
                  </span>
                </div>

                {/* Main Video View */}
                {currentVideo && (
                  <div className="space-y-3">
                    <ProductVideoPlayer
                      video={currentVideo}
                      fallbackThumbnail={currentImage.url}
                      autoPlayOnMount={false}
                      showDetails={true}
                    />
                  </div>
                )}

                {/* Video Playlist Selector if more than 1 video */}
                {activeVideos.length > 1 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-[#0F4C3A] text-xs">سایر ویدیوهای این محصول:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeVideos.map((vid, vIdx) => {
                        const isSelected = activeVideoIndex === vIdx;
                        const platform = SUPPORTED_PLATFORMS[vid.platform] || SUPPORTED_PLATFORMS.aparat;

                        return (
                          <div
                            key={vid.id || vIdx}
                            onClick={() => {
                              setActiveVideoIndex(vIdx);
                              setMediaMode('video');
                            }}
                            className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                              isSelected
                                ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] ring-1 ring-[#0F4C3A]'
                                : 'bg-white border-[#EAE6DF] hover:border-[#0F4C3A]/40'
                            }`}
                          >
                            <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-black shrink-0">
                              <img
                                src={vid.thumbnailUrl || currentImage.url}
                                alt={vid.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Play className="w-3 h-3 text-[#D4AF37] fill-current" />
                              </div>
                            </div>

                            <div className="overflow-hidden space-y-0.5 flex-1">
                              <p className={`font-bold text-[11px] truncate ${isSelected ? 'text-[#0F4C3A]' : 'text-[#2C3B37]'}`}>
                                {vid.title || `ویدیوی شماره ${toPersianDigits(vIdx + 1)}`}
                              </p>
                              <span className="text-[9px] text-[#6A7873]">
                                پلتفرم: {platform.nameFa}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] flex items-center justify-between text-[11px] text-[#4A5A55]">
                  <span>تمامی ویدیوها با کیفیت بالا و استانداردهای بسته‌بندی هدیه ثبت شده‌اند.</span>
                  {currentVideo && (
                    <a
                      href={currentVideo.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0F4C3A] font-bold hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>لینک مستقیم در {SUPPORTED_PLATFORMS[currentVideo.platform]?.nameFa || 'آپارات'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {activeModalTab === 'specs' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-extrabold text-sm text-[#0F4C3A]">مشخصات فنی، ابعاد و استانداردهای کیفی باکس</h3>
                
                <div className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden divide-y divide-[#EAE6DF]">
                  <div className="p-3 flex justify-between">
                    <span className="text-[#6A7873]">متریال و نوع جعبه:</span>
                    <span className="font-bold text-[#0F4C3A]">{product.boxType}</span>
                  </div>
                  {product.dimensions && (
                    <div className="p-3 flex justify-between">
                      <span className="text-[#6A7873]">ابعاد جعبه (طول × عرض × ارتفاع):</span>
                      <span className="font-bold text-[#0F4C3A]">{product.dimensions}</span>
                    </div>
                  )}
                  <div className="p-3 flex justify-between">
                    <span className="text-[#6A7873]">وزن ناخالص تقریبی:</span>
                    <span className="font-bold text-[#0F4C3A]">{formatWeight(product.weightGrams)}</span>
                  </div>
                  {product.materials && (
                    <div className="p-3 flex justify-between">
                      <span className="text-[#6A7873]">جنس اقلام و متریال:</span>
                      <span className="font-bold text-[#0F4C3A]">{product.materials}</span>
                    </div>
                  )}
                  <div className="p-3 flex justify-between">
                    <span className="text-[#6A7873]">کد اصالت و رهگیری:</span>
                    <span className="font-mono font-bold text-[#0F4C3A]">{product.sku || product.id}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#6A7873]">شرایط و زمان ارسال:</span>
                    <span className="font-bold text-[#0F4C3A]">{product.shippingInfo || 'ارسال با پیک اکسپرس در تهران و پست پیشتاز برای شهرستان'}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#6A7873]">خدمات چاپ و سفارشی‌سازی سازمانی:</span>
                    <span className="font-bold text-emerald-700">{product.customizationOptions || 'امکان چاپ لوگو و پلاک لیزری برای سفارش‌های بالای ۲۰ عدد'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeModalTab === 'reviews' && (
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#0F4C3A]">
                    تجربه خریداران این پک هدیه
                  </h3>
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    <Star className="w-4 h-4 fill-[#D4AF37]" />
                    <span className="font-bold text-sm text-[#1C2826]">{toPersianDigits(product.rating)}</span>
                    <span className="text-[#8C8375]">از ۵</span>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {productReviews.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] text-center text-[#8C8375]">
                      هنوز نظری برای این پک ثبت نشده است. اولین نفری باشید که تجربه خود را می‌نویسد!
                    </div>
                  ) : (
                    productReviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-3.5 rounded-2xl border border-[#EAE6DF] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0F4C3A]">{rev.authorName}</span>
                            {rev.companyName && (
                              <span className="text-[10px] text-[#6A7873] bg-[#FAF8F5] px-1.5 py-0.5 rounded">
                                {rev.companyName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[#D4AF37]">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-[#D4AF37]" />
                            ))}
                          </div>
                        </div>
                        <p className="text-[#3A4A45] leading-relaxed">{rev.comment}</p>
                        {rev.voiceRecording && (
                          <div className="pt-1">
                            <AudioPlayer
                              recording={rev.voiceRecording}
                              title={`پیام صوتی ${rev.authorName}`}
                              compact={true}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Review Form */}
                <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] space-y-3">
                  <h4 className="font-bold text-[#0F4C3A]">ثبت نظر و امتیاز شما برای این محصول:</h4>
                  {reviewSubmitted ? (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-center font-bold">
                      نظر شما با موفقیت ثبت شد و پس از بازبینی منتشر می‌گردد. با سپاس از شما!
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                      {reviewError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{reviewError}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={reviewAuthor}
                          onChange={(e) => setReviewAuthor(e.target.value)}
                          placeholder="نام و نام خانوادگی شما"
                          className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] focus:outline-none"
                        />
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] focus:outline-none font-bold text-[#0F4C3A]"
                        >
                          <option value="5">۵ ستاره - فوق‌العاده عالی</option>
                          <option value="4">۴ ستاره - بسیار خوب</option>
                          <option value="3">۳ ستاره - معمولی</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="تجربه شما در خصوص کیفیت بسته‌بندی، عطر زعفران و تحویل..."
                        className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] focus:outline-none"
                      />

                      {/* Voice Review Recording */}
                      <VoiceMessageRecorder
                        voiceRecording={reviewVoiceRecording}
                        onRecordingComplete={(rec) => setReviewVoiceRecording(rec)}
                        onRecordingDeleted={() => setReviewVoiceRecording(null)}
                        label="ضبط پیام صوتی همراه با نظر (اختیاری)"
                        helperText="می‌توانید حس و تجربه خود از باز کردن و لمس جعبه را صوتی بازگو کنید."
                        compact={true}
                      />

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="bg-[#0F4C3A] hover:bg-[#0B3C2E] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition"
                      >
                        {isSubmittingReview ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                        ) : (
                          <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                        )}
                        <span>{isSubmittingReview ? 'در حال ارسال...' : 'ارسال نظر'}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
