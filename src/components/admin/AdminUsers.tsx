import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit3,
  CheckCircle,
  XCircle,
  Building2,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  Shield,
  X,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { User, Order, UserRole, UserStatus } from '../../types';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { getUserDisplayInfo } from '../../utils/userAdapter';

interface AdminUsersProps {
  users: User[];
  orders: Order[];
  onUpdateUser: (updatedUser: User) => Promise<void> | void;
  onViewOrderDetails?: (order: Order) => void;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({
  users,
  orders,
  onUpdateUser,
  onViewOrderDetails,
  isLoading = false,
  error = null,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Selected user for Detail Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // User for Edit Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [editRole, setEditRole] = useState<UserRole>('customer');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');

  // Confirmation Modals for Deactivate and Activate
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [userToActivate, setUserToActivate] = useState<User | null>(null);

  // Loading & Feedback State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss success feedback after 5 seconds
  useEffect(() => {
    if (feedback?.type === 'success') {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Keep selected user in sync with updated list
  useEffect(() => {
    if (selectedUser) {
      const refreshed = users.find((u) => u.id === selectedUser.id);
      if (refreshed) {
        setSelectedUser(refreshed);
      }
    }
  }, [users]);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase().trim();
    const fullName = (u.fullName || u.name || '').toLowerCase();
    const phone = (u.phoneNumber || u.phone || '');
    const email = (u.email || '').toLowerCase();
    const id = (u.id || '').toLowerCase();
    const company = (u.corporateProfile?.companyName || '').toLowerCase();

    const matchSearch =
      !term ||
      fullName.includes(term) ||
      phone.includes(term) ||
      email.includes(term) ||
      id.includes(term) ||
      company.includes(term);

    const matchType =
      accountTypeFilter === 'all'
        ? true
        : accountTypeFilter === 'corporate'
        ? u.accountType === 'corporate' || Boolean(u.corporateProfile?.companyName)
        : u.accountType === 'personal' && !u.corporateProfile?.companyName;

    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchRole = roleFilter === 'all' || u.role === roleFilter;

    return matchSearch && matchType && matchStatus && matchRole;
  });

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName || u.name || '');
    setEditPhone(u.phoneNumber || u.phone || '');
    setEditEmail(u.email || '');
    setEditStatus(u.status);
    setEditRole(u.role);
    setEditAdminNotes(u.adminNotes || '');
    setEditCompanyName(u.corporateProfile?.companyName || '');
    setEditJobTitle(u.corporateProfile?.jobTitle || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || isProcessing) return;

    const updated: User = {
      ...editingUser,
      fullName: editFullName.trim(),
      name: editFullName.trim(),
      phoneNumber: editPhone.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim() || undefined,
      status: editStatus,
      role: editRole,
      adminNotes: editAdminNotes.trim(),
      corporateProfile:
        editingUser.accountType === 'corporate' || editCompanyName.trim()
          ? {
              ...(editingUser.corporateProfile || { corporatePhone: editPhone.trim() }),
              companyName: editCompanyName.trim(),
              jobTitle: editJobTitle.trim(),
            }
          : undefined,
    };

    setIsProcessing(true);
    setProcessingUserId(editingUser.id);
    setFeedback(null);

    try {
      await onUpdateUser(updated);
      setEditingUser(null);
      if (selectedUser?.id === updated.id) {
        setSelectedUser(updated);
      }
      setFeedback({
        type: 'success',
        message: `مشخصات و دسترسی کاربر «${updated.fullName}» با موفقیت در پایگاه‌داده ذخیره شد.`,
      });
    } catch (err: any) {
      console.error('Failed to update user via admin:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'خطا در ثبت تغییرات مشخصات کاربر در سرور.',
      });
    } finally {
      setIsProcessing(false);
      setProcessingUserId(null);
    }
  };

  // Trigger Confirmation Modal for Deactivate
  const handleRequestToggleStatus = (u: User) => {
    if (isProcessing) return;
    if (u.status === 'active') {
      setUserToDeactivate(u);
    } else {
      setUserToActivate(u);
    }
  };

