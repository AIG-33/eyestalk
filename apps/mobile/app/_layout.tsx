import React, { useCallback, useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthListener } from '@/hooks/use-auth';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useMatchListener } from '@/hooks/use-match-listener';
import { useMatchStore } from '@/stores/match.store';
import { useUIStore } from '@/stores/ui.store';
import { MatchNotification } from '@/components/ui/match-notification';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import '@/i18n';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 2,
    },
  },
});

function GlobalListeners({ children }: { children: React.ReactNode }) {
  useAuthListener();
  usePushNotifications();
  useMatchListener();
  const loadStealth = useUIStore((s) => s.loadStealth);
  const stealthMode = useUIStore((s) => s.stealthMode);

  React.useEffect(() => { loadStealth(); }, []);

  return (
    <>
      {children}
      {stealthMode && (
        <View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}
    </>
  );
}

function MatchToast() {
  const match = useMatchStore((s) => s.pending);
  const dismiss = useMatchStore((s) => s.dismiss);

  if (!match) return null;

  return (
    <MatchNotification
      matchedNickname={match.matchedNickname}
      chatId={match.chatId}
      onDismiss={dismiss}
    />
  );
}

let fontMap: Record<string, any> | null = null;
try {
  fontMap = {
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  };
} catch {
  fontMap = null;
}

function useOptionalFonts() {
  const [ready, setReady] = useState(!fontMap);

  useEffect(() => {
    if (!fontMap) return;
    import('expo-font')
      .then(({ loadAsync }) => loadAsync(fontMap!))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  return ready;
}

export default function RootLayout() {
  const fontsReady = useOptionalFonts();

  const onLayoutRootView = useCallback(async () => {
    if (fontsReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <GlobalListeners>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
            <MatchToast />
          </GlobalListeners>
        </ErrorBoundary>
      </QueryClientProvider>
    </View>
  );
}
