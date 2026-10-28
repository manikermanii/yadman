import { prisma, isDbConnected } from '../config/database.js';

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-corporate',
    name: 'هدایای سازمانی و تشریفاتی',
    slug: 'corporate-gifts',
    description: 'راهنما و ایده‌های تخصصی برای پیشکش‌ها و هدایای شرکتی و سازمانی فاخر',
  },
  {
    id: 'cat-guide',
    name: 'راهنمای هدیه و بسته‌بندی',
    slug: 'gift-guide',
    description: 'آداب انتخاب هدیه، پالت‌های رنگی روبان و بسته‌بندی هاردباکس فاخر با مهر و موم',
  },
  {
    id: 'cat-saffron',
    name: 'اصالت زعفران و سنت‌ها',
    slug: 'traditions-saffron',
    description: 'داستان سرخی زعفران قائنات، ترمه دست‌بافت و سوغات اصیل ایرانی',
  },
];

const DEFAULT_AUTHORS = [
  {
    id: 'author-editor',
    name: 'تحریریه یادمان',
    role: 'هیئت تحریریه و تولید محتوا',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'تیم پژوهش و تولید محتوای تخصصی فروشگاه هدایای تشریفاتی یادمان',
  },
  {
    id: 'author-sara',
    name: 'سارا مهدی‌زاده',
    role: 'کارشناس ارشد تشریفات و بسته‌بندی',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    bio: 'طراح بسته‌بندی‌های لوکس و هاردباکس‌های سفارشی با مهر و موم اختصاصی',
  },
];

