import React from 'react';
import { BlogPost, BlogCategory, BlogAuthor, BlogSectionConfig } from '../../types';
import { BlogCard } from './BlogCard';
import { BookOpen, ArrowLeft } from 'lucide-react';

interface HomeBlogSectionProps {
  posts: BlogPost[];
  categories: BlogCategory[];
  authors: BlogAuthor[];
  onOpenBlog: () => void;
  onSelectPost: (slug: string) => void;
  onSelectCategory: (categorySlug: string) => void;
  config?: BlogSectionConfig;
}

export const HomeBlogSection: React.FC<HomeBlogSectionProps> = ({
  posts = [],
  categories = [],
  authors = [],
  onOpenBlog,
  onSelectPost,
  onSelectCategory,
  config,
}) => {
  if (config && config.visible === false) {
    return null;
  }

  const publishedPosts = (posts || []).filter((p) => p && p.status === 'published');
  
  // Apply CMS filtering & limit
  let displayPosts: BlogPost[] = [];
  if (config?.selectedPostIds && config.selectedPostIds.length > 0) {
    displayPosts = config.selectedPostIds
      .map((id) => publishedPosts.find((p) => p.id === id))
      .filter((p): p is BlogPost => Boolean(p));
  } else {
    displayPosts = publishedPosts;
  }

  const limit = config?.displayLimit || 3;
  const finalPosts = displayPosts.slice(0, limit);

  if (finalPosts.length === 0) return null;

  const categoriesMap: { [id: string]: BlogCategory } = {};
  (categories || []).forEach((c) => {
    if (c && c.id) categoriesMap[c.id] = c;
  });

  const authorsMap: { [id: string]: BlogAuthor } = {};
  (authors || []).forEach((a) => {
    if (a && a.id) authorsMap[a.id] = a;
  });

  const badgeText = config?.badgeText || 'مجله یادمان';
  const title = config?.title || 'از مجله یادمان';
  const description =
    config?.description ||
    'ایده‌ها، راهنماها و مقالات تخصصی انتخاب هدیه، تشریفات سازمانی و بسته‌بندی فاخر';
  const viewAllText = config?.viewAllButtonText || 'مشاهده همه مقالات';

  return (
    <section className="py-12 sm:py-16 bg-[#FAF8F5] border-t border-[#EAE6DF] text-right" id="blog-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            {badgeText && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F4C3A]/5 border border-[#0F4C3A]/15 text-[#0F4C3A] text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{badgeText}</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F4C3A] tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#6A7873]">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenBlog}
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-extrabold text-[#0F4C3A] hover:text-[#17634D] bg-white border border-[#EAE6DF] hover:border-[#0F4C3A] px-4 py-2.5 rounded-xl shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            <span>{viewAllText}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {finalPosts.map((post) => (
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

      </div>
    </section>
  );
};
