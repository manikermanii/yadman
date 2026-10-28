import React, { useState, useMemo } from 'react';
import { BlogPost, BlogCategory, BlogAuthor } from '../../types';
import { BlogCard } from './BlogCard';
import {
  Search,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Headphones,
  SlidersHorizontal,
  X,
  Compass,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface BlogIndexPageProps {
  posts: BlogPost[];
  categories: BlogCategory[];
  authors: BlogAuthor[];
  selectedCategorySlug?: string | null;
  onSelectPost: (slug: string) => void;
  onSelectCategory: (categorySlug: string | null) => void;
  onOpenConsultation?: () => void;
  onBackToHome?: () => void;
}

export const BlogIndexPage: React.FC<BlogIndexPageProps> = ({
  posts = [],
  categories = [],
  authors = [],
  selectedCategorySlug = null,
  onSelectPost,
  onSelectCategory,
  onOpenConsultation,
  onBackToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter only published articles for public view
  const publishedPosts = useMemo(() => {
    return (posts || []).filter((p) => p && p.status === 'published');
  }, [posts]);

  // Apply Category & Search Filter
  const filteredPosts = useMemo(() => {
    let result = publishedPosts;

    if (selectedCategorySlug) {
      const targetCategory = (categories || []).find((c) => c && c.slug === selectedCategorySlug);
      if (targetCategory) {
        result = result.filter((p) => p.categoryId === targetCategory.id);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return result;
  }, [publishedPosts, selectedCategorySlug, searchQuery, categories]);

  // Featured Post (Primary hero)
  const featuredPost = useMemo(() => {
    if (selectedCategorySlug || searchQuery.trim()) return null;
    return publishedPosts.find((p) => p.isFeatured) || publishedPosts[0] || null;
  }, [publishedPosts, selectedCategorySlug, searchQuery]);

  // Exclude featured post from standard grid when on default main page
  const gridPosts = useMemo(() => {
    if (featuredPost && !selectedCategorySlug && !searchQuery.trim()) {
      return filteredPosts.filter((p) => p.id !== featuredPost.id);
    }
    return filteredPosts;
  }, [filteredPosts, featuredPost, selectedCategorySlug, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(gridPosts.length / itemsPerPage) || 1;
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return gridPosts.slice(start, start + itemsPerPage);
  }, [gridPosts, currentPage]);

  // Popular / Recommended sidebar posts
  const popularPosts = useMemo(() => {
    return [...publishedPosts]
      .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
      .slice(0, 4);
  }, [publishedPosts]);

  const authorsMap = useMemo(() => {
    const map: { [id: string]: BlogAuthor } = {};
    (authors || []).forEach((a) => {
      if (a && a.id) map[a.id] = a;
    });
    return map;
  }, [authors]);

  const categoriesMap = useMemo(() => {
    const map: { [id: string]: BlogCategory } = {};
    (categories || []).forEach((c) => {
      if (c && c.id) map[c.id] = c;
    });
    return map;
  }, [categories]);

  const activeCategoryObject = (categories || []).find((c) => c && c.slug === selectedCategorySlug);

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs text-[#6A7873]">
          <button
            onClick={onBackToHome}
            className="hover:text-[#0F4C3A] transition font-medium cursor-pointer"
          >
            صفحه اصلی
          </button>
          <span>/</span>
          <button
            onClick={() => {
              onSelectCategory(null);
              setSearchQuery('');
            }}
            className={`font-semibold transition ${
              !selectedCategorySlug ? 'text-[#0F4C3A]' : 'hover:text-[#0F4C3A]'
            }`}
          >
            مجله یادمان
          </button>
          {activeCategoryObject && (
            <>
              <span>/</span>
              <span className="text-[#0F4C3A] font-bold">{activeCategoryObject.nameFa}</span>
            </>
          )}
        </nav>

        {/* Editorial Magazine Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0F4C3A]/5 border border-[#0F4C3A]/15 text-[#0F4C3A] text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>مجله تخصصی تشریفات و سبک زندگی</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F4C3A] font-calligraphy tracking-tight">
            مجله یادمان
          </h1>

          <p className="text-sm sm:text-base text-[#4A5A55] leading-relaxed max-w-2xl mx-auto">
            ایده‌ها، راهنماها و مطالبی برای انتخاب بهتر هدیه، تشریفات سازمانی و هنر بسته‌بندی فاخر ایرانی
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="جستجو در میان مقالات، راهنماها و برچسب‌ها..."
                className="w-full pl-10 pr-12 py-3.5 rounded-2xl bg-white border border-[#EAE6DF] text-sm text-[#1C2826] placeholder-[#8A9893] focus:outline-hidden focus:border-[#0F4C3A] focus:ring-2 focus:ring-[#0F4C3A]/10 shadow-xs transition"
              />
              <Search className="w-5 h-5 text-[#8A9893] absolute right-4 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[#8A9893] hover:text-[#0F4C3A]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => {
              onSelectCategory(null);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategorySlug === null
                ? 'bg-[#0F4C3A] text-white shadow-xs'
                : 'bg-white text-[#2C3B37] border border-[#EAE6DF] hover:bg-[#F4EFE6]'
            }`}
          >
            همه مقالات ({toPersianDigits(publishedPosts.length)})
          </button>

          {categories.map((cat) => {
            const count = publishedPosts.filter((p) => p.categoryId === cat.id).length;
            const isSelected = selectedCategorySlug === cat.slug;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(isSelected ? null : cat.slug);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F4C3A] text-white shadow-xs'
                    : 'bg-white text-[#2C3B37] border border-[#EAE6DF] hover:bg-[#F4EFE6]'
                }`}
              >
                <span>{cat.nameFa}</span>
                <span className="mr-1.5 opacity-70 text-[10px]">({toPersianDigits(count)})</span>
              </button>
            );
          })}
        </div>

        {/* Search Results Feedback Bar */}
        {searchQuery.trim() && (
          <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] flex items-center justify-between text-xs text-[#2C3B37]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0F4C3A]">نتایج جستجو برای:</span>
              <span className="bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#EAE6DF] font-bold text-[#0F4C3A]">
                «{searchQuery}»
              </span>
              <span className="text-[#6A7873]">({toPersianDigits(filteredPosts.length)} مقاله یافت شد)</span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#0F4C3A] hover:underline font-bold text-[11px]"
            >
              پاک کردن جستجو
            </button>
          </div>
        )}

        {/* Hero Featured Article (Shown on default index page) */}
        {featuredPost && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0F4C3A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>مقاله برگزیده تحریریه</span>
              </h2>
            </div>

            <BlogCard
              post={featuredPost}
              category={categoriesMap[featuredPost.categoryId]}
              author={authorsMap[featuredPost.authorId]}
              onSelectPost={onSelectPost}
              onSelectCategory={onSelectCategory}
              variant="featured"
            />
          </div>
        )}

        {/* Main Grid + Popular Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Articles Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF]">
              <h2 className="font-extrabold text-lg sm:text-xl text-[#0F4C3A]">
                {activeCategoryObject
                  ? `مقالات دسته‌بندی «${activeCategoryObject.nameFa}»`
                  : searchQuery.trim()
                  ? 'مقالات منطبق با جستجو'
                  : 'جدیدترین مقالات و راهنماها'}
              </h2>
              <span className="text-xs text-[#6A7873]">
                نمایش {toPersianDigits(paginatedPosts.length)} از {toPersianDigits(gridPosts.length)} مقاله
              </span>
            </div>

            {paginatedPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {paginatedPosts.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    category={categoriesMap[post.categoryId]}
                    author={authorsMap[post.authorId]}
                    onSelectPost={onSelectPost}
                    onSelectCategory={onSelectCategory}
                    variant="default"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE6DF] space-y-4">
                <Compass className="w-12 h-12 text-[#8A9893] mx-auto opacity-50" />
                <h3 className="font-bold text-base text-[#0F4C3A]">مقاله‌ای با این مشخصات یافت نشد</h3>
                <p className="text-xs text-[#6A7873] max-w-sm mx-auto">
                  لطفاً عبارت جستجو را تغییر دهید یا دسته‌بندی دیگری را برای مشاهده انتخاب نمایید.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    onSelectCategory(null);
                  }}
                  className="bg-[#0F4C3A] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#155A45] transition cursor-pointer"
                >
                  مشاهده همه مقالات
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="p-2.5 rounded-xl border border-[#EAE6DF] bg-white text-[#0F4C3A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F4EFE6] transition"
                  title="صفحه قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#0F4C3A] text-white shadow-xs'
                        : 'bg-white text-[#2C3B37] border border-[#EAE6DF] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    {toPersianDigits(pageNum)}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="p-2.5 rounded-xl border border-[#EAE6DF] bg-white text-[#0F4C3A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F4EFE6] transition"
                  title="صفحه بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar (Popular Articles + Consultation Card) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Popular Articles Widget */}
            <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF] shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#EAE6DF]">
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-extrabold text-sm text-[#0F4C3A]">پربازدیدترین مطالب مجله</h3>
              </div>

              <div className="space-y-4">
                {popularPosts.map((post, idx) => (
                  <div
                    key={post.id}
                    onClick={() => onSelectPost(post.slug)}
                    className="flex items-start gap-3 group cursor-pointer"
                  >
                    <span className="font-bold font-calligraphy text-2xl text-[#D4AF37]/80 w-6 shrink-0 text-center">
                      {toPersianDigits(idx + 1)}
                    </span>
                    <div className="space-y-1 overflow-hidden flex-1">
                      <h4 className="font-bold text-xs text-[#1C2826] group-hover:text-[#0F4C3A] transition line-clamp-2 leading-relaxed">
                        {post.title}
                      </h4>
                      <p className="text-[10px] text-[#6A7873]">
                        {post.publishedAtFa} • {toPersianDigits(post.readingTimeMinutes)} دقیقه
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Editorial Category List Widget */}
            <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF] shadow-2xs space-y-4">
              <h3 className="font-extrabold text-sm text-[#0F4C3A] pb-3 border-b border-[#EAE6DF]">
                موضوعات مجله یادمان
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const count = publishedPosts.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.slug)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-[#FAF8F5] transition text-[#2C3B37] group cursor-pointer"
                    >
                      <span className="group-hover:text-[#0F4C3A] font-semibold">{cat.nameFa}</span>
                      <span className="bg-[#F4EFE6] text-[#0F4C3A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {toPersianDigits(count)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subtle Premium Consultation CTA */}
            {onOpenConsultation && (
              <div className="bg-gradient-to-br from-[#0F4C3A] to-[#17634D] text-[#FAF8F5] p-6 rounded-3xl shadow-md space-y-4 text-center relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
                  <Headphones className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-base text-[#FAF8F5]">
                    برای انتخاب هدیه مناسب راهنمایی می‌خواهید؟
                  </h3>
                  <p className="text-xs text-[#C0D8D0] leading-relaxed">
                    مشاوران تخصصی هدیه آماده همراهی شما در انتخاب بهترین پک کادویی شخصی یا سازمانی هستند.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-[#C29E2E] text-[#0F4C3A] font-extrabold text-xs rounded-xl shadow-md transition active:scale-98 cursor-pointer"
                >
                  دریافت مشاوره رایگان
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
