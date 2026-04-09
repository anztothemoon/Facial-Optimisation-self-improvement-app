import type { Persistence } from 'firebase/auth';

/** RN bundle exports this; web typings omit it. */
declare module '@firebase/auth' {
  export function getReactNativePersistence(
    storage: import('@react-native-async-storage/async-storage').default
  ): Persistence;
}
