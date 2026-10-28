export type CategoryId =
  | 'all'
  | 'gift_boxes'
  | 'corporate'
  | 'executive'
  | 'occasions'
  | 'yalda'
  | 'nowruz'
  | 'welcome_kits'
  | 'promotional'
  | 'custom_boxes'
  | 'saffron'
  | 'handicraft'
  | 'perfume'
  | 'vip'
  | 'zodiac';

export interface Category {
  id: CategoryId;
  nameFa: string;
  nameEn: string;
  slug: string;
  descriptionFa: string;
  iconName?: string;
  isFeatured?: boolean;
  productCount?: number;
}

export interface VoiceRecordingData {
  dataUrl: string; // Base64 Data URL or audio URL
  url?: string;
  duration: number; // duration in seconds
  mimeType?: string;
  createdAt?: string;
  sizeBytes?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  companyName?: string;
  rating: number; // 1 to 5
  comment: string;
  voiceRecording?: VoiceRecordingData;
  createdAt?: string;
  createdAtFa: string;
  approved?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  isVerifiedPurchase?: boolean;
  isVerifiedBuyer?: boolean;
  likesCount?: number;
  recipientNote?: string;
}

export type ProductStatus = 'active' | 'draft' | 'out_of_stock' | 'archived';

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
}

export type VideoPlatform = 'aparat' | 'youtube' | 'vimeo' | 'direct';

export interface ProductVideo {
  id: string;
  productId?: string;
  platform: VideoPlatform;
  videoId: string;
  videoUrl: string;
  embedUrl: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  uploadDate?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  titleFa: string;
  sku?: string;
  price?: number;
  priceModifier?: number;
  stockQuantity: number;
  attributes: { [key: string]: string };
  imageIndex?: number;
  inStock?: boolean;
}

