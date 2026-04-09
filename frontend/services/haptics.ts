import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

function canUseHaptics() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function hapticTap() {
  if (!canUseHaptics()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // no-op on unsupported devices
  }
}

export async function hapticTapStrong() {
  if (!canUseHaptics()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // no-op on unsupported devices
  }
}

export async function hapticSuccess() {
  if (!canUseHaptics()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // no-op on unsupported devices
  }
}

export async function hapticError() {
  if (!canUseHaptics()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // no-op on unsupported devices
  }
}
