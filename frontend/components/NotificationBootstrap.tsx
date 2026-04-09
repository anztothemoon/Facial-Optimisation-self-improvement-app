import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  cancelReminderNotifications,
  scheduleReminderNotifications,
} from '../services/reminderNotifications';

/**
 * Registers local reminder notifications when signed in; clears on sign-out.
 */
export function NotificationBootstrap() {
  const { ready, user } = useAuth();

  useEffect(() => {
    if (!ready) return;
    async function run() {
      try {
        if (user) {
          await scheduleReminderNotifications();
        } else {
          await cancelReminderNotifications();
        }
      } catch {
        // no-op: reminders are best-effort and should not block app.
      }
    }
    void run();
  }, [ready, user?.uid]);

  return null;
}