export interface Product {
  id: string;
  titleFa: string;
  titleEn?: string;
  sku: string;
  category: CategoryId;
  price: number; // in Tomans
  oldPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewsCount: number;
  shortDescription?: string;
  description: string;
  image: string; // Main / primary cover image for backwards compatibility
  images?: ProductImage[]; // Unlimited product images relation
  additionalImages?: string[];
  videos?: ProductVideo[]; // External lightweight product videos (Aparat, YouTube, etc.)
  itemsIncluded: string[];
  boxType: string;
  ribbonColor: string;
  ribbonColorHex: string;
  waxSeal: string;
  badge?: string;
  weightGrams: number;
  dimensions?: string; // e.g. 30 × 22 × 10 سانتی‌متر
  materials?: string; // e.g. چوب گردو طبیعی، روکش مخمل، ظروف برنجی
  shippingInfo?: string; // e.g. ارسال با پیک فوری در تهران و ۲ روزه پستی
  customizationOptions?: string; // e.g. امکان چاپ لوگوی اختصاصی و پلاک برنجی
  inStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  status?: ProductStatus;
  tags?: string[];
  occasions?: string[]; // e.g. ['یلدا', 'نوروز', 'تولد', 'هدیه مدیران', 'سازمانی']
  giftType?: string; // e.g. 'شخصی' | 'سازمانی' | 'مدیریتی' | 'اقتصادی' | 'لوکس و VIP'
  boxPackagingType?: string; // e.g. 'هاردباکس' | 'صندوقچه چوبی' | 'چرم و مخمل' | 'کرافت مینیمال' | 'کشویی'
  suitableFor?: string[]; // e.g. ['آقایان', 'بانوان', 'مدیران ارشد', 'پرسنل و همکاران']
  brandOrigin?: string; // e.g. 'قائنات' | 'اصفهان' | 'کاشان' | 'تبریز' | 'شیراز'
  salesCount?: number;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  featured?: boolean;
  isB2BRecommended?: boolean;
  slug?: string;
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  metaKeywords?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SortOptionKey =
  | 'bestseller'
  | 'popular'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'discount';

export interface ProductFilterState {
  category: CategoryId | 'all';
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  pricePreset?: string;
  occasions: string[];
  giftTypes: string[];
  boxPackagingTypes: string[];
  suitableFor: string[];
  brandOrigins: string[];
  inStockOnly: boolean;
  discountOnly: boolean;
  minRating: number;
  sortBy: SortOptionKey;
  page: number;
}

export interface FilterFacetOption {
  value: string;
  label: string;
  count: number;
  iconName?: string;
}

export interface CustomContentItem {
  id: string;
  nameFa: string;
  category: 'saffron' | 'sweets' | 'crafts' | 'drinks' | 'scent' | 'cards' | 'nuts';
  price: number;
  image: string;
  weightGrams: number;
  description: string;
  inStock: boolean;
}

export interface WaxSealOption {
  id: string;
  nameFa: string;
  colorHex: string;
  symbol: string;
  symbolName: string;
}

export interface RibbonOption {
  id: string;
  nameFa: string;
  colorHex: string;
}

export interface BoxTypeOption {
  id: string;
  nameFa: string;
  price: number;
  material: string;
  colorHex: string;
  image?: string;
  capacityItems: number;
  dimensions: string;
}

export interface CartItem {
  id: string; // unique cart item id
  product?: Product;
  productTitleFa?: string;
  productImage?: string;
  unitPrice?: number;
  isCustomBox?: boolean;
  customBoxDetails?: {
    boxType: BoxTypeOption;
    ribbon: RibbonOption;
    waxSeal: WaxSealOption;
    items: CustomContentItem[];
    cardMessage: string;
    cardFont: string;
    totalPrice: number;
    voiceRecording?: VoiceRecordingData;
  };
  quantity: number;
  cardMessage?: string;
  voiceRecording?: VoiceRecordingData;
  recipientName?: string;
  deliveryDate?: string;
  ribbonColor?: string;
  waxSeal?: string;
}

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'packaged'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type ShippingMethod = 'express_courier' | 'post_pishtaz' | 'chapar_vip' | 'in_person';
export type PaymentMethod = 'online' | 'card_to_card' | 'corporate_invoice';

export interface OrderCustomerInfo {
  fullName: string;
  phoneNumber: string;
  email?: string;
  province: string;
  city: string;
  postalCode?: string;
  address: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryDate?: string;
  specialInstructions?: string;
  giftCardMessage?: string;
  voiceRecording?: VoiceRecordingData;
}

export type CustomerInfo = OrderCustomerInfo;

export interface Order {
  id: string; // e.g. HD-849201
  userId?: string; // Linked registered user ID if authenticated
  customer: OrderCustomerInfo;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode?: string;
  totalPrice: number;
  status: OrderStatus;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'failed';
  voiceRecording?: VoiceRecordingData;
  createdAt: string; // ISO string
  createdAtFa: string; // Persian date string
  adminNotes?: string;
  trackingNumber?: string;
}

export type AccountType = 'personal' | 'corporate';
export type UserRole = 'customer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserAddress {
  id: string;
  title: string; // e.g. خانه، محل کار، دفتر شرکت
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
}

export interface CorporateProfile {
  companyName: string;
  jobTitle: string; // سمت سازمانی e.g. مدیر منابع انسانی، مسئول روابط عمومی
  corporatePhone: string;
  economicCode?: string; // کد اقتصادی
  nationalId?: string; // شناسه ملی
  industry?: string;
}

export interface User {
  id: string; // e.g. USR-1001
  fullName: string;
  name?: string;
  phoneNumber: string;
  phone?: string;
  email?: string;
  passwordHash: string;
  passwordSalt: string;
  accountType: AccountType; // 'personal' | 'corporate'
  corporateProfile?: CorporateProfile;
  role: UserRole;
  status: UserStatus;
  addresses: UserAddress[];
  wishlist: string[]; // Product IDs
  cart?: CartItem[];
  createdAt: string;
  createdAtFa: string;
  lastLoginAt?: string;
  lastLoginAtFa?: string;
  ordersCount?: number;
  totalSpent?: number;
  adminNotes?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
}

export interface PasswordResetRequest {
  id: string;
  identifier: string; // phone or email
  code: string; // 5-digit verification code
  token: string;
  expiresAt: number;
  verified: boolean;
}

export type CorporateInquiryStatus =
  | 'new'
  | 'contacted'
  | 'sample_sent'
  | 'approved'
  | 'rejected'
  | 'closed';

