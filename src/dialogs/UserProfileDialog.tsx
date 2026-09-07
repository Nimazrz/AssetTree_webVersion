/**
 * User Profile Dialog
 * Displays personal user account details, creation date, asset statistics,
 * cloud sync status, password reset email trigger, and sign out controls.
 */

import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Calendar,
  KeyRound,
  LogOut,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Edit2,
  Save,
  Loader2,
  Coins,
  Layers,
} from 'lucide-react';
import {
  auth,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  syncUserProfileToFirestore,
  getAuthErrorMessage,
} from '../lib/firebase';
import { AppLanguage, UserProfile, DisplaySettings } from '../types';
import { formatCurrency, formatNumberWithCommas } from '../utils/numberFormat';
import { formatPersianDate } from '../utils/persianDate';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  language: AppLanguage;
  settings: DisplaySettings;
  totalPortfolioValue: number;
  totalNodeCount: number;
  onLoggedOut: () => void;
  onProfileUpdated?: (name: string) => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  settings,
  totalPortfolioValue,
  totalNodeCount,
  onLoggedOut,
  onProfileUpdated,
}) => {
  const isEn = language === 'en';

  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.displayName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleCopyUid = () => {
    if (currentUser.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayNameInput.trim()) return;
    setIsUpdatingProfile(true);
    setMessage(null);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayNameInput.trim(),
        });
        await syncUserProfileToFirestore(auth.currentUser);
        if (onProfileUpdated) onProfileUpdated(displayNameInput.trim());
        setIsEditingName(false);
        setMessage({
          text: isEn ? 'Profile updated successfully!' : 'نام و مشخصات با موفقیت به‌روزرسانی شد!',
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error('Error updating name:', err);
      setMessage({
        text: getAuthErrorMessage(err.code || 'unknown', language),
        type: 'error',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!currentUser.email) return;
    setIsSendingResetEmail(true);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setMessage({
        text: isEn
          ? `Password reset email sent to ${currentUser.email}. Check your inbox.`
          : `ایمیل بازیابی و تغییر رمز عبور با موفقیت به «${currentUser.email}» ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setMessage({
        text: getAuthErrorMessage(err.code || 'unknown', language),
        type: 'error',
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onLoggedOut();
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Format creation date
  let formattedCreatedDate = '-';
  if (currentUser.createdAt) {
    const timestamp = typeof currentUser.createdAt === 'string' ? new Date(currentUser.createdAt).getTime() : currentUser.createdAt;
    if (timestamp && !isNaN(timestamp)) {
      formattedCreatedDate = isEn
        ? new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : formatPersianDate(timestamp);
    }
  }

  const userInitial = (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all"
        dir={isEn ? 'ltr' : 'rtl'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isEn ? 'Personal Account Profile' : 'مشخصات و اطلاعات حساب کاربری'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isEn ? 'Manage your account details and security' : 'اطلاعات شخصی، امنیت و همگام‌سازی ابری'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-profile-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`mx-4 sm:mx-5 mt-4 p-3 rounded-2xl flex items-start gap-2.5 text-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Top User Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/70 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100/80 dark:border-slate-700 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
              {userInitial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      className="text-xs sm:text-sm font-bold px-2 py-1 rounded-lg border border-blue-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDisplayName}
                      disabled={isUpdatingProfile}
                      className="p-1 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs hover:bg-slate-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || (isEn ? 'User' : 'کاربر گرامی')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayNameInput(currentUser.displayName || '');
                        setIsEditingName(true);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      title={isEn ? 'Edit name' : 'ویرایش نام'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate" dir="ltr">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>

              {/* Cloud badge */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  <Cloud className="w-3 h-3" />
                  <span>{isEn ? 'Cloud Synced' : 'فضای ابری متصل'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isEn ? 'Protected' : 'ایمن و اختصاصی'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* User Portfolio Personal Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-medium">{isEn ? 'Portfolio Total Value' : 'ارزش کل دارایی‌ها'}</span>
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {formatCurrency(totalPortfolioValue, settings.currencyUnit, false, settings.usePersianDigits, settings.privacyMode, language)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] font-medium">{isEn ? 'Asset Elements' : 'تعداد گره‌های ثبت‌شده'}</span>
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {formatNumberWithCommas(totalNodeCount, settings.usePersianDigits, 0, language)}{' '}
                <span className="text-[10px] font-normal text-slate-500">{isEn ? 'items' : 'مورد'}</span>
              </span>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs">
            {/* Account UID */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {isEn ? 'Account ID (UID):' : 'شناسه کاربری (UID):'}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300" dir="ltr">
                <span className="max-w-[120px] xs:max-w-[170px] truncate">{currentUser.uid}</span>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                  title={isEn ? 'Copy UID' : 'کپی شناسه'}
                >
                  {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{isEn ? 'Member Since:' : 'تاریخ عضویت:'}</span>
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">
                {formattedCreatedDate}
              </span>
            </div>
          </div>

          {/* Security & Password Action */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isEn ? 'Password & Security' : 'امنیت و تغییر رمز عبور'}
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Send a password recovery email to change your existing password.'
                : 'در صورت تمایل به تعویض گذرواژه، با کلیک بر روی دکمه زیر یک ایمیل حاوی لینک تغییر پسورد برای شما ارسال می‌شود.'}
            </p>
            <button
              type="button"
              id="btn-profile-send-reset"
              onClick={handleSendResetEmail}
              disabled={isSendingResetEmail}
              className="mt-1 self-start px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSendingResetEmail && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEn ? 'Send Password Reset Email' : 'ارسال ایمیل تغییر رمز عبور'}</span>
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              id="btn-sign-out"
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isEn ? 'Sign Out' : 'خروج از حساب کاربری'}</span>
            </button>

            <button
              type="button"
              id="btn-close-profile"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              {isEn ? 'Close' : 'بستن'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