const DEFAULT_POSTS = [
  {
    id: 'post-luxury-corporate-guide',
    title: 'راهنمای جامع انتخاب هدایای سازمانی و شرکتی فاخر',
    slug: 'corporate-gifting-guide',
    excerpt: 'اصول و آداب انتخاب پیشکش‌های ماندگار برای مدیران ارشد، شرکای تجاری و پرسنل کلیدی در مناسبت‌های ملی و بین‌المللی.',
    content: `<h2>اهمیت انتخاب هدیه سازمانی هوشمندانه</h2>\n<p>در فضای کسب‌وکار امروز، پیشکش‌های سازمانی فراتر از یک یادبود ساده هستند؛ آن‌ها نمایانگر هویت برند، سلیقه و عمق احترامی است که شما برای شرکای تجاری‌تان قائلید.</p>\n\n<div class="callout callout-emerald">\n  <p><strong>اصل اساسی:</strong> یک هدیه سازمانی موفق، ترکیبی از اصالت، کاربردی بودن و بسته‌بندی تشریفاتی بی‌نقص است.</p>\n</div>\n\n<h2>چرا هاردباکس و مهر و موم اختصاصی؟</h2>\n<p>اولین تماس بصری و لمسی مخاطب با بسته‌بندی هدیه صورت می‌گیرد. هاردباکس‌های مستحکم با روکش پارچه‌ای یا مخمل و مهر و موم‌های مومی با لوگوی اختصاصی، تجربه‌ای هیجان‌انگیز از جعبه‌گشایی خلق می‌کنند.</p>\n\n<h2>پیشنهاد محتوای داخل باکس</h2>\n<ul>\n  <li>زعفران نگین قائنات در ظروف کریستال یا خاتم</li>\n  <li>دمنوش‌های ارگانیک با شیشه‌های درپوش چوب‌پنبه</li>\n  <li>ماگ سرامیکی دست‌ساز با لعاب مات</li>\n  <li>کارت تبریک دست‌نویس با خطاطی سفارشی</li>\n</ul>`,
    coverImage: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80',
    categoryId: 'cat-corporate',
    authorId: 'author-editor',
    readingTimeMin: 6,
    status: 'PUBLISHED',
    tags: JSON.stringify(['هدایای سازمانی', 'تشریفات', 'هاردباکس', 'مدیران ارشد']),
    seoTitle: 'راهنمای جامع انتخاب هدایای سازمانی و شرکتی فاخر | یادمان',
    seoDescription: 'اصول و آداب انتخاب پیشکش‌های ماندگار برای مدیران ارشد و شرکای تجاری.',
    canonicalUrl: 'https://yadman.ir/blog/corporate-gifting-guide',
  },
  {
    id: 'post-packaging-wax-seal',
    title: 'هنر بسته‌بندی هاردباکس و مهر و موم موم‌نگار در تشریفات هدیه',
    slug: 'luxury-packaging-wax-seal',
    excerpt: 'چگونه رنگ‌بندی روبان ابریشمی و مهر و موم اختصاصی بر ارزش احساسی و اعتبار یک پیشکش نفیس می‌افزاید؟',
    content: `<h2>زیبایی‌شناسی بسته‌بندی فاخر</h2>\n<p>بسته‌بندی هدیه، روایتگر داستانی است که پیش از گشودن جعبه آغاز می‌شود. در تشریفات یادمان، تک‌تک جزئیات از جنس مقوای هاردباکس تا گرماژ روبان، با دقت مهندسی می‌شوند.</p>\n\n<h2>راز ماندگاری مهر و موم</h2>\n<p>استفاده از موم انعطاف‌پذیر اختصاصی یادمان همراه با مهرهای برنجی دست‌تراش، حسی از اصالت و نامه‌نگاری‌های کهن دیپلماتیک را تداعی می‌کند.</p>\n\n<div class="callout callout-gold">\n  <p><strong>نکته هنری:</strong> ترکیب روبان با بافت گروس‌گرین و مهر و موم زرین، هماهنگی بی‌نظیری با جعبه‌های سبز زمردی ایجاد می‌کند.</p>\n</div>`,
    coverImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    categoryId: 'cat-guide',
    authorId: 'author-sara',
    readingTimeMin: 5,
    status: 'PUBLISHED',
    tags: JSON.stringify(['بسته‌بندی لوکس', 'مهر و موم', 'هاردباکس', 'روبان ابریشمی']),
    seoTitle: 'هنر بسته‌بندی هاردباکس و مهر و موم در تشریفات هدیه | یادمان',
    seoDescription: 'بررسی تاثیر روانی و زیبایی‌شناسی بسته‌بندی تشریفاتی و مهر و موم مومی.',
    canonicalUrl: 'https://yadman.ir/blog/luxury-packaging-wax-seal',
  },
  {
    id: 'post-saffron-tradition',
    title: 'قصه سرخی زعفران قائنات و پیشکش‌های اصیل ایرانی',
    slug: 'persian-saffron-heritage',
    excerpt: 'مروری بر تاریخچه طلای سرخ ایران، جایگاه زعفران سوپر نگین در دیپلماسی هدیه و ترکیب آن با هنر دست ایرانی.',
    content: `<h2>طلای سرخ؛ نماد میزبانی و احترام ایرانیان</h2>\n<p>زعفران از دیرباز نه‌تنها چاشنی گرامی مطبخ‌های ایرانی، بلکه نشانه‌ای از برکت، خوش‌آمدگویی و شایستگی در هدیه‌دادن بوده است.</p>\n\n<h2>ویژگی‌های زعفران اعلا برای هدیه</h2>\n<ul>\n  <li>رشته‌های بلند و سالم سوپر نگین بدون کلاله زرد</li>\n  <li>عطر اصیل بدون اسانس‌های افزودنی</li>\n  <li>بسته‌بندی در ظروف غیرقابل نفوذ به نور و هوا</li>\n</ul>\n\n<div class="callout callout-emerald">\n  <p><strong>توصیه کارشناس:</strong> برای هدیه به مهمانان خارجی و دیپلماتیک، زعفران در هاون‌های برنجی کوچک انتخابی بی‌همتاست.</p>\n</div>`,
    coverImage: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1200&q=80',
    categoryId: 'cat-saffron',
    authorId: 'author-editor',
    readingTimeMin: 4,
    status: 'PUBLISHED',
    tags: JSON.stringify(['زعفران قائنات', 'سوغات اصیل', 'ترمه', 'صنایع دستی']),
    seoTitle: 'قصه سرخی زعفران قائنات و پیشکش‌های اصیل ایرانی | یادمان',
    seoDescription: 'تاریخچه طلای سرخ ایران و جایگاه زعفران سوپر نگین در پک‌های هدیه یادمان.',
    canonicalUrl: 'https://yadman.ir/blog/persian-saffron-heritage',
  },
  {
    id: 'post-draft-gifting-trends',
    title: 'روندهای نوین طراحی پک‌های هدیه در سال جدید (پیش‌نویس تحریریه)',
    slug: 'new-gifting-trends-draft',
    excerpt: 'بررسی الگوهای نوین ترکیب اقلام ارگانیک، فناوری و آثار دست‌ساز در بسته‌بندی‌های مدرن یادمان.',
    content: `<h2>پیش‌نویس جهت بررسی نهایی تحریریه</h2>\n<p>این مقاله به عنوان پیش‌نویس ذخیره شده تا پس از تکمیل مصاحبه با طراحان بسته‌بندی منتشر شود.</p>\n<p>محورهای اصلی شامل مینیمالیسم در رنگ‌بندی، بسته‌بندی‌های بازیافت‌پذیر و هوشمندسازی کارت‌های هدیه صوتی می‌باشد.</p>`,
    coverImage: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1200&q=80',
    categoryId: 'cat-guide',
    authorId: 'author-sara',
    readingTimeMin: 3,
    status: 'DRAFT',
    tags: JSON.stringify(['روندهای جدید', 'طراحی مدرن', 'پیش‌نویس']),
    seoTitle: 'روندهای نوین طراحی پک‌های هدیه | یادمان',
    seoDescription: 'بررسی الگوهای نوین طراحی و بسته‌بندی هدایای نفیس.',
    canonicalUrl: 'https://yadman.ir/blog/new-gifting-trends-draft',
  },
];

