import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AdminSection,
  Order,
  CorporateInquiry,
  Product,
  CustomContentItem,
  StoreSettings,
  OrderStatus,
  CorporateInquiryStatus,
  Category,
  Coupon,
  ProductReview,
  ConsultationRequest,
  ConsultationStatus,
  User,
  BlogPost,
  BlogCategory,
  BlogAuthor,
} from '../../types';
import { AdminHeader } from './AdminHeader';
import { AdminDashboard } from './AdminDashboard';
import { AdminOrders } from './AdminOrders';
import { OrderDetailsModal } from './OrderDetailsModal';
import { AdminProducts } from './AdminProducts';
import { ProductEditModal } from './ProductEditModal';
import { AdminCorporateInquiries } from './AdminCorporateInquiries';
import { AdminConsultations } from './AdminConsultations';
import { AdminCustomItems } from './AdminCustomItems';
import { AdminSettings } from './AdminSettings';
import { AdminCategories } from './AdminCategories';
import { AdminInventory } from './AdminInventory';
import { AdminDiscounts } from './AdminDiscounts';
import { AdminReviews } from './AdminReviews';
import { AdminUsers } from './AdminUsers';
import { AdminBlog } from './AdminBlog';
import { AdminHomepageSettings } from './AdminHomepageSettings';
import { api, recordDiagLog } from '../../services/api';
import { clearAdminSession } from '../../utils/adminAuthService';
import { mapBackendOrderToFrontendOrder, getOrderStatusLabel } from '../../utils/orderAdapter';

