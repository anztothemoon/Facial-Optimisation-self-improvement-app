/** Login & register only */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** Onboarding wizard only — no access to main app */
export type OnboardingStackParamList = {
  Onboarding: undefined;
};

/** Paywall only — subscription required before main app */
export type PaywallStackParamList = {
  Paywall: undefined;
};

/** Face reveal preview then paywall — after onboarding, before main app */
export type RevealStackParamList = {
  FaceReveal: undefined;
  Paywall: undefined;
};

/** Full app after active subscription */
export type MainStackParamList = {
  Dashboard: undefined;
  LooksmaxProtocol: undefined;
  FaceAnalysis: undefined;
  Recommendations: undefined;
  FaceBodyWorkouts: undefined;
  /** Steps + motion sensors (Expo Go). Apple Watch = native build later. */
  MotionFitness: undefined;
  ProgressPhotos: undefined;
  Tracker: undefined;
  Profile: undefined;
  AICoachChat: undefined;
  /** Privacy, terms, acquisition handoff */
  Legal: undefined;
};
