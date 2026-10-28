import {
  HomepageCMSConfig,
  HeaderConfig,
  HeroConfig,
  ProductSectionConfig,
  PromotionalBannerItem,
  ConsultationSectionConfig,
  CorporateSectionConfig,
  BlogSectionConfig,
  FooterConfig,
  HomepageSeoConfig,
  SectionOrderConfig,
  GlobalSiteConfig,
} from '../types';
const HERO_BANNER_IMAGE = '/assets/images/luxury_hero_banner_1786406338371.jpg';

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  logoImage: '',
  logoAlt: 'فروشگاه یادمان | پک‌های هدیه و سازمانی',
  websiteName: 'یادمان',
  announcementText: 'ارسال رایگان برای سفارش‌های بالای ۳ میلیون تومان | بسته‌بندی هاردباکس و خطاطی کارت هدیه',
  showAnnouncement: true,
  phoneText: 'مشاوره و سفارش سازمانی: ۰۲۱-۸۸۸۸۰۰۰۰',
  phoneLink: '02188880000',
  showPhone: true,
  searchPlaceholder: 'جستجو در میان پک‌های هدیه، سازمانی و مناسبتی...',
  showSearch: true,
  navItems: [
    { id: 'nav-home', label: 'صفحه اصلی', targetTab: 'home', iconName: 'Gift', visible: true },
    { id: 'nav-catalog', label: 'پک‌های هدیه', targetTab: 'catalog', iconName: 'Gift', visible: true },
    { id: 'nav-corporate', label: 'هدایای سازمانی', targetTab: 'corporate', iconName: 'Building2', visible: true },
    { id: 'nav-consultation', label: 'مشاوره انتخاب هدیه', targetTab: 'consultation', iconName: 'Headphones', badge: 'رایگان', visible: true },
    { id: 'nav-builder', label: 'پک‌های اختصاصی', targetTab: 'builder', iconName: 'Sparkles', visible: true },
    { id: 'nav-blog', label: 'مجله یادمان', targetTab: 'blog', iconName: 'BookOpen', visible: true },
  ],
};

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  badgeText: 'پک‌های هدیه لوکس و سازمانی',
  showBadge: true,
  mainTitle: 'هدیه‌ای برای ماندن در یاد',
  highlightedTitle: 'با سلیقه شما',
  description: 'پک‌های هدیه باکیفیت برای مناسبت‌های شخصی و سازمانی؛ با امکان انتخاب محصولات و شخصی‌سازی بسته‌بندی.',
  heroImage: HERO_BANNER_IMAGE,
  heroImageAlt: 'پک هدیه اختصاصی و نفیس یادمان',
  primaryButtonText: 'مشاهده پک‌ها',
  primaryButtonAction: 'catalog',
  showPrimaryButton: true,
  secondaryButtonText: 'سفارش سازمانی',
  secondaryButtonAction: 'corporate',
  showSecondaryButton: true,
  tertiaryButtonText: 'ساخت پک اختصاصی',
  tertiaryButtonAction: 'builder',
  showTertiaryButton: true,
  showFloatingCard: true,
  floatingCardTitle: 'بسته‌بندی اختصاصی',
  floatingCardText: 'هر پک با دقت بسته‌بندی و آماده ارسال می‌شود.',
  showBenefits: true,
  benefits: [
    {
      id: 'benefit-1',
      title: 'کیفیت تضمین‌شده',
      description: 'انتخاب محصولات باکیفیت برای هر پک',
      iconName: 'Award',
      visible: true,
    },
    {
      id: 'benefit-2',
      title: 'بسته‌بندی اختصاصی',
      description: 'امکان شخصی‌سازی بسته‌بندی و مهر مومی',
      iconName: 'Stamp',
      visible: true,
    },
    {
      id: 'benefit-3',
      title: 'ارسال مطمئن',
      description: 'بسته‌بندی ایمن و ارسال به سراسر کشور',
      iconName: 'ShieldCheck',
      visible: true,
    },
    {
      id: 'benefit-4',
      title: 'پشتیبانی سفارش',
      description: 'همراه شما از انتخاب تا تحویل',
      iconName: 'Heart',
      visible: true,
    },
  ],
};

export const DEFAULT_PRODUCTS_CONFIG: ProductSectionConfig = {
  id: 'featured-products',
  title: 'ویترین پک‌های هدیه',
  description: 'بسته‌بندی اختصاصی هاردباکس همراه با امکان درج کارت تبریک و مهر و موم',
  showCategories: true,
  productIds: [], // Empty means show all in default ordering
  displayLimit: 6,
  viewAllButtonText: 'مشاهده همه هدایا در فروشگاه با فیلترهای پیشرفته',
  showViewAllButton: true,
  visible: true,
};

export const DEFAULT_BANNERS_CONFIG: PromotionalBannerItem[] = [];

