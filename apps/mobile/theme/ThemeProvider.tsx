import React, { createContext, useContext, useMemo } from 'react';
import { colors as darkColors, lightColors, type ThemeColors } from './tokens';
import { useUIStore } from '@/stores/ui.store';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  c: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  c: darkColors,
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useUIStore((s) => s.theme);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    c: mode === 'light' ? (lightColors as ThemeColors) : darkColors,
    isDark: mode === 'dark',
  }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
