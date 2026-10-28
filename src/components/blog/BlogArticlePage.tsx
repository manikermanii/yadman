import React, { useState, useEffect, useMemo } from 'react';
import {
  BlogPost,
  BlogCategory,
  BlogAuthor,
  Product,
  StoreSettings,
} from '../../types';
import { api } from '../../services/api';
import { ProductCard } from '../ProductCard';
import { BlogCard } from './BlogCard';
import {
  Clock,
  Calendar,
  User,
  Share2,
  Bookmark,
  Check,
  Copy,
  ChevronRight,
  Headphones,
  Sparkles,
  ArrowRight,
  Send,
  MessageCircle,
  ExternalLink,
  ListTree,
  Building2,
  Sliders,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface BlogArticlePageProps {
  post?: BlogPost | null;
  slug?: string | null;
  allPosts: BlogPost[];
  categories: BlogCategory[];
  authors: BlogAuthor[];
  products: Product[];
  storeSettings: StoreSettings;
  onSelectPost: (slug: string) => void;
  onSelectCategory: (categorySlug: string) => void;
  onBackToBlog: () => void;
  onOpenConsultation: () => void;
  onOpenBuilder: () => void;
  onOpenCorporate: () => void;
  onQuickViewProduct: (product: Product) => void;
  onAddToCartProduct: (product: Product) => void;
  userWishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
}

export const BlogArticlePage: React.FC<BlogArticlePageProps> = ({
  post: initialPost,
  slug,
  allPosts = [],
  categories = [],
  authors = [],
  products = [],
  storeSettings,
  onSelectPost,
  onSelectCategory,
  onBackToBlog,
  onOpenConsultation,
  onOpenBuilder,
  onOpenCorporate,
  onQuickViewProduct,
  onAddToCartProduct,
  userWishlistIds = [],
  onToggleWishlist,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTocId, setActiveTocId] = useState<string>('');
  const [activePost, setActivePost] = useState<BlogPost | null>(initialPost || null);
  const [isLoadingArticle, setIsLoadingArticle] = useState<boolean>(!initialPost);

  useEffect(() => {
    const targetSlug = slug || initialPost?.slug;
    if (targetSlug) {
      let isMounted = true;
      setIsLoadingArticle(true);
      api.blog
        .getPostBySlug(targetSlug)
        .then((fresh) => {
          if (isMounted && fresh) {
            setActivePost(fresh);
          }
        })
        .catch((err) => {
          console.warn('Failed to load article from backend:', err);
          if (isMounted && initialPost) {
            setActivePost(initialPost);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingArticle(false);
        });
      return () => {
        isMounted = false;
      };
    } else if (initialPost) {
      setActivePost(initialPost);
      setIsLoadingArticle(false);
    }
  }, [slug, initialPost]);

  if (isLoadingArticle) {
    return (
      <div className="bg-[#FAF8F5] min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#0F4C3A] animate-spin" />
        <p className="text-sm font-bold text-[#0F4C3A]">در حال دریافت مقاله از پایگاه‌داده...</p>
      </div>
    );
  }

  if (!activePost) {
    return (
      <div className="bg-[#FAF8F5] min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0F4C3A]">مقاله مورد نظر یافت نشد</h2>
        <p className="text-xs text-[#6A7873]">ممکن است مقاله حذف شده باشد یا در وضعیت پیش‌نویس باشد.</p>
        <button
          onClick={onBackToBlog}
          className="bg-[#0F4C3A] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs hover:bg-[#155A45] transition cursor-pointer"
        >
          بازگشت به مجله یادمان
        </button>
      </div>
    );
  }

  const post = activePost;
  const author = (authors || []).find((a) => a && a.id === post.authorId);
  const category = (categories || []).find((c) => c && c.id === post.categoryId);

  // Extract headings for Table of Contents
  const tocItems = useMemo(() => {
    if (!post.content) return [];
    const regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    const items: { id: string; text: string }[] = [];
    let match;
    let index = 0;
    while ((match = regex.exec(post.content)) !== null) {
      const text = match[1].replace(/<[^>]*>/g, '');
      const id = `heading-${index++}`;
      items.push({ id, text });
    }
    return items;
  }, [post?.content]);

  // Transform content to add IDs to h2 for anchor linking
  const enrichedHtml = useMemo(() => {
    if (!post.content) return '';
    let index = 0;
    return post.content.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, content) => {
      const id = `heading-${index++}`;
      return `<h2 id="${id}" class="article-h2 scroll-mt-24"${attrs}>${content}</h2>`;
    });
  }, [post?.content]);

  // Related products from store
  const relatedProducts = useMemo(() => {
    if (!post.relatedProductIds || post.relatedProductIds.length === 0) {
      return (products || []).slice(0, 3);
    }
    const matched = (products || []).filter((p) => post.relatedProductIds?.includes(p.id));
    return matched.length > 0 ? matched : (products || []).slice(0, 3);
  }, [post?.relatedProductIds, products]);

  // Related articles (same category or recent)
  const relatedArticles = useMemo(() => {
    return (allPosts || [])
      .filter((p) => p && p.id !== post.id && p.status === 'published')
      .filter((p) => p.categoryId === post.categoryId || p.isFeatured)
      .slice(0, 3);
  }, [allPosts, post]);

  // Dynamic Schema & Document Title
  useEffect(() => {
    const pageTitle = post.seoTitle || `${post.title} | مجله یادمان`;
    document.title = pageTitle;

    // Inject JSON-LD Schema
    const canonicalUrl = post.canonicalUrl || `${storeSettings.canonicalBaseUrl}/blog/${post.slug}`;
    const schemaData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'صفحه اصلی',
              item: storeSettings.canonicalBaseUrl,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'مجله یادمان',
              item: `${storeSettings.canonicalBaseUrl}/blog`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: category?.nameFa || 'مقالات',
              item: `${storeSettings.canonicalBaseUrl}/blog/category/${category?.slug || 'all'}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: post.title,
              item: canonicalUrl,
            },
          ],
        },
        {
          '@type': 'BlogPosting',
          '@id': `${canonicalUrl}/#article`,
          headline: post.title,
          description: post.seoDescription || post.excerpt,
          image: post.coverImage,
          datePublished: post.publishedAt || post.createdAt,
          dateModified: post.updatedAt || post.publishedAt || post.createdAt,
          mainEntityOfPage: canonicalUrl,
          author: {
            '@type': 'Person',
            name: author?.name || 'تحریریه یادمان',
            jobTitle: author?.role || 'کارشناس تشریفات',
          },
          publisher: {
            '@type': 'Organization',
            name: storeSettings.storeName || 'یادمان',
            logo: {
              '@type': 'ImageObject',
              url: `${storeSettings.canonicalBaseUrl}/logo.svg`,
            },
          },
        },
      ],
    };

    const scriptId = 'blog-post-schema-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(schemaData);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [post, author, category, storeSettings]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(post.title);

  return (
    <article className="bg-[#FAF8F5] min-h-screen py-8 sm:py-12 text-right">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#6A7873] overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={onBackToBlog}
            className="hover:text-[#0F4C3A] transition font-medium whitespace-nowrap cursor-pointer"
          >
            مجله یادمان
          </button>
          <span>/</span>
          {category && (
            <>
              <button
                type="button"
                onClick={() => onSelectCategory(category.slug)}
                className="hover:text-[#0F4C3A] transition font-semibold whitespace-nowrap cursor-pointer"
              >
                {category.nameFa}
              </button>
              <span>/</span>
            </>
          )}
          <span className="text-[#0F4C3A] font-bold truncate max-w-xs">{post.title}</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {category && (
              <button
                type="button"
                onClick={() => onSelectCategory(category.slug)}
                className="bg-[#0F4C3A] text-white text-xs font-bold px-3.5 py-1.5 rounded-full hover:bg-[#155A45] transition cursor-pointer"
              >
                {category.nameFa}
              </button>
            )}
            <span className="text-xs text-[#6A7873] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{post.publishedAtFa || 'منتشر شده'}</span>
            </span>
            <span className="text-xs text-[#6A7873] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{toPersianDigits(post.readingTimeMinutes)} دقیقه مطالعه</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F4C3A] leading-snug sm:leading-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-[#4A5A55] leading-relaxed border-r-4 border-[#D4AF37] pr-4 bg-[#F4EFE6]/50 py-3 rounded-l-2xl">
            {post.excerpt}
          </p>

          {/* Author Byline Box */}
          {author && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-2xs">
              <div className="flex items-center gap-3">
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-xs"
                />
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-[#0F4C3A]">{author.name}</h3>
                  <p className="text-[11px] text-[#6A7873]">{author.role}</p>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="کپی لینک مقاله"
                  className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#0F4C3A] transition border border-[#EAE6DF] text-xs flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline text-[11px]">
                    {copiedLink ? 'کپی شد' : 'اشتراک‌گذاری'}
                  </span>
                </button>
                <a
                  href={`https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#2AABEE] transition border border-[#EAE6DF]"
                  title="اشتراک در تلگرام"
                >
                  <Send className="w-4 h-4" />
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#25D366] transition border border-[#EAE6DF]"
                  title="اشتراک در واتس‌اپ"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </header>

        {/* Main Cover Image */}
        <div className="relative rounded-3xl overflow-hidden shadow-md border border-[#EAE6DF] aspect-16/9 bg-[#121B18]">
          <img
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            className="w-full h-full object-cover"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Table of Contents (if headings exist) */}
        {tocItems.length > 0 && (
          <div className="p-5 sm:p-6 bg-white rounded-3xl border border-[#EAE6DF] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#0F4C3A] pb-2 border-b border-[#EAE6DF]">
              <ListTree className="w-4 h-4 text-[#D4AF37]" />
              <span>فهرست عناوین این مقاله</span>
            </div>
            <ul className="space-y-2 text-xs text-[#4A5A55]">
              {tocItems.map((item, idx) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="text-[#D4AF37] font-bold">{toPersianDigits(idx + 1)}.</span>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(item.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-[#0F4C3A] hover:underline font-medium transition"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body (Semantic Rich HTML Output with Custom Styles) */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EAE6DF] shadow-2xs">
          <div
            className="article-content font-['Vazirmatn',sans-serif] text-[#2C3B37] text-sm sm:text-base leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ __html: enrichedHtml }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-8 mt-8 border-t border-[#EAE6DF] flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#0F4C3A]">برچسب‌ها:</span>
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-[#FAF8F5] text-[#4A5A55] text-xs px-3 py-1 rounded-full border border-[#EAE6DF]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fast Action Cards (Internal Linking Integrations) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={onOpenCorporate}
            className="p-5 rounded-2xl bg-white border border-[#EAE6DF] hover:border-[#0F4C3A] transition shadow-2xs flex items-center gap-4 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0 group-hover:bg-[#0F4C3A] group-hover:text-white transition">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-right overflow-hidden">
              <h4 className="font-extrabold text-xs sm:text-sm text-[#0F4C3A]">مشاهده پک‌های سازمانی و شرکتی</h4>
              <p className="text-[11px] text-[#6A7873] truncate">امکان چاپ لوگو و دریافت پیش‌فاکتور رسمی</p>
            </div>
          </div>

          <div
            onClick={onOpenBuilder}
            className="p-5 rounded-2xl bg-white border border-[#EAE6DF] hover:border-[#D4AF37] transition shadow-2xs flex items-center gap-4 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 text-[#0F4C3A] flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37] transition">
              <Sliders className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-right overflow-hidden">
              <h4 className="font-extrabold text-xs sm:text-sm text-[#0F4C3A]">ساخت آنلاین جعبه هدیه اختصاصی</h4>
              <p className="text-[11px] text-[#6A7873] truncate">انتخاب هاردباکس، اقلام، روبان و مهر و موم</p>
            </div>
          </div>
        </div>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DF]">
              <h3 className="font-extrabold text-base sm:text-lg text-[#0F4C3A] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                <span>محصولات و پک‌های مرتبط با این مقاله</span>
              </h3>
              <button
                onClick={onBackToBlog}
                className="text-xs text-[#0F4C3A] font-bold hover:underline"
              >
                مشاهده در فروشگاه
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onQuickView={onQuickViewProduct}
                  onAddToCart={onAddToCartProduct}
                  isWishlisted={userWishlistIds.includes(prod.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </section>
        )}

        {/* End of Article Consultation CTA Box */}
        <div className="bg-gradient-to-br from-[#0F4C3A] to-[#145341] text-[#FAF8F5] p-6 sm:p-8 rounded-3xl shadow-lg text-center space-y-4 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
            <Headphones className="w-7 h-7" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="font-extrabold text-lg sm:text-xl text-[#FAF8F5]">
              برای انتخاب هدیه مناسب نیاز به مشاوره دارید؟
            </h3>
            <p className="text-xs sm:text-sm text-[#C0D8D0] leading-relaxed">
              کارشناسان تشریفات هدیه در کمتر از ۲ ساعت با شما تماس گرفته و بهترین گزینه‌ها را متناسب با بودجه و مناسبت شما پیشنهاد می‌دهند.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenConsultation}
            className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#C29E2E] text-[#0F4C3A] font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-98 cursor-pointer"
          >
            دریافت مشاوره رایگان
          </button>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="space-y-4 pt-6">
            <h3 className="font-extrabold text-base sm:text-lg text-[#0F4C3A] pb-2 border-b border-[#EAE6DF]">
              سایر مقالات پیشنهادی تحریریه
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArticles.map((relPost) => (
                <BlogCard
                  key={relPost.id}
                  post={relPost}
                  category={categories.find((c) => c.id === relPost.categoryId)}
                  author={authors.find((a) => a.id === relPost.authorId)}
                  onSelectPost={onSelectPost}
                  onSelectCategory={onSelectCategory}
                  variant="default"
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </article>
  );
};
