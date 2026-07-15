import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { storageAdapter } from './storage';
import type { Database } from '@eyestalk/shared/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// React Native has no browser visibility events, so Supabase can't run its
// token auto-refresh timer on its own. Drive it from AppState: refresh while the
// app is foregrounded and pause when backgrounded. Without this, the access
// token silently goes stale and bearer-authenticated API calls (waves, starting
// a chat) start failing with "Unauthorized".
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

if (AppState.currentState === 'active') {
  supabase.auth.startAutoRefresh();
}
