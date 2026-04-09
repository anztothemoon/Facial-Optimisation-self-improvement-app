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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUpEmail, signInWithGoogleIdToken, signInWithApple, authError, clearError } =
    useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
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

  const onRegister = async () => {
    clearError();
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords match.');
      return;
    }
    setBusy(true);
    const ok = await signUpEmail(email, password);
    setBusy(false);
    if (ok) {
      Alert.alert(
        'Account created',
        'Your sign-up was successful. You can now continue to onboarding.'
      );
    } else {
      Alert.alert(
        'Sign-up failed',
        'Could not create account. If this email exists, try Sign in instead.'
      );
    }
  };

  const onApple = async () => {
    clearError();
    setBusy(true);
    const ok = await signInWithApple();
    setBusy(false);
    if (!ok) {
      Alert.alert('Apple sign-up failed', 'Please use email sign-up for now.');
    }
  };

  const passwordMismatch = confirm.length > 0 && password !== confirm;
  const passwordWeak = password.length > 0 && password.length < 8;

  return (
    <ScreenShell title="Create account" subtitle="Sign up with email or a provider.">
      {authError ? <Text style={styles.error}>{authError}</Text> : null}
      {passwordWeak ? (
        <Text style={styles.hint}>Use at least 8 characters for your password.</Text>
      ) : null}
      {passwordMismatch ? (
        <Text style={styles.error}>Passwords do not match.</Text>
      ) : null}

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
          placeholder="At least 8 characters"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={(t) => {
            clearError();
            setPassword(t);
          }}
        />
      </SurfaceCard>
      <SurfaceCard title="Confirm password">
        <TextInput
          style={styles.input}
          placeholder="Repeat password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={confirm}
          onChangeText={(t) => {
            clearError();
            setConfirm(t);
          }}
        />
      </SurfaceCard>

      <PrimaryButton
        label="Create account"
        loading={busy}
        onPress={onRegister}
        disabled={
          !email.trim() || !password || passwordMismatch || passwordWeak
        }
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
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={14}
            style={styles.appleBtn}
            onPress={onApple}
          />
        </View>
      ) : null}

      <Pressable
        onPress={() => navigation.navigate('Login')}
        style={styles.linkWrap}
      >
        <Text style={styles.link}>Already have an account? Sign in</Text>
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
    marginBottom: 8,
    fontSize: 14,
  },
  hint: {
    color: colors.textMuted,
    marginBottom: 8,
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
