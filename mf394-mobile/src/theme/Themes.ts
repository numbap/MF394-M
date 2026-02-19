/**
 * Design System Theme
 *
 * Centralized theme tokens for consistent UI across the app.
 * All colors, spacing, typography, and radii are defined here.
 *
 * Usage:
 * import { theme } from '@/theme';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: theme.colors.background.primary,
 *     padding: theme.spacing.md,
 *   },
 * });
 */

/**
 * Color Palette
 * Source: colors.json
 * All colors are defined in 50-950 increments for flexibility
 */
const colors = {
  // Primary brand color - Steel Blue
  primary: {
    50: '#eef2f7',
    100: '#dde6ee',
    200: '#bbccdd',
    300: '#98b2cd',
    400: '#7699bc',
    500: '#547fab', // Primary shade
    600: '#436689',
    700: '#324c67',
    800: '#223344',
    900: '#111922',
    950: '#0c1218',
  },

  // Secondary brand color - Vanilla Custard
  secondary: {
    50: '#fbf8ea',
    100: '#f6f1d5',
    200: '#eee2aa',
    300: '#e5d480',
    400: '#dcc656',
    500: '#d4b82b', // Secondary shade
    600: '#a99323',
    700: '#7f6e1a',
    800: '#554911',
    900: '#2a2509',
    950: '#1e1a06',
  },

  // Accent colors
  accent: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e', // Green
      600: '#16a34a',
    },
    warning: {
      50: '#fefce8',
      100: '#fef08a',
      500: '#eab308', // Amber
      600: '#ca8a04',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444', // Red
      600: '#dc2626',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6', // Blue
      600: '#2563eb',
    },
  },

  // Neutral palette - Iron Grey
  neutral: {
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

  // Semantic colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: '#111313', // neutral-900
    secondary: '#475052', // neutral-700
    tertiary: '#778588', // neutral-500
    disabled: '#adb6b8', // neutral-300
    inverse: '#ffffff',
  },

  // Border colors
  border: {
    light: '#e4e7e7', // neutral-100
    default: '#c8ced0', // neutral-200
    dark: '#5f6b6d', // neutral-600
  },

  // Additional palettes
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

  spice: {
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

  amethyst: {
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
};

/**
 * Spacing Scale
 * Follows an 8px base unit (common in design systems)
 */
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 56,
  '5xl': 64,
};

/**
 * Border Radius Scale
 * For rounded corners
 */
const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999, // Circle
};

/**
 * Typography Scale
 * Font sizes following a typographic scale
 */
const typography = {
  // Display sizes
  display: {
    lg: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const,
    },
    md: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700' as const,
    },
    sm: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700' as const,
    },
  },

  // Heading sizes
  heading: {
    lg: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    md: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
    sm: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600' as const,
    },
  },

  // Body text
  body: {
    lg: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    md: {
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '400' as const,
    },
    sm: {
      fontSize: 12,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
  },

  // Labels and captions
  label: {
    lg: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
    },
    md: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '600' as const,
    },
    sm: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '600' as const,
    },
  },

  // Captions
  caption: {
    lg: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '400' as const,
    },
    md: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
  },
};

/**
 * Component-specific tokens
 * These combine base tokens for consistent component styling
 */
const components = {
  button: {
    primary: {
      backgroundColor: colors.primary[500],
      textColor: colors.text.inverse,
      pressedBackgroundColor: colors.primary[600],
      disabledBackgroundColor: colors.neutral[200],
      disabledTextColor: colors.text.disabled,
    },
    secondary: {
      backgroundColor: colors.neutral[100],
      textColor: colors.text.primary,
      pressedBackgroundColor: colors.neutral[200],
      disabledBackgroundColor: colors.neutral[100],
      disabledTextColor: colors.text.disabled,
    },
  },

  card: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.light,
    shadowColor: colors.neutral[900],
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  input: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.default,
    focusBorderColor: colors.primary[500],
    placeholderTextColor: colors.text.tertiary,
    textColor: colors.text.primary,
  },

  badge: {
    primary: {
      backgroundColor: colors.primary[100],
      textColor: colors.primary[700],
    },
    success: {
      backgroundColor: colors.accent.success[100],
      textColor: colors.accent.success[600],
    },
    warning: {
      backgroundColor: colors.accent.warning[100],
      textColor: colors.accent.warning[600],
    },
    error: {
      backgroundColor: colors.accent.error[100],
      textColor: colors.accent.error[600],
    },
  },
};

/**
 * Z-index scale
 * For layering components
 */
const zIndex = {
  hidden: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

/**
 * Complete theme object
 * Export this as the single source of truth for all design tokens
 */
export const theme = {
  colors,
  spacing,
  radii,
  typography,
  components,
  zIndex,
} as const;

// Type exports for TypeScript
export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Typography = typeof typography;
