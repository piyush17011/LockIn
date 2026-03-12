// services/waterNotifications.js
// Water reminder settings — NO expo-notifications (removed from Expo Go SDK 53 Android)
// Reminders are shown as in-app alerts via a JS interval in CaloriesScreen
// In a production/dev build, swap the stubs below for real expo-notifications calls

import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_SETTINGS_KEY = 'lockin_water_reminder_settings';

export const DEFAULT_REMINDER_SETTINGS = {
  enabled: false,
  intervalMinutes: 60,
  startHour: 8,
  endHour: 22,
};

export const INTERVAL_OPTIONS = [
  { minutes: 30,  label: 'Every 30 min' },
  { minutes: 45,  label: 'Every 45 min' },
  { minutes: 60,  label: 'Every hour'   },
  { minutes: 90,  label: 'Every 90 min' },
  { minutes: 120, label: 'Every 2 hrs'  },
];

export const intervalLabel = (minutes) =>
  INTERVAL_OPTIONS.find(o => o.minutes === minutes)?.label || `Every ${minutes}m`;

export async function saveReminderSettings(settings) {
  await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadReminderSettings() {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(raw) };
  } catch (_) {}
  return { ...DEFAULT_REMINDER_SETTINGS };
}

// Stubs — no-ops in Expo Go, swap for real impl in dev/prod build
export async function requestNotificationPermission() { return false; }
export async function scheduleWaterReminders()        { return 0;     }
export async function cancelWaterReminders()          {}
export async function setupNotificationCategories()   {}
