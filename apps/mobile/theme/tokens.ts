/**
 * EyesTalk Design Tokens
 * Based on Design Specification v1.0
 * Optimized for dark environments (clubs, bars, karaoke, lounges)
 */

// ─── Colors ──────────────────────────────────────────────
export const colors = {
  bg: {
    primary: '#0D0D1A',
    secondary: '#161630',
    tertiary: '#1E1E3F',
    surface: '#2A2A5A',
  },

  text: {
    primary: '#E8E8F0',
    secondary: '#A0A0B8',
    tertiary: '#5A5A78',
  },

  accent: {
    primary: '#7C6FF7',
    primaryLight: '#A29BFE',
    success: '#00E5A0',
    pink: '#FF6B9D',
    warning: '#FFD93D',
    error: '#FF4757',
    info: '#00D4FF',
  },

  glow: {
    primary: 'rgba(124,111,247,0.4)',
    primarySubtle: 'rgba(124,111,247,0.15)',
    success: 'rgba(0,229,160,0.4)',
    pink: 'rgba(255,107,157,0.4)',
    warning: 'rgba(255,217,61,0.3)',
    error: 'rgba(255,71,87,0.4)',
    info: 'rgba(0,212,255,0.3)',
  },

  gradient: {
    primary: ['#7C6FF7', '#A29BFE'] as const,
    match: ['#FF6B9D', '#7C6FF7'] as const,
    premium: ['#FFD93D', '#FF6B9D'] as const,
    surface: ['#161630', '#0D0D1A'] as const,
  },

  glass: {
    bg: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.12)',
  },

  tag: {
    intention: { bg: 'rgba(124,111,247,0.15)', text: '#A29BFE' },
    venue: { bg: 'rgba(0,229,160,0.15)', text: '#00E5A0' },
    filter: { bg: 'rgba(13,13,26,0.75)', text: '#A0A0B8', border: 'rgba(255,255,255,0.12)' },
    filterActive: { bg: '#7C6FF7', text: '#FFFFFF' },
  },

  status: {
    online: '#00E5A0',
    inVenue: '#7C6FF7',
    away: '#5A5A78',
  },
} as const;

export const lightColors = {
  bg: {
    primary: '#F5F5FA',
    secondary: '#FFFFFF',
    tertiary: '#EEEEF5',
    surface: '#DDDDE8',
  },

  text: {
    primary: '#1A1A2E',
    secondary: '#555570',
    tertiary: '#8888A0',
  },

  accent: {
    primary: '#6C5CE7',
    primaryLight: '#7C6FF7',
    success: '#00C98D',
    pink: '#FF6B9D',
    warning: '#E6B800',
    error: '#E63946',
    info: '#00B4D8',
  },

  glow: {
    primary: 'rgba(108,92,231,0.2)',
    primarySubtle: 'rgba(108,92,231,0.08)',
    success: 'rgba(0,201,141,0.2)',
    pink: 'rgba(255,107,157,0.2)',
    warning: 'rgba(230,184,0,0.15)',
    error: 'rgba(230,57,70,0.2)',
    info: 'rgba(0,180,216,0.15)',
  },

  gradient: {
    primary: ['#6C5CE7', '#A29BFE'] as const,
    match: ['#FF6B9D', '#6C5CE7'] as const,
    premium: ['#E6B800', '#FF6B9D'] as const,
    surface: ['#FFFFFF', '#F5F5FA'] as const,
  },

  glass: {
    bg: 'rgba(0,0,0,0.03)',
    border: 'rgba(0,0,0,0.08)',
    borderHover: 'rgba(0,0,0,0.12)',
  },

  tag: {
    intention: { bg: 'rgba(108,92,231,0.1)', text: '#6C5CE7' },
    venue: { bg: 'rgba(0,201,141,0.1)', text: '#00C98D' },
    filter: { bg: 'rgba(255,255,255,0.85)', text: '#555570', border: 'rgba(0,0,0,0.1)' },
    filterActive: { bg: '#6C5CE7', text: '#FFFFFF' },
  },

  status: {
    online: '#00C98D',
    inVenue: '#6C5CE7',
    away: '#8888A0',
  },
} as const;

export type ThemeColors = typeof colors;

// ─── Venue Ambient Palettes ──────────────────────────────
export const venueAmbient: Record<string, readonly [string, string]> = {
  nightclub: ['#7C6FF7', '#FF6B9D'],
  karaoke: ['#FF6B9D', '#FFD93D'],
  sports_bar: ['#00E5A0', '#00D4FF'],
  bowling: ['#00D4FF', '#7C6FF7'],
  hookah: ['#1E1E3F', '#2A2A5A'],
  billiards: ['#00E5A0', '#7C6FF7'],
  board_games: ['#FFD93D', '#7C6FF7'],
  arcade: ['#FF6B9D', '#00D4FF'],
  standup: ['#FFD93D', '#FF6B9D'],
  live_music: ['#7C6FF7', '#FF6B9D'],
  other: ['#2A2A5A', '#161630'],
};

