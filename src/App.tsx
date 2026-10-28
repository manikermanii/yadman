/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CustomBoxBuilder } from './components/CustomBoxBuilder';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CorporateGiftSection } from './components/CorporateGiftSection';
import { CorporateLandingPage } from './components/CorporateLandingPage';
import { ConsultationSection } from './components/ConsultationSection';
import { ConsultationPage } from './components/ConsultationPage';
import { AiGiftConcierge } from './components/AiGiftConcierge';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { ShopCatalogView } from './components/shop/ShopCatalogView';
import { PromotionalBannersSection } from './components/common/PromotionalBannersSection';
import { Sparkles, Package } from 'lucide-react';

// Blog Components
import { BlogIndexPage } from './components/blog/BlogIndexPage';
import { BlogArticlePage } from './components/blog/BlogArticlePage';
import { HomeBlogSection } from './components/blog/HomeBlogSection';

// Authentication & User Components
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { UserAccountDashboard } from './components/account/UserAccountDashboard';

import {
  mergeCarts,
  getPersianNowString,
} from './utils/authService';
import { toPersianDigits } from './utils/formatters';
import {
  getAdminSession,
  clearAdminSession,
  verifyAdminSessionWithBackend,
  AdminSession,
} from './utils/adminAuthService';
import { api } from './services/api';
import { authToast, toast } from './context/ToastContext';
import {
  DEFAULT_FILTER_STATE,
  parseFiltersFromUrl,
  serializeFiltersToUrl,
} from './utils/filterEngine';

import { RIBBONS, WAX_SEALS, INITIAL_COUPONS, INITIAL_REVIEWS } from './data/products';
import { CATEGORIES } from './data/categories';
import {
  Product,
  CategoryId,
  CartItem,
  RibbonOption,
  WaxSealOption,
  BoxTypeOption,
  CustomContentItem,
  Order,
  CorporateInquiry,
  StoreSettings,
  Category,
  Coupon,
  ProductReview,
  ConsultationRequest,
  ConsultationCustomerType,
  User,
  ProductFilterState,
  BlogPost,
  BlogCategory,
  BlogAuthor,
  VoiceRecordingData,
} from './types';
import {
  loadProductsFromStorage,
  loadCustomItemsFromStorage,
  loadStoreSettingsFromStorage,
  loadCategoriesFromStorage,
  loadCouponsFromStorage,
  loadCurrentUserFromStorage,
} from './data/mockAdminData';

const normalizeTab = (rawTab: string): string => {
  if (!rawTab) return 'home';
  const clean = rawTab.startsWith('nav-') ? rawTab.replace(/^nav-/, '') : rawTab;
  if (clean === 'b2b') return 'corporate';
  if (clean === 'custom-box') return 'builder';
  if (clean === 'shop' || clean === 'products') return 'catalog';
  return clean;
};

