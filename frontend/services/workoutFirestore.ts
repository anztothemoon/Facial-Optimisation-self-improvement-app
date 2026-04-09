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
import { db } from './firebase';

export type WorkoutSession = {
  dateKey: string;
  completed: boolean;
  completedAt?: { toDate?: () => Date };
};

function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function markWorkoutDone(uid: string, date = new Date()) {
  const key = dateKey(date);
  await setDoc(
    doc(db, 'users', uid, 'workoutSessions', key),
    { dateKey: key, completed: true, completedAt: serverTimestamp() },
    { merge: true }
  );
}

export function subscribeWorkoutSessions(
  uid: string,
  take: number,
  onData: (sessions: WorkoutSession[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(
    collection(db, 'users', uid, 'workoutSessions'),
    orderBy('dateKey', 'desc'),
    limit(take)
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as WorkoutSession));
    },
    onError
  );
}

export function computeWorkoutStreak(sessions: WorkoutSession[]): number {
  const keys = new Set(sessions.filter((s) => s.completed).map((s) => s.dateKey));
  const cursor = new Date();
  let streak = 0;
  for (;;) {
    const key = dateKey(cursor);
    if (!keys.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