interface AdminPanelProps {
  onExitAdmin: () => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  inquiries: CorporateInquiry[];
  setInquiries: React.Dispatch<React.SetStateAction<CorporateInquiry[]>>;
  consultations: ConsultationRequest[];
  setConsultations: React.Dispatch<React.SetStateAction<ConsultationRequest[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customItems: CustomContentItem[];
  setCustomItems: React.Dispatch<React.SetStateAction<CustomContentItem[]>>;
  storeSettings: StoreSettings;
  setStoreSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  reviews: ProductReview[];
  setReviews: React.Dispatch<React.SetStateAction<ProductReview[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  blogPosts: BlogPost[];
  setBlogPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  blogCategories: BlogCategory[];
  setBlogCategories: React.Dispatch<React.SetStateAction<BlogCategory[]>>;
  blogAuthors: BlogAuthor[];
  setBlogAuthors: React.Dispatch<React.SetStateAction<BlogAuthor[]>>;
  onViewPostInBlog?: (slug: string) => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onExitAdmin,
  onLogout,
  orders,
  setOrders,
  inquiries,
  setInquiries,
  consultations,
  setConsultations,
  products,
  setProducts,
  customItems,
  setCustomItems,
  storeSettings,
  setStoreSettings,
  categories,
  setCategories,
  coupons,
  setCoupons,
  reviews,
  setReviews,
  users,
  setUsers,
  blogPosts,
  setBlogPosts,
  blogCategories,
  setBlogCategories,
  blogAuthors,
  setBlogAuthors,
  onViewPostInBlog,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      const validSections: AdminSection[] = [
        'dashboard',
        'orders',
        'users',
        'consultations',
        'inquiries',
        'products',
        'inventory',
        'custom_items',
        'categories',
        'discounts',
        'reviews',
        'blog',
        'settings',
        'homepage',
      ];
      if (validSections.includes(hash as AdminSection)) {
        return hash as AdminSection;
      }
    }
    return 'dashboard';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = activeSection;
    }
  }, [activeSection]);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Stable ref for onLogout to prevent dependency churn and infinite fetching loops
  const onLogoutRef = useRef(onLogout);
  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  // In-flight guard to prevent duplicate concurrent network requests
  const inFlightRef = useRef<Record<string, boolean>>({});

  // Sync real users from backend PostgreSQL database
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (inFlightRef.current['users']) return;
    inFlightRef.current['users'] = true;
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const serverUsers = await api.users.getAllAdmin();
      if (Array.isArray(serverUsers)) {
        setUsers(serverUsers);
      }
    } catch (err: any) {
      if (
        err?.status === 401 ||
        err?.status === 403 ||
        err?.code === 'UNAUTHORIZED' ||
        err?.code === 'FORBIDDEN'
      ) {
        clearAdminSession();
        onLogoutRef.current?.();
        return;
      }
      const isNetErr = err?.code === 'NETWORK_ERROR' || err?.message === 'Failed to fetch';
      if (!isNetErr) {
        console.warn('Admin users backend notice:', err?.message || err);
      }
      setUsersError(err?.message || 'خطا در برقراری ارتباط با سرور و دریافت فهرست کاربران از پایگاه داده.');
    } finally {
      setIsLoadingUsers(false);
      inFlightRef.current['users'] = false;
    }
  }, [setUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Orders backend management
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderActionFeedback, setOrderActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessingOrderAction, setIsProcessingOrderAction] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (inFlightRef.current['orders']) return;
    inFlightRef.current['orders'] = true;
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const serverOrders = await api.orders.getAllAdmin();
      if (Array.isArray(serverOrders)) {
        const adaptedOrders = serverOrders.map(mapBackendOrderToFrontendOrder);
        setOrders(adaptedOrders);
      }
    } catch (err: any) {
      if (
        err?.status === 401 ||
        err?.status === 403 ||
        err?.code === 'UNAUTHORIZED' ||
        err?.code === 'FORBIDDEN'
      ) {
        clearAdminSession();
        onLogoutRef.current?.();
        return;
      }
      const isNetErr = err?.code === 'NETWORK_ERROR' || err?.message === 'Failed to fetch';
      if (!isNetErr) {
        console.warn('Admin orders backend notice:', err?.message || err);
      }
      setOrdersError(err?.message || 'خطا در دریافت لیست سفارش‌ها از پایگاه‌داده.');
    } finally {
      setIsLoadingOrders(false);
      inFlightRef.current['orders'] = false;
    }
  }, [setOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reviews backend management
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewActionFeedback, setReviewActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessingReviewAction, setIsProcessingReviewAction] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (inFlightRef.current['reviews']) return;
    inFlightRef.current['reviews'] = true;
    setIsLoadingReviews(true);
    setReviewsError(null);
    try {
      const serverReviews = await api.reviews.getAllAdmin();
      if (Array.isArray(serverReviews)) {
        setReviews(serverReviews);
      }
    } catch (err: any) {
      if (
        err?.status === 401 ||
        err?.status === 403 ||
        err?.code === 'UNAUTHORIZED' ||
        err?.code === 'FORBIDDEN'
      ) {
        clearAdminSession();
        onLogoutRef.current?.();
        return;
      }
      const isNetErr = err?.code === 'NETWORK_ERROR' || err?.message === 'Failed to fetch';
      if (!isNetErr) {
        console.warn('Admin reviews backend notice:', err?.message || err);
      }
      setReviewsError(err?.message || 'خطا در دریافت لیست دیدگاه‌ها از پایگاه‌داده.');
    } finally {
      setIsLoadingReviews(false);
      inFlightRef.current['reviews'] = false;
    }
  }, [setReviews]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Stats for header badges
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;
  const newInquiriesCount = inquiries.filter((i) => i.status === 'new').length;
  const newConsultationsCount = consultations.filter((c) => c.status === 'new').length;
  const pendingReviewsCount = reviews.filter((r) => r.status === 'pending').length;
  const lowStockCount = products.filter(
    (p) => p.inStock && (p.stockQuantity || 0) <= (p.lowStockThreshold || 5)
  ).length;

  // Products & Inventory backend synchronization
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (inFlightRef.current['products']) return;
    inFlightRef.current['products'] = true;
    setIsLoadingProducts(true);
    try {
      const serverProducts = await api.products.getAll();
      if (Array.isArray(serverProducts)) {
        setProducts(serverProducts);
      }
    } catch (err: any) {
      console.warn('Failed to load products from PostgreSQL:', err);
    } finally {
      setIsLoadingProducts(false);
      inFlightRef.current['products'] = false;
    }
  }, [setProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Corporate Inquiries Backend Synchronization
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [inquiryFeedback, setInquiryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInquiries = useCallback(async () => {
    if (inFlightRef.current['inquiries']) return;
    inFlightRef.current['inquiries'] = true;
    setIsLoadingInquiries(true);
    try {
      const data = await api.inquiries.getAllCorporateAdmin();
      if (Array.isArray(data)) {
        setInquiries(data);
      }
    } catch (err: any) {
      console.warn('Failed to load corporate inquiries from PostgreSQL:', err);
    } finally {
      setIsLoadingInquiries(false);
      inFlightRef.current['inquiries'] = false;
    }
  }, [setInquiries]);

  // Consultations Backend Synchronization
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
  const [consultationFeedback, setConsultationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConsultations = useCallback(async () => {
    if (inFlightRef.current['consultations']) return;
    inFlightRef.current['consultations'] = true;
    setIsLoadingConsultations(true);
    try {
      const data = await api.inquiries.getAllConsultationsAdmin();
      if (Array.isArray(data)) {
        setConsultations(data);
      }
    } catch (err: any) {
      console.warn('Failed to load consultations from PostgreSQL:', err);
    } finally {
      setIsLoadingConsultations(false);
      inFlightRef.current['consultations'] = false;
    }
  }, [setConsultations]);

  useEffect(() => {
    fetchInquiries();
    fetchConsultations();
  }, [fetchInquiries, fetchConsultations]);

  // Blog Backend Synchronization
  const [isLoadingBlog, setIsLoadingBlog] = useState(false);
  const [blogFeedback, setBlogFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchBlogData = useCallback(async () => {
    if (inFlightRef.current['blog']) return;
    inFlightRef.current['blog'] = true;
    setIsLoadingBlog(true);
    try {
      const [postsRes, catsRes, authorsRes] = await Promise.all([
        api.blog.getAllAdmin(),
        api.blog.getCategories(),
        api.blog.getAuthors(),
      ]);
      if (Array.isArray(postsRes)) setBlogPosts(postsRes);
      if (Array.isArray(catsRes)) setBlogCategories(catsRes);
      if (Array.isArray(authorsRes)) setBlogAuthors(authorsRes);
    } catch (err: any) {
      console.warn('Error loading blog data from PostgreSQL:', err);
    } finally {
      setIsLoadingBlog(false);
      inFlightRef.current['blog'] = false;
    }
  }, [setBlogPosts, setBlogCategories, setBlogAuthors]);

  useEffect(() => {
    fetchBlogData();
  }, [fetchBlogData]);

  // Homepage CMS & Store Settings Backend Synchronization
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const fetchCMSAndSettings = useCallback(async () => {
    if (inFlightRef.current['cms_settings']) return;
    inFlightRef.current['cms_settings'] = true;
    setIsLoadingSettings(true);
    setSettingsError(null);
    try {
      const [homepageRes, settingsRes] = await Promise.all([
        api.cms.getHomepage(),
        api.cms.getSettings(),
      ]);
      if (settingsRes) {
        setStoreSettings((prev) => ({
          ...prev,
          ...settingsRes,
          homepage: homepageRes || settingsRes.homepage || prev.homepage,
        }));
      }
    } catch (err: any) {
      console.warn('Error loading CMS and store settings from PostgreSQL:', err);
      setSettingsError(err?.message || 'خطا در بارگذاری تنظیمات از پایگاه‌داده');
    } finally {
      setIsLoadingSettings(false);
      inFlightRef.current['cms_settings'] = false;
    }
  }, [setStoreSettings]);

  useEffect(() => {
    fetchCMSAndSettings();
  }, [fetchCMSAndSettings]);

  // Custom Items Backend Synchronization
  const [isLoadingCustomItems, setIsLoadingCustomItems] = useState(false);
  const [customItemsError, setCustomItemsError] = useState<string | null>(null);

  const fetchCustomItems = useCallback(async () => {
    if (inFlightRef.current['custom_items']) return;
    inFlightRef.current['custom_items'] = true;
    setIsLoadingCustomItems(true);
    setCustomItemsError(null);
    try {
      const items = await api.customItems.getAllAdmin();
      setCustomItems(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.warn('Error loading custom items from PostgreSQL:', err);
      setCustomItemsError(err?.message || 'خطا در بارگذاری اقلام اختصاصی از پایگاه‌داده');
    } finally {
      setIsLoadingCustomItems(false);
      inFlightRef.current['custom_items'] = false;
    }
  }, [setCustomItems]);

  useEffect(() => {
    fetchCustomItems();
  }, [fetchCustomItems]);

  // Categories Backend Synchronization
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (inFlightRef.current['categories']) return;
    inFlightRef.current['categories'] = true;
    setIsLoadingCategories(true);
    setCategoriesError(null);
    try {
      const cats = await api.categories.getAll();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err: any) {
      console.warn('Error loading categories from PostgreSQL:', err);
      setCategoriesError(err?.message || 'خطا در بارگذاری دسته‌بندی‌ها از پایگاه‌داده');
    } finally {
      setIsLoadingCategories(false);
      inFlightRef.current['categories'] = false;
    }
  }, [setCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Blog Handlers - Persisted directly into PostgreSQL
  const handleSaveBlogPost = async (post: BlogPost) => {
    try {
      const exists = blogPosts.some((p) => p.id === post.id);
      if (exists) {
        await api.blog.updateAdmin(post.id, post);
        setBlogFeedback({ type: 'success', message: 'مقاله با موفقیت به‌روزرسانی شد.' });
      } else {
        await api.blog.createAdmin(post);
        setBlogFeedback({ type: 'success', message: 'مقاله جدید با موفقیت در پایگاه‌داده ایجاد شد.' });
      }
      await fetchBlogData();
      return true;
    } catch (err: any) {
      console.error('Failed to save blog post to PostgreSQL:', err);
      setBlogFeedback({ type: 'error', message: err?.message || 'خطا در ذخیره مقاله.' });
      throw err;
    }
  };

  const handleDeleteBlogPost = async (postId: string) => {
    try {
      await api.blog.deleteAdmin(postId);
      setBlogFeedback({ type: 'success', message: 'مقاله با موفقیت از پایگاه‌داده حذف شد.' });
      await fetchBlogData();
      return true;
    } catch (err: any) {
      console.error('Failed to delete blog post from PostgreSQL:', err);
      setBlogFeedback({ type: 'error', message: err?.message || 'خطا در حذف مقاله.' });
      throw err;
    }
  };

  const handleSaveBlogCategory = async (category: BlogCategory) => {
    try {
      const exists = blogCategories.some((c) => c.id === category.id);
      if (exists) {
        await api.blog.updateCategoryAdmin(category.id, category);
        setBlogFeedback({ type: 'success', message: 'دسته‌بندی با موفقیت به‌روزرسانی شد.' });
      } else {
        await api.blog.createCategoryAdmin(category);
        setBlogFeedback({ type: 'success', message: 'دسته‌بندی جدید با موفقیت در پایگاه‌داده ثبت شد.' });
      }
      await fetchBlogData();
      return true;
    } catch (err: any) {
      console.error('Failed to save blog category to PostgreSQL:', err);
      setBlogFeedback({ type: 'error', message: err?.message || 'خطا در ذخیره دسته‌بندی.' });
      throw err;
    }
  };

  const handleDeleteBlogCategory = async (categoryId: string) => {
    try {
      await api.blog.deleteCategoryAdmin(categoryId);
      setBlogFeedback({ type: 'success', message: 'دسته‌بندی با موفقیت حذف شد.' });
      await fetchBlogData();
      return true;
    } catch (err: any) {
      console.error('Failed to delete blog category from PostgreSQL:', err);
      setBlogFeedback({ type: 'error', message: err?.message || 'خطا در حذف دسته‌بندی.' });
      throw err;
    }
  };

  const handleSaveBlogAuthor = async (author: BlogAuthor) => {
    try {
      const exists = blogAuthors.some((a) => a.id === author.id);
      if (exists) {
        await api.blog.updateAuthorAdmin(author.id, author);
        setBlogFeedback({ type: 'success', message: 'اطلاعات نویسنده با موفقیت به‌روزرسانی شد.' });
      } else {
        await api.blog.createAuthorAdmin(author);
        setBlogFeedback({ type: 'success', message: 'نویسنده جدید با موفقیت ثبت شد.' });
      }
      await fetchBlogData();
      return true;
    } catch (err: any) {
      console.error('Failed to save blog author to PostgreSQL:', err);
      setBlogFeedback({ type: 'error', message: err?.message || 'خطا در ثبت نویسنده.' });
      throw err;
    }
  };

  const handleDeleteBlogAuthor = async (authorId: string) => {
    try {
      await api.blog.deleteAuthorAdmin(authorId);
      setBlogFeedback({ type: 'success', message: 'نویسنده با موفقیت حذف شد.' });
      await fetchBlogData();
      return true;
    } catch (err: any) {
      console.error('Failed to delete blog author from PostgreSQL:', err);
      setBlogFeedback({ type: 'error', message: err?.message || 'خطا در حذف نویسنده.' });
      throw err;
    }
  };

  // User Handlers
  const handleUpdateUser = async (updatedUser: User) => {
    const isTargetActive = updatedUser.status === 'active';
    const targetRole = updatedUser.role === 'admin' ? 'ADMIN' : 'CUSTOMER';
    const profile = {
      name: (updatedUser.fullName || updatedUser.name || '').trim(),
      phone: (updatedUser.phoneNumber || updatedUser.phone || '').trim(),
      companyName: updatedUser.corporateProfile?.companyName || '',
    };
    try {
      // Persist active/inactive status, role, and profile details in PostgreSQL via authenticated Admin API
      const savedUser = await api.users.updateStatusAdmin(updatedUser.id, isTargetActive, targetRole, profile);
      // Immediately reflect updated user in local state so UI never goes stale
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? (savedUser || { ...u, ...updatedUser }) : u)));
      // Refresh user list directly from PostgreSQL database in background
      try {
        await fetchUsers();
      } catch (fetchErr) {
        console.warn('Background user list refresh note:', fetchErr);
      }
    } catch (err: any) {
      console.error('Failed to update user status in PostgreSQL:', err);
      try {
        await fetchUsers();
      } catch {
        // Prevent secondary refresh error from hiding the real update error
      }
      throw err;
    }
  };

  // Order Handlers
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    try {
      setIsProcessingOrderAction(true);
      setOrderActionFeedback(null);
      await api.orders.updateStatusAdmin(
        updatedOrder.id,
        updatedOrder.status.toUpperCase(),
        updatedOrder.adminNotes,
        updatedOrder.trackingNumber
      );
      await Promise.all([fetchOrders(), fetchProducts()]);
      setSelectedOrder(updatedOrder);
      setOrderActionFeedback({
        type: 'success',
        message: `اطلاعات و وضعیت سفارش ${updatedOrder.id} با موفقیت در پایگاه‌داده ذخیره شد.`,
      });
    } catch (err: any) {
      console.error('Failed to update order details:', err);
      await fetchOrders();
      const errorMsg = err?.message || 'خطا در ذخیره جزئیات سفارش در پایگاه‌داده.';
      setOrderActionFeedback({
        type: 'error',
        message: errorMsg,
      });
      throw err;
    } finally {
      setIsProcessingOrderAction(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setIsProcessingOrderAction(true);
      setOrderActionFeedback(null);
      await api.orders.updateStatusAdmin(orderId, newStatus.toUpperCase());
      await Promise.all([fetchOrders(), fetchProducts()]);
      setOrderActionFeedback({
        type: 'success',
        message: `وضعیت سفارش ${orderId} با موفقیت به «${getOrderStatusLabel(newStatus)}» تغییر یافت.`,
      });
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      await fetchOrders();
      const errorMsg = err?.message || 'خطا در تغییر وضعیت سفارش در پایگاه‌داده.';
      setOrderActionFeedback({
        type: 'error',
        message: errorMsg,
      });
      throw err;
    } finally {
      setIsProcessingOrderAction(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setIsProcessingOrderAction(true);
      setOrderActionFeedback(null);
      await api.orders.deleteAdmin(orderId);
      await Promise.all([fetchOrders(), fetchProducts()]);
      if (selectedOrder?.id === orderId) {
        setIsOrderModalOpen(false);
        setSelectedOrder(null);
      }
      setOrderActionFeedback({
        type: 'success',
        message: `سفارش ${orderId} با موفقیت حذف شد و موجودی انبار به محصولات بازگردانده شد.`,
      });
    } catch (err: any) {
      console.error('Failed to delete order:', err);
      await fetchOrders();
      const errorMsg = err?.message || 'خطا در حذف سفارش از پایگاه‌داده.';
      setOrderActionFeedback({
        type: 'error',
        message: errorMsg,
      });
      throw err;
    } finally {
      setIsProcessingOrderAction(false);
    }
  };

  // Product Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (product: Product) => {
    const exists = products.some((p) => p.id === product.id);
    try {
      if (exists) {
        const saved = await api.products.updateAdmin(product.id, product);
        const merged = saved ? { ...product, ...saved } : product;
        const updated = products.map((p) => (p.id === product.id ? merged : p));
        setProducts(updated);
        await fetchProducts();
        return merged;
      } else {
        const saved = await api.products.createAdmin(product);
        const merged = saved ? { ...product, ...saved } : product;
        const updated = [merged, ...products];
        setProducts(updated);
        await fetchProducts();
        return merged;
      }
    } catch (err: any) {
      console.error('Failed to save product via backend API:', err);
      throw err;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.products.deleteAdmin(productId);
      const updated = products.filter((p) => p.id !== productId);
      setProducts(updated);
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to delete product via backend API:', err);
      throw err;
    }
  };

  const handleToggleStock = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    const newStock = !target?.inStock;
    try {
      await api.products.updateAdmin(productId, { inStock: newStock });
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to toggle stock via backend API:', err);
    }
    const updated = products.map((p) =>
      p.id === productId ? { ...p, inStock: newStock } : p
    );
    setProducts(updated);
  };

  // Inquiry Handlers
  const handleUpdateInquiryStatus = async (
    id: string,
    newStatus: CorporateInquiryStatus,
    adminNotes?: string
  ) => {
    try {
      await api.inquiries.updateCorporateAdmin(id, { status: newStatus, adminNotes });
      setInquiryFeedback({
        type: 'success',
        message: 'وضعیت استعلام سازمانی با موفقیت در پایگاه‌داده ذخیره شد.',
      });
      await fetchInquiries();
      return true;
    } catch (err: any) {
      console.error('Failed to update corporate inquiry in PostgreSQL:', err);
      setInquiryFeedback({
        type: 'error',
        message: err?.message || 'خطا در به‌روزرسانی وضعیت استعلام سازمانی.',
      });
      throw err;
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    try {
      await api.inquiries.deleteCorporateAdmin(id);
      setInquiryFeedback({
        type: 'success',
        message: 'استعلام سازمانی با موفقیت از پایگاه‌داده حذف شد.',
      });
      await fetchInquiries();
      return true;
    } catch (err: any) {
      console.error('Failed to delete corporate inquiry from PostgreSQL:', err);
      setInquiryFeedback({
        type: 'error',
        message: err?.message || 'خطا در حذف استعلام سازمانی.',
      });
      throw err;
    }
  };

  // Consultation Handlers
  const handleUpdateConsultationStatus = async (
    id: string,
    newStatus: ConsultationStatus,
    adminNotes?: string,
    assignedConsultant?: string
  ) => {
    try {
      await api.inquiries.updateConsultationAdmin(id, {
        status: newStatus,
        adminNotes,
        assignedConsultant,
      });
      setConsultationFeedback({
        type: 'success',
        message: 'وضعیت و یادداشت‌های مشاوره با موفقیت ثبت شد.',
      });
      await fetchConsultations();
      return true;
    } catch (err: any) {
      console.error('Failed to update consultation in PostgreSQL:', err);
      setConsultationFeedback({
        type: 'error',
        message: err?.message || 'خطا در به‌روزرسانی درخواست مشاوره.',
      });
      throw err;
    }
  };

  const handleDeleteConsultation = async (id: string) => {
    try {
      await api.inquiries.deleteConsultationAdmin(id);
      setConsultationFeedback({
        type: 'success',
        message: 'درخواست مشاوره با موفقیت از پایگاه‌داده حذف شد.',
      });
      await fetchConsultations();
      return true;
    } catch (err: any) {
      console.error('Failed to delete consultation from PostgreSQL:', err);
      setConsultationFeedback({
        type: 'error',
        message: err?.message || 'خطا در حذف درخواست مشاوره.',
      });
      throw err;
    }
  };

  // Custom Items Handlers - Persisted directly into PostgreSQL
  const handleUpdateCustomItem = async (item: CustomContentItem): Promise<void> => {
    try {
      const updated = await api.customItems.updateAdmin(item.id, item);
      setCustomItems((prev) => prev.map((ci) => (ci.id === item.id ? updated : ci)));
      await fetchCustomItems();
    } catch (err: any) {
      console.error('Failed to update custom item in PostgreSQL:', err);
      throw err;
    }
  };

  const handleAddCustomItem = async (item: CustomContentItem): Promise<void> => {
    try {
      const created = await api.customItems.createAdmin(item);
      setCustomItems((prev) => [created, ...prev.filter((ci) => ci.id !== created.id)]);
      await fetchCustomItems();
    } catch (err: any) {
      console.error('Failed to create custom item in PostgreSQL:', err);
      throw err;
    }
  };

  const handleDeleteCustomItem = async (id: string) => {
    try {
      await api.customItems.deleteAdmin(id);
      setCustomItems((prev) => prev.filter((ci) => ci.id !== id));
      await fetchCustomItems();
    } catch (err: any) {
      console.error('Failed to delete custom item from PostgreSQL:', err);
      throw err;
    }
  };

  // Category Handlers - Persisted directly into PostgreSQL
  const handleSaveCategories = (updatedCats: Category[]) => {
    setCategories(updatedCats);
  };

  // Coupon Handlers
  const handleSaveCoupons = (updatedCoupons: Coupon[]) => {
    setCoupons(updatedCoupons);
  };

  // Review Handlers
  const handleUpdateReviewStatus = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setIsProcessingReviewAction(true);
      setReviewActionFeedback(null);
      await api.reviews.updateStatusAdmin(reviewId, newStatus);
      await fetchReviews();
      setReviewActionFeedback({
        type: 'success',
        message:
          newStatus === 'approved'
            ? 'دیدگاه با موفقیت تایید و در سایت منتشر شد.'
            : 'وضعیت دیدگاه با موفقیت به عدم انتشار تغییر یافت.',
      });
    } catch (err: any) {
      console.error('Failed to update review status in backend:', err);
      await fetchReviews();
      setReviewActionFeedback({
        type: 'error',
        message: err?.message || 'خطا در به‌روزرسانی وضعیت دیدگاه در پایگاه‌داده.',
      });
      throw err;
    } finally {
      setIsProcessingReviewAction(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setIsProcessingReviewAction(true);
      setReviewActionFeedback(null);
      await api.reviews.deleteAdmin(reviewId);
      await fetchReviews();
      setReviewActionFeedback({
        type: 'success',
        message: 'دیدگاه با موفقیت حذف شد',
      });
    } catch (err: any) {
      console.error('Failed to delete review in backend:', err);
      await fetchReviews();
      setReviewActionFeedback({
        type: 'error',
        message: err?.message || 'خطا در حذف دیدگاه از پایگاه‌داده.',
      });
      throw err;
    } finally {
      setIsProcessingReviewAction(false);
    }
  };

  const handleSaveReviews = (updatedReviews: ProductReview[]) => {
    setReviews(updatedReviews);
  };

  // Settings Handler - Persisted directly into PostgreSQL
  const handleSaveSettings = async (settingsToSave: StoreSettings) => {
    recordDiagLog('handleSaveSettings:start', { hasHomepage: !!settingsToSave.homepage });
    setIsSavingSettings(true);
    setSettingsError(null);
    try {
      const [homepageUpdated, settingsUpdated] = await Promise.all([
        settingsToSave.homepage
          ? api.cms.updateHomepageAdmin(settingsToSave.homepage)
          : Promise.resolve(null),
        api.cms.updateSettingsAdmin(settingsToSave),
      ]);

      setStoreSettings((prev) => ({
        ...prev,
        ...(settingsUpdated || {}),
        homepage: homepageUpdated || settingsToSave.homepage || prev.homepage,
      }));
    } catch (err: any) {
      recordDiagLog('handleSaveSettings:catch', { message: err?.message, code: err?.code, status: err?.status });
      console.error('Failed to save settings to PostgreSQL:', err);
      const errorMsg = err?.message || 'خطا در برقراری ارتباط با سرور و ذخیره‌سازی تنظیمات';
      setSettingsError(errorMsg);
      throw err;
    } finally {
      recordDiagLog('handleSaveSettings:finally_reset_isSavingSettings');
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C2826] flex flex-col font-['Vazirmatn',sans-serif]" dir="rtl">
      {/* Header */}
      <AdminHeader
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onExitAdmin={onExitAdmin}
        onLogout={onLogout}
        pendingOrdersCount={pendingOrdersCount}
        newInquiriesCount={newInquiriesCount}
        newConsultationsCount={newConsultationsCount}
        pendingReviewsCount={pendingReviewsCount}
        lowStockCount={lowStockCount}
        usersCount={users.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'dashboard' && (
          <AdminDashboard
            orders={orders}
            inquiries={inquiries}
            products={products}
            onNavigateSection={setActiveSection}
            onViewOrder={handleViewOrder}
            onViewInquiry={() => {
              setActiveSection('inquiries');
            }}
            onAddNewProduct={handleOpenAddProduct}
          />
        )}

        {activeSection === 'orders' && (
          <AdminOrders
            orders={orders}
            onViewOrder={handleViewOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            isLoading={isLoadingOrders}
            isProcessing={isProcessingOrderAction}
            error={ordersError}
            feedbackMessage={orderActionFeedback}
            onRefresh={fetchOrders}
          />
        )}

        {activeSection === 'users' && (
          <AdminUsers
            users={users}
            orders={orders}
            onUpdateUser={handleUpdateUser}
            onViewOrderDetails={handleViewOrder}
            isLoading={isLoadingUsers}
            error={usersError}
            onRefresh={fetchUsers}
          />
        )}

        {activeSection === 'consultations' && (
          <AdminConsultations
            consultations={consultations}
            isLoading={isLoadingConsultations}
            feedbackMessage={consultationFeedback}
            onClearFeedback={() => setConsultationFeedback(null)}
            onRefresh={fetchConsultations}
            onUpdateConsultationStatus={handleUpdateConsultationStatus}
            onDeleteConsultation={handleDeleteConsultation}
          />
        )}

        {activeSection === 'products' && (
          <AdminProducts
            products={products}
            categories={categories}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleStock={handleToggleStock}
            onRefresh={fetchProducts}
            isLoading={isLoadingProducts}
          />
        )}

        {activeSection === 'categories' && (
          <AdminCategories
            categories={categories}
            setCategories={setCategories}
            onSaveCategories={handleSaveCategories}
            onRefresh={fetchCategories}
            isLoading={isLoadingCategories}
          />
        )}

        {activeSection === 'blog' && (
          <AdminBlog
            posts={blogPosts}
            categories={blogCategories}
            authors={blogAuthors}
            products={products}
            isLoading={isLoadingBlog}
            feedbackMessage={blogFeedback}
            onClearFeedback={() => setBlogFeedback(null)}
            onSavePost={handleSaveBlogPost}
            onDeletePost={handleDeleteBlogPost}
            onSaveCategory={handleSaveBlogCategory}
            onDeleteCategory={handleDeleteBlogCategory}
            onSaveAuthor={handleSaveBlogAuthor}
            onDeleteAuthor={handleDeleteBlogAuthor}
            onViewPostInBlog={onViewPostInBlog}
          />
        )}

        {activeSection === 'inventory' && (
          <AdminInventory
            products={products}
            setProducts={setProducts}
            onRefresh={fetchProducts}
            isLoading={isLoadingProducts}
          />
        )}

        {activeSection === 'inquiries' && (
          <AdminCorporateInquiries
            inquiries={inquiries}
            isLoading={isLoadingInquiries}
            feedbackMessage={inquiryFeedback}
            onClearFeedback={() => setInquiryFeedback(null)}
            onRefresh={fetchInquiries}
            onUpdateInquiryStatus={handleUpdateInquiryStatus}
            onDeleteInquiry={handleDeleteInquiry}
          />
        )}

        {activeSection === 'custom_items' && (
          <AdminCustomItems
            customItems={customItems}
            onUpdateCustomItem={handleUpdateCustomItem}
            onAddCustomItem={handleAddCustomItem}
            onDeleteCustomItem={handleDeleteCustomItem}
            onRefresh={fetchCustomItems}
            isLoading={isLoadingCustomItems}
          />
        )}

        {activeSection === 'discounts' && (
          <AdminDiscounts
            coupons={coupons}
            setCoupons={setCoupons}
            onSaveCoupons={handleSaveCoupons}
          />
        )}

        {activeSection === 'reviews' && (
          <AdminReviews
            reviews={reviews}
            setReviews={setReviews}
            products={products}
            onSaveReviews={handleSaveReviews}
            onUpdateStatus={handleUpdateReviewStatus}
            onDeleteReview={handleDeleteReview}
            isLoading={isLoadingReviews}
            isProcessing={isProcessingReviewAction}
            error={reviewsError}
            feedbackMessage={reviewActionFeedback}
            onRefresh={fetchReviews}
          />
        )}

        {activeSection === 'homepage' && (
          <AdminHomepageSettings
            settings={storeSettings}
            onSaveSettings={handleSaveSettings}
            onExitAdmin={onExitAdmin}
            products={products}
            blogPosts={blogPosts}
            isLoading={isLoadingSettings}
            isSaving={isSavingSettings}
            error={settingsError}
            onRefresh={fetchCMSAndSettings}
          />
        )}

        {activeSection === 'settings' && (
          <AdminSettings
            settings={storeSettings}
            onSaveSettings={handleSaveSettings}
            isLoading={isLoadingSettings}
            isSaving={isSavingSettings}
            error={settingsError}
            onRefresh={fetchCMSAndSettings}
          />
        )}
      </main>

      {/* Order Details & Packing Slip Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setSelectedOrder(null);
        }}
        onUpdateOrder={handleUpdateOrder}
      />

      {/* Product Create / Edit Modal */}
      {isProductModalOpen && (
        <ProductEditModal
          key={editingProduct?.id || 'new-gift-pack-modal'}
          product={editingProduct}
          categories={categories}
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};