export default function App() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => getAdminSession());
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    const p = window.location.pathname;
    const h = window.location.hash;
    return p === '/admin' || p.startsWith('/admin/') || h === '#admin';
  });
  const [activeTab, setActiveTab] = useState<string>('home');
  const [accountSubTab, setAccountSubTab] = useState<string>('overview');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [consultationCustomerType, setConsultationCustomerType] = useState<ConsultationCustomerType>('personal');

  // Unified Product Filter State & URL Sync
  const [filters, setFilters] = useState<ProductFilterState>(() => {
    return parseFiltersFromUrl(window.location.search, DEFAULT_FILTER_STATE);
  });

  // Auth Modal State ('login' | 'register' | 'forgot_password' | null)
  const [authModal, setAuthModal] = useState<'login' | 'register' | 'forgot_password' | null>(null);

  // Persistent Users & Authentication State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(loadCurrentUserFromStorage);

  // Persistent Admin State
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<CorporateInquiry[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customItems, setCustomItems] = useState<CustomContentItem[]>(loadCustomItemsFromStorage);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(loadStoreSettingsFromStorage);
  const [categories, setCategories] = useState<Category[]>(loadCategoriesFromStorage);
  const [coupons, setCoupons] = useState<Coupon[]>(loadCouponsFromStorage);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  // Products & Categories API Loading & Error State
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const fetchProductsAndCategories = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        api.products.getAll(),
        api.products.getCategories(),
      ]);

      // Database is the ONLY source of truth: when backend returns an array (including []), set it directly
      if (Array.isArray(prodsRes)) {
        setProducts(prodsRes);
      }

      if (Array.isArray(catsRes)) {
        setCategories(catsRes);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.warn('Could not fetch products/categories from backend:', err);
      setProductsError(err?.message || 'خطا در برقراری ارتباط با پایگاه‌داده محصولات');
      setProducts((prev) => (prev.length > 0 ? prev : []));
      setCategories((prev) => (prev.length > 0 ? prev : []));
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Purge obsolete product keys on startup
    loadProductsFromStorage();
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  // Store Settings & Homepage CMS from PostgreSQL
  const fetchStoreSettings = useCallback(async () => {
    try {
      const [settingsRes, homepageRes] = await Promise.all([
        api.cms.getSettings().catch(() => null),
        api.cms.getHomepage().catch(() => null),
      ]);
      if (settingsRes || homepageRes) {
        setStoreSettings((prev) => ({
          ...prev,
          ...(settingsRes || {}),
          homepage: homepageRes || settingsRes?.homepage || prev.homepage,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch store settings/homepage from backend:', err);
    }
  }, []);

  useEffect(() => {
    fetchStoreSettings();
  }, [fetchStoreSettings]);

  // Custom Items from PostgreSQL
  const fetchCustomItems = useCallback(async () => {
    try {
      const items = await api.customItems.getAll();
      if (Array.isArray(items)) {
        setCustomItems(items);
      }
    } catch (err) {
      console.warn('Could not fetch custom items from PostgreSQL:', err);
    }
  }, []);

  useEffect(() => {
    fetchCustomItems();
  }, [fetchCustomItems]);

  // Active Coupons from PostgreSQL
  const fetchActiveCoupons = useCallback(async () => {
    try {
      const activeCoupons = await api.coupons.getActive();
      if (Array.isArray(activeCoupons)) {
        setCoupons(activeCoupons);
      }
    } catch (err) {
      console.warn('Could not fetch active coupons from PostgreSQL:', err);
    }
  }, []);

  useEffect(() => {
    fetchActiveCoupons();
  }, [fetchActiveCoupons]);

  // Selected Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Blog State - Loaded directly from PostgreSQL via backend API
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [blogAuthors, setBlogAuthors] = useState<BlogAuthor[]>([]);
  const [activeArticleSlug, setActiveArticleSlug] = useState<string | null>(null);
  const [activeBlogCategorySlug, setActiveBlogCategorySlug] = useState<string | null>(null);
  const [isBlogLoading, setIsBlogLoading] = useState<boolean>(true);

  // Fetch fresh blog data from PostgreSQL
  const fetchBlogData = useCallback(async () => {
    setIsBlogLoading(true);
    try {
      const [postsRes, catsRes, authorsRes] = await Promise.all([
        isAdminView ? api.blog.getAllAdmin() : api.blog.getPosts(),
        api.blog.getCategories(),
        api.blog.getAuthors(),
      ]);
      if (Array.isArray(postsRes)) setBlogPosts(postsRes);
      if (Array.isArray(catsRes)) setBlogCategories(catsRes);
      if (Array.isArray(authorsRes)) setBlogAuthors(authorsRes);
    } catch (err) {
      console.warn('Could not fetch blog data from PostgreSQL:', err);
    } finally {
      setIsBlogLoading(false);
    }
  }, [isAdminView]);

  // Fetch inquiries and consultations from PostgreSQL for Admin
  const fetchInquiriesAndConsultations = useCallback(async () => {
    try {
      const [inqRes, consRes] = await Promise.all([
        api.inquiries.getAllCorporateAdmin(),
        api.inquiries.getAllConsultationsAdmin(),
      ]);
      if (Array.isArray(inqRes)) setInquiries(inqRes);
      if (Array.isArray(consRes)) setConsultations(consRes);
    } catch (err) {
      console.warn('Could not fetch corporate inquiries or consultations from PostgreSQL:', err);
    }
  }, []);

  useEffect(() => {
    fetchBlogData();
  }, [fetchBlogData]);

  useEffect(() => {
    if (isAdminView) {
      fetchInquiriesAndConsultations();
    }
  }, [isAdminView, fetchInquiriesAndConsultations]);

  // Sync filters to URL query string when on catalog page
  useEffect(() => {
    if (activeTab === 'catalog') {
      const urlQuery = serializeFiltersToUrl(filters);
      const newUrl = `/catalog${urlQuery}`;
      window.history.replaceState({ filters, tab: 'catalog' }, '', newUrl);
    }
  }, [filters, activeTab]);

  // Real backend customer session check on mount
  useEffect(() => {
    let isMounted = true;
    api.auth.getMe()
      .then((res) => {
        if (isMounted && res?.user) {
          setCurrentUser((prev) => {
            const merged: User = {
              ...prev,
              ...res.user,
              id: res.user.id,
              fullName: res.user.name || res.user.fullName || prev?.fullName || 'کاربر',
              phoneNumber: res.user.phone || res.user.phoneNumber || prev?.phoneNumber || '',
            };
            return merged;
          });
        }
      })
      .catch(() => {
        // Not logged in or session expired
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Real backend admin session check on opening admin
  useEffect(() => {
    if (isAdminView) {
      let isMounted = true;
      verifyAdminSessionWithBackend().then((validSession) => {
        if (isMounted) {
          setAdminSession(validSession);
        }
      });

      return () => {
        isMounted = false;
      };
    }
  }, [isAdminView]);

  // Real backend admin users synchronization when admin is active
  useEffect(() => {
    if (adminSession) {
      let isMounted = true;
      api.users
        .getAllAdmin()
        .then((serverUsers) => {
          if (isMounted && Array.isArray(serverUsers)) {
            setUsers(serverUsers);
          }
        })
        .catch((err) => {
          console.warn('Admin users fetch in App note:', err);
          if (
            err?.status === 401 ||
            err?.status === 403 ||
            err?.code === 'UNAUTHORIZED' ||
            err?.code === 'FORBIDDEN'
          ) {
            clearAdminSession();
            if (isMounted) {
              setAdminSession(null);
            }
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [adminSession]);

  // Handle URL path initialization and popstate synchronization
  const syncRouteFromLocation = useCallback(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;

    if (pathname === '/admin' || pathname.startsWith('/admin') || hash === '#admin') {
      setIsAdminView(true);
      return;
    }

    setIsAdminView(false);

    if (pathname.startsWith('/blog/category/')) {
      const catSlug = pathname.replace('/blog/category/', '').replace(/\/$/, '');
      setActiveBlogCategorySlug(catSlug);
      setActiveArticleSlug(null);
      setActiveTab('blog');
    } else if (pathname.startsWith('/blog/')) {
      const slug = pathname.replace('/blog/', '').replace(/\/$/, '');
      if (slug) {
        setActiveArticleSlug(slug);
        setActiveTab('blog-article');
      } else {
        setActiveTab('blog');
      }
    } else if (pathname === '/blog') {
      setActiveArticleSlug(null);
      setActiveBlogCategorySlug(null);
      setActiveTab('blog');
    } else if (pathname === '/catalog' || pathname === '/shop' || pathname === '/products') {
      setFilters(parseFiltersFromUrl(window.location.search, DEFAULT_FILTER_STATE));
      setActiveTab('catalog');
    } else if (pathname === '/corporate' || pathname === '/b2b') {
      setActiveTab('corporate');
    } else if (pathname === '/consultation') {
      setActiveTab('consultation');
    } else if (pathname === '/builder' || pathname === '/custom-box') {
      setActiveTab('builder');
    } else if (pathname === '/account') {
      setActiveTab('account');
    } else if (pathname === '/ai') {
      setActiveTab('ai');
    } else {
      setActiveTab('home');
    }
  }, []);

  useEffect(() => {
    syncRouteFromLocation();
    const handlePopState = () => {
      syncRouteFromLocation();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncRouteFromLocation]);

  // Blog Navigation Handlers
  const handleNavigateToBlog = (catSlug?: string) => {
    setActiveBlogCategorySlug(catSlug || null);
    setActiveArticleSlug(null);
    setActiveTab('blog');
    const newUrl = catSlug ? `/blog/category/${catSlug}` : '/blog';
    window.history.pushState({ tab: 'blog' }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToArticle = (slug: string) => {
    setActiveArticleSlug(slug);
    setActiveTab('blog-article');
    window.history.pushState({ tab: 'blog-article', slug }, '', `/blog/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Main Unified Tab Navigation Handler
  const handleNavigateTab = (
    rawTab: string,
    options?: { scrollToTop?: boolean; replaceUrl?: boolean }
  ) => {
    const tab = normalizeTab(rawTab);
    setIsAdminView(false);

    if (tab === 'blog') {
      handleNavigateToBlog();
      return;
    }

    setActiveArticleSlug(null);
    setActiveBlogCategorySlug(null);
    setActiveTab(tab);

    let targetPath = '/';
    if (tab === 'catalog') targetPath = '/catalog';
    else if (tab === 'corporate') targetPath = '/corporate';
    else if (tab === 'consultation') targetPath = '/consultation';
    else if (tab === 'builder') targetPath = '/builder';
    else if (tab === 'account') targetPath = '/account';
    else if (tab === 'ai') targetPath = '/ai';
    else if (tab === 'home') targetPath = '/';

    if (tab === 'catalog') {
      const urlQuery = serializeFiltersToUrl(filters);
      targetPath = `${targetPath}${urlQuery}`;
    }

    if (window.location.pathname !== targetPath) {
      if (options?.replaceUrl) {
        window.history.replaceState({ tab }, '', targetPath);
      } else {
        window.history.pushState({ tab }, '', targetPath);
      }
    }

    if (options?.scrollToTop !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Update filters handler
  const handleUpdateFilters = (updates: Partial<ProductFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setFilters({
      ...DEFAULT_FILTER_STATE,
      category: 'all',
      searchQuery: '',
    });
  };

  // Quick navigation to catalog with specific category or search
  const handleNavigateToCatalogWithCategory = (catId: CategoryId) => {
    setFilters((prev) => ({ ...prev, category: catId, page: 1 }));
    handleNavigateTab('catalog');
  };

  const handleLikeBlogPost = (postId: string) => {
    const updated = blogPosts.map((p) => {
      if (p.id === postId) {
        return { ...p, likesCount: (p.likesCount || 0) + 1 };
      }
      return p;
    });
    setBlogPosts(updated);
  };

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('hedyeh_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Sync cart to localStorage as offline/guest cache
  useEffect(() => {
    try {
      localStorage.setItem('hedyeh_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Load real backend Cart & Wishlist from PostgreSQL Prisma when user is authenticated
  useEffect(() => {
    if (!currentUser?.id) return;

    let isMounted = true;

    const syncBackendData = async () => {
      try {
        const [cartRes, wishlistRes] = await Promise.allSettled([
          api.cart.getCart(),
          api.wishlist.getWishlist(),
        ]);

        if (!isMounted) return;

        if (cartRes.status === 'fulfilled' && cartRes.value?.items) {
          setCartItems(cartRes.value.items);
        }

        if (wishlistRes.status === 'fulfilled' && wishlistRes.value?.wishlist) {
          const serverWishlist = wishlistRes.value.wishlist;
          setCurrentUser((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              wishlist: serverWishlist,
            };
          });
        }
      } catch (err) {
        console.warn('Backend cart/wishlist sync warning:', err);
      }
    };

    syncBackendData();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Dynamic document title update
  useEffect(() => {
    if (storeSettings.storeName) {
      if (activeTab === 'corporate') {
        document.title = `هدایای سازمانی و رویدادها | ${storeSettings.storeName}`;
      } else if (activeTab === 'builder') {
        document.title = `طراحی و ساخت آنلاین پک هدیه اختصاصی | ${storeSettings.storeName}`;
      } else if (activeTab === 'catalog') {
        document.title = `کاتالوگ پک‌های هدیه لوکس | ${storeSettings.storeName}`;
      } else if (activeTab === 'consultation') {
        document.title = `مشاوره انتخاب هدیه | ${storeSettings.storeName}`;
      } else if (activeTab === 'blog') {
        document.title = `مجله یادمان | ایده‌ها و راهنمای انتخاب پک‌های هدیه | ${storeSettings.storeName}`;
      } else if (activeTab === 'blog-article') {
        const article = blogPosts.find((p) => p.slug === activeArticleSlug || p.id === activeArticleSlug);
        document.title = article ? `${article.seoTitle || article.title} | ${storeSettings.storeName}` : `مجله یادمان | ${storeSettings.storeName}`;
      } else if (activeTab === 'account') {
        document.title = `حساب کاربری | ${storeSettings.storeName}`;
      } else if (activeTab === 'ai') {
        document.title = `مشاور هوشمند انتخاب هدیه | ${storeSettings.storeName}`;
      } else {
        if (storeSettings.homepage?.seo?.metaTitle) {
          document.title = storeSettings.homepage.seo.metaTitle;
        } else {
          document.title = `${storeSettings.storeName} | ${storeSettings.tagline}`;
        }
      }
    }
  }, [activeTab, storeSettings, activeArticleSlug, blogPosts]);

  // Filtering products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      product.titleFa.includes(searchQuery) ||
      product.description.includes(searchQuery) ||
      product.itemsIncluded.some((item) => item.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  // Pending items count for admin badge
  const pendingAdminCount =
    orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length +
    inquiries.filter((i) => i.status === 'new').length +
    consultations.filter((c) => c.status === 'new').length +
    reviews.filter((r) => r.status === 'pending').length;

  // --- Auth Handlers ---
  const handleLoginSuccess = async (user: User) => {
    const previousGuestCart = [...cartItems];

    const updatedUser: User = {
      ...user,
      lastLoginAt: new Date().toISOString(),
      lastLoginAtFa: getPersianNowString(),
    };

    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
    setUsers(updatedUsers);
    setCurrentUser(updatedUser);
    setAuthModal(null);

    // Sync any guest cart items to the server-side database
    try {
      if (previousGuestCart.length > 0) {
        await Promise.allSettled(
          previousGuestCart.map((item) => {
            if (item.isCustomBox && item.customBoxDetails) {
              return api.cart.addItem({
                isCustomBox: true,
                customBoxDetails: item.customBoxDetails,
                quantity: item.quantity || 1,
              });
            }
            return api.cart.addItem({
              productId: item.product?.id,
              quantity: item.quantity || 1,
              cardMessage: item.cardMessage,
              recipientName: item.recipientName,
              ribbonColor: item.ribbonColor,
              waxSeal: item.waxSeal,
            });
          })
        );
      }

      // Refresh real Cart and Wishlist from server
      const [freshCart, freshWishlist] = await Promise.allSettled([
        api.cart.getCart(),
        api.wishlist.getWishlist(),
      ]);

      if (freshCart.status === 'fulfilled' && freshCart.value?.items) {
        setCartItems(freshCart.value.items);
      }
      if (freshWishlist.status === 'fulfilled' && freshWishlist.value?.wishlist) {
        setCurrentUser((prev) => (prev ? { ...prev, wishlist: freshWishlist.value.wishlist } : null));
      }
    } catch (err) {
      console.warn('Post-login cart/wishlist sync failed:', err);
    }
  };

  const handleRegisterSuccess = async (newUser: User) => {
    const previousGuestCart = [...cartItems];

    const registeredUser: User = {
      ...newUser,
    };

    const updatedUsers = [registeredUser, ...users];
    setUsers(updatedUsers);
    setCurrentUser(registeredUser);
    setAuthModal(null);

    // Sync any guest cart items to the server-side database
    try {
      if (previousGuestCart.length > 0) {
        await Promise.allSettled(
          previousGuestCart.map((item) => {
            if (item.isCustomBox && item.customBoxDetails) {
              return api.cart.addItem({
                isCustomBox: true,
                customBoxDetails: item.customBoxDetails,
                quantity: item.quantity || 1,
              });
            }
            return api.cart.addItem({
              productId: item.product?.id,
              quantity: item.quantity || 1,
              cardMessage: item.cardMessage,
              recipientName: item.recipientName,
              ribbonColor: item.ribbonColor,
              waxSeal: item.waxSeal,
            });
          })
        );
      }

      const [freshCart, freshWishlist] = await Promise.allSettled([
        api.cart.getCart(),
        api.wishlist.getWishlist(),
      ]);

      if (freshCart.status === 'fulfilled' && freshCart.value?.items) {
        setCartItems(freshCart.value.items);
      }
      if (freshWishlist.status === 'fulfilled' && freshWishlist.value?.wishlist) {
        setCurrentUser((prev) => (prev ? { ...prev, wishlist: freshWishlist.value.wishlist } : null));
      }
    } catch (err) {
      console.warn('Post-register cart/wishlist sync failed:', err);
    }
  };

  const handlePasswordResetComplete = (updatedUser: User) => {
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    // Switch to login modal
    setAuthModal('login');
  };

  const handleLogout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network errors on logout
    }
    setCurrentUser(null);
    setCartItems([]);
    try {
      localStorage.removeItem('hedyeh_cart');
    } catch {}
    authToast.logoutSuccess();
    if (activeTab === 'account') {
      setActiveTab('home');
    }
  }, [activeTab]);

  const handleUpdateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);
  };

  const handleOpenAccount = (subTab: string = 'overview') => {
    setAccountSubTab(subTab);
    if (!currentUser) {
      setAuthModal('login');
      return;
    }
    handleNavigateTab('account');
  };

  // --- Wishlist Handlers ---
  const userWishlistIds = currentUser?.wishlist || [];

  const handleToggleWishlist = async (product: Product) => {
    if (!currentUser) {
      setAuthModal('login');
      return;
    }

    const previousWishlist = currentUser.wishlist || [];
    const isAlreadyWishlisted = previousWishlist.includes(product.id);
    const updatedWishlist = isAlreadyWishlisted
      ? previousWishlist.filter((id) => id !== product.id)
      : [...previousWishlist, product.id];

    // Optimistic local update
    const updatedUser: User = {
      ...currentUser,
      wishlist: updatedWishlist,
    };
    handleUpdateCurrentUser(updatedUser);

    // Backend PostgreSQL Prisma sync
    try {
      const res = await api.wishlist.toggle(product.id);
      if (res && Array.isArray(res.wishlist)) {
        handleUpdateCurrentUser({
          ...currentUser,
          wishlist: res.wishlist,
        });
      }
    } catch (err: any) {
      console.warn('Backend wishlist toggle sync error:', err);
      // Rollback to previous wishlist state on failure
      handleUpdateCurrentUser({
        ...currentUser,
        wishlist: previousWishlist,
      });
      toast.error('خطا در به‌روزرسانی لیست علاقه‌مندی‌ها', err?.message || 'لطفاً دوباره تلاش کنید.');
    }
  };

  // --- Store & Consultation Handlers ---
  const handleQuickView = async (product: Product) => {
    setSelectedProduct(product);
    if (product.id || product.slug) {
      try {
        const freshProduct = await api.products.getById(product.slug || product.id);
        if (freshProduct) {
          setSelectedProduct(freshProduct);
        }
      } catch {
        // Keep existing product if fetch fails
      }
    }
  };

  const handleOpenConsultation = (initialType?: ConsultationCustomerType) => {
    if (initialType) {
      setConsultationCustomerType(initialType);
    }
    handleNavigateTab('consultation');
  };

  const handleConsultationSubmitted = (newRequest: ConsultationRequest) => {
    setConsultations((prev) => [newRequest, ...prev.filter((c) => c.id !== newRequest.id)]);
  };

  const handleAddToCartDirect = async (product: Product) => {
    // Stock validation: Reject out of stock products
    if (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
      toast.error('محصول ناموجود است', `کالای «${product.titleFa}» در حال حاضر در انبار موجود نمی‌باشد.`);
      return;
    }

    const defaultRibbon = RIBBONS.find((r) => r.colorHex === product.ribbonColorHex) || RIBBONS[0];
    const defaultSeal = WAX_SEALS[0];
    const previousCartItems = [...cartItems];

    const existingIndex = cartItems.findIndex((item) => item.product?.id === product.id);
    const currentQtyInCart = existingIndex > -1 ? cartItems[existingIndex].quantity : 0;
    const maxAvailable = product.stockQuantity !== undefined ? product.stockQuantity : 999;

    if (currentQtyInCart + 1 > maxAvailable) {
      toast.warning('محدودیت موجودی انبار', `حداکثر تعداد قابل سفارش این محصول ${toPersianDigits(maxAvailable)} عدد می‌باشد.`);
      return;
    }

    // Optimistic UI state
    const optimisticItemId = `cart-${Date.now()}-${Math.random()}`;
    const optimisticItem: CartItem = {
      id: optimisticItemId,
      product,
      quantity: 1,
      cardMessage: 'با آرزوی بهترین‌ها و شادکامی',
      waxSeal: defaultSeal.nameFa,
      ribbonColor: defaultRibbon.nameFa,
      unitPrice: product.price,
    };

    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.product?.id === product.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, optimisticItem];
    });
    setIsCartOpen(true);

    // Sync to PostgreSQL backend when logged in
    if (currentUser) {
      try {
        const res = await api.cart.addItem({
          productId: product.id,
          quantity: 1,
          waxSeal: defaultSeal.nameFa,
          ribbonColor: defaultRibbon.nameFa,
          cardMessage: 'با آرزوی بهترین‌ها و شادکامی',
        });
        if (res?.items) {
          setCartItems(res.items);
        }
      } catch (err: any) {
        console.warn('Backend add to cart error:', err);
        setCartItems(previousCartItems);
        toast.error('افزودن به سبد خرید ناموفق بود', err?.message || 'لطفاً دوباره تلاش کنید.');
      }
    }
  };

  const handleAddToCartWithOptions = async (
    product: Product,
    selectedRibbon: RibbonOption,
    selectedWaxSeal: WaxSealOption,
    cardMessage: string,
    recipientName: string
  ) => {
    // Stock validation: Reject out of stock products
    if (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
      toast.error('محصول ناموجود است', `کالای «${product.titleFa}» در حال حاضر در انبار موجود نمی‌باشد.`);
      return;
    }

    const existingIndex = cartItems.findIndex((item) => item.product?.id === product.id);
    const currentQtyInCart = existingIndex > -1 ? cartItems[existingIndex].quantity : 0;
    const maxAvailable = product.stockQuantity !== undefined ? product.stockQuantity : 999;

    if (currentQtyInCart + 1 > maxAvailable) {
      toast.warning('محدودیت موجودی انبار', `حداکثر تعداد قابل سفارش این محصول ${toPersianDigits(maxAvailable)} عدد می‌باشد.`);
      return;
    }

    const previousCartItems = [...cartItems];
    const optimisticItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random()}`,
      product,
      quantity: 1,
      cardMessage,
      recipientName,
      waxSeal: selectedWaxSeal.nameFa,
      ribbonColor: selectedRibbon.nameFa,
      unitPrice: product.price,
    };

    setCartItems((prev) => [...prev, optimisticItem]);
    setIsCartOpen(true);

    if (currentUser) {
      try {
        const res = await api.cart.addItem({
          productId: product.id,
          quantity: 1,
          cardMessage,
          recipientName,
          waxSeal: selectedWaxSeal.nameFa,
          ribbonColor: selectedRibbon.nameFa,
        });
        if (res?.items) {
          setCartItems(res.items);
        }
      } catch (err: any) {
        console.warn('Backend add to cart with options error:', err);
        setCartItems(previousCartItems);
        toast.error('افزودن به سبد خرید ناموفق بود', err?.message || 'لطفاً دوباره تلاش کنید.');
      }
    }
  };

  const handleAddCustomBoxToCart = async (customBox: {
    boxType: BoxTypeOption;
    ribbon: RibbonOption;
    waxSeal: WaxSealOption;
    items: CustomContentItem[];
    cardMessage: string;
    cardFont: string;
    totalPrice: number;
    voiceRecording?: VoiceRecordingData;
  }) => {
    const previousCartItems = [...cartItems];
    const optimisticItem: CartItem = {
      id: `custom-box-${Date.now()}`,
      isCustomBox: true,
      customBoxDetails: customBox,
      quantity: 1,
      unitPrice: customBox.totalPrice,
    };

    setCartItems((prev) => [...prev, optimisticItem]);
    setIsCartOpen(true);

    if (currentUser) {
      try {
        const res = await api.cart.addItem({
          isCustomBox: true,
          customBoxDetails: customBox,
          quantity: 1,
          voiceRecordingUrl: customBox.voiceRecording?.url,
          voiceDuration: customBox.voiceRecording?.duration,
        });
        if (res?.items) {
          setCartItems(res.items);
        }
      } catch (err: any) {
        console.warn('Backend add custom box error:', err);
        setCartItems(previousCartItems);
        toast.error('افزودن باکس اختصاصی ناموفق بود', err?.message || 'لطفاً دوباره تلاش کنید.');
      }
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, delta: number) => {
    const previousCartItems = [...cartItems];
    const currentItem = cartItems.find((item) => item.id === cartItemId);
    if (!currentItem) return;

    const newQty = (currentItem.quantity || 1) + delta;

    // Enforce available stock limits
    if (delta > 0 && currentItem.product) {
      const maxAvailable = currentItem.product.stockQuantity !== undefined ? currentItem.product.stockQuantity : 999;
      if (!currentItem.product.inStock || newQty > maxAvailable) {
        toast.warning('محدودیت موجودی انبار', `حداکثر تعداد قابل سفارش این محصول ${toPersianDigits(maxAvailable)} عدد می‌باشد.`);
        return;
      }
    }

    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );

    if (currentUser) {
      try {
        if (newQty <= 0) {
          const res = await api.cart.removeItem(cartItemId);
          if (res?.items) setCartItems(res.items);
        } else {
          const res = await api.cart.updateQuantity(cartItemId, newQty);
          if (res?.items) setCartItems(res.items);
        }
      } catch (err: any) {
        console.warn('Backend update quantity error:', err);
        setCartItems(previousCartItems);
        toast.error('به‌روزرسانی تعداد ناموفق بود', err?.message || 'موجودی یا دسترسی نامعتبر است.');
      }
    }
  };

  const handleRemoveCartItem = async (cartItemId: string) => {
    const previousCartItems = [...cartItems];
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));

    if (currentUser) {
      try {
        const res = await api.cart.removeItem(cartItemId);
        if (res?.items) setCartItems(res.items);
      } catch (err: any) {
        console.warn('Backend remove cart item error:', err);
        setCartItems(previousCartItems);
        toast.error('حذف آیتم ناموفق بود', err?.message || 'خطا در ارتباط با سرور.');
      }
    }
  };

  const handleClearCart = async () => {
    const previousCartItems = [...cartItems];
    setCartItems([]);
    if (currentUser) {
      try {
        await api.cart.clearCart();
      } catch (err: any) {
        console.warn('Backend clear cart error:', err);
        setCartItems(previousCartItems);
        toast.error('پاک کردن سبد خرید ناموفق بود', err?.message || 'خطا در ارتباط با سرور.');
      }
    }
  };

  const handleStartCheckout = () => {
    // Prevent checkout if any item in cart is out of stock
    const hasOutOfStock = cartItems.some(
      (item) => item.product && (!item.product.inStock || (item.product.stockQuantity !== undefined && item.product.stockQuantity <= 0))
    );
    if (hasOutOfStock) {
      toast.error('کالای ناموجود در سبد خرید', 'یک یا چند کالا در سبد خرید شما ناموجود هستند. لطفاً آنها را پیش از ثبت سفارش حذف فرمایید.');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderPlaced = async (newOrder: Order) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    setLastPlacedOrder(newOrder);

    // Refresh products catalog & stock immediately from PostgreSQL database
    await fetchProductsAndCategories();

    // Clear server cart after successful order placement
    if (currentUser) {
      try {
        await api.cart.clearCart();
      } catch (err) {
        console.warn('Post-order cart clear error:', err);
      }
    }
  };

  const handleInquirySubmitted = (newInquiry: CorporateInquiry) => {
    setInquiries((prev) => [newInquiry, ...prev.filter((i) => i.id !== newInquiry.id)]);
  };

  const handleAddReview = (newReview: ProductReview) => {
    setReviews((prev) => [newReview, ...prev.filter((r) => r.id !== newReview.id)]);
  };

  const handleExitAdmin = useCallback(() => {
    setIsAdminView(false);
    if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
      window.history.pushState(null, '', '/');
    }
  }, []);

  const handleAdminLogout = useCallback(() => {
    clearAdminSession();
    setAdminSession(null);
    setIsAdminView(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
  }, []);

  const handleAdminLoginSuccess = useCallback((session: AdminSession) => {
    setAdminSession(session);
    setIsAdminView(true);
  }, []);

  // Render Admin View
  if (isAdminView) {
    if (!adminSession) {
      return (
        <AdminLoginPage
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToStore={handleExitAdmin}
        />
      );
    }

    return (
      <AdminPanel
        onExitAdmin={handleExitAdmin}
        onLogout={handleAdminLogout}
        orders={orders}
        setOrders={setOrders}
        inquiries={inquiries}
        setInquiries={setInquiries}
        consultations={consultations}
        setConsultations={setConsultations}
        products={products}
        setProducts={setProducts}
        customItems={customItems}
        setCustomItems={setCustomItems}
        storeSettings={storeSettings}
        setStoreSettings={setStoreSettings}
        categories={categories}
        setCategories={setCategories}
        coupons={coupons}
        setCoupons={setCoupons}
        reviews={reviews}
        setReviews={setReviews}
        users={users}
        setUsers={setUsers}
        blogPosts={blogPosts}
        setBlogPosts={setBlogPosts}
        blogCategories={blogCategories}
        setBlogCategories={setBlogCategories}
        blogAuthors={blogAuthors}
        setBlogAuthors={setBlogAuthors}
        onViewPostInBlog={(slug) => {
          setIsAdminView(false);
          handleNavigateToArticle(slug);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C2826] font-['Vazirmatn',sans-serif] flex flex-col selection:bg-[#0F4C3A] selection:text-[#FAF8F5]" dir="rtl">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={filters.searchQuery}
        setSearchQuery={(q) => {
          handleUpdateFilters({ searchQuery: q, page: 1 });
          if (q.trim() && activeTab !== 'catalog') {
            handleNavigateTab('catalog');
          }
        }}
        onOpenAdmin={() => setIsAdminView(true)}
        pendingAdminCount={pendingAdminCount}
        currentUser={currentUser}
        onOpenLogin={() => setAuthModal('login')}
        onOpenRegister={() => setAuthModal('register')}
        onOpenAccount={handleOpenAccount}
        onLogout={handleLogout}
        wishlistCount={userWishlistIds.length}
        config={storeSettings.homepage?.header}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {/* Tab 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            <Hero
              heroImage={storeSettings.heroImage}
              config={storeSettings.homepage?.hero}
              onExploreCatalog={() => handleNavigateTab('catalog')}
              onOpenBuilder={() => handleNavigateTab('builder')}
              onOpenAiConcierge={() => handleNavigateTab('ai')}
              onNavigateTab={(tab) => handleNavigateTab(tab)}
            />

            {/* Promotional Banners Carousel/Stack */}
            {Boolean(storeSettings.homepage?.banners) && (
              <PromotionalBannersSection
                banners={
                  Array.isArray(storeSettings.homepage?.banners)
                    ? storeSettings.homepage.banners
                    : (storeSettings.homepage?.banners as any)?.banners || []
                }
                onNavigateTab={(tab) => handleNavigateTab(tab)}
              />
            )}

            {/* Catalog Showcase Section */}
            {storeSettings.homepage?.products?.visible !== false && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" id="home-showcase-products">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-right">
                  <div>
                    {storeSettings.homepage?.products?.badgeText && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0F4C3A]/10 text-[#0F4C3A] mb-1.5">
                        <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                        <span>{storeSettings.homepage.products.badgeText}</span>
                      </div>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F4C3A]">
                      {storeSettings.homepage?.products?.title || 'ویترین پک‌های هدیه'}
                    </h2>
                    <p className="text-xs text-[#6A7873] mt-1">
                      {storeSettings.homepage?.products?.description ||
                        'بسته‌بندی اختصاصی هاردباکس همراه با امکان درج کارت تبریک و مهر و موم'}
                    </p>
                  </div>

                  {/* Category Pills */}
                  {storeSettings.homepage?.products?.showCategoryFilter !== false && categories.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleNavigateToCatalogWithCategory(cat.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            filters.category === cat.id
                              ? 'bg-[#0F4C3A] text-white shadow-xs'
                              : 'bg-[#F4EFE6] text-[#2C3B37] hover:bg-[#EAE6DF]'
                          }`}
                        >
                          {cat.nameFa}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  {(() => {
                    const prodConfig = storeSettings.homepage?.products;
                    let displayList: Product[] = [];
                    if (prodConfig?.selectedProductIds && prodConfig.selectedProductIds.length > 0) {
                      displayList = prodConfig.selectedProductIds
                        .map((id) => products.find((p) => p.id === id))
                        .filter((p): p is Product => Boolean(p));
                    }
                    if (displayList.length === 0) {
                      const limit = prodConfig?.displayLimit || 6;
                      displayList = products.slice(0, limit);
                    }
                    if (displayList.length === 0) {
                      return (
                        <div className="col-span-full py-12 text-center bg-white/60 border border-dashed border-[#D4AF37]/30 rounded-2xl p-8 space-y-2">
                          <Package className="w-10 h-10 text-[#6A7873] mx-auto opacity-60" />
                          <p className="text-[#2C3B37] font-bold text-sm">در حال حاضر محصولی در فروشگاه ثبت نشده است.</p>
                          <p className="text-xs text-[#6A7873]">به‌زودی پک‌ها و هدایای فاخر یادمان در این بخش عرضه خواهند شد.</p>
                        </div>
                      );
                    }
                    return displayList.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={handleQuickView}
                        onAddToCart={handleAddToCartDirect}
                        isWishlisted={userWishlistIds.includes(product.id)}
                        onToggleWishlist={handleToggleWishlist}
                      />
                    ));
                  })()}
                </div>

                {/* View all in catalog button */}
                {storeSettings.homepage?.products?.showViewAllButton !== false && products.length > 0 && (
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => handleNavigateTab('catalog')}
                      className="bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#0F4C3A] border-2 border-[#0F4C3A] font-extrabold text-xs px-6 py-3 rounded-2xl shadow-xs transition-all active:scale-98 cursor-pointer"
                    >
                      {storeSettings.homepage?.products?.viewAllButtonText ||
                        'مشاهده همه هدایا در فروشگاه با فیلترهای پیشرفته'}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Prominent Consultation Section on Homepage */}
            <ConsultationSection
              onOpenConsultation={handleOpenConsultation}
              config={storeSettings.homepage?.consultation}
            />

            {/* Corporate Banner Section Preview */}
            <CorporateGiftSection
              onInquirySubmitted={handleInquirySubmitted}
              onOpenConsultation={handleOpenConsultation}
              config={storeSettings.homepage?.corporate}
            />

            {/* Blog Articles Section on Homepage */}
            <HomeBlogSection
              posts={blogPosts}
              categories={blogCategories}
              authors={blogAuthors}
              onOpenBlog={() => handleNavigateToBlog()}
              onSelectPost={handleNavigateToArticle}
              onSelectCategory={(slug) => handleNavigateToBlog(slug)}
              config={storeSettings.homepage?.blog}
            />
          </div>
        )}

        {/* Tab 2: DEDICATED FULL CATALOG & ADVANCED FILTERING VIEW */}
        {activeTab === 'catalog' && (
          <ShopCatalogView
            products={products}
            categories={categories}
            filters={filters}
            isLoading={productsLoading}
            error={productsError}
            onRetry={fetchProductsAndCategories}
            onUpdateFilters={handleUpdateFilters}
            onResetFilters={handleResetFilters}
            onQuickView={handleQuickView}
            onAddToCart={handleAddToCartDirect}
            wishlistIds={userWishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {/* Tab 3: DEDICATED CONSULTATION PAGE */}
        {activeTab === 'consultation' && (
          <ConsultationPage
            initialCustomerType={consultationCustomerType}
            storeSettings={storeSettings}
            onConsultationSubmitted={handleConsultationSubmitted}
            onExploreCatalog={() => handleNavigateTab('catalog')}
          />
        )}

        {/* Tab 4: CUSTOM BUILDER */}
        {activeTab === 'builder' && (
          <ErrorBoundary fallbackTitle="خطایی در بخش ساخت پک اختصاصی رخ داده است">
            <CustomBoxBuilder
              products={products}
              customItems={customItems}
              onExploreCatalog={() => handleNavigateTab('catalog')}
              onAddCustomBoxToCart={handleAddCustomBoxToCart}
            />
          </ErrorBoundary>
        )}

        {/* Tab 5: CORPORATE (B2B Dedicated Landing) */}
        {activeTab === 'corporate' && (
          <CorporateLandingPage
            onInquirySubmitted={handleInquirySubmitted}
            onExploreCatalog={() => handleNavigateTab('catalog')}
            onOpenConsultation={handleOpenConsultation}
          />
        )}

        {/* Tab 6: USER ACCOUNT DASHBOARD */}
        {activeTab === 'account' && (
          currentUser ? (
            <UserAccountDashboard
              currentUser={currentUser}
              orders={orders}
              products={products}
              coupons={coupons}
              onUpdateUser={handleUpdateCurrentUser}
              onLogout={handleLogout}
              onExploreCatalog={() => handleNavigateTab('catalog')}
              onAddToCart={handleAddToCartDirect}
              onToggleWishlist={handleToggleWishlist}
              onStartConsultation={handleOpenConsultation}
              initialTab={accountSubTab}
            />
          ) : (
            <div className="bg-[#FAF8F5] min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
              <h2 className="text-xl font-bold text-[#0F4C3A]">برای مشاهده حساب کاربری لطفا وارد شوید</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAuthModal('login')}
                  className="bg-[#0F4C3A] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0B3C2E] transition"
                >
                  ورود به حساب
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModal('register')}
                  className="bg-transparent border border-[#0F4C3A] text-[#0F4C3A] px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0F4C3A]/5 transition"
                >
                  ثبت‌نام
                </button>
              </div>
            </div>
          )
        )}

        {/* Tab 7: AI CONCIERGE */}
        {activeTab === 'ai' && (
          <AiGiftConcierge
            products={products}
            onSelectProduct={handleQuickView}
            onAddToCart={handleAddToCartDirect}
          />
        )}

        {/* Tab 8: BLOG INDEX (مجله یادمان) */}
        {activeTab === 'blog' && (
          <BlogIndexPage
            posts={blogPosts}
            categories={blogCategories}
            authors={blogAuthors}
            selectedCategorySlug={activeBlogCategorySlug}
            onSelectPost={handleNavigateToArticle}
            onSelectCategory={handleNavigateToBlog}
            onOpenConsultation={handleOpenConsultation}
            onBackToHome={() => handleNavigateTab('home')}
          />
        )}

        {/* Tab 9: BLOG ARTICLE DETAIL PAGE */}
        {activeTab === 'blog-article' && (
          <BlogArticlePage
            slug={activeArticleSlug}
            post={
              blogPosts.find((p) => p.slug === activeArticleSlug || p.id === activeArticleSlug) ||
              null
            }
            allPosts={blogPosts}
            categories={blogCategories}
            authors={blogAuthors}
            products={products}
            storeSettings={storeSettings}
            onSelectPost={handleNavigateToArticle}
            onSelectCategory={handleNavigateToBlog}
            onBackToBlog={() => handleNavigateToBlog()}
            onOpenConsultation={handleOpenConsultation}
            onOpenBuilder={() => handleNavigateTab('builder')}
            onOpenCorporate={() => handleNavigateTab('corporate')}
            onQuickViewProduct={handleQuickView}
            onAddToCartProduct={handleAddToCartDirect}
            userWishlistIds={userWishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        config={storeSettings.homepage?.footer}
        onNavigateToBlog={() => handleNavigateToBlog()}
        onNavigateTab={(tab) => handleNavigateTab(tab)}
      />

      {/* Product Detail & Customization Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          reviews={reviews}
          onAddReview={handleAddReview}
          currentUser={currentUser}
          isWishlisted={selectedProduct ? userWishlistIds.includes(selectedProduct.id) : false}
          onToggleWishlist={handleToggleWishlist}
          onAddToCartWithOptions={handleAddToCartWithOptions}
        />
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={handleStartCheckout}
        />
      )}

      {/* Full Checkout & Payment Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartItems={cartItems}
          coupons={coupons}
          onOrderPlaced={handleOrderPlaced}
          onClearCart={handleClearCart}
          currentUser={currentUser}
        />
      )}

      {/* Order Success Confirmation Modal */}
      {isOrderSuccessOpen && (
        <OrderSuccessModal
          isOpen={isOrderSuccessOpen}
          onClose={() => setIsOrderSuccessOpen(false)}
          cartItems={lastPlacedOrder?.items || cartItems}
        />
      )}

      {/* --- AUTHENTICATION MODALS --- */}
      {authModal === 'login' && (
        <LoginPage
          users={users}
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setAuthModal('register')}
          onSwitchToForgotPassword={() => setAuthModal('forgot_password')}
          onClose={() => setAuthModal(null)}
        />
      )}

      {authModal === 'register' && (
        <RegisterPage
          users={users}
          onSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setAuthModal('login')}
          onClose={() => setAuthModal(null)}
        />
      )}

      {authModal === 'forgot_password' && (
        <ForgotPasswordPage
          users={users}
          onSuccess={handlePasswordResetComplete}
          onPasswordResetComplete={handlePasswordResetComplete}
          onSwitchToLogin={() => setAuthModal('login')}
          onClose={() => setAuthModal(null)}
        />
      )}
    </div>
  );
}
