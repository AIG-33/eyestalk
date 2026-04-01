import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { registerForPushNotifications, addNotificationResponseListener } from '@/lib/push-notifications';

export function usePushNotifications() {
  const session = useAuthStore((s) => s.session);
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!session) return;

    registerForPushNotifications(session.user.id);

    listenerRef.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'chat' && data?.chatId) {
        router.push(`/(app)/chat/${data.chatId}` as any);
      } else if (data?.type === 'venue' && data?.venueId) {
        router.push(`/(app)/venue/${data.venueId}` as any);
      }
    });

    return () => {
      listenerRef.current?.remove();
    };
  }, [session]);
}
