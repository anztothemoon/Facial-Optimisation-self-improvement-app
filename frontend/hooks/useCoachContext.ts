import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../services/firebase';
import type { DailyNutritionLog } from '../services/nutritionFirestore';
import type { OnboardingProfile } from '../types/onboardingProfile';
import {
  type CoachContext,
  defaultCoachContext,
} from '../services/coachContext';

export function useCoachContext(user: User | null): {
  context: CoachContext;
  ready: boolean;
} {
  const [context, setContext] = useState<CoachContext>(() => defaultCoachContext());
  const [ready, setReady] = useState(!user);

  useEffect(() => {
    if (!user) {
      setContext(defaultCoachContext());
      setReady(true);
      return;
    }

    setReady(false);

    let profileChunk: Partial<CoachContext> = {};
    let latestNut: CoachContext['latestNutrition'] = null;

    const flush = () => {
      setContext({
        goals: profileChunk.goals ?? [],
        age: profileChunk.age ?? null,
        heightCm: profileChunk.heightCm ?? null,
        weightKg: profileChunk.weightKg ?? null,
        bodyType: profileChunk.bodyType ?? null,
        fitnessLevel: profileChunk.fitnessLevel ?? null,
        faceStructure: profileChunk.faceStructure ?? null,
        latestNutrition: latestNut,
      });
      setReady(true);
    };

    const unsubUser = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.data();
        const ob = data?.onboardingProfile as Partial<OnboardingProfile> | undefined;
        profileChunk = {
          goals: Array.isArray(ob?.goals) ? ob!.goals! : [],
          age: ob?.age ?? null,
          heightCm: ob?.heightCm ?? null,
          weightKg: ob?.weightKg ?? null,
          bodyType: ob?.bodyType ?? null,
          fitnessLevel: ob?.fitnessLevel ?? null,
          faceStructure: ob?.faceStructure ?? null,
        };
        flush();
      },
      () => {
        setReady(true);
      }
    );

    const nutQ = query(
      collection(db, 'users', user.uid, 'dailyNutrition'),
      orderBy('dateKey', 'desc'),
      limit(1)
    );
    const unsubNut = onSnapshot(
      nutQ,
      (snap) => {
        const d = snap.docs[0]?.data() as DailyNutritionLog | undefined;
        latestNut = d
          ? {
              calories: d.calories,
              proteinG: d.proteinG,
              goal: d.calorieGoal,
            }
          : null;
        flush();
      },
      () => {
        setReady(true);
      }
    );

    return () => {
      unsubUser();
      unsubNut();
    };
  }, [user?.uid]);

  return { context, ready };
}
