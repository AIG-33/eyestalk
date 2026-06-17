import { create } from 'zustand';
import { appStorage } from '@/lib/storage';

const STEALTH_KEY = 'eyestalk_stealth_mode';
const RADIUS_KEY = 'eyestalk_search_radius';
const THEME_KEY = 'eyestalk_theme';
const MARKER_SIZE_KEY = 'eyestalk_map_marker_size';

const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50] as const;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];
type ThemeMode = 'dark' | 'light';

const MARKER_SIZE_OPTIONS = ['small', 'medium', 'large'] as const;
type MarkerSize = (typeof MARKER_SIZE_OPTIONS)[number];

/** Logo-container diameter (dp) per marker-size preference. */
const MARKER_SIZE_DP: Record<MarkerSize, number> = {
  small: 34,
  medium: 44,
  large: 56,
};

const DEFAULT_RADIUS: RadiusKm = 5;
const DEFAULT_MARKER_SIZE: MarkerSize = 'medium';

interface UIState {
  stealthMode: boolean;
  toggleStealth: () => void;
  searchRadiusKm: RadiusKm;
  setSearchRadius: (km: RadiusKm) => void;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  mapMarkerSize: MarkerSize;
  setMapMarkerSize: (size: MarkerSize) => void;
  loadSettings: () => void;
}

export { RADIUS_OPTIONS, MARKER_SIZE_OPTIONS, MARKER_SIZE_DP };
export type { RadiusKm, ThemeMode, MarkerSize };

export const useUIStore = create<UIState>((set, get) => ({
  stealthMode: false,
  searchRadiusKm: DEFAULT_RADIUS,
  theme: 'dark',
  mapMarkerSize: DEFAULT_MARKER_SIZE,

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

  setMapMarkerSize: (size: MarkerSize) => {
    set({ mapMarkerSize: size });
    appStorage.set(MARKER_SIZE_KEY, size);
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
    appStorage.get(MARKER_SIZE_KEY).then((val) => {
      if (val && MARKER_SIZE_OPTIONS.includes(val as MarkerSize)) {
        set({ mapMarkerSize: val as MarkerSize });
      }
    });
  },
}));
