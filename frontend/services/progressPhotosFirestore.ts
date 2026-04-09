import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';

export type ProgressPhotoEntry = {
  id: string;
  weekKey: string;
  type: 'face' | 'body';
  url: string;
  createdAt?: { toDate?: () => Date };
};

function getWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export async function uploadWeeklyProgressPhoto(
  uid: string,
  uri: string,
  type: 'face' | 'body',
  date = new Date()
): Promise<void> {
  try {
    const weekKey = getWeekKey(date);
    const storageRef = ref(
      storage,
      `users/${uid}/progress/${weekKey}/${type}_${Date.now()}.jpg`
    );
    const response = await fetch(uri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
    const url = await getDownloadURL(storageRef);

    await setDoc(
      doc(db, 'users', uid, 'progressPhotos', `${weekKey}_${type}`),
      {
        weekKey,
        type,
        url,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    const code =
      e && typeof e === 'object' && 'code' in e
        ? String((e as { code?: string }).code)
        : '';
    if (code.includes('storage/unauthorized')) {
      throw new Error(
        'Storage access denied. Update Firebase Storage Rules to allow users/{uid}/** for authenticated matching uid.'
      );
    }
    throw e;
  }
}

export function subscribeProgressPhotos(
  uid: string,
  take: number,
  onData: (entries: ProgressPhotoEntry[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(
    collection(db, 'users', uid, 'progressPhotos'),
    orderBy('weekKey', 'desc'),
    limit(take)
  );
  return onSnapshot(
    q,
    (snap) => {
      const entries = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProgressPhotoEntry, 'id'>),
      }));
      onData(entries);
    },
    onError
  );
}

