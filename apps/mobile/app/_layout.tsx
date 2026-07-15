import React, { useCallback, useEffect, useState } from 'react';
import { View, Platform, Text as RNText, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthListener } from '@/hooks/use-auth';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useMatchListener } from '@/hooks/use-match-listener';
import { useGeofenceAutoCheckout } from '@/hooks/use-geofence-auto-checkout';
import { useAutoCheckoutNotice } from '@/hooks/use-auto-checkout-notice';
import { useMatchStore } from '@/stores/match.store';
import { useUIStore } from '@/stores/ui.store';
import { MatchNotification } from '@/components/ui/match-notification';
import { PostCheckinSheet } from '@/components/venue/post-checkin-sheet';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ThemeProvider, useTheme } from '@/theme';
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
  useGeofenceAutoCheckout();
  useAutoCheckoutNotice();
  const loadSettings = useUIStore((s) => s.loadSettings);
  const stealthMode = useUIStore((s) => s.stealthMode);

  React.useEffect(() => { loadSettings(); }, []);

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

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
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
    'ClashDisplay-Medium': require('../assets/fonts/ClashDisplay-Medium.otf'),
    'ClashDisplay-Semibold': require('../assets/fonts/ClashDisplay-Semibold.otf'),
    'ClashDisplay-Bold': require('../assets/fonts/ClashDisplay-Bold.otf'),
    'SpaceGrotesk-Medium': require('../assets/fonts/SpaceGrotesk-500.ttf'),
    'SpaceGrotesk-SemiBold': require('../assets/fonts/SpaceGrotesk-600.ttf'),
    'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-700.ttf'),
  };
} catch {
  fontMap = null;
}

// Make Inter the default body font everywhere (weight-aware), without touching
// every StyleSheet. Components that set an explicit fontFamily (Clash Display
// wordmark / Space Grotesk numerics) keep theirs.
const INTER_BY_WEIGHT: Record<string, string> = {
  '100': 'Inter-Regular', '200': 'Inter-Regular', '300': 'Inter-Regular',
  '400': 'Inter-Regular', normal: 'Inter-Regular',
  '500': 'Inter-Medium',
  '600': 'Inter-SemiBold',
  '700': 'Inter-Bold', '800': 'Inter-Bold', '900': 'Inter-Bold', bold: 'Inter-Bold',
};

(function patchDefaultFont() {
  const anyText = RNText as any;
  if (anyText.__eyestalkFontPatched) return;
  const orig = anyText.render;
  if (typeof orig !== 'function') return;
  anyText.render = function patchedRender(...args: any[]) {
    const el = orig.apply(this, args);
    try {
      const flat = StyleSheet.flatten(el.props.style) || {};
      if (flat.fontFamily) return el;
      const w = String(flat.fontWeight ?? '400');
      const fam = INTER_BY_WEIGHT[w] ?? 'Inter-Regular';
      return React.cloneElement(el, {
        style: [el.props.style, { fontFamily: fam }],
      });
    } catch {
      return el;
    }
  };
  anyText.__eyestalkFontPatched = true;
})();

// If fonts don't finish loading quickly, launch with system fonts instead of
// sitting behind the native splash forever (a stuck splash reads as a dead
// app to App Review's automated launch test).
const FONT_LOAD_TIMEOUT_MS = 5000;

function useOptionalFonts() {
  const [ready, setReady] = useState(!fontMap);

  useEffect(() => {
    if (!fontMap) return;
    const timeout = setTimeout(() => setReady(true), FONT_LOAD_TIMEOUT_MS);
    import('expo-font')
      .then(({ loadAsync }) => loadAsync(fontMap!))
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        setReady(true);
      });
    return () => clearTimeout(timeout);
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
          <ThemeProvider>
            <GlobalListeners>
              <ThemedStatusBar />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
              </Stack>
              <MatchToast />
              <PostCheckinSheet />
            </GlobalListeners>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </View>
  );
}
