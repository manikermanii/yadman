import React from 'react';
import { BlogSectionConfig, BlogPost } from '../../../types';
import { BookOpen, CheckSquare, Square, ListFilter } from 'lucide-react';

interface BlogSettingsTabProps {
  blogConfig: BlogSectionConfig;
  allPosts: BlogPost[];
  onChange: (updated: BlogSectionConfig) => void;
}

export const BlogSettingsTab: React.FC<BlogSettingsTabProps> = ({
  blogConfig,
  allPosts,
  onChange,
}) => {
  const selectedIds = blogConfig.selectedPostIds || [];

  const handleTogglePost = (postId: string) => {
    let updated: string[];
    if (selectedIds.includes(postId)) {
      updated = selectedIds.filter((id) => id !== postId);
    } else {
      updated = [...selectedIds, postId];
    }
    onChange({ ...blogConfig, selectedPostIds: updated });
  };

  const handleClearSelection = () => {
    onChange({ ...blogConfig, selectedPostIds: [] });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Main Headings & Visibility */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-3">
          <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span>عناوین و تنظیمات بخش مقالات و مجله یادمان در صفحه اصلی</span>
          </h2>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F4C3A]">
            <span>نمایش بخش در صفحه اصلی:</span>
            <input
              type="checkbox"
              checked={blogConfig.visible !== false}
              onChange={(e) => onChange({ ...blogConfig, visible: e.target.checked })}
              className="w-4 h-4 accent-[#0F4C3A] rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              برچسب بالای تیتر (Badge):
            </label>
            <input
              type="text"
              value={blogConfig.badgeText || ''}
              onChange={(e) => onChange({ ...blogConfig, badgeText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs"
              placeholder="مثال: مجله یادمان"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              تیتر اصلی بخش مقالات:
            </label>
            <input
              type="text"
              value={blogConfig.title || ''}
              onChange={(e) => onChange({ ...blogConfig, title: e.target.value })}
              className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs font-extrabold text-[#0F4C3A]"
              placeholder="از مجله یادمان"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
            توضیحات و زیرعنوان بخش:
          </label>
          <textarea
            rows={2}
            value={blogConfig.description || ''}
            onChange={(e) => onChange({ ...blogConfig, description: e.target.value })}
            className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-[#E0D8C8] text-xs leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              حداکثر تعداد مقالات قابل نمایش:
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={blogConfig.displayLimit || 3}
              onChange={(e) => onChange({ ...blogConfig, displayLimit: parseInt(e.target.value) || 3 })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F4C3A] mb-1">
              متن دکمه «مشاهده همه مقالات»:
            </label>
            <input
              type="text"
              value={blogConfig.viewAllButtonText || ''}
              onChange={(e) => onChange({ ...blogConfig, viewAllButtonText: e.target.value })}
              className="w-full bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E0D8C8] text-xs font-bold"
            />
          </div>
        </div>
      </div>

      {/* 2. Specific Post Selector */}
      <div className="bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4EFE6] pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-[#0F4C3A] flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-[#D4AF37]" />
              <span>انتخاب دستی مقالات منتخب برای صفحه اصلی</span>
            </h2>
            <p className="text-[11px] text-[#6A7873] mt-0.5">
              {selectedIds.length === 0
                ? 'در حالت خودکار: آخرین مقالات منتشر شده به صورت خودکار نمایش داده می‌شوند.'
                : `تعداد ${selectedIds.length} مقاله به صورت اختصاصی انتخاب شده است.`}
            </p>
          </div>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-xs font-bold text-[#6A7873] hover:text-red-700 bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl transition cursor-pointer"
            >
              بازگشت به حالت خودکار (جدیدترین‌ها)
            </button>
          )}
        </div>

        {/* Posts Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
          {allPosts.map((post) => {
            const isSelected = selectedIds.includes(post.id);

            return (
              <div
                key={post.id}
                onClick={() => handleTogglePost(post.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-[#0F4C3A]/5 border-[#0F4C3A] shadow-2xs'
                    : 'bg-[#FAF8F5] border-[#EAE6DF] hover:border-[#D4AF37]'
                }`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/5 shrink-0 border border-[#EAE6DF]">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#1C2826] truncate block">
                      {post.title}
                    </span>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#0F4C3A] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-[#6A7873] block mt-0.5 truncate">
                    {post.excerpt}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