  // Confirm Deactivate Action
  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate || isProcessing) return;
    const target = userToDeactivate;
    const updated: User = { ...target, status: 'inactive' };

    setIsProcessing(true);
    setProcessingUserId(target.id);
    setFeedback(null);

    try {
      await onUpdateUser(updated);
      setUserToDeactivate(null);
      if (selectedUser?.id === target.id) {
        setSelectedUser({ ...selectedUser, status: 'inactive' });
      }
      setFeedback({
        type: 'success',
        message: `حساب کاربری «${target.fullName || target.name}» با موفقیت غیرفعال شد.`,
      });
    } catch (err: any) {
      console.error('Failed to deactivate user:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'خطا در غیرفعال‌سازی کاربر در پایگاه‌داده.',
      });
    } finally {
      setIsProcessing(false);
      setProcessingUserId(null);
    }
  };

  // Confirm Activate Action
  const handleConfirmActivate = async () => {
    if (!userToActivate || isProcessing) return;
    const target = userToActivate;
    const updated: User = { ...target, status: 'active' };

    setIsProcessing(true);
    setProcessingUserId(target.id);
    setFeedback(null);

    try {
      await onUpdateUser(updated);
      setUserToActivate(null);
      if (selectedUser?.id === target.id) {
        setSelectedUser({ ...selectedUser, status: 'active' });
      }
      setFeedback({
        type: 'success',
        message: `حساب کاربری «${target.fullName || target.name}» با موفقیت فعال گردید.`,
      });
    } catch (err: any) {
      console.error('Failed to activate user:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'خطا در فعال‌سازی کاربر در پایگاه‌داده.',
      });
    } finally {
      setIsProcessing(false);
      setProcessingUserId(null);
    }
  };

  // Get orders for a specific user
  const getUserOrders = (user: User) => {
    return orders.filter(
      (o) =>
        o.userId === user.id ||
        (user.phoneNumber && o.customer?.phoneNumber === user.phoneNumber) ||
        (user.phone && o.customer?.phoneNumber === user.phone) ||
        (user.email && o.customer?.email?.toLowerCase() === user.email.toLowerCase())
    );
  };

  const corporateCount = users.filter((u) => u.accountType === 'corporate' || Boolean(u.corporateProfile?.companyName)).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeCount = users.filter((u) => u.status === 'active').length;

  return (
    <div className="space-y-6 text-right">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F4C3A] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#D4AF37]" />
            <span>مدیریت کاربران و مشتریان</span>
          </h2>
          <p className="text-xs text-[#6A7873] mt-1">
            مشاهده اطلاعات کاربران، مدیریت وضعیت و دسترسی‌ها، و بررسی سوابق خرید متصل به PostgreSQL
          </p>
        </div>

        {/* Quick Stats Pills & Refresh */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading || isProcessing}
              title="تازه‌سازی فهرست کاربران از پایگاه داده"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/50 text-[#0F4C3A] hover:bg-[#F4EFE6] font-bold transition disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی از دیتابیس</span>
            </button>
          )}
          <span className="bg-[#0F4C3A]/10 text-[#0F4C3A] font-bold px-3 py-1.5 rounded-xl">
            کل: {toPersianDigits(users.length)}
          </span>
          <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl">
            فعال: {toPersianDigits(activeCount)}
          </span>
          <span className="bg-[#D4AF37]/20 text-[#0F4C3A] font-bold px-3 py-1.5 rounded-xl">
            سازمانی: {toPersianDigits(corporateCount)}
          </span>
          {adminCount > 0 && (
            <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1.5 rounded-xl">
              مدیران: {toPersianDigits(adminCount)}
            </span>
          )}
        </div>
      </div>

      {/* Feedback Messages (Success / Server Error) */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 px-2 py-0.5"
          >
            بستن
          </button>
        </div>
      )}

      {/* General Server Error Box */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-red-900">
                خطا در برقراری ارتباط با پایگاه‌داده کاربران
              </h4>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading || isProcessing}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-end sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تلاش مجدد</span>
            </button>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام، شماره موبایل، ایمیل، شناسه یا نام شرکت..."
            className="w-full bg-[#FAF8F5] border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2.5 pr-10 pl-16 text-xs text-[#1C2826] focus:outline-none"
          />
          <Search className="w-4 h-4 text-[#6A7873] absolute right-3.5 top-3" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-2.5 text-[10px] text-[#6A7873] hover:text-[#1C2826] bg-[#EAE6DF] px-2 py-0.5 rounded-md"
            >
              پاک کردن
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Account Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#6A7873]" />
            <span className="text-[#6A7873]">نوع حساب:</span>
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl py-1.5 px-3 text-xs font-bold text-[#0F4C3A] focus:outline-none"
            >
              <option value="all">همه حساب‌ها</option>
              <option value="personal">مشتری شخصی</option>
              <option value="corporate">حساب سازمانی (B2B)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#6A7873]">وضعیت:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl py-1.5 px-3 text-xs font-bold text-[#0F4C3A] focus:outline-none"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="suspended">مسدود</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#6A7873]">نقش:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E0D8C8] rounded-xl py-1.5 px-3 text-xs font-bold text-[#0F4C3A] focus:outline-none"
            >
              <option value="all">همه نقش‌ها</option>
              <option value="customer">مشتری</option>
              <option value="admin">مدیر سیستم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#EAE6DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#0F4C3A] font-bold">
              <tr>
                <th className="p-4">کاربر</th>
                <th className="p-4">نقش و نوع حساب</th>
                <th className="p-4">شماره تماس / ایمیل</th>
                <th className="p-4">تاریخ ثبت‌نام</th>
                <th className="p-4">سفارش‌ها</th>
                <th className="p-4">وضعیت</th>
                <th className="p-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#6A7873] space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#0F4C3A] animate-spin mx-auto opacity-80 mb-2" />
                    <div className="font-bold text-sm text-[#0F4C3A]">در حال دریافت اطلاعات کاربران از پایگاه داده...</div>
                    <div className="text-xs text-[#6A7873]">لطفاً چند لحظه شکیبا باشید.</div>
                  </td>
                </tr>
              ) : error && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-red-600 space-y-3">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto opacity-80 mb-2" />
                    <div className="font-bold text-sm text-red-900">عدم دسترسی به پایگاه داده کاربران</div>
                    <div className="text-xs text-red-700 max-w-md mx-auto">{error}</div>
                    {onRefresh && (
                      <button
                        type="button"
                        onClick={onRefresh}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F4C3A] text-white rounded-xl text-xs font-bold hover:bg-[#0F4C3A]/90 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>تلاش مجدد</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#6A7873] space-y-2">
                    <Users className="w-10 h-10 text-[#D4AF37] mx-auto opacity-70 mb-2" />
                    <div className="font-bold text-sm text-[#0F4C3A]">هیچ کاربری یافت نشد</div>
                    <div className="text-xs">
                      {searchTerm || accountTypeFilter !== 'all' || statusFilter !== 'all' || roleFilter !== 'all'
                        ? 'هیچ کاربری با فیلترهای انتخابی مطابقت ندارد.'
                        : 'هنوز هیچ کاربری در پایگاه‌داده ثبت نشده است.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userOrdersList = getUserOrders(user);
                  const totalSpent = userOrdersList.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
                  const { displayName, initial } = getUserDisplayInfo(user);
                  const isThisProcessing = isProcessing && processingUserId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-[#FAF8F5]/60 transition">
                      {/* User info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#0F4C3A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-extrabold text-[#1C2826]">{displayName}</p>
                              {user.role === 'admin' && (
                                <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-purple-200">
                                  مدیر سیستم
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#6A7873] font-mono mt-0.5">{user.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Account Type */}
                      <td className="p-4">
                        {user.accountType === 'corporate' || Boolean(user.corporateProfile?.companyName) ? (
                          <div className="space-y-0.5">
                            <span className="bg-[#D4AF37]/20 text-[#0F4C3A] border border-[#D4AF37]/40 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#D4AF37]" />
                              <span>سازمانی</span>
                            </span>
                            {user.corporateProfile?.companyName && (
                              <p className="text-[10px] text-[#6A7873] truncate max-w-[130px]">
                                {user.corporateProfile.companyName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="bg-[#0F4C3A]/10 text-[#0F4C3A] px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            <span>مشتری شخصی</span>
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="p-4">
                        <p className="font-mono font-bold text-[#1C2826]">{user.phoneNumber || user.phone || '—'}</p>
                        {user.email && <p className="text-[10px] text-[#6A7873] truncate max-w-[150px]">{user.email}</p>}
                      </td>

                      {/* Registration Date */}
                      <td className="p-4 text-[#6A7873]">
                        {user.createdAtFa || (user.createdAt ? new Date(user.createdAt).toLocaleDateString('fa-IR') : '—')}
                      </td>

                      {/* Orders count & spent */}
                      <td className="p-4">
                        <p className="font-bold text-[#0F4C3A]">
                          {toPersianDigits(userOrdersList.length || user.ordersCount || 0)} سفارش
                        </p>
                        {totalSpent > 0 ? (
                          <p className="text-[10px] text-[#6A7873]">{formatToman(totalSpent)}</p>
                        ) : user.totalSpent && user.totalSpent > 0 ? (
                          <p className="text-[10px] text-[#6A7873]">{formatToman(user.totalSpent)}</p>
                        ) : null}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : user.status === 'inactive'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {user.status === 'active' ? 'فعال' : user.status === 'inactive' ? 'غیرفعال' : 'مسدود'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 bg-[#FAF8F5] hover:bg-[#0F4C3A] text-[#0F4C3A] hover:text-white rounded-lg transition border border-[#EAE6DF]"
                            title="مشاهده جزئیات کامل حساب"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit user */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 bg-[#FAF8F5] hover:bg-[#D4AF37] text-[#0F4C3A] rounded-lg transition border border-[#EAE6DF] disabled:opacity-50"
                            title="ویرایش وضعیت و نقش کاربر"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Inactive (Deactivate has confirmation modal) */}
                          {user.email === 'admin@yadman.ir' ? (
                            <button
                              type="button"
                              disabled
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                              title="مدیر ارشد سامانه قابل غیرفعال‌سازی نیست"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              id={`toggle-user-status-${user.id}`}
                              disabled={isProcessing}
                              onClick={() => handleRequestToggleStatus(user)}
                              className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border ${
                                user.status === 'active'
                                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-200'
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-200'
                              }`}
                              title={
                                isThisProcessing
                                  ? 'در حال بروزرسانی...'
                                  : user.status === 'active'
                                  ? 'غیرفعال‌سازی حساب کاربر'
                                  : 'فعال‌سازی حساب کاربر'
                              }
                            >
                              {isThisProcessing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : user.status === 'active' ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL: DEACTIVATE USER --- */}
      {userToDeactivate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-red-200 shadow-2xl p-6 sm:p-7 space-y-5 text-right animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600 border-b border-[#EAE6DF] pb-3">
              <div className="p-2.5 rounded-2xl bg-red-100 text-red-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-red-900">تأیید غیرفعال‌سازی حساب کاربری</h3>
                <p className="text-xs text-[#6A7873] mt-0.5">عملیات نیازمند تأیید مدیریت</p>
              </div>
            </div>

            <div className="text-xs text-[#1C2826] space-y-2 leading-relaxed">
              <p>
                آیا از غیرفعال‌سازی حساب کاربری <span className="font-extrabold text-[#0F4C3A]">«{userToDeactivate.fullName || userToDeactivate.name}»</span> با شماره تماس <span className="font-mono font-bold">{userToDeactivate.phoneNumber || userToDeactivate.phone}</span> اطمینان دارید؟
              </p>
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-[11px]">
                ⚠️ پس از غیرفعال‌سازی، ورود این کاربر به سامانه مسدود خواهد شد تا زمانی که مجدداً توسط مدیر فعال گردد.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setUserToDeactivate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6A7873] hover:bg-[#FAF8F5] border border-[#EAE6DF] transition"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDeactivate}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isProcessing ? 'در حال انجام...' : 'تأیید و غیرفعال‌سازی'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION MODAL: ACTIVATE USER --- */}
      {userToActivate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-emerald-200 shadow-2xl p-6 sm:p-7 space-y-5 text-right animate-scaleIn">
            <div className="flex items-center gap-3 text-emerald-700 border-b border-[#EAE6DF] pb-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F4C3A]">تأیید فعال‌سازی حساب کاربری</h3>
                <p className="text-xs text-[#6A7873] mt-0.5">بازگردانی دسترسی کاربر</p>
              </div>
            </div>

            <div className="text-xs text-[#1C2826] space-y-2 leading-relaxed">
              <p>
                آیا مایلید حساب کاربری <span className="font-extrabold text-[#0F4C3A]">«{userToActivate.fullName || userToActivate.name}»</span> با شماره تماس <span className="font-mono font-bold">{userToActivate.phoneNumber || userToActivate.phone}</span> مجدداً فعال گردد؟
              </p>
              <p className="text-[11px] text-[#6A7873]">
                با فعال‌سازی، دسترسی کاربر به پنل کاربری، سبد خرید و ثبت سفارشات آنلاین بازیابی خواهد شد.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setUserToActivate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6A7873] hover:bg-[#FAF8F5] border border-[#EAE6DF] transition"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmActivate}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isProcessing ? 'در حال انجام...' : 'تأیید و فعال‌سازی'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- USER DETAILS MODAL --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] max-w-2xl w-full rounded-3xl border border-[#EAE6DF] shadow-2xl p-6 sm:p-8 space-y-6 text-right my-8 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0F4C3A] text-white flex items-center justify-center font-bold text-lg">
                  {getUserDisplayInfo(selectedUser).initial}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#0F4C3A]">
                      {selectedUser.fullName || selectedUser.name || 'کاربر'}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        selectedUser.accountType === 'corporate' || Boolean(selectedUser.corporateProfile?.companyName)
                          ? 'bg-[#D4AF37] text-[#0F4C3A]'
                          : 'bg-[#0F4C3A]/10 text-[#0F4C3A]'
                      }`}
                    >
                      {selectedUser.accountType === 'corporate' || Boolean(selectedUser.corporateProfile?.companyName) ? 'حساب سازمانی' : 'مشتری شخصی'}
                    </span>
                    {selectedUser.role === 'admin' && (
                      <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        مدیر سیستم
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6A7873] mt-0.5 font-mono">شناسه کاربری: {selectedUser.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-[#6A7873] hover:text-[#0F4C3A] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F4EFE6]/60 p-4 rounded-2xl border border-[#E0D8C8] text-xs">
              <div>
                <p className="text-[#6A7873]">شماره تماس:</p>
                <p className="font-bold text-[#1C2826] font-mono mt-0.5">{selectedUser.phoneNumber || selectedUser.phone || 'ثبت نشده'}</p>
              </div>

              <div>
                <p className="text-[#6A7873]">ایمیل:</p>
                <p className="font-bold text-[#1C2826] mt-0.5">{selectedUser.email || 'ثبت نشده'}</p>
              </div>

              <div>
                <p className="text-[#6A7873]">تاریخ عضویت:</p>
                <p className="font-bold text-[#1C2826] mt-0.5">
                  {selectedUser.createdAtFa || (selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('fa-IR') : '—')}
                </p>
              </div>

              <div>
                <p className="text-[#6A7873]">وضعیت دسترسی:</p>
                <p className="mt-0.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                      selectedUser.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedUser.status === 'inactive'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedUser.status === 'active' ? 'فعال' : selectedUser.status === 'inactive' ? 'غیرفعال' : 'مسدود'}
                  </span>
                </p>
              </div>

              {selectedUser.corporateProfile?.companyName && (
                <>
                  <div>
                    <p className="text-[#6A7873]">نام شرکت / سازمان:</p>
                    <p className="font-bold text-[#0F4C3A] mt-0.5">
                      {selectedUser.corporateProfile.companyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6A7873]">سمت سازمانی:</p>
                    <p className="font-bold text-[#1C2826] mt-0.5">
                      {selectedUser.corporateProfile?.jobTitle || 'ثبت نشده'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Admin Notes */}
            {selectedUser.adminNotes && (
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE6DF] text-xs space-y-1">
                <p className="font-bold text-[#0F4C3A]">یادداشت اختصاصی مدیر فروش:</p>
                <p className="text-[#6A7873] leading-relaxed">{selectedUser.adminNotes}</p>
              </div>
            )}

            {/* Saved Addresses */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F4C3A] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span>آدرس‌های ثبت شده ({toPersianDigits(selectedUser.addresses?.length || 0)}):</span>
              </h4>
              {!selectedUser.addresses || selectedUser.addresses.length === 0 ? (
                <p className="text-xs text-[#6A7873] bg-white p-3 rounded-xl border border-[#EAE6DF]">
                  هنوز آدرسی برای این کاربر در پایگاه‌داده ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedUser.addresses.map((addr) => (
                    <div key={addr.id} className="bg-white p-3 rounded-xl border border-[#EAE6DF] text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1C2826]">{addr.title || 'آدرس'} - {addr.recipientName}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            پیش‌فرض
                          </span>
                        )}
                      </div>
                      <p className="text-[#6A7873]">
                        {addr.province}، {addr.city}، {addr.address} {addr.phoneNumber && `(${addr.phoneNumber})`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F4C3A] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#D4AF37]" />
                <span>سوابق خرید:</span>
              </h4>
              {(() => {
                const uOrders = getUserOrders(selectedUser);
                if (uOrders.length === 0) {
                  return (
                    <p className="text-xs text-[#6A7873] bg-white p-3 rounded-xl border border-[#EAE6DF]">
                      هیچ سفارشی برای این کاربر ثبت نشده است.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-white p-3 rounded-xl border border-[#EAE6DF] flex items-center justify-between text-xs hover:border-[#0F4C3A]/40 transition"
                      >
                        <div>
                          <p className="font-bold text-[#0F4C3A] font-mono">{ord.id}</p>
                          <p className="text-[10px] text-[#6A7873]">{ord.createdAtFa} • {formatToman(ord.totalPrice)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-[#F4EFE6] text-[#0F4C3A] px-2 py-0.5 rounded-md font-bold">
                            {ord.status === 'preparing' ? 'در حال آماده‌سازی' : ord.status === 'delivered' ? 'تحویل شده' : ord.status}
                          </span>
                          {onViewOrderDetails && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(null);
                                onViewOrderDetails(ord);
                              }}
                              className="text-[10px] text-[#0F4C3A] hover:underline font-bold"
                            >
                              مشاهده
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EAE6DF]">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="bg-[#0F4C3A] text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-[#0B3C2E] transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] max-w-md w-full rounded-3xl border border-[#EAE6DF] shadow-2xl p-6 sm:p-8 space-y-6 text-right animate-scaleIn">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
              <h3 className="text-base font-extrabold text-[#0F4C3A]">مدیریت دسترسی و وضعیت کاربر</h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-[#6A7873] hover:text-[#0F4C3A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#1C2826]">نام کاربر</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">شماره تماس</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">وضعیت حساب</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-2 text-xs text-[#1C2826] focus:outline-none font-bold"
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="suspended">مسدود شده</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">ایمیل</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1C2826]">نقش در سامانه</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-2 text-xs text-[#1C2826] focus:outline-none font-bold"
                  >
                    <option value="customer">مشتری عادی</option>
                    <option value="admin">مدیر سیستم</option>
                  </select>
                </div>
              </div>

              {(editingUser.accountType === 'corporate' || Boolean(editCompanyName)) && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#1C2826]">نام شرکت / برند</label>
                    <input
                      type="text"
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#1C2826]">سمت سازمانی</label>
                    <input
                      type="text"
                      value={editJobTitle}
                      onChange={(e) => setEditJobTitle(e.target.value)}
                      className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl py-2 px-3 text-xs text-[#1C2826] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#1C2826]">یادداشت‌های مدیریتی</label>
                <textarea
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="یادداشت‌های اختصاصی مدیران فروش..."
                  className="w-full bg-[#F4EFE6]/70 border border-[#E0D8C8] focus:border-[#0F4C3A] rounded-xl p-2.5 text-xs text-[#1C2826] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EAE6DF]">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6A7873] hover:bg-[#EAE6DF] transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isProcessing ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
