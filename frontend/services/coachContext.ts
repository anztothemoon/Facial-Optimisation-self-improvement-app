/**
 * Same coaching context shape as backend chatRoutes — used for BYOK (device-side OpenAI).
 */
export type CoachContext = {
  goals: string[];
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyType: string | null;
  fitnessLevel: string | null;
  faceStructure: string | null;
  latestNutrition: {
    calories: number;
    proteinG: number;
    goal: number;
  } | null;
};

export function defaultCoachContext(): CoachContext {
  return {
    goals: [],
    age: null,
    heightCm: null,
    weightKg: null,
    bodyType: null,
    fitnessLevel: null,
    faceStructure: null,
    latestNutrition: null,
  };
}

export function buildCoachSystemPrompt(context: CoachContext): string {
  const lines = [
    'You are a supportive fitness, grooming, and wellness coach for a mobile app user.',
    'Give concise, actionable advice (short paragraphs or bullets). No medical diagnosis.',
    'Personalize using the user profile below. If asked about jawline, posture, skin, workouts, haircuts, or style, tailor to their goals and body/face data.',
    '',
    'User profile:',
    `- Goals: ${context.goals.length ? context.goals.join(', ') : 'not set'}`,
    `- Age: ${context.age ?? 'unknown'}`,
    `- Height (cm): ${context.heightCm ?? 'unknown'}`,
    `- Weight (kg): ${context.weightKg ?? 'unknown'}`,
    `- Body type: ${context.bodyType ?? 'unknown'}`,
    `- Fitness level: ${context.fitnessLevel ?? 'unknown'}`,
    `- Face structure (self-reported): ${context.faceStructure ?? 'unknown'}`,
  ];
  if (context.latestNutrition) {
    lines.push(
      `- Latest logged day: ~${context.latestNutrition.calories} kcal (goal ${context.latestNutrition.goal}), protein ~${context.latestNutrition.proteinG}g`
    );
  } else {
    lines.push('- Nutrition logs: none yet — encourage logging.');
  }
  return lines.join('\n');
}
