import { create } from 'zustand';
import { appStorage } from '@/lib/storage';

const STEALTH_KEY = 'eyestalk_stealth_mode';

interface UIState {
  stealthMode: boolean;
  toggleStealth: () => void;
  loadStealth: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  stealthMode: false,
  toggleStealth: () => {
    const next = !get().stealthMode;
    set({ stealthMode: next });
    appStorage.set(STEALTH_KEY, next ? 'true' : 'false');
  },
  loadStealth: () => {
    appStorage.get(STEALTH_KEY).then((val) => {
      if (val === 'true') set({ stealthMode: true });
    });
  },
}));
