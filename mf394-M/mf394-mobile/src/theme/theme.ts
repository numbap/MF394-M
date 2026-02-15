/**
 * Design System Theme
 *
 * Centralized theme tokens including colors, spacing, typography, and more.
 * All components must consume tokens from this file only - no hardcoded values.
 */

export const colors = {
  // Primary brand color - Steel Blue
  primary: {
    50: '#eef2f7',
    100: '#dde6ee',
    200: '#bbccdd',
    300: '#98b2cd',
    400: '#7699bc',
    500: '#547fab',
    600: '#436689',
    700: '#324c67',
    800: '#223344',
    900: '#111922',
    950: '#0c1218',
  },

  // Secondary accent - Vanilla Custard
  secondary: {
    50: '#fbf8ea',
    100: '#f6f1d5',
    200: '#eee2aa',
    300: '#e5d480',
    400: '#dcc656',
    500: '#d4b82b',
    600: '#a99323',
    700: '#7f6e1a',
    800: '#554911',
    900: '#2a2509',
    950: '#1e1a06',
  },

  // Accent/Error - Rusty Spice
  accent: {
    50: '#fcede9',
    100: '#f8dbd3',
    200: '#f1b7a7',
    300: '#ea937b',
    400: '#e36f4f',
    500: '#dd4b22',
    600: '#b03c1c',
    700: '#842d15',
    800: '#581e0e',
    900: '#2c0f07',
    950: '#1f0a05',
  },

  // Neutral palette - Bone (background) & Iron Grey (text)
  neutral: {
    bone: {
      50: '#f5f3ef',
      100: '#ece7df',
      200: '#d8cec0',
      300: '#c5b6a0',
      400: '#b19d81',
      500: '#9e8561',
      600: '#7e6a4e',
      700: '#5f503a',
      800: '#3f3527',
      900: '#201b13',
      950: '#16130e',
    },
    iron: {
      50: '#f1f3f3',
      100: '#e4e7e7',
      200: '#c8ced0',
      300: '#adb6b8',
      400: '#929ea0',
      500: '#778588',
      600: '#5f6b6d',
      700: '#475052',
      800: '#2f3537',
      900: '#181b1b',
      950: '#111313',
    },
  },

  // Supporting colors
  copper: {
    50: '#f6f2ee',
    100: '#ede5de',
    200: '#dccbbc',
    300: '#cab29b',
    400: '#b99879',
    500: '#a77e58',
    600: '#866546',
    700: '#644c35',
    800: '#433223',
    900: '#211912',
    950: '#17120c',
  },

  ashBrown: {
    50: '#f4f2f0',
    100: '#eae4e1',
    200: '#d5c9c3',
    300: '#c0aea5',
    400: '#aa9388',
    500: '#95786a',
    600: '#776055',
    700: '#5a483f',
    800: '#3c302a',
    900: '#1e1815',
    950: '#15110f',
  },

  purple: {
    50: '#f7eafa',
    100: '#efd6f5',
    200: '#dfacec',
    300: '#cf83e2',
    400: '#bf5ad8',
    500: '#af30cf',
    600: '#8c27a5',
    700: '#691d7c',
    800: '#461353',
    900: '#230a29',
    950: '#18071d',
  },

  // Semantic colors
  semantic: {
    background: '#f5f3ef', // bone-50
    surface: '#ece7df', // bone-100
    surfaceHover: '#d8cec0', // bone-200
    inputBackground: '#ffffff', // white - lighter than background for form inputs
    border: '#c8ced0', // iron-200
    text: '#181b1b', // iron-900
    textSecondary: '#778588', // iron-500
    textTertiary: '#adb6b8', // iron-300
    disabled: '#e4e7e7', // iron-100
    success: '#10b981', // emerald green
    warning: '#d4b82b', // secondary-500
    error: '#dc2626', // red
    info: '#547fab', // primary-500
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const radii = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const typography = {
  // Display sizes (for large headings)
  display: {
    large: {
      fontSize: 57,
      lineHeight: 64,
      fontWeight: '700' as const,
      letterSpacing: -0.25,
    },
    medium: {
      fontSize: 45,
      lineHeight: 52,
      fontWeight: '700' as const,
      letterSpacing: 0,
    },
    small: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '700' as const,
      letterSpacing: 0,
    },
  },

  // Headline sizes
  headline: {
    large: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const,
      letterSpacing: 0,
    },
    medium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700' as const,
      letterSpacing: 0,
    },
    small: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700' as const,
      letterSpacing: 0,
    },
  },

  // Title sizes
  title: {
    large: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
      letterSpacing: 0,
    },
    medium: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
    small: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
  },

  // Body text sizes
  body: {
    large: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
      letterSpacing: 0.15,
    },
    medium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: 0.25,
    },
    small: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.4,
    },
  },

  // Label sizes
  label: {
    large: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
    medium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    },
    small: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    },
  },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
};

export type Theme = typeof theme;
