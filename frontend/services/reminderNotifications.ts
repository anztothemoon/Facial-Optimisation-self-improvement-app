import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STORAGE_KEY = 'reminder_notifications_scheduled_v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#38bdf8',
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/**
 * Schedules local reminders: daily calories, daily face workout, weekly photo.
 * Call when user signs in; idempotent (clears prior app-scheduled notifications first).
 */
export async function scheduleReminderNotifications(): Promise<void> {
  const ok = await requestReminderPermission();
  if (!ok) return;

  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const channelId = Platform.OS === 'android' ? 'reminders' : undefined;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Log your calories',
      body: 'Quick log in Tracker keeps your plan accurate.',
      ...(channelId ? { channelId } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Face workout',
      body: '10 minutes for posture, jaw, and neck — open Face & body workouts.',
      ...(channelId ? { channelId } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 30,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly progress photos',
      body: 'Upload face & body shots to track changes in Progress photos.',
      ...(channelId ? { channelId } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 10,
      minute: 0,
    },
  });

  await AsyncStorage.setItem(STORAGE_KEY, new Date().toISOString());
}

export async function cancelReminderNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(STORAGE_KEY);
}
