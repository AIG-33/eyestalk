import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { registerForPushNotifications, addNotificationResponseListener } from '@/lib/push-notifications';

function routeFromNotificationData(data: Record<string, unknown> | null | undefined) {
  if (!data) return;
  if (data.type === 'chat' && data.chatId) {
    router.push(`/(app)/chat/${data.chatId}` as any);
  } else if (data.type === 'venue' && data.venueId) {
    router.push(`/(app)/venue/${data.venueId}` as any);
  } else if (data.type === 'service_update' && data.venueId) {
    router.push(`/(app)/venue/${data.venueId}/services` as any);
  } else if (data.type === 'announcement') {
    router.push('/(app)/announcements' as any);
  }
}

export function usePushNotifications() {
  const session = useAuthStore((s) => s.session);
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!session) return;

    void registerForPushNotifications(session.user.id);

    listenerRef.current = addNotificationResponseListener((response) => {
      routeFromNotificationData(
        response.notification.request.content.data as Record<string, unknown>,
      );
    });

    return () => {
      listenerRef.current?.remove();
    };
  }, [session]);
}