// ─── Typography ──────────────────────────────────────────
export const typography = {
  family: {
    display: 'ClashDisplay',
    body: 'Inter',
    accent: 'SpaceGrotesk',
    mono: 'JetBrainsMono',
    displayFallback: 'System',
    bodyFallback: 'System',
  },

  size: {
    displayXl: 36,
    displayLg: 28,
    displayMd: 24,
    headingLg: 22,
    headingMd: 18,
    headingSm: 16,
    bodyLg: 16,
    bodyMd: 14,
    bodySm: 12,
    label: 12,
    micro: 10,
  },

  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  lineHeight: {
    displayXl: 1.1,
    displayLg: 1.15,
    displayMd: 1.2,
    headingLg: 1.2,
    headingMd: 1.25,
    headingSm: 1.3,
    bodyLg: 1.5,
    bodyMd: 1.45,
    bodySm: 1.4,
    label: 1.2,
    micro: 1.2,
  },

  letterSpacing: {
    display: -0.5,
    heading: -0.2,
    body: 0,
    small: 0.3,
    caps: 1.5,
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────
export const spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

// ─── Border Radius ───────────────────────────────────────
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Shadows (React Native compatible) ───────────────────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  glowPrimary: {
    shadowColor: '#7C6FF7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  glowSuccess: {
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  glowPink: {
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  glowError: {
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ─── Touch Targets ───────────────────────────────────────
export const touch = {
  minPrimary: 56,
  minSecondary: 48,
  minCompact: 44,
  listItemHeight: 64,
  tabBarItem: 56,
  spacingBetweenTargets: 12,
} as const;

// ─── Component Sizes ─────────────────────────────────────
export const component = {
  button: {
    primaryHeight: 56,
    secondaryHeight: 48,
    ghostHeight: 44,
    fabSize: 64,
    iconButtonSize: 48,
    radius: radius.lg,
  },
  input: {
    height: 52,
    radius: 14,
    bgColor: '#1E1E3F',
    borderDefault: '#2A2A5A',
    borderFocus: '#7C6FF7',
    borderError: '#FF4757',
    placeholderColor: '#5A5A78',
  },
  card: {
    userBg: '#161630',
    userBorder: 'rgba(255,255,255,0.06)',
    userRadius: radius.xl,
    venueBorder: 'rgba(255,255,255,0.08)',
    venueRadius: radius['2xl'],
    activityBg: '#1E1E3F',
    activityRadius: radius.lg,
  },
  avatar: {
    xs: 28,
    sm: 36,
    md: 48,
    lg: 72,
    xl: 120,
    statusRingWidth: { md: 2, lg: 3, xl: 3 },
  },
  tabBar: {
    height: 84,
    iconSize: 24,
    activeIconSize: 28,
    dotSize: 4,
  },
  topBar: {
    height: 56,
  },
  bottomSheet: {
    handleWidth: 40,
    handleHeight: 4,
    handleColor: '#2A2A5A',
    radius: radius['2xl'],
    backdrop: 'rgba(0,0,0,0.6)',
  },
  chatBubble: {
    ownRadius: { topLeft: 20, topRight: 20, bottomLeft: 20, bottomRight: 4 },
    otherRadius: { topLeft: 20, topRight: 20, bottomLeft: 4, bottomRight: 20 },
    ownBg: '#7C6FF7',
    otherBg: '#1E1E3F',
    paddingH: 16,
    paddingV: 12,
  },
  notification: {
    toastHeight: 64,
    badgeSize: 8,
    bannerHeight: 56,
  },
} as const;

// ─── Z-Index ─────────────────────────────────────────────
export const zIndex = {
  base: 0,
  card: 10,
  sticky: 100,
  dropdown: 200,
  modal: 300,
  toast: 400,
  overlay: 500,
} as const;

// ─── Opacity ─────────────────────────────────────────────
export const opacity = {
  disabled: 0.4,
  hint: 0.6,
  overlay: 0.7,
  glass: 0.1,
  pressed: 0.8,
} as const;

// ─── Animation Timing ────────────────────────────────────
export const timing = {
  quickFeedback: 150,
  standard: 250,
  emphasis: 400,
  dramatic: 600,
  ambientLoop: 5000,
} as const;
