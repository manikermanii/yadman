import React from 'react';
import { BlogPost, BlogCategory, BlogAuthor } from '../../types';
import { Clock, Calendar, User, ArrowLeft, Bookmark } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface BlogCardProps {
  post: BlogPost;
  category?: BlogCategory;
  author?: BlogAuthor;
  onSelectPost: (slug: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  variant?: 'default' | 'compact' | 'featured' | 'horizontal';
}

export const BlogCard: React.FC<BlogCardProps> = ({
  post,
  category,
  author,
  onSelectPost,
  onSelectCategory,
  variant = 'default',
}) => {
  if (variant === 'featured') {
    return (
      <article
        onClick={() => onSelectPost(post.slug)}
        className="group relative bg-white rounded-3xl border border-[#EAE6DF] hover:border-[#D4AF37]/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer grid grid-cols-1 lg:grid-cols-12 text-right"
      >
        {/* Cover Image */}
        <div className="lg:col-span-7 relative overflow-hidden bg-[#121B18] min-h-[260px] sm:min-h-[340px]">
          <img
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95 group-hover:opacity-100"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />

          {category && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectCategory) onSelectCategory(category.slug);
              }}
              className="absolute top-4 right-4 bg-[#0F4C3A]/90 hover:bg-[#0F4C3A] text-[#FAF8F5] text-xs font-bold px-3 py-1.5 rounded-full border border-[#D4AF37]/30 backdrop-blur-md transition-all shadow-sm"
            >
              {category.nameFa}
            </button>
          )}

          <div className="absolute bottom-4 right-4 text-white text-[11px] font-medium flex items-center gap-2 lg:hidden">
            <span className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
              <Clock className="w-3 h-3 text-[#D4AF37]" />
              <span>{toPersianDigits(post.readingTimeMinutes)} دقیقه مطالعه</span>
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="hidden lg:flex items-center justify-between text-xs text-[#6A7873]">
              {category && (
                <span className="bg-[#F4EFE6] text-[#0F4C3A] font-bold px-3 py-1 rounded-full">
                  {category.nameFa}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{toPersianDigits(post.readingTimeMinutes)} دقیقه مطالعه</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F4C3A] group-hover:text-[#1A6B53] transition-colors leading-snug">
              {post.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#4A5A55] leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="pt-4 border-t border-[#EAE6DF] flex items-center justify-between">
            {author && (
              <div className="flex items-center gap-2.5">
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/40 shadow-2xs"
                  loading="lazy"
                />
                <div className="text-right">
                  <p className="text-xs font-bold text-[#1C2826]">{author.name}</p>
                  <p className="text-[10px] text-[#6A7873]">{post.publishedAtFa || 'منتشر شده'}</p>
                </div>
              </div>
            )}

            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F4C3A] group-hover:translate-x-[-4px] transition-transform">
              <span>مطالعه مقاله</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article
        onClick={() => onSelectPost(post.slug)}
        className="group flex flex-col sm:flex-row items-stretch bg-white rounded-2xl border border-[#EAE6DF] hover:border-[#D4AF37]/60 shadow-2xs hover:shadow-md transition-all overflow-hidden cursor-pointer text-right"
      >
        <div className="sm:w-1/3 min-h-[140px] relative overflow-hidden bg-[#121B18]">
          <img
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="sm:w-2/3 p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#6A7873]">
              {category && (
                <span className="text-[#0F4C3A] font-bold bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EAE6DF]">
                  {category.nameFa}
                </span>
              )}
              <span>{post.publishedAtFa}</span>
            </div>

            <h3 className="font-bold text-sm sm:text-base text-[#0F4C3A] group-hover:text-[#1A6B53] transition-colors line-clamp-2">
              {post.title}
            </h3>

            <p className="text-xs text-[#4A5A55] line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-[#6A7873] pt-2 border-t border-[#F4EFE6]">
            <span>{author?.name || 'تحریریه هدیه'}</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-[#D4AF37]" />
              <span>{toPersianDigits(post.readingTimeMinutes)} دقیقه</span>
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Default Grid Card
  return (
    <article
      onClick={() => onSelectPost(post.slug)}
      className="group flex flex-col bg-white rounded-2xl border border-[#EAE6DF] hover:border-[#D4AF37]/60 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer text-right"
    >
      {/* Cover Image */}
      <div className="relative aspect-16/10 overflow-hidden bg-[#121B18]">
        <img
          src={post.coverImage}
          alt={post.coverImageAlt || post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {category && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectCategory) onSelectCategory(category.slug);
            }}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-md hover:bg-white text-[#0F4C3A] text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#EAE6DF] shadow-2xs transition"
          >
            {category.nameFa}
          </button>
        )}

        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#D4AF37]" />
          <span>{toPersianDigits(post.readingTimeMinutes)} دقیقه</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[11px] text-[#6A7873]">
            <Calendar className="w-3 h-3 text-[#D4AF37]" />
            <span>{post.publishedAtFa || 'به‌روزرسانی شده'}</span>
          </div>

          <h3 className="font-extrabold text-base text-[#0F4C3A] group-hover:text-[#1A6B53] transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>

          <p className="text-xs text-[#4A5A55] leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        </div>

        {/* Author Footer */}
        <div className="pt-3.5 border-t border-[#F4EFE6] flex items-center justify-between">
          {author ? (
            <div className="flex items-center gap-2">
              <img
                src={author.avatar}
                alt={author.name}
                className="w-6 h-6 rounded-full object-cover border border-[#D4AF37]/30"
                loading="lazy"
              />
              <span className="text-xs font-semibold text-[#2C3B37] truncate max-w-[120px]">
                {author.name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-[#6A7873]">تحریریه هدیه</span>
          )}

          <span className="text-xs font-bold text-[#0F4C3A] group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
            <span>ادامه</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
