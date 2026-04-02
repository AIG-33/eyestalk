import { create } from 'zustand';
import { appStorage } from '@/lib/storage';

const STEALTH_KEY = 'eyestalk_stealth_mode';
const RADIUS_KEY = 'eyestalk_search_radius';
const THEME_KEY = 'eyestalk_theme';

const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50] as const;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];
type ThemeMode = 'dark' | 'light';

const DEFAULT_RADIUS: RadiusKm = 5;

interface UIState {
  stealthMode: boolean;
  toggleStealth: () => void;
  searchRadiusKm: RadiusKm;
  setSearchRadius: (km: RadiusKm) => void;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  loadSettings: () => void;
}

export { RADIUS_OPTIONS };
export type { RadiusKm, ThemeMode };

export const useUIStore = create<UIState>((set, get) => ({
  stealthMode: false,
  searchRadiusKm: DEFAULT_RADIUS,
  theme: 'dark',

  toggleStealth: () => {
    const next = !get().stealthMode;
    set({ stealthMode: next });
    appStorage.set(STEALTH_KEY, next ? 'true' : 'false');
  },

  setSearchRadius: (km: RadiusKm) => {
    set({ searchRadiusKm: km });
    appStorage.set(RADIUS_KEY, String(km));
  },

  setTheme: (mode: ThemeMode) => {
    set({ theme: mode });
    appStorage.set(THEME_KEY, mode);
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    appStorage.set(THEME_KEY, next);
  },

  loadSettings: () => {
    appStorage.get(STEALTH_KEY).then((val) => {
      if (val === 'true') set({ stealthMode: true });
    });
    appStorage.get(RADIUS_KEY).then((val) => {
      if (val) {
        const num = Number(val);
        if (RADIUS_OPTIONS.includes(num as RadiusKm)) {
          set({ searchRadiusKm: num as RadiusKm });
        }
      }
    });
    appStorage.get(THEME_KEY).then((val) => {
      if (val === 'light' || val === 'dark') {
        set({ theme: val });
      }
    });
  },
}));
