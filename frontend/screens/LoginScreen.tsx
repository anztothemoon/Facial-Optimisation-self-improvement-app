import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { PrimaryButton, ScreenShell, SurfaceCard } from '../components';
import { colors } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signInEmail, signInWithGoogleIdToken, signInWithApple, authError, clearError } =
    useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  const handledGoogleToken = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  useEffect(() => {
    // Google Sign-In temporarily disabled in setup-safe mode.
    handledGoogleToken.current = null;
  }, [signInWithGoogleIdToken]);

  const onEmailLogin = async () => {
    clearError();
    setBusy(true);
    const ok = await signInEmail(email, password);
    setBusy(false);
    if (!ok) {
      Alert.alert('Sign in failed', 'Please check your email and password.');
    }
  };

  const onApple = async () => {
    clearError();
    setBusy(true);
    const ok = await signInWithApple();
    setBusy(false);
    if (!ok) {
      Alert.alert('Apple sign-in failed', 'Please try email sign-in for now.');
    }
  };

  return (
    <ScreenShell
      title="Welcome back"
      subtitle="Sign in with email or a provider."
      showBack={false}
    >
      {authError ? <Text style={styles.error}>{authError}</Text> : null}

      <SurfaceCard title="Email">
        <TextInput
          style={styles.input}
          placeholder="you@email.com"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(t) => {
            clearError();
            setEmail(t);
          }}
        />
      </SurfaceCard>
      <SurfaceCard title="Password">
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={(t) => {
            clearError();
            setPassword(t);
          }}
        />
      </SurfaceCard>

      <PrimaryButton
        label="Sign in"
        loading={busy}
        onPress={onEmailLogin}
        disabled={!email.trim() || !password}
      />

      <Text style={styles.divider}>or</Text>

      <PrimaryButton
        label="Continue with Google (setup pending)"
        variant="ghost"
        onPress={() => {}}
        disabled
      />

      {appleAvailable ? (
        <View style={styles.appleWrap}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={14}
            style={styles.appleBtn}
            onPress={onApple}
          />
        </View>
      ) : null}

      <Pressable
        onPress={() => navigation.navigate('Register')}
        style={styles.linkWrap}
      >
        <Text style={styles.link}>Create an account</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.text,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
    fontSize: 14,
  },
  divider: {
    textAlign: 'center',
    color: colors.textMuted,
    marginVertical: 16,
    fontSize: 14,
  },
  appleWrap: { marginTop: 12, width: '100%' },
  appleBtn: { width: '100%', height: 48 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: colors.accent, fontSize: 16, fontWeight: '600' },
});
