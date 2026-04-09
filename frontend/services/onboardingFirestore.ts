import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { OnboardingProfile } from '../types/onboardingProfile';
import { db } from './firebase';

/**
 * Merge onboarding fields on `users/{uid}.onboardingProfile`.
 * Configure Firestore rules: users can read/write only their own `users/{request.auth.uid}` doc.
 */
export async function saveOnboardingProfile(
  uid: string,
  partial: Partial<OnboardingProfile>,
  options?: { markComplete?: boolean }
): Promise<void> {
  const onboardingProfile: Record<string, unknown> = {
    ...partial,
    updatedAt: serverTimestamp(),
  };
  if (options?.markComplete) {
    onboardingProfile.completedAt = serverTimestamp();
  }
  await setDoc(
    doc(db, 'users', uid),
    { onboardingProfile },
    { merge: true }
  );
}
