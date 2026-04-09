import type { FaceAnalysisResult } from './faceAnalysis';

export type PlanItem = {
  id: string;
  domain: 'face' | 'body' | 'fitness' | 'skin' | 'style' | 'supplements';
  title: string;
  checklist: string[];
};

export type PlanPack = {
  daily: PlanItem[];
  weekly: PlanItem[];
  monthly: PlanItem[];
};

export function generateActionPlans(input: {
  goals: string[];
  faceAnalysis: FaceAnalysisResult;
  caloriesTarget: number;
}): PlanPack {
  const topWeak = input.faceAnalysis.priorityImprovementAreas[0] || 'Symmetry';
  return {
    daily: [
      {
        id: 'd-face',
        domain: 'face',
        title: `Face tune-up (${topWeak})`,
        checklist: [
          '8 min facial mobility routine',
          '2 min posture reset (neck + jaw)',
          'Hydration: 2-3L water',
        ],
      },
      {
        id: 'd-body',
        domain: 'body',
        title: 'Body composition consistency',
        checklist: [
          `Hit ${input.caloriesTarget} kcal target`,
          'Walk 8k+ steps',
          'Log body weight in tracker',
        ],
      },
      {
        id: 'd-skin',
        domain: 'skin',
        title: 'Skin clarity stack',
        checklist: [
          'AM cleanse + SPF',
          'PM cleanse + moisturizer',
          'No high-glycemic snacks post-dinner',
        ],
      },
    ],
    weekly: [
      {
        id: 'w-fitness',
        domain: 'fitness',
        title: 'Strength + conditioning',
        checklist: [
          '3 strength sessions',
          '2 cardio sessions',
          '1 active recovery day',
        ],
      },
      {
        id: 'w-style',
        domain: 'style',
        title: 'Style upgrade',
        checklist: [
          'Plan 3 fitted outfits',
          'Grooming refresh (hair + brows)',
          'Take one mirror photo for review',
        ],
      },
    ],
    monthly: [
      {
        id: 'm-face',
        domain: 'face',
        title: 'Face progression checkpoint',
        checklist: [
          'Upload before/after face photos',
          'Review category score movement',
          'Adjust focus areas for next month',
        ],
      },
      {
        id: 'm-supplements',
        domain: 'supplements',
        title: 'Supplement protocol audit',
        checklist: [
          'Evaluate adherence and tolerance',
          'Restock essentials (omega-3, vitamin D, magnesium)',
          'Update timing with meals/workouts',
        ],
      },
    ],
  };
}

