import { Product, CustomContentItem, WaxSealOption, RibbonOption, BoxTypeOption, ProductReview, Coupon } from '../types';

import heroBannerImg from '../assets/images/luxury_hero_banner_1786406338371.jpg';

// Real product images
import giftYaldaImg from '../assets/images/product_yalda.jpg';
import giftNutsImg from '../assets/images/product_nuts.jpg';
import giftRelaxTeaImg from '../assets/images/product_relax_tea.jpg';
import giftIsfahanImg from '../assets/images/product_isfahan.jpg';
import giftTechImg from '../assets/images/product_tech.jpg';
import giftHafezImg from '../assets/images/product_hafez.jpg';
import giftEspressoImg from '../assets/images/product_espresso.jpg';
import giftBaristaImg from '../assets/images/product_barista.jpg';

export {
  giftYaldaImg,
  giftNutsImg,
  giftRelaxTeaImg,
  giftIsfahanImg,
  giftTechImg,
  giftHafezImg,
  giftEspressoImg,
  giftBaristaImg,
};

export const HERO_BANNER_IMAGE = heroBannerImg;

export const PRODUCTS: Product[] = [];

export const CUSTOM_ITEMS: CustomContentItem[] = [];

export const BOX_TYPES: BoxTypeOption[] = [
  {
    id: 'box-cream-hardbox',
    nameFa: 'هاردباکس کرم بافت‌دار مخملی',
    price: 380000,
    material: 'مقوای فشرده ۱۲۰۰ گرمی با روکش کتان متالایز',
    colorHex: '#F5EFE3',
    capacityItems: 4,
    dimensions: '۳۰ × ۲۲ × ۹ سانتی‌متر',
  },
  {
    id: 'box-walnut-wood',
    nameFa: 'صندوقچه چوب گردو با قفل برنجی سنتی',
    price: 850000,
    material: 'چوب طبیعی گردوی تیره با آستر جیر سبز یشمی و قفل عتیقه',
    colorHex: '#3A271D',
    capacityItems: 6,
    dimensions: '۳۸ × ۲۸ × ۱۲ سانتی‌متر',
  },
  {
    id: 'box-emerald-velvet',
    nameFa: 'هاردباکس مخمل سبز زمردی با مگنت مخفی',
    price: 520000,
    material: 'روکش مخمل ابریشمی فرانسوی با قاب طلایی',
    colorHex: '#0B3D32',
    capacityItems: 5,
    dimensions: '۳۴ × ۲۴ × ۱۰ سانتی‌متر',
  },
  {
    id: 'box-kraft-minimal',
    nameFa: 'جعبه کرافت ارگانیک با پنجره لمینت مات',
    price: 240000,
    material: 'کرافت دوستدار طبیعت با فوم برش‌خورده مخملی',
    colorHex: '#D2B48C',
    capacityItems: 3,
    dimensions: '۲۶ × ۱۸ × ۸ سانتی‌متر',
  },
];

export const RIBBONS: RibbonOption[] = [
  { id: 'ribbon-emerald', nameFa: 'سبز زمردی سلطنتی (ساتن براق)', colorHex: '#0B3D32' },
  { id: 'ribbon-gold', nameFa: 'طلایی شامپاینی متالیک', colorHex: '#C9B27C' },
  { id: 'ribbon-burgundy', nameFa: 'زرشکی کهن (مخملی)', colorHex: '#7A1C28' },
  { id: 'ribbon-navy', nameFa: 'سرمه‌ای درباری', colorHex: '#1B2A4A' },
  { id: 'ribbon-cream', nameFa: 'کرم عاجی نچرال', colorHex: '#EAE1D0' },
  { id: 'ribbon-black', nameFa: 'مشکی مات مدرن', colorHex: '#1C2826' },
];

export const WAX_SEALS: WaxSealOption[] = [
  { id: 'seal-eslimi', nameFa: 'طرح اسلیمی و ختایی ایرانی', colorHex: '#C9B27C', symbol: '⚜️', symbolName: 'اسلیمی زرین' },
  { id: 'seal-sun', nameFa: 'طرح مهر خورشید آریایی', colorHex: '#0B3D32', symbol: '☀️', symbolName: 'خورشید زمردی' },
  { id: 'seal-rose', nameFa: 'طرح گل سرخ شیراز', colorHex: '#7A1C28', symbol: '🌹', symbolName: 'گل سرخ لاکی' },
  { id: 'seal-classic-crown', nameFa: 'طرح تاج فاخر سلطنتی', colorHex: '#2C3E50', symbol: '👑', symbolName: 'تاج سرمه‌ای' },
  { id: 'seal-corporate-logo', nameFa: 'مهر مومی با لوگوی اختصاصی سازمان', colorHex: '#B8860B', symbol: '🏢', symbolName: 'لوگوی شرکتی' },
];

export const INITIAL_REVIEWS: ProductReview[] = [];

export const INITIAL_COUPONS: Coupon[] = [];
