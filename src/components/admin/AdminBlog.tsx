import React, { useState, useMemo } from 'react';
import {
  BlogPost,
  BlogCategory,
  BlogAuthor,
  BlogPostStatus,
  Product,
} from '../../types';
import { BlogPostEditModal } from './BlogPostEditModal';
import { BlogCategoryModal } from './BlogCategoryModal';
import { BlogAuthorModal } from './BlogAuthorModal';
import {
  FileText,
  Tag,
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Archive,
  Sparkles,
  TrendingUp,
  ExternalLink,
  BookOpen,
  Calendar,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface AdminBlogProps {
  posts: BlogPost[];
  categories: BlogCategory[];
  authors: BlogAuthor[];
  products: Product[];
  isLoading?: boolean;
  feedbackMessage?: { type: 'success' | 'error'; message: string } | null;
  onClearFeedback?: () => void;
  onSavePost: (post: BlogPost) => Promise<boolean | void> | void;
  onDeletePost: (postId: string) => Promise<boolean | void> | void;
  onSaveCategory: (category: BlogCategory) => Promise<boolean | void> | void;
  onDeleteCategory: (categoryId: string) => Promise<boolean | void> | void;
  onSaveAuthor: (author: BlogAuthor) => Promise<boolean | void> | void;
  onDeleteAuthor: (authorId: string) => Promise<boolean | void> | void;
  onViewPostInBlog?: (slug: string) => void;
}

export const AdminBlog: React.FC<AdminBlogProps> = ({
  posts = [],
  categories = [],
  authors = [],
  products = [],
  isLoading = false,
  feedbackMessage,
  onClearFeedback,
  onSavePost,
  onDeletePost,
  onSaveCategory,
  onDeleteCategory,
  onSaveAuthor,
  onDeleteAuthor,
  onViewPostInBlog,
}) => {
  const [subTab, setSubTab] = useState<'posts' | 'categories' | 'authors'>('posts');
  
  // Filter States for Posts
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BlogPostStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [editingAuthor, setEditingAuthor] = useState<BlogAuthor | null>(null);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);

  // Deletion Confirmation States
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<BlogCategory | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const [authorToDelete, setAuthorToDelete] = useState<BlogAuthor | null>(null);
  const [isDeletingAuthor, setIsDeletingAuthor] = useState(false);

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [localFeedback, setLocalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleConfirmDeletePost = async () => {
    if (!postToDelete || isDeletingPost) return;
    try {
      setIsDeletingPost(true);
      setDeleteError(null);
      await onDeletePost(postToDelete.id);
      setLocalFeedback({
        type: 'success',
        message: 'مقاله با موفقیت حذف شد',
      });
      setPostToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'خطا در حذف مقاله از سرور.');
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete || isDeletingCategory) return;
    try {
      setIsDeletingCategory(true);
      setDeleteError(null);
      await onDeleteCategory(categoryToDelete.id);
      setLocalFeedback({
        type: 'success',
        message: 'دسته‌بندی با موفقیت حذف شد',
      });
      setCategoryToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'خطا در حذف دسته‌بندی از سرور.');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleConfirmDeleteAuthor = async () => {
    if (!authorToDelete || isDeletingAuthor) return;
    try {
      setIsDeletingAuthor(true);
      setDeleteError(null);
      await onDeleteAuthor(authorToDelete.id);
      setLocalFeedback({
        type: 'success',
        message: 'نویسنده با موفقیت حذف شد',
      });
      setAuthorToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'خطا در حذف نویسنده از سرور.');
    } finally {
      setIsDeletingAuthor(false);
    }
  };

  // Author & Category maps
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

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return (posts || []).filter((post) => {
      if (!post) return false;
      const matchSearch =
        !searchQuery.trim() ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || post.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || post.categoryId === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [posts, searchQuery, statusFilter, categoryFilter]);

  // Statistics
  const totalViews = useMemo(() => {
    return (posts || []).reduce((sum, p) => sum + (p?.viewsCount || 0), 0);
  }, [posts]);

  const publishedCount = useMemo(() => {
    return posts.filter((p) => p.status === 'published').length;
  }, [posts]);

  const draftCount = useMemo(() => {
    return posts.filter((p) => p.status === 'draft').length;
  }, [posts]);

  const getStatusBadge = (status: BlogPostStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>منتشر شده</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            <span>پیش‌نویس</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2.5 py-1 rounded-full">
            <Calendar className="w-3 h-3" />
            <span>زمان‌بندی شده</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-bold px-2.5 py-1 rounded-full">
            <Archive className="w-3 h-3" />
            <span>آرشیو شده</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Feedback Banner */}
      {(feedbackMessage || localFeedback) && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-fadeIn ${
            (feedbackMessage || localFeedback)?.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {(feedbackMessage || localFeedback)?.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{(feedbackMessage || localFeedback)?.message}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalFeedback(null);
              if (onClearFeedback) onClearFeedback();
            }}
            className="p-1 hover:bg-black/5 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAE6DF] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#0F4C3A]" />
            <h2 className="text-xl font-extrabold text-[#0F4C3A]">
              مدیریت وبلاگ و مجله یادمان (CMS)
            </h2>
          </div>
          <p className="text-xs text-[#6A7873] mt-1">
            مدیریت کامل مقالات، نگارش محتوای تحریریه، دسته‌بندی‌ها، نویسندگان و متاداده‌های سئو
          </p>
        </div>

        {/* Action Button depending on subTab */}
        <div className="flex items-center gap-2">
          {subTab === 'posts' && (
            <button
              type="button"
              onClick={() => {
                setEditingPost(null);
                setIsPostModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#0F4C3A] hover:bg-[#155A45] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد مقاله جدید</span>
            </button>
          )}

          {subTab === 'categories' && (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#0F4C3A] hover:bg-[#155A45] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن دسته‌بندی</span>
            </button>
          )}

          {subTab === 'authors' && (
            <button
              type="button"
              onClick={() => {
                setEditingAuthor(null);
                setIsAuthorModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#0F4C3A] hover:bg-[#155A45] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن نویسنده</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE6DF] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setSubTab('posts')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'posts'
              ? 'bg-[#0F4C3A] text-white shadow-xs'
              : 'bg-white text-[#6A7873] border border-[#EAE6DF] hover:bg-[#FAF8F5]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>مقالات مجله ({toPersianDigits(posts.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('categories')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'categories'
              ? 'bg-[#0F4C3A] text-white shadow-xs'
              : 'bg-white text-[#6A7873] border border-[#EAE6DF] hover:bg-[#FAF8F5]'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>دسته‌بندی‌های وبلاگ ({toPersianDigits(categories.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('authors')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'authors'
              ? 'bg-[#0F4C3A] text-white shadow-xs'
              : 'bg-white text-[#6A7873] border border-[#EAE6DF] hover:bg-[#FAF8F5]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>تیم نویسندگان و تحریریه ({toPersianDigits(authors.length)})</span>
        </button>
      </div>

      {/* SUBTAB 1: ARTICLES MANAGEMENT */}
      {subTab === 'posts' && (
        <div className="space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] space-y-1">
              <span className="text-[11px] text-[#6A7873]">کل مقالات</span>
              <p className="text-xl font-extrabold text-[#0F4C3A]">{toPersianDigits(posts.length)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] space-y-1">
              <span className="text-[11px] text-[#6A7873]">مقالات منتشر شده</span>
              <p className="text-xl font-extrabold text-emerald-600">{toPersianDigits(publishedCount)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] space-y-1">
              <span className="text-[11px] text-[#6A7873]">پیش‌نویس‌ها</span>
              <p className="text-xl font-extrabold text-amber-600">{toPersianDigits(draftCount)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] space-y-1">
              <span className="text-[11px] text-[#6A7873]">مجموع بازدیدها</span>
              <p className="text-xl font-extrabold text-[#D4AF37]">{toPersianDigits(totalViews)}</p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در میان عنوان، خلاصه و برچسب‌های مقالات..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#EAE6DF] text-xs focus:border-[#0F4C3A] focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-[#8A9893] absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-[#EAE6DF] bg-white text-xs font-semibold text-[#0F4C3A] focus:outline-hidden"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="published">منتشر شده</option>
                <option value="draft">پیش‌نویس</option>
                <option value="scheduled">زمان‌بندی شده</option>
                <option value="archived">آرشیو شده</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#EAE6DF] bg-white text-xs font-semibold text-[#0F4C3A] focus:outline-hidden"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameFa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Articles Table */}
          <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#0F4C3A] font-bold">
                    <th className="py-3.5 px-4">تصویر</th>
                    <th className="py-3.5 px-4">عنوان و خلاصه مقاله</th>
                    <th className="py-3.5 px-4">دسته‌بندی</th>
                    <th className="py-3.5 px-4">نویسنده</th>
                    <th className="py-3.5 px-4">وضعیت</th>
                    <th className="py-3.5 px-4">بازدید</th>
                    <th className="py-3.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => {
                      const postCategory = categoriesMap[post.categoryId];
                      const postAuthor = authorsMap[post.authorId];

                      return (
                        <tr key={post.id} className="hover:bg-[#FAF8F5]/80 transition">
                          <td className="py-3.5 px-4">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-14 h-10 rounded-lg object-cover shadow-2xs border border-[#EAE6DF]"
                            />
                          </td>

                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {post.isFeatured && (
                                  <span className="bg-[#D4AF37]/20 text-[#8B6E16] text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                    برگزیده
                                  </span>
                                )}
                                <h4 className="font-extrabold text-[#0F4C3A] text-xs leading-snug">
                                  {post.title}
                                </h4>
                              </div>
                              <p className="text-[11px] text-[#6A7873] line-clamp-1">
                                {post.excerpt}
                              </p>
                              <span className="text-[10px] text-[#8A9893] block font-mono">
                                /{post.slug}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="bg-[#FAF8F5] text-[#0F4C3A] font-bold px-2.5 py-1 rounded-lg border border-[#EAE6DF]">
                              {postCategory?.nameFa || 'نامشخص'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {postAuthor && (
                                <img
                                  src={postAuthor.avatar}
                                  alt={postAuthor.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              )}
                              <span className="font-semibold text-[#2C3B37]">
                                {postAuthor?.name || 'تحریریه'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {getStatusBadge(post.status)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#6A7873]">
                            {toPersianDigits(post.viewsCount || 0)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {onViewPostInBlog && (
                                <button
                                  type="button"
                                  onClick={() => onViewPostInBlog(post.slug)}
                                  title="مشاهده در سایت"
                                  className="p-1.5 text-[#0F4C3A] hover:bg-[#0F4C3A]/10 rounded-lg transition"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPost(post);
                                  setIsPostModalOpen(true);
                                }}
                                title="ویرایش مقاله"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setPostToDelete(post);
                                }}
                                title="حذف مقاله"
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-[#8A9893]">
                        مقاله‌ای مطابق با فیلترهای انتخابی یافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CATEGORIES MANAGEMENT */}
      {subTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-[#EAE6DF] shadow-2xs overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#0F4C3A] font-bold">
                <th className="py-3.5 px-4">ترتیب</th>
                <th className="py-3.5 px-4">عنوان دسته‌بندی</th>
                <th className="py-3.5 px-4">نامک (Slug)</th>
                <th className="py-3.5 px-4">توضیحات</th>
                <th className="py-3.5 px-4">تعداد مقالات</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {categories.map((cat) => {
                const count = posts.filter((p) => p.categoryId === cat.id).length;
                return (
                  <tr key={cat.id} className="hover:bg-[#FAF8F5]/80 transition">
                    <td className="py-3.5 px-4 font-bold text-[#D4AF37]">
                      {toPersianDigits(cat.sortOrder)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0F4C3A]">
                      {cat.nameFa}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#6A7873]">
                      {cat.slug}
                    </td>
                    <td className="py-3.5 px-4 text-[#4A5A55] max-w-xs truncate">
                      {cat.descriptionFa || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0F4C3A]">
                      {toPersianDigits(count)} مقاله
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setCategoryToDelete(cat);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 3: AUTHORS MANAGEMENT */}
      {subTab === 'authors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {authors.map((author) => {
            const authorPosts = posts.filter((p) => p.authorId === author.id);
            return (
              <div
                key={author.id}
                className="bg-white p-5 rounded-3xl border border-[#EAE6DF] shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]/40 shadow-xs shrink-0"
                  />
                  <div className="space-y-1 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-[#0F4C3A]">{author.name}</h4>
                      <span className="text-[11px] font-bold text-[#D4AF37] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#EAE6DF]">
                        {toPersianDigits(authorPosts.length)} مقاله
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#17634D]">{author.role}</p>
                    <p className="text-xs text-[#6A7873] line-clamp-2 leading-relaxed">
                      {author.bio || 'بدون بیوگرافی'}
                    </p>
                    {author.email && (
                      <p className="text-[11px] text-[#8A9893] font-mono truncate">{author.email}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE6DF] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAuthor(author);
                      setIsAuthorModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setAuthorToDelete(author);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#EAE6DF] overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F4C3A]">تأیید حذف مقاله</h3>
                <p className="text-xs text-[#6A7873]">این عملیات غیرقابل بازگشت است</p>
              </div>
            </div>

            <p className="text-xs text-[#2C3B37] leading-relaxed">
              آیا از حذف دائمی مقاله «<span className="font-bold text-[#0F4C3A]">{postToDelete.title}</span>» از پایگاه‌داده اطمینان دارید؟ تمامی متاداده‌ها و پیوندهای این مقاله حذف خواهند شد.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingPost}
                onClick={() => {
                  setPostToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6A7873] hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeletingPost}
                onClick={handleConfirmDeletePost}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingPost && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isDeletingPost ? 'در حال حذف...' : 'بله، حذف کن'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#EAE6DF] overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F4C3A]">تأیید حذف دسته‌بندی</h3>
                <p className="text-xs text-[#6A7873]">این عملیات غیرقابل بازگشت است</p>
              </div>
            </div>

            <p className="text-xs text-[#2C3B37] leading-relaxed">
              آیا از حذف دسته‌بندی «<span className="font-bold text-[#0F4C3A]">{categoryToDelete.nameFa}</span>» اطمینان دارید؟
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => {
                  setCategoryToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6A7873] hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={handleConfirmDeleteCategory}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingCategory && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isDeletingCategory ? 'در حال حذف...' : 'بله، حذف کن'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Author Confirmation Modal */}
      {authorToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#EAE6DF] overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F4C3A]">تأیید حذف نویسنده</h3>
                <p className="text-xs text-[#6A7873]">این عملیات غیرقابل بازگشت است</p>
              </div>
            </div>

            <p className="text-xs text-[#2C3B37] leading-relaxed">
              آیا از حذف نویسنده «<span className="font-bold text-[#0F4C3A]">{authorToDelete.name}</span>» اطمینان دارید؟
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingAuthor}
                onClick={() => {
                  setAuthorToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6A7873] hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeletingAuthor}
                onClick={handleConfirmDeleteAuthor}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingAuthor && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isDeletingAuthor ? 'در حال حذف...' : 'بله، حذف کن'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BlogPostEditModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        post={editingPost}
        categories={categories}
        authors={authors}
        products={products}
        onSave={onSavePost}
      />

      <BlogCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={editingCategory}
        onSave={onSaveCategory}
      />

      <BlogAuthorModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        author={editingAuthor}
        onSave={onSaveAuthor}
      />

    </div>
  );
};
