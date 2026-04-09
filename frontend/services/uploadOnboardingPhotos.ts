import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadOnboardingPhoto(
  uid: string,
  uri: string,
  index: number,
  angle?: 'front' | 'left' | 'right'
): Promise<string> {
  try {
    const suffix = angle ? `_${angle}` : '';
    const path = `users/${uid}/onboarding/photo_${index}${suffix}_${Date.now()}.jpg`;
    const storageRef = ref(storage, path);
    const response = await fetch(uri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });
    return getDownloadURL(storageRef);
  } catch (e) {
    const code =
      e && typeof e === 'object' && 'code' in e
        ? String((e as { code?: string }).code)
        : '';
    if (code.includes('storage/unauthorized')) {
      throw new Error(
        'Storage access denied. In Firebase Storage Rules, allow users to write under users/{uid}/** for their own uid.'
      );
    }
    throw e;
  }
}
