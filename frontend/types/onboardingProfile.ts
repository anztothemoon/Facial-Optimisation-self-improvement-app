export type StartingPhotoMeta = {
  angle: 'front' | 'left' | 'right';
  url: string;
};

/** Stored under Firestore `users/{uid}.onboardingProfile` */
export type OnboardingProfile = {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyType: string | null;
  fitnessLevel: string | null;
  goals: string[];
  faceStructure: string | null;
  startingPhotoUrls: string[];
  startingPhotoMeta?: StartingPhotoMeta[];
};

export const BODY_TYPES = [
  'Slim',
  'Lean / toned',
  'Average',
  'Broad / stocky',
  'Curvy / soft',
  'Athletic',
] as const;

export const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const GOALS = [
  'Build muscle',
  'Lose fat',
  'Better posture',
  'Face definition',
  'Confidence',
  'General health',
  'Mobility',
  'Consistency',
] as const;

export const FACE_STRUCTURES = [
  'Oval',
  'Round',
  'Square',
  'Heart',
  'Oblong',
  'Diamond',
] as const;

export const ONBOARDING_STEPS = 8;
