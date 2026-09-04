// SonicStream Design System Tokens

export const Spacing = {
  none: 0,
  xs: 6,
  sm: 12,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
  xxxl: 96,
} as const;

export const Radii = {
  none: 0,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  full: 9999,
} as const;

export const FontSizes = {
  displayLarge: 57,
  displayMedium: 45,
  displaySmall: 36,
  headlineLarge: 32,
  headlineMedium: 28,
  headlineSmall: 24,
  titleLarge: 22,
  titleMedium: 16,
  titleSmall: 14,
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  labelLarge: 14,
  labelMedium: 12,
  labelSmall: 11,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const LineHeights = {
  displayLarge: 1.12,
  displayMedium: 1.16,
  displaySmall: 1.22,
  headlineLarge: 1.25,
  headlineMedium: 1.29,
  headlineSmall: 1.33,
  titleLarge: 1.27,
  titleMedium: 1.5,
  titleSmall: 1.43,
  bodyLarge: 1.5,
  bodyMedium: 1.43,
  bodySmall: 1.33,
  labelLarge: 1.43,
  labelMedium: 1.33,
  labelSmall: 1.45,
} as const;

export const Shadows = {
  none: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#8BB97A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const AnimationDurations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

export const ComponentDefaults = {
  button: {
    radius: 8,
    paddingH: 24,
    paddingV: 12,
    minHeight: 40,
  },
  card: {
    radius: 16,
    padding: 16,
  },
  textfield: {
    radius: 4,
    borderWidth: 1,
    paddingH: 12,
    paddingV: 16,
  },
  chip: {
    radius: 9999,
    paddingH: 16,
    paddingV: 8,
    minHeight: 34,
  },
  iconButton: {
    radius: 20,
    size: 40,
  },
  miniPlayer: {
    height: 68,
    paddingH: 16,
  },
  trackItem: {
    width: 150,
    imageSize: 150,
  },
  radioCard: {
    width: 180,
    height: 110,
  },
} as const;
