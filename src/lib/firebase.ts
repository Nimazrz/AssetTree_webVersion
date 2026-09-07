/**
 * Firebase Service Initialization and Client SDK Interface
 * Manages Authentication, Cloud Firestore sync with custom database ID,
 * and user profile management.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StoredNodeEntity, SymbolEntryEntity, DisplaySettings, UserProfile } from '../types';

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);

const customDbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db: Firestore = customDbId
  ? getFirestore(app, customDbId)
  : getFirestore(app);

export interface UserPortfolioCloudData {
  nodes: StoredNodeEntity[];
  symbols?: SymbolEntryEntity[];
  settings?: Partial<DisplaySettings>;
  updatedAt?: any;
}

/**
 * Translate Firebase Auth error codes to user-friendly messages in Persian and English
 */
export function getAuthErrorMessage(errorCode: string, lang: 'fa' | 'en' = 'fa'): string {
  const isEn = lang === 'en';
  switch (errorCode) {
    case 'auth/invalid-email':
      return isEn ? 'The email address is badly formatted.' : 'فرمت آدرس ایمیل وارد شده نامعتبر است.';
    case 'auth/user-disabled':
      return isEn ? 'This user account has been disabled.' : 'این حساب کاربری غیرفعال شده است.';
    case 'auth/user-not-found':
      return isEn ? 'No account found with this email address.' : 'حسابی با این آدرس ایمیل پیدا نشد.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return isEn ? 'Incorrect email or password. Please check and try again.' : 'ایمیل یا رمز عبور اشتباه است. لطفاً بررسی و دوباره امتحان کنید.';
    case 'auth/email-already-in-use':
      return isEn ? 'This email address is already registered.' : 'این آدرس ایمیل قبلاً در سیستم ثبت شده است.';
    case 'auth/weak-password':
      return isEn ? 'The password must be at least 6 characters.' : 'گذرواژه باید حداقل شامل ۶ کاراکتر باشد.';
    case 'auth/too-many-requests':
      return isEn ? 'Too many unsuccessful attempts. Please try again later.' : 'تلاش‌های ناموفق بیش از حد مجاز بوده است. لطفاً کمی بعد دوباره تلاش فرمایید.';
    case 'auth/network-request-failed':
      return isEn ? 'Network connection error. Please check your internet.' : 'خطای اتصال به شبکه اینترنت. لطفاً اینترنت خود را بررسی کنید.';
    case 'auth/expired-action-code':
      return isEn ? 'The password reset link has expired.' : 'لینک بازیابی رمز عبور منقضی شده است.';
    case 'auth/invalid-action-code':
      return isEn ? 'The reset link is invalid or has already been used.' : 'لینک بازیابی نامعتبر است یا قبلاً استفاده شده است.';
    case 'auth/operation-not-allowed':
      return isEn
        ? 'Email/Password sign-in provider is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.'
        : 'ورود با ایمیل و گذرواژه در کنسول فایربیس فعال نشده است. لطفاً در پنل Firebase Console وارد بخش Authentication > Sign-in method شده و Email/Password را Enable کنید.';
    default:
      return isEn ? `Authentication error (${errorCode})` : `خطا در احراز هویت (${errorCode})`;
  }
}

/**
 * Save user profile info to Firestore /users/{uid}
 */
export async function syncUserProfileToFirestore(user: User): Promise<void> {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'کاربر',
        photoURL: user.photoURL || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not sync user profile to Firestore:', error);
  }
}

/**
 * Load user's private asset portfolio from Firestore /users/{uid}/portfolio/main
 */
export async function loadUserPortfolioFromFirestore(userId: string): Promise<UserPortfolioCloudData | null> {
  try {
    const portfolioDocRef = doc(db, 'users', userId, 'portfolio', 'main');
    const snap = await getDoc(portfolioDocRef);
    if (snap.exists()) {
      return snap.data() as UserPortfolioCloudData;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user portfolio from Firestore:', err);
    return null;
  }
}

/**
 * Save user's asset portfolio to Firestore /users/{uid}/portfolio/main
 */
export async function saveUserPortfolioToFirestore(
  userId: string,
  data: {
    nodes: StoredNodeEntity[];
    symbols?: SymbolEntryEntity[];
    settings?: DisplaySettings;
  }
): Promise<boolean> {
  try {
    const portfolioDocRef = doc(db, 'users', userId, 'portfolio', 'main');
    await setDoc(
      portfolioDocRef,
      {
        nodes: data.nodes,
        symbols: data.symbols || [],
        settings: data.settings || {},
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error saving user portfolio to Firestore:', err);
    return false;
  }
}

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
};