export function formatCategoryFromPrisma(c: any) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    nameFa: c.name,
    slug: c.slug,
    description: c.description || '',
    descriptionFa: c.description || '',
    sortOrder: 1,
    postCount: c._count?.posts ?? 0,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function formatAuthorFromPrisma(a: any) {
  if (!a) return null;
  return {
    id: a.id,
    name: a.name,
    role: a.role || '',
    avatar: a.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: a.bio || '',
    email: '',
    socialLink: '',
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function formatPostFromPrisma(p: any, includeContent = true) {
  if (!p) return null;
  let tags: string[] = [];
  try {
    if (typeof p.tags === 'string') {
      tags = JSON.parse(p.tags || '[]');
    } else if (Array.isArray(p.tags)) {
      tags = p.tags;
    }
  } catch {
    tags = p.tags ? p.tags.split(',').map((t: string) => t.trim()) : [];
  }

  const publishedAt = p.publishedAt ? new Date(p.publishedAt) : new Date(p.createdAt || Date.now());
  const publishedAtFa = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(publishedAt);

  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || '',
    content: includeContent && p.content ? p.content : '',
    coverImage: p.coverImage || '',
    coverImageAlt: p.title,
    status: (p.status ? p.status.toLowerCase() : 'published'),
    publishedAt: publishedAt.toISOString(),
    publishedAtFa,
    readingTimeMinutes: p.readingTimeMin || 5,
    authorId: p.authorId,
    categoryId: p.categoryId,
    tags,
    relatedProductIds: [],
    isFeatured: false,
    viewsCount: p.viewsCount || 0,
    likesCount: p.likesCount || 0,
    seoTitle: p.seoTitle || p.title,
    seoDescription: p.seoDescription || p.excerpt || '',
    canonicalUrl: p.canonicalUrl || `https://yadman.ir/blog/${p.slug}`,
    ogImage: p.coverImage || '',
    focusKeyword: '',
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    category: p.category ? formatCategoryFromPrisma(p.category) : undefined,
    author: p.author ? formatAuthorFromPrisma(p.author) : undefined,
  };
}

let defaultsEnsured = false;
let cachedBlogResult: any = null;
let lastBlogFetchTime = 0;
const BLOG_CACHE_TTL = 60000; // 60 seconds

export function invalidateBlogCache() {
  cachedBlogResult = null;
  lastBlogFetchTime = 0;
}

export class BlogService {
  async ensureDefaults() {
    if (!isDbConnected() || defaultsEnsured) return;
    defaultsEnsured = true;
    try {
      const catCount = await prisma.blogCategory.count();
      if (catCount === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await prisma.blogCategory.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
          });
        }
      }

      const authorCount = await prisma.blogAuthor.count();
      if (authorCount === 0) {
        for (const author of DEFAULT_AUTHORS) {
          await prisma.blogAuthor.upsert({
            where: { id: author.id },
            update: {},
            create: author,
          });
        }
      }

      const postCount = await prisma.blogPost.count();
      if (postCount === 0) {
        for (const post of DEFAULT_POSTS) {
          await prisma.blogPost.upsert({
            where: { slug: post.slug },
            update: {},
            create: post,
          });
        }
      }
    } catch (err) {
      console.warn('Error ensuring default blog categories/authors/posts:', err);
    }
  }

  async getPosts(query?: {
    categorySlug?: string;
    tag?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    isAdmin?: boolean;
  }) {
    await this.ensureDefaults();

    const isSimplePublicListing =
      !query?.isAdmin &&
      !query?.categorySlug &&
      !query?.tag &&
      !query?.search &&
      (!query?.status || query.status === 'PUBLISHED') &&
      (!query?.page || Number(query.page) === 1);

    const now = Date.now();
    if (isSimplePublicListing && cachedBlogResult && now - lastBlogFetchTime < BLOG_CACHE_TTL) {
      return cachedBlogResult;
    }

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || (query?.isAdmin ? 50 : 12)));
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const where: any = {};

        // Status filtering:
        // If admin or status === 'all', do not restrict by status unless a specific status is provided.
        // If public, default to PUBLISHED.
        if (query?.status && query.status !== 'all') {
          where.status = query.status.toUpperCase();
        } else if (!query?.isAdmin && !query?.status) {
          where.status = 'PUBLISHED';
        }

        if (query?.categorySlug) {
          const cat = await prisma.blogCategory.findFirst({
            where: { OR: [{ slug: query.categorySlug }, { id: query.categorySlug }] },
          });
          if (cat) where.categoryId = cat.id;
        }

        if (query?.search && query.search.trim()) {
          const q = query.search.trim();
          where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { excerpt: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ];
        }

        const [total, posts] = await Promise.all([
          prisma.blogPost.count({ where }),
          prisma.blogPost.findMany({
            where,
            select: {
              id: true,
              slug: true,
              title: true,
              excerpt: true,
              coverImage: true,
              categoryId: true,
              category: true,
              authorId: true,
              author: true,
              readingTimeMin: true,
              viewsCount: true,
              likesCount: true,
              status: true,
              tags: true,
              seoTitle: true,
              seoDescription: true,
              canonicalUrl: true,
              publishedAt: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { publishedAt: 'desc' },
            skip,
            take: limit,
          }),
        ]);

        const result = {
          posts: posts.map((post) => formatPostFromPrisma(post, false)),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          },
        };

        if (isSimplePublicListing) {
          cachedBlogResult = result;
          lastBlogFetchTime = Date.now();
        }

        return result;
      } catch (err) {
        console.warn('Prisma getPosts error:', err);
        if (cachedBlogResult) {
          return cachedBlogResult;
        }
        throw err;
      }
    }

    return {
      posts: [],
      pagination: { total: 0, page: 1, limit, totalPages: 1 },
    };
  }

  async getPostBySlug(slug: string, isAdmin = false) {
    await this.ensureDefaults();

    if (isDbConnected()) {
      try {
        const post = await prisma.blogPost.findFirst({
          where: { OR: [{ slug }, { id: slug }] },
          include: { category: true, author: true },
        });

        if (!post) return null;

        // If not admin and post is draft, don't show to public
        if (!isAdmin && post.status !== 'PUBLISHED') {
          return null;
        }

        // Increment views count asynchronously
        prisma.blogPost.update({
          where: { id: post.id },
          data: { viewsCount: { increment: 1 } },
        }).catch(() => {});

        return formatPostFromPrisma(post);
      } catch (err) {
        console.warn('Prisma getPostBySlug error:', err);
        throw err;
      }
    }

    return null;
  }

  async getCategories() {
    await this.ensureDefaults();

    if (isDbConnected()) {
      try {
        const cats = await prisma.blogCategory.findMany({
          include: { _count: { select: { posts: true } } },
          orderBy: { name: 'asc' },
        });
        return cats.map(formatCategoryFromPrisma);
      } catch (err) {
        console.warn('Prisma getCategories error:', err);
        throw err;
      }
    }

    return DEFAULT_CATEGORIES.map(formatCategoryFromPrisma);
  }

  async getAuthors() {
    await this.ensureDefaults();

    if (isDbConnected()) {
      try {
        const authors = await prisma.blogAuthor.findMany({
          orderBy: { name: 'asc' },
        });
        return authors.map(formatAuthorFromPrisma);
      } catch (err) {
        console.warn('Prisma getAuthors error:', err);
        throw err;
      }
    }

    return DEFAULT_AUTHORS.map(formatAuthorFromPrisma);
  }

  async createPost(data: any) {
    await this.ensureDefaults();

    const now = new Date();
    let categoryId = data.categoryId;
    let authorId = data.authorId;

    if (isDbConnected()) {
      // Ensure valid category exists
      let cat = categoryId ? await prisma.blogCategory.findUnique({ where: { id: categoryId } }) : null;
      if (!cat) {
        cat = await prisma.blogCategory.findFirst();
        if (!cat) {
          cat = await prisma.blogCategory.create({ data: DEFAULT_CATEGORIES[0] });
        }
        categoryId = cat.id;
      }

      // Ensure valid author exists
      let author = authorId ? await prisma.blogAuthor.findUnique({ where: { id: authorId } }) : null;
      if (!author) {
        author = await prisma.blogAuthor.findFirst();
        if (!author) {
          author = await prisma.blogAuthor.create({ data: DEFAULT_AUTHORS[0] });
        }
        authorId = author.id;
      }

      // Generate clean unique slug
      let slug = (data.slug || data.title || `post-${Date.now()}`)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
      
      const existingSlug = await prisma.blogPost.findUnique({ where: { slug } });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const status = (data.status || 'PUBLISHED').toUpperCase();
      const publishedAt = data.publishedAt ? new Date(data.publishedAt) : now;

      const created = await prisma.blogPost.create({
        data: {
          id: data.id || `post-${Date.now()}`,
          title: data.title.trim(),
          slug,
          excerpt: data.excerpt ? data.excerpt.trim() : '',
          content: data.content ? data.content.trim() : '',
          coverImage: data.coverImage || '',
          categoryId,
          authorId,
          readingTimeMin: data.readingTimeMinutes ? Number(data.readingTimeMinutes) : 5,
          tags: JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
          status,
          publishedAt,
          seoTitle: data.seoTitle || data.title,
          seoDescription: data.seoDescription || data.excerpt?.slice(0, 160) || null,
          canonicalUrl: data.canonicalUrl || `https://yadman.ir/blog/${slug}`,
        },
        include: { category: true, author: true },
      });

      invalidateBlogCache();
      return formatPostFromPrisma(created);
    }

    throw new Error('پایگاه‌داده در دسترس نیست.');
  }

  async updatePost(id: string, data: any) {
    await this.ensureDefaults();

    if (isDbConnected()) {
      const existing = await prisma.blogPost.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('مقاله مورد نظر یافت نشد.');
      }

      let slug = existing.slug;
      if (data.slug && data.slug.trim() !== existing.slug) {
        slug = data.slug.trim().toLowerCase().replace(/\s+/g, '-');
        const duplicate = await prisma.blogPost.findFirst({
          where: { slug, id: { not: id } },
        });
        if (duplicate) {
          slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
      }

      const updated = await prisma.blogPost.update({
        where: { id },
        data: {
          title: data.title !== undefined ? data.title.trim() : undefined,
          slug,
          excerpt: data.excerpt !== undefined ? data.excerpt.trim() : undefined,
          content: data.content !== undefined ? data.content.trim() : undefined,
          coverImage: data.coverImage !== undefined ? data.coverImage : undefined,
          categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
          authorId: data.authorId !== undefined ? data.authorId : undefined,
          readingTimeMin: data.readingTimeMinutes !== undefined ? Number(data.readingTimeMinutes) : undefined,
          tags: data.tags !== undefined ? JSON.stringify(Array.isArray(data.tags) ? data.tags : []) : undefined,
          status: data.status ? String(data.status).toUpperCase() : undefined,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
          seoTitle: data.seoTitle !== undefined ? data.seoTitle : undefined,
          seoDescription: data.seoDescription !== undefined ? data.seoDescription : undefined,
          canonicalUrl: data.canonicalUrl !== undefined ? data.canonicalUrl : undefined,
        },
        include: { category: true, author: true },
      });

      invalidateBlogCache();
      return formatPostFromPrisma(updated);
    }

    throw new Error('پایگاه‌داده در دسترس نیست.');
  }

  async deletePost(id: string) {
    if (isDbConnected()) {
      const existing = await prisma.blogPost.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('مقاله مورد نظر یافت نشد.');
      }

      const deleted = await prisma.blogPost.delete({
        where: { id },
        include: { category: true, author: true },
      });

      invalidateBlogCache();
      return formatPostFromPrisma(deleted);
    }

    throw new Error('پایگاه‌داده در دسترس نیست.');
  }

  async createCategory(data: any) {
    if (isDbConnected()) {
      const name = (data.nameFa || data.name || '').trim();
      let slug = (data.slug || name || `cat-${Date.now()}`).trim().toLowerCase().replace(/\s+/g, '-');
      const existing = await prisma.blogCategory.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const created = await prisma.blogCategory.create({
        data: {
          id: data.id || `cat-${Date.now()}`,
          name: name || 'دسته‌بندی جدید',
          slug,
          description: data.descriptionFa || data.description || '',
        },
        include: { _count: { select: { posts: true } } },
      });

      return formatCategoryFromPrisma(created);
    }
    throw new Error('پایگاه‌داده در دسترس نیست.');
  }

  async updateCategory(id: string, data: any) {
    if (isDbConnected()) {
      const existing = await prisma.blogCategory.findUnique({ where: { id } });
      if (!existing) throw new Error('دسته‌بندی مورد نظر یافت نشد.');

      let slug = existing.slug;
      if (data.slug && data.slug.trim() !== existing.slug) {
        slug = data.slug.trim().toLowerCase().replace(/\s+/g, '-');
        const duplicate = await prisma.blogCategory.findFirst({
          where: { slug, id: { not: id } },
        });
        if (duplicate) {
          slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
      }

      const updated = await prisma.blogCategory.update({
        where: { id },
        data: {
          name: data.nameFa || data.name ? (data.nameFa || data.name).trim() : undefined,
          slug,
          description: data.descriptionFa !== undefined ? data.descriptionFa : data.description,
        },
        include: { _count: { select: { posts: true } } },
      });

      return formatCategoryFromPrisma(updated);
    }
    throw new Error('پایگاه‌داده در دسترس نیست.');
  }

  async deleteCategory(id: string) {
    if (isDbConnected()) {
      const existing = await prisma.blogCategory.findUnique({ where: { id } });
      if (!existing) throw new Error('دسته‌بندی مورد نظر یافت نشد.');

      // Check if posts use this category
      const postCount = await prisma.blogPost.count({ where: { categoryId: id } });
      if (postCount > 0) {
        throw new Error(`امکان حذف این دسته‌بندی وجود ندارد؛ ${postCount} مقاله به آن متصل هستند.`);
      }

      const deleted = await prisma.blogCategory.delete({ where: { id } });
      return formatCategoryFromPrisma(deleted);
    }
    throw new Error('پایگاه‌داده در دسترس نیست.');
  }

  async createAuthor(data: any) {
    if (isDbConnected()) {
      const created = await prisma.blogAuthor.create({
        data: {
          id: data.id || `author-${Date.now()}`,
          name: data.name.trim(),
          role: data.role ? data.role.trim() : 'نویسنده',
          avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          bio: data.bio ? data.bio.trim() : '',
        },
      });

      return formatAuthorFromPrisma(created);
    }
    throw new Error('پایگاه‌داده در دسترس نیست.');
  }

  async updateAuthor(id: string, data: any) {
    if (isDbConnected()) {
      const existing = await prisma.blogAuthor.findUnique({ where: { id } });
      if (!existing) throw new Error('نویسنده مورد نظر یافت نشد.');

      const updated = await prisma.blogAuthor.update({
        where: { id },
        data: {
          name: data.name !== undefined ? data.name.trim() : undefined,
          role: data.role !== undefined ? data.role.trim() : undefined,
          avatar: data.avatar !== undefined ? data.avatar : undefined,
          bio: data.bio !== undefined ? data.bio.trim() : undefined,
        },
      });

      return formatAuthorFromPrisma(updated);
    }
    throw new Error('پایگاه‌داده در دسترس نیست.');
  }

  async deleteAuthor(id: string) {
    if (isDbConnected()) {
      const existing = await prisma.blogAuthor.findUnique({ where: { id } });
      if (!existing) throw new Error('نویسنده مورد نظر یافت نشد.');

      const postCount = await prisma.blogPost.count({ where: { authorId: id } });
      if (postCount > 0) {
        throw new Error(`امکان حذف این نویسنده وجود ندارد؛ ${postCount} مقاله به آن متصل هستند.`);
      }

      const deleted = await prisma.blogAuthor.delete({ where: { id } });
      return formatAuthorFromPrisma(deleted);
    }
    throw new Error('پایگاه‌داده در دسترس نیست.');
  }
}

export const blogService = new BlogService();
