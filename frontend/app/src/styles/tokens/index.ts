export const COLORS = {
  // Phase 5 Stitch Palette
  surface: '#F7F9FF',
  surfaceDim: '#D1DBE9',
  surfaceBright: '#F7F9FF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#EDF4FF',
  surfaceContainer: '#E4EFFD',
  surfaceContainerHigh: '#DFE9F7',
  surfaceContainerHighest: '#D9E3F1',
  surfaceVariant: '#D9E3F1',
  onSurface: '#121C26',
  onSurfaceVariant: '#43474D',
  inverseSurface: '#27313C',
  inverseOnSurface: '#E8F2FF',
  outline: '#74777E',
  outlineVariant: '#C3C6CE',
  surfaceTint: '#47607E',

  // Deep Indigo (Structural)
  primary: '#001D36',
  onPrimary: '#FFFFFF',
  primaryContainer: '#17324D',
  onPrimaryContainer: '#819ABA',
  primaryFixed: '#D1E4FF',
  primaryFixedDim: '#AFC9EA',
  onPrimaryFixed: '#001D36',
  onPrimaryFixedVariant: '#2F4865',
  inversePrimary: '#AFC9EA',

  // Terracotta (Primary Action)
  secondary: '#A13F1C',
  secondaryHover: '#812805',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FD835B',
  onSecondaryContainer: '#701F00',
  secondaryFixed: '#FFDBD0',
  secondaryFixedDim: '#FFB59D',
  onSecondaryFixed: '#390B00',
  onSecondaryFixedVariant: '#812805',
  terracotta: '#C65A35',
  terracottaHover: '#A64A2B',

  // Marigold (Focus & Accent)
  tertiary: '#2A1800',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#462B00',
  onTertiaryContainer: '#CC8C28',
  tertiaryFixed: '#FFDDB5',
  tertiaryFixedDim: '#FFB955',
  onTertiaryFixed: '#2A1800',
  onTertiaryFixedVariant: '#633F00',
  marigold: '#FFB955',

  // Semantic
  success: '#2E7D32',
  successContainer: '#E8F5E9',
  onSuccessContainer: '#1B5E20',
  warning: '#E65100',
  warningContainer: '#FFF3E0',
  onErrorContainer: '#93000A',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onError: '#FFFFFF',

  // Canvas
  background: '#F7F9FF',
  onBackground: '#121C26',
  offWhite: '#FFF9EF',
} as const;

export const RADII = {
  controls: '12px', // buttons, inputs, chips
  panels: '16px',   // cards, bottom sheets, modals
  pills: '9999px',
} as const;

export const SPACING = {
  touchTargetMin: '48px',
  marginMobile: '16px',
  marginDesktop: '48px',
  base: '8px',
} as const;
