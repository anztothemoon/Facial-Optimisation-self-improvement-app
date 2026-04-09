import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { PrimaryButton, ScreenShell } from '../components';
import { hasLegalUrls, productConfig } from '../config/product';
import { colors } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Legal'>;

export function LegalScreen({ navigation }: Props) {
  const open = async (url: string) => {
    if (!url) return;
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <ScreenShell
      title="Legal & data"
      subtitle={`${productConfig.appDisplayName} · ${productConfig.companyLegalName}`}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.p}>
          Use this screen to host links required for App Store / Play review and
          acquisitions: privacy policy, terms, and optional data-processing addendum.
        </Text>

        {productConfig.supportEmail ? (
          <Text style={styles.p}>
            Support:{' '}
            <Text
              style={styles.link}
              onPress={() =>
                void Linking.openURL(`mailto:${productConfig.supportEmail}`)
              }
            >
              {productConfig.supportEmail}
            </Text>
          </Text>
        ) : (
          <Text style={styles.warn}>
            Set EXPO_PUBLIC_SUPPORT_EMAIL in .env for a visible support address.
          </Text>
        )}

        {!hasLegalUrls() && (
          <Text style={styles.warn}>
            Set EXPO_PUBLIC_PRIVACY_URL and EXPO_PUBLIC_TERMS_URL in .env for
            external policy links.
          </Text>
        )}

        <View style={styles.block}>
          <Text style={styles.h}>Privacy</Text>
          <PrimaryButton
            label={
              productConfig.privacyPolicyUrl
                ? 'Open privacy policy'
                : 'Privacy URL not configured'
            }
            onPress={() => open(productConfig.privacyPolicyUrl)}
            disabled={!productConfig.privacyPolicyUrl}
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.h}>Terms of service</Text>
          <PrimaryButton
            label={
              productConfig.termsOfServiceUrl
                ? 'Open terms of service'
                : 'Terms URL not configured'
            }
            onPress={() => open(productConfig.termsOfServiceUrl)}
            disabled={!productConfig.termsOfServiceUrl}
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.h}>Data processing (optional)</Text>
          <PrimaryButton
            label={
              productConfig.dataProcessingUrl
                ? 'Open data processing notice'
                : 'Not configured'
            }
            variant="ghost"
            onPress={() => open(productConfig.dataProcessingUrl)}
            disabled={!productConfig.dataProcessingUrl}
          />
        </View>

        <Text style={styles.h}>Third-party services</Text>
        <Text style={styles.p}>
          The app may use Firebase (Google), Stripe, OpenAI (when AI features are
          enabled), and Sentry for crash reporting. Each provider has its own
          terms — disclose them in your privacy policy.
        </Text>

        <Text style={styles.h}>Face photos & analysis</Text>
        <Text style={styles.p}>
          Face images and scores are for user-facing wellness and grooming
          guidance only. They are not biometric identifiers for identity
          verification and must not be used as a medical device.
        </Text>

        <Text style={styles.h}>Health, nutrition & weight</Text>
        <Text style={styles.p}>
          Anything related to calories, weight, workouts, or AI coaching in this app
          is general wellness information — not a medical diagnosis, prescription, or
          individualized treatment plan. Do not use the app as your only source of
          care for eating disorders, chronic conditions, or acute symptoms.
        </Text>
        <Text style={styles.p}>
          For retention and product improvement we may analyze usage patterns in
          aggregate. Do not enter highly sensitive health information you would not
          want processed by our infrastructure providers (see your privacy policy).
        </Text>

        <Text style={styles.h}>Data retention (summary)</Text>
        {productConfig.dataRetentionSummary.map((line) => (
          <Text key={line} style={styles.bulletItem}>
            • {line}
          </Text>
        ))}
        <Text style={styles.p}>
          Replace this summary with your lawyer-reviewed privacy policy — the bullets
          above are placeholders only.
        </Text>

        <PrimaryButton
          label="Back"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  p: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  h: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  link: { color: colors.accent, fontWeight: '700' },
  warn: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  block: { marginBottom: 8 },
  bulletItem: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 4,
  },
});
