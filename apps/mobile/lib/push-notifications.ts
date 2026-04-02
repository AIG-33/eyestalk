import { Platform } from 'react-native';

const IS_EXPO_GO = !!(typeof global !== 'undefined' && (global as any).expo);

export async function setupNotificationHandler() {
  // Push notifications are not supported in Expo Go SDK 53+
  // This will be enabled when using EAS development builds
}

export async function registerForPushNotifications(_userId: string): Promise<string | null> {
  if (Platform.OS === 'web' || IS_EXPO_GO) return null;
  return null;
}

export function addNotificationResponseListener(
  _callback: (response: any) => void,
) {
  return { remove: () => {} };
}
