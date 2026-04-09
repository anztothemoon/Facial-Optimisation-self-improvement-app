import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type PlanProgress = Record<string, boolean>;

export function subscribePlanProgress(
  uid: string,
  onData: (progress: PlanProgress) => void,
  onError?: (error: unknown) => void
) {
  return onSnapshot(
    doc(db, 'users', uid, 'meta', 'planProgress'),
    (snap) => {
      const data = snap.data() as { checklist?: PlanProgress } | undefined;
      onData(data?.checklist ?? {});
    },
    onError
  );
}

export async function setChecklistItem(
  uid: string,
  itemId: string,
  done: boolean
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'meta', 'planProgress'),
    {
      checklist: { [itemId]: done },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