export interface CorporateInquiry {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
  estimatedQuantity: string;
  budgetPerBox: string;
  occasion?: string;
  deliveryDate?: string;
  customizationTypes?: string[]; // e.g. ['چاپ لوگو روی جعبه', 'پلاک فلزی طلایی', 'روبان با رنگ سازمانی']
  uploadedLogoUrl?: string;
  logoFileName?: string;
  notes?: string;
  voiceRecording?: VoiceRecordingData;
  status: CorporateInquiryStatus;
  createdAt: string;
  createdAtFa: string;
  adminNotes?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 10 for 10% or 200000 for 200k tomans
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount?: number;
  isActive: boolean;
  startDate?: string;
  startDateFa?: string;
  expiresAt?: string;
  expiresAtFa?: string;
  description?: string;
}

export type ConsultationCustomerType = 'personal' | 'corporate';

export type ConsultationTopic =
  | 'box_selection'
  | 'corporate_gift'
  | 'custom_box'
  | 'bulk_order'
  | 'customization'
  | 'other';

export type ConsultationStatus =
  | 'new'
  | 'in_review'
  | 'contacted'
  | 'completed'
  | 'cancelled';

export interface ConsultationRequest {
  id: string; // e.g. CNS-9021
  fullName: string;
  phone: string;
  email?: string;
  customerType: ConsultationCustomerType; // مشتری شخصی | شرکت / سازمان
  companyName?: string; // If corporate
  topic: ConsultationTopic; // موضوع مشاوره
  approxBudget?: string; // بودجه تقریبی
  quantityNeeded?: string; // تعداد مورد نیاز
  occasion?: string; // مناسبت
  targetDate?: string; // زمان مورد نیاز
  description?: string; // توضیحات
  voiceRecording?: VoiceRecordingData;
  preferredContactMethod?: 'phone' | 'whatsapp' | 'online'; // روش مشاوره
  status: ConsultationStatus; // جدید | در حال بررسی | تماس گرفته شد | تکمیل شده | لغو شده
  createdAt: string;
  createdAtFa: string;
  adminNotes?: string;
  assignedConsultant?: string;
}

export interface HeaderNavItemConfig {
  id: string;
  label: string;
  targetTab: string; // 'home' | 'catalog' | 'corporate' | 'consultation' | 'builder' | 'blog'
  iconName: string;
  badge?: string;
  visible: boolean;
}

export interface HeaderConfig {
  logoImage?: string;
  logoAlt?: string;
  websiteName?: string;
  announcementText: string;
  showAnnouncement: boolean;
  phoneText: string;
  phoneLink: string;
  showPhone: boolean;
  searchPlaceholder: string;
  showSearch: boolean;
  navItems: HeaderNavItemConfig[];
}

export interface HeroBenefitItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  visible: boolean;
}

export interface HeroConfig {
  badgeText: string;
  showBadge: boolean;
  mainTitle: string;
  highlightedTitle: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  primaryButtonText: string;
  primaryButtonAction: string; // 'catalog' | 'corporate' | 'builder' | 'consultation' | 'ai'
  showPrimaryButton: boolean;
  secondaryButtonText: string;
  secondaryButtonAction: string;
  showSecondaryButton: boolean;
  tertiaryButtonText: string;
  tertiaryButtonAction: string;
  showTertiaryButton: boolean;
  showFloatingCard: boolean;
  floatingCardTitle: string;
  floatingCardText: string;
  benefits: HeroBenefitItem[];
  showBenefits: boolean;
}

export interface ProductSectionConfig {
  id: string;
  title: string;
  badgeText?: string;
  description: string;
  showCategories: boolean;
  showCategoryFilter?: boolean;
  productIds: string[]; // List of specific product IDs in order (empty means default)
  selectedProductIds?: string[];
  displayLimit: number;
  viewAllButtonText: string;
  showViewAllButton: boolean;
  visible: boolean;
}

export interface PromotionalBannerItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  badgeText?: string;
  buttonText: string;
  buttonAction: string; // 'catalog' | 'corporate' | 'builder' | 'consultation' | 'ai' | url
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  visible: boolean;
}

export interface ConsultationBenefitItem {
  id: string;
  text: string;
  iconName: string;
}

export interface ConsultationSectionConfig {
  badgeText: string;
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonType: 'personal' | 'corporate';
  secondaryButtonText: string;
  secondaryButtonType: 'personal' | 'corporate';
  showButtons: boolean;
  benefits: ConsultationBenefitItem[];
  cardTitle: string;
  cardSubtitle: string;
  cardBadgeText: string;
  cardItems: string[];
  cardBottomNote: string;
  visible: boolean;
}

