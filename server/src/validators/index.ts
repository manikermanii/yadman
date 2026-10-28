import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'نام و نام خانوادگی باید حداقل ۲ حرف باشد'),
  phoneNumber: z.string().regex(/^(\+98|0)?9\d{9}$/, 'شماره موبایل وارد شده معتبر نیست'),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  accountType: z.enum(['personal', 'corporate']).optional(),
  corporateName: z.string().optional(),
  jobTitle: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'شماره موبایل یا ایمیل را وارد کنید'),
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
});

export const adminLoginSchema = z.object({
  email: z.string().min(3, 'نام کاربری یا ایمیل ادمین را وارد کنید'),
  password: z.string().min(1, 'رمز عبور ادمین را وارد کنید'),
});

const noBase64Url = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      const lower = val.trim().toLowerCase();
      return !lower.startsWith('data:image/') && !lower.includes(';base64,');
    },
    {
      message: 'ارسال تصویر به صورت داده خام Base64 مجاز نیست. لطفاً ابتدا تصویر را آپلود فرمایید.',
    }
  );

export const productCreateSchema = z.object({
  id: z.string().optional(),
  titleFa: z.string().min(2, 'عنوان محصول الزامی است'),
  titleEn: z.string().optional().nullable(),
  sku: z.string().min(2, 'کد کالا الزامی است'),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0, 'قیمت باید مثبت باشد'),
  oldPrice: z.number().optional().nullable(),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
  description: z.string().optional().default(''),
  shortDescription: z.string().optional().nullable(),
  image: noBase64Url.optional().default(''),
  images: z
    .array(
      z.union([
        noBase64Url,
        z
          .object({
            url: noBase64Url,
            thumbnailUrl: noBase64Url.optional().nullable(),
            altText: z.string().optional().nullable(),
            sortOrder: z.number().optional(),
            isPrimary: z.boolean().optional(),
          })
          .passthrough(),
      ])
    )
    .optional(),
  videos: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  itemsIncluded: z.array(z.string()).optional(),
  boxType: z.string().optional(),
  ribbonColor: z.string().optional(),
  ribbonColorHex: z.string().optional(),
  waxSeal: z.string().optional(),
  badge: z.string().optional().nullable(),
  weightGrams: z.number().optional(),
  dimensions: z.string().optional().nullable(),
  materials: z.string().optional().nullable(),
  shippingInfo: z.string().optional().nullable(),
  customizationOptions: z.string().optional().nullable(),
  stockQuantity: z.number().min(0).default(50),
  lowStockThreshold: z.number().optional(),
  inStock: z.boolean().default(true),
  status: z.string().optional().default('active'),
  tags: z.array(z.string()).optional(),
  occasions: z.array(z.string()).optional(),
  giftType: z.string().optional().nullable(),
  boxPackagingType: z.string().optional().nullable(),
  suitableFor: z.array(z.string()).optional(),
  brandOrigin: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  isB2BRecommended: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const orderCreateSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2, 'نام گیرنده را وارد کنید'),
    phoneNumber: z.string().min(10, 'شماره تماس الزامی است'),
    email: z.string().email().optional().or(z.literal('')),
    province: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    postalCode: z.string().optional(),
    recipientName: z.string().optional(),
    recipientPhone: z.string().optional(),
    deliveryDate: z.string().optional(),
    specialInstructions: z.string().optional(),
    giftCardMessage: z.string().optional(),
    voiceRecording: z.any().optional(),
  }),
  items: z.array(
    z.object({
      id: z.string().optional(),
      productId: z.string().optional(),
      quantity: z.number().min(1),
      price: z.number().optional(),
      isCustomBox: z.boolean().optional(),
      customBoxDetails: z.any().optional(),
      cardMessage: z.string().optional(),
      voiceRecording: z.any().optional(),
      recipientName: z.string().optional(),
      deliveryDate: z.string().optional(),
      ribbonColor: z.string().optional(),
      waxSeal: z.string().optional(),
    })
  ).min(1, 'سبد خرید خالی است'),
  couponCode: z.string().optional(),
  shippingMethod: z.enum(['express_courier', 'post_pishtaz', 'chapar_vip', 'in_person']).default('post_pishtaz').optional(),
  paymentMethod: z.enum(['online', 'card_to_card', 'corporate_invoice']).default('online').optional(),
  shippingCost: z.number().optional(),
  subtotal: z.number().optional(),
  totalAmount: z.number().optional(),
});

export const couponValidateSchema = z.object({
  code: z.string().min(2, 'کد تخفیف را وارد کنید'),
  cartTotal: z.number().min(0),
});

export const reviewCreateSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'شناسه محصول الزامی است'),
  authorName: z.string().min(2, 'نام نویسنده الزامی است'),
  companyName: z.string().optional().nullable(),
  rating: z.coerce.number().min(1).max(5, 'امتیاز باید بین ۱ تا ۵ باشد'),
  comment: z.string().min(3, 'متن دیدگاه را بنویسید'),
  voiceRecording: z.any().optional().nullable(),
  recipientNote: z.string().optional().nullable(),
  isVerifiedPurchase: z.boolean().optional(),
  isVerifiedBuyer: z.boolean().optional(),
});

