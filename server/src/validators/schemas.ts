import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  email: z.string().email('فرمت ایمیل نامعتبر است'),
  phone: z.string().optional(),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  companyName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('فرمت ایمیل نامعتبر است'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

export const createProductSchema = z.object({
  titleFa: z.string().min(2, 'عنوان محصول الزامی است'),
  titleEn: z.string().optional(),
  sku: z.string().min(2, 'کد کالا الزامی است'),
  slug: z.string().optional(),
  categoryId: z.string().min(1, 'دسته‌بندی الزامی است'),
  price: z.number().positive('قیمت باید عددی مثبت باشد'),
  oldPrice: z.number().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  description: z.string().min(5, 'توضیحات الزامی است'),
  shortDescription: z.string().optional(),
  image: z.string().min(1, 'تصویر اصلی الزامی است'),
  itemsIncluded: z.array(z.string()).optional().default([]),
  boxType: z.string().optional().default('هاردباکس لوکس'),
  ribbonColor: z.string().optional().default('زرشکی'),
  ribbonColorHex: z.string().optional().default('#8B0000'),
  waxSeal: z.string().optional().default('مهر موم طلایی'),
  badge: z.string().optional(),
  weightGrams: z.number().optional().default(500),
  dimensions: z.string().optional(),
  materials: z.string().optional(),
  shippingInfo: z.string().optional(),
  customizationOptions: z.string().optional(),
  inStock: z.boolean().optional().default(true),
  stockQuantity: z.number().int().min(0).default(10),
  lowStockThreshold: z.number().int().min(0).default(3),
  status: z.string().optional().default('ACTIVE'),
  tags: z.array(z.string()).optional(),
  occasions: z.array(z.string()).optional(),
  giftType: z.string().optional(),
  boxPackagingType: z.string().optional(),
  suitableFor: z.array(z.string()).optional(),
  brandOrigin: z.string().optional(),
  featured: z.boolean().optional().default(false),
  isB2BRecommended: z.boolean().optional().default(false),
  images: z.array(z.any()).optional(),
  videos: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'نام سفارش‌دهنده الزامی است'),
  customerPhone: z.string().min(10, 'شماره تماس معتبر الزامی است'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  deliveryAddress: z.string().min(5, 'آدرس تحویل الزامی است'),
  deliveryCity: z.string().optional().default('تهران'),
  deliveryDate: z.string().optional(),
  deliveryTimeSlot: z.string().optional(),
  cardMessage: z.string().optional(),
  cardFont: z.string().optional().default('nastaliq'),
  customPackingNotes: z.string().optional(),
  couponCode: z.string().optional(),
  voiceRecordingUrl: z.string().optional(),
  voiceDuration: z.number().optional(),
  items: z.array(
    z.object({
      productId: z.string().optional(),
      quantity: z.number().int().min(1),
      isCustomBox: z.boolean().optional(),
      customBoxDetails: z.any().optional(),
      ribbonColor: z.string().optional(),
      waxSeal: z.string().optional(),
    })
  ).min(1, 'حداقل یک محصول در سبد خرید الزامی است'),
});

export const createReviewSchema = z.object({
  productId: z.string().min(1, 'شناسه محصول الزامی است'),
  authorName: z.string().min(2, 'نام نویسنده الزامی است'),
  companyName: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, 'متن دیدگاه الزامی است'),
  recipientNote: z.string().optional(),
  voiceRecordingUrl: z.string().optional(),
  voiceDuration: z.number().optional(),
});

export const createCorporateInquirySchema = z.object({
  companyName: z.string().min(2, 'نام شرکت الزامی است'),
  contactName: z.string().min(2, 'نام رابط الزامی است'),
  phone: z.string().min(10, 'شماره تماس الزامی است'),
  email: z.string().email().optional().or(z.literal('')),
  estimatedQuantity: z.string().optional(),
  budgetPerBox: z.string().optional(),
  deliveryDeadline: z.string().optional(),
  notes: z.string().optional(),
  voiceRecordingUrl: z.string().optional(),
  voiceDuration: z.number().optional(),
});

export const createConsultationSchema = z.object({
  name: z.string().min(2, 'نام الزامی است'),
  phone: z.string().min(10, 'شماره تماس الزامی است'),
  email: z.string().email().optional().or(z.literal('')),
  inquiryType: z.string().optional().default('personal'),
  budget: z.string().optional(),
  occasion: z.string().optional(),
  recipientType: z.string().optional(),
  preferredContact: z.string().optional().default('phone'),
  notes: z.string().optional(),
  voiceRecordingUrl: z.string().optional(),
  voiceDuration: z.number().optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(2, 'کد تخفیف الزامی است'),
  discountPercent: z.number().min(1).max(100).optional(),
  discountAmount: z.number().positive().optional(),
  minOrderAmount: z.number().min(0).optional().default(0),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().min(1).optional().default(100),
  isActive: z.boolean().optional().default(true),
  expiresAt: z.string().optional(),
  description: z.string().optional(),
});
