/**
 * Authentication Dialog (Login, Registration, Password Reset, and Password Reset Link Handling)
 * Fully bilingual (Persian & English) with Firebase Auth integration.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  getAuthErrorMessage,
  syncUserProfileToFirestore,
} from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppLanguage } from '../types';

export type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'RESET_CONFIRM';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
  initialMode?: AuthMode;
  initialOobCode?: string | null;
  onSuccess?: (userEmail: string) => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  isOpen,
  onClose,
  language,
  initialMode = 'LOGIN',
  initialOobCode = null,
  onSuccess,
}) => {
  const isEn = language === 'en';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset code from email link
  const [oobCode, setOobCode] = useState<string>(initialOobCode || '');
  const [resetEmailTarget, setResetEmailTarget] = useState<string | null>(null);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
    if (initialOobCode) {
      setOobCode(initialOobCode);
      // Verify the code
      verifyPasswordResetCode(auth, initialOobCode)
        .then((verifiedEmail) => {
          setResetEmailTarget(verifiedEmail);
          setMode('RESET_CONFIRM');
        })
        .catch((err) => {
          setLastErrorCode(err.code || null);
          setErrorMessage(getAuthErrorMessage(err.code, language));
        });
    }
  }, [initialMode, initialOobCode, language]);

  // Clear errors when changing modes
  useEffect(() => {
    setErrorMessage(null);
    setLastErrorCode(null);
    setSuccessMessage(null);
  }, [mode]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLastErrorCode(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      await syncUserProfileToFirestore(userCredential.user);
      if (onSuccess) onSuccess(userCredential.user.email || '');
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      // Ignore user closed popup
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setIsLoading(false);
        return;
      }
      setLastErrorCode(err.code || null);
      setErrorMessage(getAuthErrorMessage(err.code || 'unknown', language));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLastErrorCode(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(isEn ? 'Please fill in all fields.' : 'لطفاً تمامی فیلدها را تکمیل نمایید.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncUserProfileToFirestore(userCredential.user);
      if (onSuccess) onSuccess(userCredential.user.email || '');
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setLastErrorCode(err.code || null);
      setErrorMessage(getAuthErrorMessage(err.code || 'unknown', language));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLastErrorCode(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(isEn ? 'Please fill in all fields.' : 'لطفاً تمامی فیلدها را وارد نمایید.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage(isEn ? 'Password must be at least 6 characters.' : 'طول رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(isEn ? 'Passwords do not match.' : 'تکرار رمز عبور با رمز عبور اصلی یکسان نیست.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
        });
      }
      await syncUserProfileToFirestore(userCredential.user);
      if (onSuccess) onSuccess(userCredential.user.email || '');
      onClose();
    } catch (err: any) {
      console.error('Register error:', err);
      setLastErrorCode(err.code || null);
      setErrorMessage(getAuthErrorMessage(err.code || 'unknown', language));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLastErrorCode(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage(isEn ? 'Please enter your registered email.' : 'لطفاً ایمیل ثبت‌شده خود را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage(
        isEn
          ? `A password reset link has been sent to ${email.trim()}. Please check your inbox and spam folder, click the link to reset your password.`
          : `ایمیل بازیابی با موفقیت به آدرس «${email.trim()}» ارسال شد. لطفاً صندوق ورودی یا هرزنامه (Spam) خود را بررسی کرده و روی لینک درون ایمیل کلیک نمایید تا رمز جدید خود را ثبت کنید.`
      );
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setLastErrorCode(err.code || null);
      setErrorMessage(getAuthErrorMessage(err.code || 'unknown', language));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLastErrorCode(null);
    setSuccessMessage(null);

    if (!password || !confirmPassword) {
      setErrorMessage(isEn ? 'Please enter your new password.' : 'لطفاً رمز عبور جدید را وارد کنید.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage(isEn ? 'Password must be at least 6 characters.' : 'طول رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(isEn ? 'Passwords do not match.' : 'تکرار رمز عبور یکسان نیست.');
      return;
    }

    if (!oobCode.trim()) {
      setErrorMessage(isEn ? 'Reset verification code is missing.' : 'کد امنیتی بازیابی یافت نشد.');
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode.trim(), password);
      setSuccessMessage(
        isEn
          ? 'Your password has been successfully changed! You can now log in with your new password.'
          : 'گذرواژه شما با موفقیت تغییر کرد! اکنون می‌توانید با رمز عبور جدید وارد حساب کاربری خود شوید.'
      );
      setTimeout(() => {
        setMode('LOGIN');
      }, 2500);
    } catch (err: any) {
      console.error('Reset password confirm error:', err);
      setErrorMessage(getAuthErrorMessage(err.code || 'unknown', language));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all"
        dir={isEn ? 'ltr' : 'rtl'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {mode === 'LOGIN' && <KeyRound className="w-4 h-4" />}
              {mode === 'REGISTER' && <UserIcon className="w-4 h-4" />}
              {mode === 'FORGOT_PASSWORD' && <Mail className="w-4 h-4" />}
              {mode === 'RESET_CONFIRM' && <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {mode === 'LOGIN' && (isEn ? 'Sign In to Account' : 'ورود به حساب کاربری')}
                {mode === 'REGISTER' && (isEn ? 'Create New Account' : 'ایجاد حساب کاربری جدید')}
                {mode === 'FORGOT_PASSWORD' && (isEn ? 'Reset Password' : 'بازیابی گذرواژه')}
                {mode === 'RESET_CONFIRM' && (isEn ? 'Set New Password' : 'ثبت رمز عبور جدید')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {mode === 'LOGIN' && (isEn ? 'Access your private portfolio data' : 'دسترسی به دارایی‌ها و اطلاعات اختصاصی')}
                {mode === 'REGISTER' && (isEn ? 'Start managing your private assets' : 'مدیریت و همگام‌سازی امن پرتفوی')}
                {mode === 'FORGOT_PASSWORD' && (isEn ? 'Receive recovery email with reset link' : 'دریافت ایمیل حاوی لینک تغییر پسورد')}
                {mode === 'RESET_CONFIRM' && (isEn ? 'Enter your new security password' : 'تغییر و ذخیره گذرواژه جدید')}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mx-4 sm:mx-5 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col gap-2 text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
            {lastErrorCode === 'auth/operation-not-allowed' && (
              <div className="mt-1 p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-rose-200 dark:border-rose-800/60 text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed space-y-2">
                <p className="font-bold text-rose-600 dark:text-rose-400">
                  {isEn
                    ? 'Why this error happened: Email/Password provider is disabled by default in Firebase Console.'
                    : 'علت این خطا: روش ثبت‌نام با ایمیل و گذرواژه هنوز در کنسول فایربیس فعال (Enable) نشده است.'}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>
                    {isEn
                      ? 'Click the button below to open Firebase Authentication console.'
                      : 'روی دکمه آبی زیر کلیک کنید تا وارد پنل Authentication فایربیس شوید.'}
                  </li>
                  <li>
                    {isEn
                      ? 'Under "Sign-in method" / "Sign-in providers", click "Email/Password" and toggle "Enable" then Save.'
                      : 'در تب «Sign-in method»، گزینه «Email/Password» را انتخاب و وضعیت آن را فعال (Enable) و ذخیره کنید.'}
                  </li>
                  <li>
                    {isEn
                      ? 'Alternative: You can also use the "Google Account" sign-in button below directly!'
                      : 'راهکار فوری: همچنین می‌توانید بدون هیچ تنظیمی از دکمه «حساب گوگل» در پایین استفاده کنید.'}
                  </li>
                </ol>
                <div className="pt-1">
                  <a
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Open Firebase Console Sign-in Providers' : 'باز کردن صفحه فعال‌سازی در کنسول فایربیس'}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mx-4 sm:mx-5 mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <div className="p-4 sm:p-5">
          {/* MODE: LOGIN */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Google Sign-in Alternative */}
              <button
                type="button"
                id="btn-google-sign-in-login"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isEn ? 'Sign in with Google' : 'ورود با حساب گوگل'}</span>
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                    {isEn ? 'or with email' : 'یا با ایمیل و گذرواژه'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? 'Email Address' : 'آدرس ایمیل'}
                </label>
                <div className="relative">
                  <Mail className={`absolute ${isEn ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type="email"
                    id="input-login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    dir="ltr"
                    className={`w-full ${
                      isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
                    } py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? 'Password' : 'گذرواژه'}
                  </label>
                  <button
                    type="button"
                    id="btn-switch-forgot-password"
                    onClick={() => setMode('FORGOT_PASSWORD')}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isEn ? 'Forgot password?' : 'رمز عبور را فراموش کرده‌اید؟'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`absolute ${isEn ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className={`w-full ${
                      isEn ? 'pl-9 pr-10' : 'pr-9 pl-10'
                    } py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isEn ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEn ? 'Sign In' : 'ورود به حساب کاربری'}</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400">
                <span>{isEn ? "Don't have an account? " : 'هنوز حسابی ندارید؟ '}</span>
                <button
                  type="button"
                  id="btn-switch-register"
                  onClick={() => setMode('REGISTER')}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isEn ? 'Create an account' : 'ثبت‌نام و ساخت اکانت'}
                </button>
              </div>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Google Sign-in Alternative */}
              <button
                type="button"
                id="btn-google-sign-in-register"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isEn ? 'Sign up with Google' : 'ثبت‌نام سریع با حساب گوگل'}</span>
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                    {isEn ? 'or register with email' : 'یا ثبت‌نام با ایمیل'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? 'Full Name / Display Name' : 'نام و نام خانوادگی / عنوان نمایش'}
                </label>
                <div className="relative">
                  <UserIcon className={`absolute ${isEn ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type="text"
                    id="input-register-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isEn ? 'Ali Rezaei' : 'علی رضایی'}
                    className={`w-full ${
                      isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
                    } py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? 'Email Address' : 'آدرس ایمیل'}
                </label>
                <div className="relative">
                  <Mail className={`absolute ${isEn ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type="email"
                    id="input-register-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    dir="ltr"
                    className={`w-full ${
                      isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
                    } py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? 'Password (at least 6 chars)' : 'گذرواژه (حداقل ۶ کاراکتر)'}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isEn ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-register-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className={`w-full ${
                      isEn ? 'pl-9 pr-10' : 'pr-9 pl-10'
                    } py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isEn ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? 'Confirm Password' : 'تکرار گذرواژه'}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isEn ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-register-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className={`w-full ${
                      isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
                    } py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEn ? 'Create Account' : 'ثبت‌نام و ورود'}</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400">
                <span>{isEn ? 'Already have an account? ' : 'قبلاً ثبت‌نام کرده‌اید؟ '}</span>
                <button
                  type="button"
                  id="btn-switch-login"
                  onClick={() => setMode('LOGIN')}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isEn ? 'Sign in here' : 'ورود به حساب'}
                </button>
              </div>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                {isEn
                  ? 'Enter your registered email address. We will send you an email with a secure link to reset and set a new password.'
                  : 'آدرس ایمیلی را که با آن ثبت‌نام کرده‌اید وارد نمایید. یک لینک امن جهت تغییر و تعیین رمز عبور جدید برای شما ایمیل خواهد شد.'}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? 'Registered Email Address' : 'ایمیل ثبت‌شده در سیستم'}
                </label>
                <div className="relative">
                  <Mail className={`absolute ${isEn ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type="email"
                    id="input-forgot-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    dir="ltr"
                    className={`w-full ${
                      isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
                    } py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-forgot"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEn ? 'Send Reset Link' : 'ارسال لینک بازیابی رمز'}</span>
              </button>

              <div className="pt-2 flex items-center justify-center">
                <button
                  type="button"
                  id="btn-back-to-login"
                  onClick={() => setMode('LOGIN')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {isEn ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  <span>{isEn ? 'Back to Sign In' : 'بازگشت به صفحه ورود'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE: RESET PASSWORD CONFIRM (from email link) */}
          {mode === 'RESET_CONFIRM' && (
            <form onSubmit={handleResetPasswordConfirm} className="space-y-4">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-xs text-indigo-800 dark:text-indigo-300">
                {resetEmailTarget ? (
                  <span>
                    {isEn ? `Setting new password for: ` : 'تعیین گذرواژه جدید برای: '}
                    <strong className="underline">{resetEmailTarget}</strong>
                  </span>
                ) : (
                  <span>{isEn ? 'Enter your new password below:' : 'رمز عبور جدید خود را وارد نمایید:'}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? 'New Password' : 'رمز عبور جدید'}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isEn ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className={`w-full ${
                      isEn ? 'pl-9 pr-10' : 'pr-9 pl-10'
                    } py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isEn ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? 'Confirm New Password' : 'تکرار رمز عبور جدید'}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isEn ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-confirm-new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className={`w-full ${
                      isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
                    } py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-save-new-password"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEn ? 'Save New Password' : 'ثبت و تغییر رمز عبور'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
