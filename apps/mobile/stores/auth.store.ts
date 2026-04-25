import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  /**
   * True while the user is in a Supabase PASSWORD_RECOVERY session.
   * The session is real (Supabase signed in to perform updateUser),
   * but we must route the user to /update-password instead of the app
   * and prevent normal "signed in" navigation.
   */
  isRecovering: boolean;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  setRecovering: (recovering: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  isRecovering: false,
  setSession: (session) => set({ session, isLoading: false }),
  clearSession: () => set({ session: null, isLoading: false, isRecovering: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setRecovering: (isRecovering) => set({ isRecovering }),
}));
