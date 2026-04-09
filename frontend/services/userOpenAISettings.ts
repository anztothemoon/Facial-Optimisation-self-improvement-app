import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SECURE_KEY = 'user_openai_api_key_v1';
const BYOK_FLAG = 'coach_byok_enabled_v1';

export async function getUserOpenAIKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECURE_KEY);
  } catch {
    return null;
  }
}

export async function setUserOpenAIKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) {
    await clearUserOpenAIKey();
    return;
  }
  await SecureStore.setItemAsync(SECURE_KEY, trimmed);
}

export async function clearUserOpenAIKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEY);
  } catch {
    /* no key */
  }
}

export async function getByokEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(BYOK_FLAG);
  return v === '1';
}

export async function setByokEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(BYOK_FLAG, on ? '1' : '0');
}

export function looksLikeOpenAIKey(key: string): boolean {
  return /^sk-[a-zA-Z0-9_-]{20,}$/.test(key.trim());
}