export const DEFAULT_CONSULTATION_CONFIG: ConsultationSectionConfig = {
  badgeText: 'مشاوره تخصصی و همراهی اختصاصی',
  title: 'برای انتخاب بهترین هدیه، با ما مشورت کنید',
  description: 'اگر برای انتخاب پک مناسب، تعداد سفارش، بودجه یا شخصی‌سازی هدیه نیاز به راهنمایی دارید، کارشناسان ما در کنار شما هستند.',
  primaryButtonText: 'دریافت مشاوره',
  primaryButtonType: 'personal',
  secondaryButtonText: 'مشاوره سازمانی',
  secondaryButtonType: 'corporate',
  showButtons: true,
  benefits: [
    { id: 'c-b-1', text: 'مشاوره متناسب با بودجه', iconName: 'ShieldCheck' },
    { id: 'c-b-2', text: 'سفارش‌های عمده و سازمانی', iconName: 'Building2' },
    { id: 'c-b-3', text: 'پاسخ‌گویی سریع و دقیق', iconName: 'Clock' },
  ],
  cardTitle: 'چگونه به شما کمک می‌کنیم؟',
  cardSubtitle: 'همراهی در تمام مراحل انتخاب و ارسال',
  cardBadgeText: 'خدمت اختصاصی',
  cardItems: [
    'پیشنهاد پک بر اساس مناسبت (نوروز، یلدا، روز پزشک، تولد و قدردانی)',
    'تنظیم اقلام پک متناسب با سقف بودجه مدنظر شما',
    'امکان ارسال نمونه فیزیکی پیش از سفارش تیراژ برای سازمان‌ها',
    'طراحی هویت بصری، روبان سازمانی و مهر مومی اختصاصی',
  ],
  cardBottomNote: 'پاسخگویی سریع توسط مشاوران',
  visible: true,
};

export const DEFAULT_CORPORATE_CONFIG: CorporateSectionConfig = {
  badgeText: 'هدایای سازمانی',
  title: 'هدایای سازمانی و مدیریتی با لوگوی اختصاصی شما',
  description: 'ارائه پک‌های هدیه سازمانی برای شرکت‌ها و سازمان‌ها. امکان درج لوگو، مهر مومی اختصاصی و سفارشی‌سازی محتوای هر پک.',
  features: [
    {
      id: 'corp-f-1',
      title: 'برندینگ اختصاصی',
      description: 'امکان حک لوگو روی پلاک برنجی، مهر مومی اختصاصی و درج کارت تبریک با لوگوی سازمان.',
      iconName: 'Stamp',
    },
    {
      id: 'corp-f-2',
      title: 'تخفیف سفارش‌های عمده',
      description: 'تخفیف ویژه برای سفارش‌های با تیراژ بالا به همراه صدور فاکتور رسمی.',
      iconName: 'Award',
    },
    {
      id: 'corp-f-3',
      title: 'ارسال نمونه پیش از سفارش',
      description: 'امکان آماده‌سازی و ارسال نمونه اولیه برای بررسی قبل از ثبت نهایی سفارش.',
      iconName: 'FileText',
    },
  ],
  discountTableTitle: 'جدول تخفیف سفارش‌های سازمانی:',
  discountTiers: [
    { id: 'tier-1', quantityRange: 'سفارش‌های ۲۰ تا ۵۰ عدد', discountText: '۵٪ تخفیف + پلاک اختصاصی' },
    { id: 'tier-2', quantityRange: 'سفارش‌های ۵۱ تا ۱۰۰ عدد', discountText: '۱۰٪ تخفیف + مهر مومی اختصاصی' },
    { id: 'tier-3', quantityRange: 'سفارش‌های بالاتر از ۱۰۱ عدد', discountText: '۱۵٪ تخفیف + ارسال رایگان' },
  ],
  contactTitle: 'ارتباط با واحد هدایای سازمانی:',
  contactPhone: '۰۲۱-۸۸۸۸۰۰۰۰ (داخلی ۱۰۴)',
  contactHours: 'پاسخگویی: شنبه تا چهارشنبه ۹ الی ۱۷',
  contactEmail: 'corporate@yadman.ir',
  showForm: true,
  visible: true,
};

