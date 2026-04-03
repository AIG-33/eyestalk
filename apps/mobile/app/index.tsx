import { useEffect, useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { Redirect } from 'expo-router';
import { appStorage } from '@/lib/storage';
import { useAuthStore } from '@/stores/auth.store';
import { LoadingScreen } from '@/components/ui/loading-screen';

const ONBOARDING_KEY = 'eyestalk_onboarding_seen';
const MIN_SPLASH_MS = 3000;
const FADE_OUT_MS = 600;

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [navigateReady, setNavigateReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    appStorage.get(ONBOARDING_KEY).then((val) => {
      setOnboardingSeen(val === 'true');
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const dataReady = !isLoading && onboardingSeen !== null;

  const triggerFadeOut = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => setNavigateReady(true));
  }, [fadeAnim]);

  useEffect(() => {
    if (dataReady && minTimeElapsed && !navigateReady) {
      triggerFadeOut();
    }
  }, [dataReady, minTimeElapsed, navigateReady, triggerFadeOut]);

  if (!navigateReady) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <LoadingScreen />
      </Animated.View>
    );
  }

  if (session) {
    return <Redirect href="/(app)/map" />;
  }

  if (!onboardingSeen) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
