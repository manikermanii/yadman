import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Package,
  MapPin,
  Heart,
  Tag,
  LogOut,
  Building2,
  Phone,
  Mail,
  Edit3,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  Check,
  ShieldCheck,
  Eye,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  X,
  FileText,
  Stamp,
  Sparkles,
  AlertCircle,
  Copy,
} from 'lucide-react';
import {
  User,
  Order,
  UserAddress,
  Product,
  Coupon,
  CartItem,
  OrderStatus,
} from '../../types';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { getUserDisplayInfo } from '../../utils/userAdapter';
import { api } from '../../services/api';
import {
  isValidMobileNumber,
  isValidEmail,
  normalizePhoneNumber,
} from '../../utils/authService';

interface UserAccountDashboardProps {
  currentUser: User;
  orders: Order[];
  products: Product[];
  coupons: Coupon[];
  initialTab?: string;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onQuickViewProduct?: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onExploreCatalog: () => void;
  onToggleWishlist?: (product: Product) => void;
  onStartConsultation?: (initialType?: any) => void;
}

export const UserAccountDashboard: React.FC<UserAccountDashboardProps> = ({
  currentUser,
  orders,
  products,
  coupons,
  initialTab = 'overview',
  onUpdateUser,
  onLogout,
  onQuickViewProduct,
  onAddToCart,
  onExploreCatalog,
  onToggleWishlist,
  onStartConsultation,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Local & backend-fetched user orders state
  const [backendOrders, setBackendOrders] = useState<Order[]>([]);

  useEffect(() => {
    let isMounted = true;
    api.orders
      .getMyOrders()
      .then((serverOrders) => {
        if (isMounted && Array.isArray(serverOrders) && serverOrders.length > 0) {
          const adapted: Order[] = serverOrders.map((so: any) => ({
            id: so.orderNumber || so.id,
            userId: so.userId || currentUser.id,
            customer: {
              fullName: so.customerName || currentUser.fullName,
              phoneNumber: so.customerPhone || currentUser.phoneNumber,
              email: so.customerEmail || currentUser.email,
              province: 'تهران',
              city: so.deliveryCity || 'تهران',
              address: so.deliveryAddress || '',
              recipientName: so.recipientName || undefined,
              recipientPhone: so.recipientPhone || undefined,
              deliveryDate: so.deliveryDate || undefined,
              specialInstructions: so.customPackingNotes || undefined,
            },
            items: Array.isArray(so.items)
              ? so.items.map((it: any) => ({
                  id: it.id,
                  product: {
                    id: it.productId,
                    titleFa: it.productTitleFa || 'محصول',
                    price: it.unitPrice || 0,
                    sku: it.productSku,
                  } as any,
                  quantity: it.quantity || 1,
                  isCustomBox: Boolean(it.isCustomBox),
                  customBoxDetails: it.customBoxDetails,
                  cardMessage: it.cardMessage,
                  waxSeal: it.waxSeal,
                  ribbonColor: it.ribbonColor,
                  unitPrice: it.unitPrice,
                }))
              : [],
            subtotal: so.subtotal || 0,
            shippingCost: so.shippingCost || 0,
            discountAmount: so.discountAmount || 0,
            couponCode: so.couponCode || undefined,
            totalPrice: so.totalAmount || 0,
            status: (so.status?.toLowerCase() as any) || 'pending',
            shippingMethod: (so.shippingMethod as any) || 'post_pishtaz',
            paymentMethod: (so.paymentMethod as any) || 'online',
            paymentStatus: (so.paymentStatus?.toLowerCase() as any) || 'pending',
            createdAt: so.createdAt || new Date().toISOString(),
            createdAtFa: so.createdAt
              ? new Date(so.createdAt).toLocaleDateString('fa-IR')
              : 'امروز',
            adminNotes: so.adminNotes || undefined,
          }));
          setBackendOrders(adapted);
        }
      })
      .catch((err) => {
        console.warn('Customer my orders fetch note:', err?.message || err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser.id]);

  // Combine parent orders with backend fetched orders (deduplicating by id)
  const allUserSourceOrders = [
    ...backendOrders,
    ...orders.filter(
      (o) =>
        o.userId === currentUser.id ||
        normalizePhoneNumber(o.customer.phoneNumber) === normalizePhoneNumber(currentUser.phoneNumber) ||
        (currentUser.email && o.customer.email?.toLowerCase() === currentUser.email.toLowerCase())
    ),
  ];

  const userOrders = Array.from(
    new Map(allUserSourceOrders.map((o) => [o.id, o])).values()
  );

  // User Wishlist products
  const wishlistProducts = products.filter((p) => currentUser.wishlist?.includes(p.id));

  // Selected order for detailed modal view
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Order status filter in "سفارش‌های من"
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // --- Personal Info Form State ---
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber);
  const [email, setEmail] = useState(currentUser.email || '');
  const [companyName, setCompanyName] = useState(currentUser.corporateProfile?.companyName || '');
  const [jobTitle, setJobTitle] = useState(currentUser.corporateProfile?.jobTitle || '');
  const [corporatePhone, setCorporatePhone] = useState(currentUser.corporateProfile?.corporatePhone || '');
  const [economicCode, setEconomicCode] = useState(currentUser.corporateProfile?.economicCode || '');
  const [nationalId, setNationalId] = useState(currentUser.corporateProfile?.nationalId || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Personal info feedback
  const [infoSaveSuccess, setInfoSaveSuccess] = useState(false);
  const [infoSaveError, setInfoSaveError] = useState('');

  // --- Address Management State ---
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressTitle, setAddressTitle] = useState('خانه');
  const [addressRecipient, setAddressRecipient] = useState(currentUser.fullName);
  const [addressPhone, setAddressPhone] = useState(currentUser.phoneNumber);
  const [addressProvince, setAddressProvince] = useState('تهران');
  const [addressCity, setAddressCity] = useState('تهران');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Coupon copy toast
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  // Helper for status badge
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'در انتظار پرداخت', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock };
      case 'preparing':
        return { label: 'در حال پردازش و آماده‌سازی', bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Package };
      case 'packaged':
        return { label: 'آماده ارسال (مهر مومی شده)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Stamp };
      case 'shipped':
        return { label: 'ارسال شده با پیک / پست', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Truck };
      case 'delivered':
        return { label: 'تحویل داده شده', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: CheckCircle };
      case 'cancelled':
        return { label: 'لغو شده', bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: AlertCircle };
      default:
        return { label: status, bg: 'bg-gray-50 text-gray-800 border-gray-200', icon: Package };
    }
  };

  // --- Handlers ---
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoSaveError('');
    setInfoSaveSuccess(false);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setInfoSaveError('نام و نام خانوادگی نمی‌تواند خالی باشد.');
      return;
    }

    const normalized = normalizePhoneNumber(phoneNumber);
    if (!isValidMobileNumber(normalized)) {
      setInfoSaveError('شماره موبایل وارد شده معتبر نیست.');
      return;
    }

    if (email.trim() && !isValidEmail(email)) {
      setInfoSaveError('فرمت ایمیل نامعتبر است.');
      return;
    }

    try {
      const companyNameVal = currentUser.accountType === 'corporate' ? companyName.trim() || 'شرکت ثبت‌شده' : undefined;
      await api.auth.updateProfile({
        name: fullName.trim(),
        phone: normalized,
        companyName: companyNameVal,
      }).catch(() => {});

      const updatedUser: User = {
        ...currentUser,
        fullName: fullName.trim(),
        name: fullName.trim(),
        phoneNumber: normalized,
        phone: normalized,
        email: email.trim() || undefined,
        corporateProfile:
          currentUser.accountType === 'corporate'
            ? {
                companyName: companyName.trim() || 'شرکت ثبت‌شده',
                jobTitle: jobTitle.trim(),
                corporatePhone: corporatePhone.trim(),
                economicCode: economicCode.trim(),
                nationalId: nationalId.trim(),
              }
            : undefined,
      };

      onUpdateUser(updatedUser);
      setInfoSaveSuccess(true);
      setTimeout(() => setInfoSaveSuccess(false), 4000);
    } catch (err: any) {
      setInfoSaveError(err.message || 'خطا در ذخیره تغییرات.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess(false);

    if (!currentPassword) {
      setPasswordChangeError('لطفاً رمز عبور فعلی خود را وارد کنید.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordChangeError('رمز عبور جدید باید حداقل ۶ نویسه باشد.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('رمز عبور جدید و تکرار آن مطابقت ندارند.');
      return;
    }

    try {
      await api.auth.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordChangeSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordChangeSuccess(false), 4000);
    } catch (err: any) {
      setPasswordChangeError(err.message || 'رمز عبور فعلی نادرست است یا خطایی رخ داد.');
    }
  };

  // --- Address Handlers ---
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressTitle('منزل');
    setAddressRecipient(currentUser.fullName);
    setAddressPhone(currentUser.phoneNumber);
    setAddressProvince('تهران');
    setAddressCity('تهران');
    setAddressStreet('');
    setAddressPostalCode('');
    setAddressIsDefault(currentUser.addresses.length === 0);
    setAddressError('');
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setAddressTitle(addr.title);
    setAddressRecipient(addr.recipientName);
    setAddressPhone(addr.phoneNumber);
    setAddressProvince(addr.province);
    setAddressCity(addr.city);
    setAddressStreet(addr.address);
    setAddressPostalCode(addr.postalCode);
    setAddressIsDefault(addr.isDefault);
    setAddressError('');
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (!addressRecipient.trim()) {
      setAddressError('نام تحویل‌گیرنده الزامی است.');
      return;
    }

    if (!addressStreet.trim()) {
      setAddressError('آدرس کامل الزامی است.');
      return;
    }

    let updatedAddresses = [...currentUser.addresses];

    if (editingAddressId) {
      updatedAddresses = updatedAddresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            title: addressTitle.trim() || 'آدرس',
            recipientName: addressRecipient.trim(),
            phoneNumber: addressPhone.trim() || currentUser.phoneNumber,
            province: addressProvince,
            city: addressCity,
            address: addressStreet.trim(),
            postalCode: addressPostalCode.trim(),
            isDefault: addressIsDefault,
          };
        }
        return addressIsDefault ? { ...a, isDefault: false } : a;
      });
    } else {
      const newAddr: UserAddress = {
        id: `addr-${Date.now()}`,
        title: addressTitle.trim() || 'آدرس جدید',
        recipientName: addressRecipient.trim(),
        phoneNumber: addressPhone.trim() || currentUser.phoneNumber,
        province: addressProvince,
        city: addressCity,
        address: addressStreet.trim(),
        postalCode: addressPostalCode.trim(),
        isDefault: addressIsDefault || currentUser.addresses.length === 0,
      };

      if (newAddr.isDefault) {
        updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
      }
      updatedAddresses.push(newAddr);
    }

    const updatedUser: User = {
      ...currentUser,
      addresses: updatedAddresses,
    };

    onUpdateUser(updatedUser);
    setIsAddressModalOpen(false);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = currentUser.addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    onUpdateUser({ ...currentUser, addresses: updated });
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = currentUser.addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    onUpdateUser({ ...currentUser, addresses: updated });
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await api.wishlist.removeItem(productId);
    } catch (err) {
      console.warn('Backend wishlist remove sync:', err);
    }
    const updatedWishlist = (currentUser.wishlist || []).filter((id) => id !== productId);
    onUpdateUser({ ...currentUser, wishlist: updatedWishlist });
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => setCopiedCouponCode(null), 2500);
  };

  // Nav menu items
  const menuItems = [
    { id: 'overview', label: 'حساب کاربری', icon: UserIcon },
    { id: 'orders', label: 'سفارش‌های من', icon: Package, badge: userOrders.length > 0 ? toPersianDigits(userOrders.length) : undefined },
    { id: 'info', label: 'اطلاعات شخصی', icon: Edit3 },
    { id: 'addresses', label: 'آدرس‌ها', icon: MapPin, badge: currentUser.addresses.length > 0 ? toPersianDigits(currentUser.addresses.length) : undefined },
    { id: 'wishlist', label: 'علاقه‌مندی‌ها', icon: Heart, badge: wishlistProducts.length > 0 ? toPersianDigits(wishlistProducts.length) : undefined },
    { id: 'coupons', label: 'کدهای تخفیف', icon: Tag },
  ];

  // Filtered orders
  const filteredOrders = userOrders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const {
    displayName: userDisplayName,
    initial: userInitial,
    displayPhone: userPhone,
    isCorporate,
  } = getUserDisplayInfo(currentUser);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right">
      
      {/* Top Banner with User Greeting & Role Badge */}
      <div className="bg-[#0F4C3A] text-[#FAF8F5] p-6 sm:p-8 rounded-3xl shadow-lg border border-[#D4AF37]/30 mb-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] text-[#0F4C3A] flex items-center justify-center font-bold text-2xl shadow-md border-2 border-[#D4AF37]">
            {userInitial}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#FAF8F5]">
                {userDisplayName}
              </h1>
              {isCorporate ? (
                <span className="bg-[#D4AF37] text-[#0F4C3A] font-extrabold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>حساب سازمانی VIP</span>
                </span>
              ) : (
                <span className="bg-[#FAF8F5]/20 text-[#FAF8F5] font-semibold text-[11px] px-2.5 py-0.5 rounded-full">
                  مشتری وفادار
                </span>
              )}
            </div>
            <p className="text-xs text-[#D0E2DB] mt-1">
              {userPhone} {currentUser.email && `• ${currentUser.email}`}
            </p>
            {currentUser.corporateProfile?.companyName && (
              <p className="text-xs text-[#D4AF37] mt-0.5 font-bold">
                {currentUser.corporateProfile.companyName} {currentUser.corporateProfile.jobTitle && `(${currentUser.corporateProfile.jobTitle})`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end relative z-10">
          <button
            onClick={onLogout}
            className="bg-white/10 hover:bg-rose-600/80 text-[#FAF8F5] border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Layout (Sidebar Tabs + Content Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F4C3A] text-[#FAF8F5] shadow-xs'
                      : 'text-[#2C3B37] hover:bg-[#F4EFE6] hover:text-[#0F4C3A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-[#0F4C3A]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-[#D4AF37] text-[#0F4C3A]' : 'bg-[#0F4C3A]/10 text-[#0F4C3A]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 p-3 rounded-xl text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer mt-2 border-t border-[#EAE6DF]"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب کاربری</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: OVERVIEW / SUMMARY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] shadow-xs text-right">
                  <span className="text-[11px] text-[#6A7873]">تعداد کل سفارش‌ها</span>
                  <p className="text-xl font-extrabold text-[#0F4C3A] mt-1">
                    {toPersianDigits(userOrders.length)}
                  </p>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] shadow-xs text-right">
                  <span className="text-[11px] text-[#6A7873]">سفارش‌های در حال انجام</span>
                  <p className="text-xl font-extrabold text-blue-700 mt-1">
                    {toPersianDigits(
                      userOrders.filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'packaged').length
                    )}
                  </p>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] shadow-xs text-right">
                  <span className="text-[11px] text-[#6A7873]">آدرس‌های ثبت‌شده</span>
                  <p className="text-xl font-extrabold text-[#1C2826] mt-1">
                    {toPersianDigits(currentUser.addresses.length)}
                  </p>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE6DF] shadow-xs text-right">
                  <span className="text-[11px] text-[#6A7873]">لیست علاقه‌مندی‌ها</span>
                  <p className="text-xl font-extrabold text-[#D4AF37] mt-1">
                    {toPersianDigits(wishlistProducts.length)}
                  </p>
                </div>
              </div>

              {/* Corporate B2B Account Perks Banner */}
              {currentUser.accountType === 'corporate' && (
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#D4AF37]/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#0F4C3A] text-[#D4AF37] rounded-xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0F4C3A]">امکانات ویژه حساب سازمانی</h3>
                      <p className="text-xs text-[#6A7873] mt-0.5">
                        فاکتور رسمی با شناسه ملی، ارسال نمونه رایگان و درج پلاک طلایی اختصاصی برند شما
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('info')}
                    className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-xs font-bold px-4 py-2 rounded-xl transition shrink-0"
                  >
                    تکمیل اطلاعات اقتصادی
                  </button>
                </div>
              )}

              {/* Recent Orders Section */}
              <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#0F4C3A] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#D4AF37]" />
                    <span>آخرین سفارش‌ها</span>
                  </h2>
                  {userOrders.length > 0 && (
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#0F4C3A] hover:text-[#D4AF37] flex items-center gap-1 transition"
                    >
                      <span>مشاهده همه</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {userOrders.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <Package className="w-12 h-12 text-[#6A7873]/40 mx-auto" />
                    <p className="text-xs text-[#6A7873]">شما هنوز سفارشی ثبت نکرده‌اید.</p>
                    <button
                      onClick={onExploreCatalog}
                      className="bg-[#0F4C3A] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#0B3C2E] transition"
                    >
                      مشاهده پک‌های هدیه
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.slice(0, 3).map((order) => {
                      const badge = getStatusBadge(order.status);
                      const BadgeIcon = badge.icon;
                      return (
                        <div
                          key={order.id}
                          className="bg-[#F4EFE6]/50 p-4 rounded-xl border border-[#E0D8C8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#0F4C3A]/40 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#0F4C3A]">{order.id}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${badge.bg}`}>
                                <BadgeIcon className="w-3 h-3" />
                                <span>{badge.label}</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6A7873]">
                              ثبت شده در: {order.createdAtFa} • مبلغ: <strong className="text-[#1C2826]">{formatToman(order.totalPrice)}</strong>
                            </p>
                          </div>

                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="text-xs bg-[#FAF8F5] hover:bg-[#0F4C3A] text-[#0F4C3A] hover:text-white border border-[#E0D8C8] px-3.5 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 self-end sm:self-center"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>مشاهده فاکتور و جزئیات</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Default Address Preview */}
              <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#0F4C3A] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#D4AF37]" />
                    <span>آدرس پیش‌فرض تحویل</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className="text-xs font-bold text-[#0F4C3A] hover:text-[#D4AF37] transition"
                  >
                    مدیریت آدرس‌ها
                  </button>
                </div>

                {currentUser.addresses.length === 0 ? (
                  <p className="text-xs text-[#6A7873]">هیچ آدرسی ثبت نشده است.</p>
                ) : (
                  (() => {
                    const defaultAddr = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
                    return (
                      <div className="p-3.5 bg-[#F4EFE6]/50 rounded-xl border border-[#E0D8C8] text-xs space-y-1 text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1C2826]">{defaultAddr.title}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">پیش‌فرض</span>
                        </div>
                        <p className="text-[#6A7873]">تحویل‌گیرنده: {defaultAddr.recipientName} ({defaultAddr.phoneNumber})</p>
                        <p className="text-[#1C2826]">{defaultAddr.province}، {defaultAddr.city}، {defaultAddr.address}</p>
                        {defaultAddr.postalCode && <p className="text-[#6A7873]">کد پستی: {defaultAddr.postalCode}</p>}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY ORDERS («سفارش‌های من») */}
          {activeTab === 'orders' && (
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[#0F4C3A] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#D4AF37]" />
                    <span>تاریخچه سفارش‌های من</span>
                  </h2>
                  <p className="text-xs text-[#6A7873] mt-0.5">
                    مشاهده وضعیت آماده‌سازی، کد پیگیری مرسوله و فاکتور تفکیک شده
                  </p>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'همه' },
                    { id: 'pending', label: 'در انتظار پرداخت' },
                    { id: 'preparing', label: 'در حال پردازش' },
                    { id: 'shipped', label: 'ارسال شده' },
                    { id: 'delivered', label: 'تحویل شده' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setOrderStatusFilter(filter.id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                        orderStatusFilter === filter.id
                          ? 'bg-[#0F4C3A] text-white shadow-xs'
                          : 'bg-[#F4EFE6] text-[#2C3B37] hover:bg-[#EAE6DF]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-14 h-14 text-[#6A7873]/30 mx-auto" />
                  <p className="text-sm font-bold text-[#1C2826]">سفارشی در این وضعیت یافت نشد.</p>
                  <p className="text-xs text-[#6A7873]">می‌توانید کاتالوگ پک‌های هدیه را بررسی کرده و سفارش جدید ثبت کنید.</p>
                  <button
                    onClick={onExploreCatalog}
                    className="bg-[#0F4C3A] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#0B3C2E] transition shadow-xs"
                  >
                    مشاهده ویترین محصولات
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const badge = getStatusBadge(order.status);
                    const BadgeIcon = badge.icon;
                    return (
                      <div
                        key={order.id}
                        className="bg-[#F4EFE6]/40 rounded-2xl border border-[#E0D8C8] p-5 space-y-4 hover:border-[#0F4C3A]/50 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0D8C8]/60 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-sm text-[#0F4C3A]">{order.id}</span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1 ${badge.bg}`}>
                              <BadgeIcon className="w-3 h-3" />
                              <span>{badge.label}</span>
                            </span>
                          </div>

                          <div className="text-xs text-[#6A7873]">
                            <span>تاریخ ثبت: {order.createdAtFa}</span>
                          </div>
                        </div>

                        {/* Items Preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE6DF]">
                              <div className="w-12 h-12 rounded-lg bg-[#F4EFE6] overflow-hidden shrink-0">
                                <img
                                  src={item.product?.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="text-xs overflow-hidden">
                                <p className="font-bold text-[#1C2826] truncate">
                                  {item.product ? item.product.titleFa : 'باکس اختصاصی دست‌ساز'}
                                </p>
                                <p className="text-[10px] text-[#6A7873]">
                                  تعداد: {toPersianDigits(item.quantity)} عدد • {item.ribbonColor || 'روبان سبز'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer Actions & Price */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                          <div className="text-xs">
                            <span className="text-[#6A7873]">مبلغ کل پرداختی: </span>
                            <strong className="text-sm font-extrabold text-[#0F4C3A]">
                              {formatToman(order.totalPrice)}
                            </strong>
                            {order.trackingNumber && (
                              <span className="mr-3 text-[11px] text-[#6A7873] bg-[#EAE6DF] px-2 py-0.5 rounded-md">
                                کد رهگیری: {order.trackingNumber}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 self-end sm:self-center"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>مشاهده فاکتور و جزئیات</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERSONAL INFO («اطلاعات شخصی») */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Profile Details Form */}
              <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-5">
                <div className="border-b border-[#EAE6DF] pb-3">
                  <h2 className="text-base font-extrabold text-[#0F4C3A] flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-[#D4AF37]" />
                    <span>مشخصات فردی و هویتی</span>
                  </h2>
                  <p className="text-xs text-[#6A7873] mt-0.5">
                    این اطلاعات برای صدور فاکتور و ارسال بسته‌ها استفاده خواهد شد
                  </p>
                </div>

                {infoSaveSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>اطلاعات شما با موفقیت ذخیره شد.</span>
                  </div>
                )}

                {infoSaveError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{infoSaveError}</span>
                  </div>
                )}

                <form onSubmit={handleSavePersonalInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#1C2826]">
                        نام و نام خانوادگی <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2.5 px-3 text-xs text-[#1C2826] focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#1C2826]">
                        شماره موبایل <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        dir="ltr"
                        className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2.5 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#1C2826]">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      dir="ltr"
                      className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2.5 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                    />
                  </div>

                  {/* Corporate Specific Fields */}
                  {currentUser.accountType === 'corporate' && (
                    <div className="p-4 bg-[#F4EFE6]/60 rounded-2xl border border-[#D4AF37]/40 space-y-4 mt-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0F4C3A]">
                        <Building2 className="w-4 h-4 text-[#D4AF37]" />
                        <span>اطلاعات حقوقی و سازمانی (فاکتور رسمی)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#1C2826]">
                            نام رسمی شرکت / برند
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full bg-[#FAF8F5] border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#1C2826]">
                            سمت سازمانی شما
                          </label>
                          <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="w-full bg-[#FAF8F5] border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#1C2826]">
                            شماره تماس ثابت سازمانی
                          </label>
                          <input
                            type="text"
                            value={corporatePhone}
                            onChange={(e) => setCorporatePhone(e.target.value)}
                            dir="ltr"
                            className="w-full bg-[#FAF8F5] border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#1C2826]">
                            شناسه ملی شرکت
                          </label>
                          <input
                            type="text"
                            value={nationalId}
                            onChange={(e) => setNationalId(e.target.value)}
                            dir="ltr"
                            className="w-full bg-[#FAF8F5] border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      ذخیره تغییرات مشخصات
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Change Form */}
              <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4">
                <div className="border-b border-[#EAE6DF] pb-3">
                  <h2 className="text-base font-extrabold text-[#0F4C3A] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                    <span>تغییر رمز عبور</span>
                  </h2>
                  <p className="text-xs text-[#6A7873] mt-0.5">
                    برای امنیت بیشتر از رمزهای عبور ترکیبی شامل حروف و اعداد استفاده کنید
                  </p>
                </div>

                {passwordChangeSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>رمز عبور شما با موفقیت تغییر کرد.</span>
                  </div>
                )}

                {passwordChangeError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordChangeError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#1C2826]">
                      رمز عبور فعلی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full sm:w-1/2 bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#1C2826]">
                        رمز عبور جدید <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="حداقل ۶ نویسه"
                        dir="ltr"
                        className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#1C2826]">
                        تکرار رمز عبور جدید <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="تکرار همان رمز"
                        dir="ltr"
                        className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    به‌روزرسانی رمز عبور
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: ADDRESSES («آدرس‌ها») */}
          {activeTab === 'addresses' && (
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F4C3A] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#D4AF37]" />
                    <span>آدرس‌های ذخیره شده</span>
                  </h2>
                  <p className="text-xs text-[#6A7873] mt-0.5">
                    می‌توانید چندین آدرس برای ارسال هدایا به دوستان یا شعب شرکت ثبت کنید
                  </p>
                </div>

                <button
                  onClick={handleOpenAddAddress}
                  className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>افزودن آدرس جدید</span>
                </button>
              </div>

              {currentUser.addresses.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <MapPin className="w-12 h-12 text-[#6A7873]/30 mx-auto" />
                  <p className="text-xs text-[#6A7873]">هنوز هیچ آدرسی ثبت نکرده‌اید.</p>
                  <button
                    onClick={handleOpenAddAddress}
                    className="bg-[#0F4C3A] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#0B3C2E] transition"
                  >
                    ثبت اولین آدرس
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentUser.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                        addr.isDefault
                          ? 'bg-[#F4EFE6]/70 border-[#0F4C3A] shadow-xs ring-1 ring-[#0F4C3A]/20'
                          : 'bg-[#FAF8F5] border-[#EAE6DF] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-[#0F4C3A]">{addr.title}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-[#0F4C3A] text-[#FAF8F5] px-2.5 py-0.5 rounded-full font-bold">
                              آدرس پیش‌فرض
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#1C2826] leading-relaxed">
                          {addr.province}، {addr.city}، {addr.address}
                        </p>

                        <div className="text-[11px] text-[#6A7873] space-y-0.5 pt-1">
                          <p>تحویل‌گیرنده: <strong>{addr.recipientName}</strong></p>
                          <p>شماره تماس: {addr.phoneNumber}</p>
                          {addr.postalCode && <p>کد پستی: {addr.postalCode}</p>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#EAE6DF] text-xs">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[#0F4C3A] hover:text-[#D4AF37] font-bold text-[11px] transition"
                          >
                            انتخاب به عنوان پیش‌فرض
                          </button>
                        )}
                        <div className="flex items-center gap-2 mr-auto">
                          <button
                            onClick={() => handleOpenEditAddress(addr)}
                            className="p-1.5 text-[#6A7873] hover:text-[#0F4C3A] transition"
                            title="ویرایش آدرس"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 transition"
                            title="حذف آدرس"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: WISHLIST («علاقه‌مندی‌ها») */}
          {activeTab === 'wishlist' && (
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-[#0F4C3A] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span>لیست هدایای مورد علاقه</span>
                </h2>
                <p className="text-xs text-[#6A7873] mt-0.5">
                  پک‌های ذخیره شده شما برای مناسبت‌های بعدی
                </p>
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Heart className="w-12 h-12 text-[#6A7873]/30 mx-auto" />
                  <p className="text-sm font-bold text-[#1C2826]">لیست علاقه‌مندی‌های شما خالی است.</p>
                  <p className="text-xs text-[#6A7873]">با کلیک روی آیکون قلب در کنار هر پک هدیه، آن را به این لیست اضافه کنید.</p>
                  <button
                    onClick={onExploreCatalog}
                    className="bg-[#0F4C3A] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#0B3C2E] transition shadow-xs"
                  >
                    مشاهده ویترین محصولات
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {wishlistProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-[#FAF8F5] rounded-xl sm:rounded-2xl border border-[#EAE6DF] hover:border-[#D4AF37]/60 shadow-2xs overflow-hidden flex flex-col justify-between relative group"
                    >
                      <div className="relative aspect-[4/3] w-full bg-[#F4EFE6] overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.titleFa}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() => handleRemoveFromWishlist(product.id)}
                          className="absolute top-1.5 left-1.5 bg-white/90 text-rose-500 hover:bg-rose-500 hover:text-white p-1.5 rounded-full shadow-2xs transition"
                          title="حذف از لیست"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="p-2.5 sm:p-3 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-[#1C2826] line-clamp-1">{product.titleFa}</h3>
                          <p className="text-xs font-extrabold text-[#0F4C3A] mt-0.5">{formatToman(product.price)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#EAE6DF]">
                          <button
                            onClick={() => onQuickViewProduct(product)}
                            className="bg-[#F4EFE6] hover:bg-[#EAE6DF] text-[#0F4C3A] text-[11px] sm:text-xs font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>جزئیات</span>
                          </button>

                          <button
                            onClick={() => onAddToCart(product)}
                            className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white text-[11px] sm:text-xs font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <ShoppingBag className="w-3 h-3 text-[#D4AF37]" />
                            <span>خرید</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: COUPONS («کدهای تخفیف») */}
          {activeTab === 'coupons' && (
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-[#0F4C3A] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#D4AF37]" />
                  <span>کدهای تخفیف فعال و اختصاصی</span>
                </h2>
                <p className="text-xs text-[#6A7873] mt-0.5">
                  کدها را کپی کرده و در صفحه تسویه حساب اعمال نمایید
                </p>
              </div>

              {coupons.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#EAE6DF] space-y-2">
                  <Tag className="w-8 h-8 text-[#D4AF37] mx-auto opacity-60" />
                  <p className="text-xs text-[#6A7873] font-medium">در حال حاضر کد تخفیف فعالی در دسترس نیست.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="p-5 rounded-2xl bg-[#F4EFE6]/60 border border-[#D4AF37]/50 shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-[#0F4C3A]">
                            {coupon.type === 'percentage' ? `${toPersianDigits(coupon.value)}٪ تخفیف` : `${formatToman(coupon.value)} تخفیف`}
                          </span>
                          <span className="text-[10px] bg-[#0F4C3A] text-[#FAF8F5] px-2 py-0.5 rounded-full font-bold">
                            فعال
                          </span>
                        </div>
                        <p className="text-xs text-[#1C2826]">{coupon.description || 'تخفیف ویژه سفارش پک‌های هدیه'}</p>
                        {coupon.minOrderAmount && (
                          <p className="text-[11px] text-[#6A7873]">
                            حداقل سفارش: {formatToman(coupon.minOrderAmount)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#E0D8C8]">
                        <code className="bg-[#FAF8F5] px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-[#0F4C3A] border border-[#E0D8C8] tracking-wider">
                          {coupon.code}
                        </code>

                        <button
                          onClick={() => handleCopyCoupon(coupon.code)}
                          className="text-xs font-bold bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCouponCode === coupon.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>کپی شد!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>کپی کد</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* --- ADD / EDIT ADDRESS MODAL --- */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] max-w-lg w-full rounded-3xl border border-[#EAE6DF] shadow-2xl p-6 sm:p-8 space-y-6 text-right animate-scaleIn">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <h3 className="text-base font-extrabold text-[#0F4C3A] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                <span>{editingAddressId ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}</span>
              </h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-[#6A7873] hover:text-[#0F4C3A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addressError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">عنوان آدرس</label>
                  <input
                    type="text"
                    value={addressTitle}
                    onChange={(e) => setAddressTitle(e.target.value)}
                    placeholder="مثال: خانه، شرکت، مطب"
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">نام تحویل‌گیرنده</label>
                  <input
                    type="text"
                    value={addressRecipient}
                    onChange={(e) => setAddressRecipient(e.target.value)}
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">شماره تماس گیرنده</label>
                  <input
                    type="tel"
                    value={addressPhone}
                    onChange={(e) => setAddressPhone(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">کد پستی (۱۰ رقمی)</label>
                  <input
                    type="text"
                    value={addressPostalCode}
                    onChange={(e) => setAddressPostalCode(e.target.value)}
                    dir="ltr"
                    placeholder="۱۲۳۴۵۶۷۸۹۰"
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">استان</label>
                  <input
                    type="text"
                    value={addressProvince}
                    onChange={(e) => setAddressProvince(e.target.value)}
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">شهر</label>
                  <input
                    type="text"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#1C2826]">آدرس دقیق پستی</label>
                <textarea
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  rows={3}
                  placeholder="خیابان، کوچه، پلاک، زنگ یا واحد..."
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl p-3 text-xs text-[#1C2826] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addr-default-check"
                  checked={addressIsDefault}
                  onChange={(e) => setAddressIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F4C3A] accent-[#0F4C3A]"
                />
                <label htmlFor="addr-default-check" className="text-xs text-[#1C2826] font-semibold cursor-pointer">
                  انتخاب به عنوان آدرس پیش‌فرض ارسال
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE6DF]">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6A7873] hover:bg-[#EAE6DF] transition"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  ذخیره آدرس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ORDER DETAILS MODAL --- */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] max-w-2xl w-full rounded-3xl border border-[#EAE6DF] shadow-2xl p-6 sm:p-8 space-y-6 text-right my-8 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#0F4C3A]">
                    فاکتور سفارش {selectedOrderDetails.id}
                  </h3>
                  {(() => {
                    const b = getStatusBadge(selectedOrderDetails.status);
                    return (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${b.bg}`}>
                        {b.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-[#6A7873] mt-0.5">ثبت شده در: {selectedOrderDetails.createdAtFa}</p>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 text-[#6A7873] hover:text-[#0F4C3A] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#0F4C3A]">اقلام سفارش:</h4>
              <div className="border border-[#E0D8C8] rounded-2xl overflow-hidden bg-white/60">
                {selectedOrderDetails.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 border-b border-[#EAE6DF] last:border-none flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#F4EFE6] overflow-hidden shrink-0">
                        <img
                          src={item.product?.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#1C2826]">{item.product?.titleFa || 'باکس اختصاصی دست‌ساز'}</p>
                        <p className="text-[10px] text-[#6A7873]">
                          روبان: {item.ribbonColor || 'سبز زمردی'} • مهر مومی: {item.waxSeal || 'اسلیمی'}
                        </p>
                        {item.cardMessage && (
                          <p className="text-[10px] text-[#0F4C3A] mt-0.5 bg-[#F4EFE6] px-2 py-0.5 rounded italic">
                            متن کارت: «{item.cardMessage}»
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <p className="font-bold text-[#0F4C3A]">
                        {formatToman((item.product?.price || item.customBoxDetails?.totalPrice || 0) * item.quantity)}
                      </p>
                      <p className="text-[10px] text-[#6A7873]">تعداد: {toPersianDigits(item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient & Shipping Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F4EFE6]/50 p-4 rounded-2xl border border-[#E0D8C8] text-xs">
              <div className="space-y-1">
                <p className="font-bold text-[#0F4C3A]">اطلاعات تحویل‌گیرنده:</p>
                <p className="text-[#1C2826]">
                  {selectedOrderDetails.customer.recipientName || selectedOrderDetails.customer.fullName}
                </p>
                <p className="text-[#6A7873]">
                  تلفن: {selectedOrderDetails.customer.recipientPhone || selectedOrderDetails.customer.phoneNumber}
                </p>
                <p className="text-[#1C2826] leading-relaxed">
                  {selectedOrderDetails.customer.province}، {selectedOrderDetails.customer.city}، {selectedOrderDetails.customer.address}
                </p>
              </div>

              <div className="space-y-1 sm:border-r sm:border-[#E0D8C8] sm:pr-4">
                <p className="font-bold text-[#0F4C3A]">روش ارسال و پرداخت:</p>
                <p className="text-[#1C2826]">
                  شیوه ارسال: {selectedOrderDetails.shippingMethod === 'express_courier' ? 'پیک اکسپرس VIP' : 'پست پیشتاز اختصاصی'}
                </p>
                <p className="text-[#1C2826]">
                  وضعیت پرداخت: {selectedOrderDetails.paymentStatus === 'paid' ? 'پرداخت شده آنلاین (شاپرک)' : 'در انتظار پرداخت'}
                </p>
                {selectedOrderDetails.trackingNumber && (
                  <p className="text-[#0F4C3A] font-bold mt-1 bg-white p-1.5 rounded-lg border border-[#E0D8C8]">
                    کد رهگیری: {selectedOrderDetails.trackingNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Total Calculation */}
            <div className="space-y-1.5 text-xs border-t border-[#EAE6DF] pt-3">
              <div className="flex justify-between text-[#6A7873]">
                <span>جمع کل اقلام:</span>
                <span>{formatToman(selectedOrderDetails.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#6A7873]">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span>{selectedOrderDetails.shippingCost === 0 ? 'رایگان' : formatToman(selectedOrderDetails.shippingCost)}</span>
              </div>
              {selectedOrderDetails.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>تخفیف اعمال شده:</span>
                  <span>- {formatToman(selectedOrderDetails.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-[#0F4C3A] pt-2 border-t border-[#EAE6DF]">
                <span>مبلغ نهایی پرداختی:</span>
                <span>{formatToman(selectedOrderDetails.totalPrice)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="bg-[#0F4C3A] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#0B3C2E] transition"
              >
                بستن فاکتور
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