export const DEFAULT_BLOG_CONFIG: BlogSectionConfig = {
  badgeText: 'مجله یادمان',
  title: 'از مجله یادمان',
  description: 'ایده‌ها، راهنماها و مقالات تخصصی انتخاب هدیه، تشریفات سازمانی و بسته‌بندی فاخر',
  viewAllButtonText: 'مشاهده همه مقالات',
  selectedPostIds: [],
  displayLimit: 3,
  visible: true,
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  description: 'یادمان؛ طراحی و ارائه‌دهنده پک‌های هدیه فاخر، هدایای سازمانی و محصولات اصیل ایرانی با بسته‌بندی‌های خاص و مهر و موم مومی.',
  showGuarantees: true,
  guarantees: [
    { id: 'g-1', title: 'مهر و موم دست‌ساز', description: 'بسته‌بندی اختصاصی با مهر و موم مومی', iconName: 'Stamp' },
    { id: 'g-2', title: 'تضمین کیفیت', description: 'زعفران سوپر نگین و صنایع دستی اصیل', iconName: 'ShieldCheck' },
    { id: 'g-3', title: 'کارت تبریک اختصاصی', description: 'چاپ متن دلخواه روی کارت تبریک', iconName: 'Heart' },
    { id: 'g-4', title: 'پشتیبانی و مشاوره', description: 'پاسخگویی روزهای کاری از ۸ تا ۲۱', iconName: 'Phone' },
  ],
  quickLinksTitle: 'دسترسی سریع',
  quickLinks: [
    { id: 'ql-1', label: 'پک‌های هدیه زعفران', target: 'catalog' },
    { id: 'ql-2', label: 'ساخت پک اختصاصی', target: 'builder' },
    { id: 'ql-3', label: 'هدیه‌های سازمانی', target: 'corporate' },
    { id: 'ql-4', label: 'مجله یادمان (مقالات و راهنماها)', target: 'blog' },
  ],
  contactTitle: 'ارتباط با مجموعه یادمان',
  address: 'تهران، خیابان فرشته، مجتمع تشریفاتی یادمان، پلاک ۱۲',
  phone: '۰۲۱-۸۸۸۸۰۰۰۰',
  email: 'info@yadman.ir',
  socialInstagram: 'https://instagram.com/yadman_gifts',
  socialTelegram: 'https://t.me/yadman_gifts_official',
  socialWhatsapp: 'https://wa.me/989121112233',
  socialLinkedin: 'https://linkedin.com/company/yadman',
  copyrightText: '© ۱۴۰۵ تمامی حقوق برای برند «یادمان» محفوظ است.',
  showSocials: true,
  visible: true,
};

export const DEFAULT_SEO_CONFIG: HomepageSeoConfig = {
  metaTitle: 'یادمان | پک‌های هدیه لوکس و هدایای سازمانی فاخر',
  metaDescription: 'یادمان؛ ارائه پک‌های هدیه لوکس زعفران، صنایع دستی و هدایای سازمانی با امکان ساخت آنلاین پک و بسته‌بندی اختصاصی با مهر و موم مومی.',
  canonicalUrl: 'https://yadman.ir',
  ogTitle: 'یادمان | هدیه‌ای برای ماندن در یاد',
  ogDescription: 'پک‌های هدیه فاخر شخصی و سازمانی با کیفیت تضمین شده و بسته‌بندی هاردباکس لوکس.',
  ogImage: HERO_BANNER_IMAGE,
  keywords: ['پک هدیه', 'هدیه سازمانی', 'پک زعفران', 'هدیه تبلیغاتی', 'هاردباکس', 'یادمان', 'هدیه نفیس', 'هدیه مدیران'],
};

export const DEFAULT_GLOBAL_CONFIG: GlobalSiteConfig = {
  websiteName: 'یادمان',
  websiteNameEn: 'Yadman Luxury Gifts',
  tagline: 'انتخابی برای هدیه‌های ماندگار',
  logoImage: '',
  faviconImage: '',
  primaryColor: '#0F4C3A',
  secondaryColor: '#D4AF37',
  mainFont: 'Vazirmatn',
  defaultSeoTitle: 'یادمان | پک‌های هدیه و هدایای سازمانی',
  defaultSeoDescription: 'یادمان؛ انتخابی برای هدیه‌های ماندگار. ارائه پک‌های هدیه شخصی و سازمانی با امکان شخصی‌سازی و طراحی پک اختصاصی.',
  phone: '۰۲۱-۸۸۸۸۰۰۰۰',
  email: 'info@yadman.ir',
  address: 'تهران، خیابان فرشته، مجتمع تشریفاتی یادمان، پلاک ۱۲',
  instagram: 'yadman_gifts',
  telegram: 'yadman_gifts_official',
  whatsapp: '+989121112233',
};

export const DEFAULT_SECTION_ORDER: SectionOrderConfig[] = [
  { id: 'hero', label: 'بخش آغازین و معرفی (Hero)', enabled: true },
  { id: 'product_showcase', label: 'ویترین پک‌های هدیه (Products)', enabled: true },
  { id: 'banners', label: 'بنرهای تبلیغاتی و اطلاعیه‌ها (Banners)', enabled: true },
  { id: 'consultation', label: 'بخش مشاوره انتخاب هدیه (Consultation)', enabled: true },
  { id: 'corporate', label: 'هدایای سازمانی و شرکتی (Corporate B2B)', enabled: true },
  { id: 'blog', label: 'مطالب منتخب مجله یادمان (Blog)', enabled: true },
];

export const DEFAULT_HOMEPAGE_CMS_CONFIG: HomepageCMSConfig = {
  sectionOrder: DEFAULT_SECTION_ORDER,
  header: DEFAULT_HEADER_CONFIG,
  hero: DEFAULT_HERO_CONFIG,
  products: DEFAULT_PRODUCTS_CONFIG,
  banners: DEFAULT_BANNERS_CONFIG,
  consultation: DEFAULT_CONSULTATION_CONFIG,
  corporate: DEFAULT_CORPORATE_CONFIG,
  blog: DEFAULT_BLOG_CONFIG,
  footer: DEFAULT_FOOTER_CONFIG,
  seo: DEFAULT_SEO_CONFIG,
  global: DEFAULT_GLOBAL_CONFIG,
};
