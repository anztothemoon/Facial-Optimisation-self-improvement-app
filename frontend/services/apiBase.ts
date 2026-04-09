import Constants from 'expo-constants';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveExpoHostApiUrl(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost ||
    null;

  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host) return null;
  return `http://${host}:3001`;
}

export function getApiBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL?.trim();
  const expoHostUrl = resolveExpoHostApiUrl();

  // If env points to localhost, prefer LAN host for physical devices.
  if (env && /localhost|127\.0\.0\.1/.test(env) && expoHostUrl) {
    return trimTrailingSlash(expoHostUrl);
  }

  if (env) return trimTrailingSlash(env);
  if (expoHostUrl) return trimTrailingSlash(expoHostUrl);
  return 'http://localhost:3001';
}

