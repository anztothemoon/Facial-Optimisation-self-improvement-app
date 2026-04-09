import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { productConfig } from '../config/product';
import { auth, db } from '../services/firebase';

type AuthContextValue = {
  user: User | null;
  /** Auth resolved and first Firestore user doc snapshot received (if logged in) */
  ready: boolean;
  /** Onboarding wizard completed (Firestore `onboardingProfile.completedAt`) */
  wizardFirestoreComplete: boolean;
  /** Active Stripe subscription or trial (`trialing` | `active`) */
  subscribed: boolean;
  /** Raw Stripe status from Firestore */
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  subscriptionPlan: string | null;
  authError: string | null;
  clearError: () => void;
  signInEmail: (email: string, password: string) => Promise<boolean>;
  signUpEmail: (email: string, password: string) => Promise<boolean>;
  signInWithGoogleIdToken: (idToken: string) => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code?: string }).code);
    if (code === 'auth/invalid-email') return 'Invalid email address.';
    if (code === 'auth/user-disabled') return 'This account has been disabled.';
    if (code === 'auth/user-not-found') return 'No account found for this email.';
    if (code === 'auth/wrong-password') return 'Incorrect password.';
    if (code === 'auth/invalid-credential') return 'Invalid credentials.';
    if (code === 'auth/email-already-in-use') return 'Email is already registered.';
    if (code === 'auth/weak-password') return 'Password should be at least 8 characters.';
    if (code === 'auth/network-request-failed') return 'Network error. Try again.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [userDocReady, setUserDocReady] = useState(false);
  const [wizardFirestoreComplete, setWizardFirestoreComplete] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setSessionReady(true);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) {
      setUserDocReady(true);
      setWizardFirestoreComplete(false);
      setSubscribed(false);
      setSubscriptionStatus(null);
      setTrialEndsAt(null);
      setSubscriptionPlan(null);
      return;
    }

    setUserDocReady(false);
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        setWizardFirestoreComplete(
          Boolean(data?.onboardingProfile?.completedAt)
        );
        const sub = data?.subscription as
          | {
              status?: string;
              trialEnd?: { toDate?: () => Date };
              plan?: string;
            }
          | undefined;
        const status = sub?.status ?? null;
        setSubscriptionStatus(status);
        const ok =
          status === 'trialing' ||
          status === 'active' ||
          (productConfig.subscriptionIncludePastDue && status === 'past_due');
        setSubscribed(ok);
        setTrialEndsAt(sub?.trialEnd?.toDate?.() ?? null);
        setSubscriptionPlan(sub?.plan ?? null);
        setUserDocReady(true);
      },
      () => {
        setUserDocReady(true);
      }
    );
    return unsub;
  }, [user?.uid]);

  const clearError = useCallback(() => setAuthError(null), []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (e) {
      setAuthError(mapAuthError(e));
      return false;
    }
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (e) {
      setAuthError(mapAuthError(e));
      return false;
    }
  }, []);

  const signInWithGoogleIdToken = useCallback(async (idToken: string) => {
    setAuthError(null);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      return true;
    } catch (e) {
      setAuthError(mapAuthError(e));
      return false;
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setAuthError('Apple Sign-In is only available on iOS.');
      return false;
    }
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        setAuthError('Apple Sign-In is not available on this device.');
        return false;
      }
      setAuthError(null);

      const rawNonce =
        Math.random().toString(36).substring(2, 10) +
        Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const apple = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!apple.identityToken) {
        setAuthError('Apple did not return an identity token.');
        return false;
      }

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: apple.identityToken,
        rawNonce,
      });
      await signInWithCredential(auth, credential);
      return true;
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e
          ? String((e as { code: string }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') {
        return false;
      }
      setAuthError(mapAuthError(e));
      return false;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
  }, []);

  const ready = sessionReady && userDocReady;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      wizardFirestoreComplete,
      subscribed,
      subscriptionStatus,
      trialEndsAt,
      subscriptionPlan,
      authError,
      clearError,
      signInEmail,
      signUpEmail,
      signInWithGoogleIdToken,
      signInWithApple,
      signOutUser,
    }),
    [
      user,
      ready,
      wizardFirestoreComplete,
      subscribed,
      subscriptionStatus,
      trialEndsAt,
      subscriptionPlan,
      authError,
      clearError,
      signInEmail,
      signUpEmail,
      signInWithGoogleIdToken,
      signInWithApple,
      signOutUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
