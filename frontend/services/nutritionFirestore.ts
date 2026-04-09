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

export type DailyNutritionLog = {
  dateKey: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  weightKg: number | null;
  calorieGoal: number;
  suggestedCalories: number;
};

type GoalAdjusterInput = {
  weightKg: number | null;
  goals: string[];
};

export function getDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function estimateDailyCalorieTarget({
  weightKg,
  goals,
}: GoalAdjusterInput): number {
  const base = weightKg && weightKg > 0 ? weightKg * 30 : 2200;
  const goalText = goals.map((g) => g.toLowerCase());
  const wantsFatLoss = goalText.some((g) => g.includes('lose fat') || g.includes('face'));
  const wantsMuscle = goalText.some((g) => g.includes('muscle'));

  let adjusted = base;
  if (wantsFatLoss) adjusted -= 350;
  if (wantsMuscle) adjusted += 250;
  if (wantsFatLoss && wantsMuscle) adjusted = base;

  return Math.max(1400, Math.min(3600, Math.round(adjusted)));
}

export function estimateMacroTargets(calorieTarget: number, goals: string[]) {
  const goalText = goals.map((g) => g.toLowerCase());
  const wantsFatLoss = goalText.some((g) => g.includes('lose fat') || g.includes('face'));
  const wantsMuscle = goalText.some((g) => g.includes('muscle'));

  const split = wantsMuscle
    ? { protein: 0.3, carbs: 0.45, fat: 0.25 }
    : wantsFatLoss
      ? { protein: 0.35, carbs: 0.35, fat: 0.3 }
      : { protein: 0.3, carbs: 0.4, fat: 0.3 };

  return {
    proteinG: Math.round((calorieTarget * split.protein) / 4),
    carbsG: Math.round((calorieTarget * split.carbs) / 4),
    fatG: Math.round((calorieTarget * split.fat) / 9),
  };
}

export async function saveDailyNutritionLog(
  uid: string,
  payload: Omit<DailyNutritionLog, 'dateKey'>,
  date = new Date()
): Promise<void> {
  const dateKey = getDateKey(date);
  await setDoc(
    doc(db, 'users', uid, 'dailyNutrition', dateKey),
    {
      ...payload,
      dateKey,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Consecutive days with a nutrition log (by dateKey), ending today or yesterday chain. */
export function computeNutritionLogStreak(logs: DailyNutritionLog[]): number {
  const dateSet = new Set(logs.map((l) => l.dateKey));
  const cursor = new Date();
  let streak = 0;
  for (;;) {
    const key = getDateKey(cursor);
    if (!dateSet.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function subscribeDailyNutritionLogs(
  uid: string,
  days: number,
  onData: (logs: DailyNutritionLog[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(
    collection(db, 'users', uid, 'dailyNutrition'),
    orderBy('dateKey', 'desc'),
    limit(days)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((d) => d.data() as DailyNutritionLog);
      onData(logs);
    },
    onError
  );
}