export const corporateInquirySchema = z.object({
  companyName: z.string().min(2, 'نام شرکت الزامی است'),
  contactName: z.string().min(2, 'نام مسئول ارتباط الزامی است'),
  phone: z.string().min(10, 'شماره تماس الزامی است'),
  email: z.string().email().optional().or(z.literal('')),
  estimatedQuantity: z.string().min(1, 'تعداد تقریبی را مشخص کنید'),
  budgetPerBox: z.string().min(1, 'بودجه مدنظر را مشخص کنید'),
  occasion: z.string().optional(),
  deliveryDate: z.string().optional(),
  customizationTypes: z.array(z.string()).optional(),
  uploadedLogoUrl: z.string().optional(),
  notes: z.string().optional(),
  voiceRecording: z.any().optional(),
});

export const consultationSchema = z.object({
  fullName: z.string().min(2, 'نام و نام خانوادگی الزامی است'),
  phone: z.string().min(10, 'شماره تماس الزامی است'),
  email: z.string().email().optional().or(z.literal('')),
  customerType: z.enum(['personal', 'corporate']).default('personal'),
  companyName: z.string().optional(),
  topic: z.string().default('box_selection'),
  approxBudget: z.string().optional(),
  quantityNeeded: z.string().optional(),
  occasion: z.string().optional(),
  targetDate: z.string().optional(),
  description: z.string().optional(),
  preferredContactMethod: z.enum(['phone', 'whatsapp', 'online']).default('phone'),
  voiceRecording: z.any().optional(),
});

export const blogPostCreateSchema = z.object({
  title: z.string().min(2, 'عنوان مقاله الزامی است'),
  slug: z.string().min(2, 'نامک (اسلاگ) الزامی است'),
  excerpt: z.string().min(3, 'خلاصه مقاله الزامی است'),
  content: z.string().min(5, 'متن کامل مقاله الزامی است'),
  coverImage: z.string().min(1, 'تصویر شاخص الزامی است'),
  coverImageAlt: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'دسته‌بندی الزامی است'),
  authorId: z.string().min(1, 'نویسنده الزامی است'),
  status: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.enum(['draft', 'published', 'scheduled', 'archived'])
  ).default('published'),
  tags: z.array(z.string()).optional(),
  relatedProductIds: z.array(z.string()).optional(),
  readingTimeMinutes: z.coerce.number().min(1).default(5),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  focusKeyword: z.string().optional().nullable(),
  publishedAt: z.string().optional().nullable(),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial();

export const blogCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  nameFa: z.string().optional(),
  slug: z.string().min(2, 'نامک دسته‌بندی الزامی است'),
  description: z.string().optional().nullable(),
  descriptionFa: z.string().optional().nullable(),
  sortOrder: z.coerce.number().optional().default(1),
}).refine((data) => Boolean((data.nameFa && data.nameFa.trim()) || (data.name && data.name.trim())), {
  message: 'نام دسته‌بندی الزامی است',
  path: ['nameFa'],
});

export const blogAuthorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'نام نویسنده الزامی است'),
  role: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  socialLink: z.string().optional().nullable(),
});

export const addToCartSchema = z.object({
  productId: z.string().optional(),
  quantity: z.number().int().min(1, 'تعداد باید حداقل ۱ باشد').default(1),
  ribbonColor: z.string().optional().nullable(),
  waxSeal: z.string().optional().nullable(),
  cardMessage: z.string().optional().nullable(),
  recipientName: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  voiceRecordingUrl: z.string().optional().nullable(),
  voiceDuration: z.number().optional().nullable(),
  isCustomBox: z.boolean().optional().default(false),
  customBoxDetails: z.any().optional(),
}).refine(data => data.isCustomBox || Boolean(data.productId), {
  message: 'شناسه محصول یا جزئیات باکس اختصاصی الزامی است',
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'تعداد نامعتبر است'),
});

export const wishlistAddSchema = z.object({
  productId: z.string().min(1, 'شناسه محصول الزامی است'),
});

export const categoryCreateSchema = z.object({
  id: z.string().optional(),
  nameFa: z.string().min(1, 'نام دسته‌بندی الزامی است'),
  nameEn: z.string().optional().default(''),
  slug: z.string().optional(),
  descriptionFa: z.string().optional().default(''),
  iconName: z.string().optional().default('Gift'),
  isFeatured: z.boolean().optional().default(false),
});

export const categoryUpdateSchema = z.object({
  nameFa: z.string().min(1, 'نام دسته‌بندی الزامی است').optional(),
  nameEn: z.string().optional(),
  slug: z.string().optional(),
  descriptionFa: z.string().optional(),
  iconName: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
});

export const couponCreateSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, 'کد تخفیف باید حداقل ۲ کاراکتر باشد'),
  type: z.enum(['percentage', 'fixed']).optional(),
  value: z.coerce.number().positive('مقدار تخفیف باید بزرگتر از صفر باشد').optional(),
  discountPercent: z.coerce.number().min(1, 'درصد تخفیف باید حداقل ۱ باشد').max(100, 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد').optional().nullable(),
  discountAmount: z.coerce.number().positive('مبلغ تخفیف باید بزرگتر از صفر باشد').optional().nullable(),
  minOrderAmount: z.coerce.number().min(0, 'حداقل مبلغ سفارش نمی‌تواند منفی باشد').optional().default(0),
  maxDiscountAmount: z.coerce.number().positive().optional().nullable(),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  usageLimit: z.coerce.number().int().min(1, 'سقف استفاده باید حداقل ۱ باشد').optional().default(100),
  isActive: z.boolean().optional().default(true),
  startDate: z.any().optional().nullable(),
  startDateFa: z.string().optional().nullable(),
  expiresAt: z.any().optional().nullable(),
  expiresAtFa: z.string().optional().nullable(),
  description: z.string().optional().default(''),
});

export const couponUpdateSchema = couponCreateSchema.partial();
