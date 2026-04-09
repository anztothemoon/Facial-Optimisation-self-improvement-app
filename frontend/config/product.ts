/**
 * White-label / acquisition settings — override via EXPO_PUBLIC_* in .env or change defaults before shipping.
 * This file is the single source for display names and legal URLs shown in the app.
 */

export const productConfig = {
  /** Shown in UI copy, About, paywall */
  appDisplayName:
    process.env.EXPO_PUBLIC_APP_DISPLAY_NAME?.trim() || 'Looksmax Pro',

  /** Legal entity name for disclaimers (e.g. App Store seller) */
  companyLegalName:
    process.env.EXPO_PUBLIC_COMPANY_NAME?.trim() || 'Your Company LLC',

  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || '',

  /** If set, Legal screen shows “Open” buttons */
  privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || '',
  termsOfServiceUrl: process.env.EXPO_PUBLIC_TERMS_URL?.trim() || '',
  /** Optional separate data processing / DPA page */
  dataProcessingUrl: process.env.EXPO_PUBLIC_DATA_PROCESSING_URL?.trim() || '',

  /** Apple Pay / merchant display strings */
  paywallMerchantDisplayName:
    process.env.EXPO_PUBLIC_PAYWALL_MERCHANT_NAME?.trim() || 'Looksmax Pro',

  /** Shown on dashboard / profile trust strips */
  trustTagline:
    'Wellness & grooming focus — not medical advice. Your data is used to personalize the app experience.',

  /** Nutrition / weight — avoid presenting as clinical care */
  healthDataNotice:
    'Calorie targets and logs are estimates for general fitness goals. They are not a prescription or treatment plan. Consult a registered dietitian or physician for medical nutrition therapy.',

  /** AI coach — credibility + safety */
  coach: {
    welcomeHint:
      'I give general wellness and style guidance — not diagnosis. For emergencies or medical concerns, contact a professional or local emergency services.',
  },

  /**
   * If true, users with Stripe status `past_due` (failed payment retry window) still see Premium.
   * Set EXPO_PUBLIC_SUBSCRIPTION_INCLUDE_PAST_DUE=1 to reduce churn while Stripe retries charges.
   */
  subscriptionIncludePastDue:
    process.env.EXPO_PUBLIC_SUBSCRIPTION_INCLUDE_PAST_DUE === '1',

  /** Short bullets for Legal & data — customize before launch; not a substitute for lawyer-reviewed policy */
  dataRetentionSummary: [
    'Account and profile data are kept while your account is active.',
    'You can request account deletion via support; deletion timelines depend on backups and legal holds.',
    'Photos and logs may be removed on account deletion — confirm exact behavior in your hosted privacy policy.',
  ] as const,

  faceAnalysis: {
    /** Screen title area — avoid “medical diagnosis” claims */
    subtitle:
      'Structure-style scoring for wellness and grooming goals — not a medical device.',

    longDisclaimer:
      'This feature provides educational wellness and appearance-style insights only. It is not a medical device, diagnostic tool, or substitute for professional medical, dental, or dermatological advice. Results are influenced by camera angle, lighting, and image quality. Do not use scores to diagnose or treat any condition.',

    photoTips: [
      'Use eye-level camera height and neutral head position.',
      'Even, front lighting — avoid harsh overhead shadows.',
      'Keep the same distance each week for comparable trends.',
    ],
  },
} as const;

export function hasLegalUrls(): boolean {
  return Boolean(
    productConfig.privacyPolicyUrl ||
      productConfig.termsOfServiceUrl ||
      productConfig.dataProcessingUrl
  );
}
