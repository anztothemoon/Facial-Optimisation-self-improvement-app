import * as Sentry from '@sentry/react-native';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 0 : 0.15,
  });
}
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary, NotificationBootstrap } from './components';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const publishableKey =
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

  if (__DEV__ && publishableKey.includes('placeholder')) {
    console.warn(
      '[App] Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env for real payments.'
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <StripeProvider
          publishableKey={publishableKey}
          merchantIdentifier="merchant.com.looksmaxxing.pro"
          urlScheme="frontend"
        >
          <AuthProvider>
            <NotificationBootstrap />
            <RootNavigator />
          </AuthProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