export interface CorporateFeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface CorporateDiscountTier {
  id: string;
  quantityRange: string;
  discountText: string;
}

export interface CorporateSectionConfig {
  badgeText: string;
  title: string;
  description: string;
  features: CorporateFeatureItem[];
  discountTableTitle: string;
  discountTiers: CorporateDiscountTier[];
  contactTitle: string;
  contactPhone: string;
  contactHours: string;
  contactEmail: string;
  showForm: boolean;
  visible: boolean;
}

export interface BlogSectionConfig {
  badgeText: string;
  title: string;
  description: string;
  viewAllButtonText: string;
  selectedPostIds?: string[]; // Empty means latest published
  displayLimit: number;
  visible: boolean;
}

export interface FooterGuaranteeItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface FooterMenuItem {
  id: string;
  label: string;
  target: string;
}

export interface FooterConfig {
  description: string;
  showGuarantees: boolean;
  guarantees: FooterGuaranteeItem[];
  quickLinksTitle: string;
  quickLinks: FooterMenuItem[];
  contactTitle: string;
  address: string;
  phone: string;
  email: string;
  socialInstagram: string;
  socialTelegram: string;
  socialWhatsapp: string;
  socialLinkedin?: string;
  copyrightText: string;
  showSocials: boolean;
  visible: boolean;
}

export interface HomepageSeoConfig {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string[];
}

export type HomepageSectionType =
  | 'hero'
  | 'product_showcase'
  | 'banners'
  | 'consultation'
  | 'corporate'
  | 'blog';

export interface SectionOrderConfig {
  id: HomepageSectionType;
  label: string;
  enabled: boolean;
}

export interface GlobalSiteConfig {
  websiteName: string;
  websiteNameEn: string;
  tagline: string;
  logoImage?: string;
  faviconImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  mainFont?: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  telegram: string;
  whatsapp?: string;
}

export interface HomepageCMSConfig {
  sectionOrder: SectionOrderConfig[];
  header: HeaderConfig;
  hero: HeroConfig;
  products: ProductSectionConfig;
  banners: PromotionalBannerItem[];
  consultation: ConsultationSectionConfig;
  corporate: CorporateSectionConfig;
  blog: BlogSectionConfig;
  footer: FooterConfig;
  seo: HomepageSeoConfig;
  global?: GlobalSiteConfig;
}

export interface StoreSettings {
  storeName?: string;
  storeNameFa: string;
  storeNameEn: string;
  tagline?: string;
  announcementText: string;
  freeShippingThreshold: number;
  supportPhone: string;
  corporatePhone: string;
  corporateEmail: string;
  isStoreActive: boolean;
  customRibbonEnabled: boolean;
  waxSealEnabled: boolean;
  freeCalligraphyEnabled: boolean;
  heroImage?: string; // Active main homepage hero image
  // SEO Site-wide Defaults
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  canonicalBaseUrl: string;
  instagramHandle: string;
  telegramHandle: string;
  homepage?: HomepageCMSConfig;
}

export type AdminSection =
  | 'dashboard'
  | 'orders'
  | 'users'
  | 'consultations'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'inquiries'
  | 'blog'
  | 'custom_items'
  | 'discounts'
  | 'reviews'
  | 'homepage'
  | 'settings';

export type BlogPostStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export interface BlogAuthor {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio?: string;
  email?: string;
  socialLink?: string;
}

export interface BlogCategory {
  id: string;
  nameFa: string;
  slug: string;
  descriptionFa?: string;
  iconName?: string;
  sortOrder: number;
  postCount?: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown or rich HTML supported
  coverImage: string;
  coverImageAlt?: string;
  status: BlogPostStatus;
  publishedAt?: string; // ISO String
  publishedAtFa?: string; // e.g. "۲۲ بهمن ۱۴۰۴"
  scheduledFor?: string;
  readingTimeMinutes: number; // e.g. 5
  authorId: string;
  categoryId: string;
  tags: string[];
  relatedProductIds: string[]; // Association with store products
  isFeatured?: boolean;
  viewsCount?: number;
  likesCount?: number;
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  focusKeyword?: string;
  createdAt: string;
  updatedAt: string;
}

