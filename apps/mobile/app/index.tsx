import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { appStorage } from '@/lib/storage';
import { useAuthStore } from '@/stores/auth.store';
import { LoadingScreen } from '@/components/ui/loading-screen';

const ONBOARDING_KEY = 'eyestalk_onboarding_seen';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    appStorage.get(ONBOARDING_KEY).then((val) => {
      setOnboardingSeen(val === 'true');
    });
  }, []);

  if (isLoading || onboardingSeen === null) return <LoadingScreen />;

  if (session) {
    return <Redirect href="/(app)/map" />;
  }

  if (!onboardingSeen) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
