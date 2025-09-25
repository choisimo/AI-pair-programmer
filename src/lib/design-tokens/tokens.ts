/**
 * Design Token System
 * Implements TASK-041: UI 토큰 시스템 정의
 */

// Color tokens
export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },
  
  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b'
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },
  
  // Special colors
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e'
  }
} as const;

// Semantic color mappings
export const semanticColors = {
  // Background colors
  background: {
    primary: 'var(--color-neutral-50)',
    secondary: 'var(--color-neutral-100)',
    tertiary: 'var(--color-neutral-200)',
    inverse: 'var(--color-neutral-900)',
    overlay: 'rgba(0, 0, 0, 0.5)'
  },
  
  // Text colors
  text: {
    primary: 'var(--color-neutral-900)',
    secondary: 'var(--color-neutral-600)',
    tertiary: 'var(--color-neutral-500)',
    inverse: 'var(--color-neutral-50)',
    disabled: 'var(--color-neutral-400)',
    link: 'var(--color-primary-600)',
    linkHover: 'var(--color-primary-700)'
  },
  
  // Border colors
  border: {
    default: 'var(--color-neutral-200)',
    subtle: 'var(--color-neutral-100)',
    strong: 'var(--color-neutral-300)',
    inverse: 'var(--color-neutral-700)',
    focus: 'var(--color-primary-500)',
    error: 'var(--color-error-500)',
    success: 'var(--color-success-500)',
    warning: 'var(--color-warning-500)'
  },
  
  // Surface colors
  surface: {
    default: 'var(--color-neutral-50)',
    subtle: 'var(--color-neutral-100)',
    card: 'var(--color-neutral-50)',
    elevated: 'var(--color-neutral-50)',
    overlay: 'var(--color-neutral-50)',
    inverse: 'var(--color-neutral-800)'
  }
} as const;

// Dark mode color overrides
export const darkModeColors = {
  background: {
    primary: 'var(--color-neutral-950)',
    secondary: 'var(--color-neutral-900)',
    tertiary: 'var(--color-neutral-800)',
    inverse: 'var(--color-neutral-50)',
    overlay: 'rgba(0, 0, 0, 0.8)'
  },
  
  text: {
    primary: 'var(--color-neutral-50)',
    secondary: 'var(--color-neutral-300)',
    tertiary: 'var(--color-neutral-400)',
    inverse: 'var(--color-neutral-900)',
    disabled: 'var(--color-neutral-600)',
    link: 'var(--color-primary-400)',
    linkHover: 'var(--color-primary-300)'
  },
  
  border: {
    default: 'var(--color-neutral-700)',
    subtle: 'var(--color-neutral-800)',
    strong: 'var(--color-neutral-600)',
    inverse: 'var(--color-neutral-300)',
    focus: 'var(--color-primary-400)',
    error: 'var(--color-error-400)',
    success: 'var(--color-success-400)',
    warning: 'var(--color-warning-400)'
  },
  
  surface: {
    default: 'var(--color-neutral-950)',
    subtle: 'var(--color-neutral-900)',
    card: 'var(--color-neutral-900)',
    elevated: 'var(--color-neutral-800)',
    overlay: 'var(--color-neutral-900)',
    inverse: 'var(--color-neutral-100)'
  }
} as const;

// Typography tokens
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
    display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif']
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }]
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
} as const;

// Spacing tokens
export const spacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem'
} as const;

// Border radius tokens
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  default: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px'
} as const;

// Shadow tokens
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000'
} as const;

// Z-index tokens
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
  toast: '1080'
} as const;

// Animation tokens
export const animation = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms'
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  keyframes: {
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' }
    },
    ping: {
      '75%, 100%': { transform: 'scale(2)', opacity: '0' }
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' }
    },
    bounce: {
      '0%, 100%': {
        transform: 'translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
      },
      '50%': {
        transform: 'translateY(0)',
        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
      }
    },
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' }
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' }
    },
    slideInUp: {
      from: { transform: 'translateY(100%)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' }
    },
    slideOutDown: {
      from: { transform: 'translateY(0)', opacity: '1' },
      to: { transform: 'translateY(100%)', opacity: '0' }
    }
  }
} as const;

// Breakpoint tokens
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem'
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.625rem 1rem',
      lg: '0.75rem 1.25rem'
    },
    fontSize: {
      sm: 'var(--font-size-sm)',
      md: 'var(--font-size-base)',
      lg: 'var(--font-size-lg)'
    }
  },
  
  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem'
    },
    padding: {
      sm: '0.375rem 0.75rem',
      md: '0.5rem 0.75rem',
      lg: '0.625rem 1rem'
    }
  },
  
  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem'
    },
    borderRadius: 'var(--border-radius-lg)',
    shadow: 'var(--box-shadow-md)'
  },
  
  modal: {
    backdropColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 'var(--border-radius-xl)',
    shadow: 'var(--box-shadow-2xl)',
    maxWidth: {
      sm: '24rem',
      md: '32rem',
      lg: '48rem',
      xl: '64rem'
    }
  }
} as const;

// Export all tokens
export const tokens = {
  colors,
  semanticColors,
  darkModeColors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  zIndex,
  animation,
  breakpoints,
  components
} as const;

// Type definitions for better TypeScript support
export type ColorToken = keyof typeof colors;
export type SemanticColorToken = keyof typeof semanticColors;
export type SpacingToken = keyof typeof spacing;
export type BorderRadiusToken = keyof typeof borderRadius;
export type ShadowToken = keyof typeof boxShadow;
export type ZIndexToken = keyof typeof zIndex;
export type BreakpointToken = keyof typeof breakpoints;

// Utility function to get token values
export function getToken<T extends Record<string, any>>(
  tokenGroup: T,
  path: string
): string | undefined {
  return path.split('.').reduce((obj, key) => obj?.[key], tokenGroup);
}

// CSS custom properties generator
export function generateCSSCustomProperties(): string {
  const cssVars: string[] = [];
  
  // Generate color variables
  Object.entries(colors).forEach(([colorName, colorShades]) => {
    if (typeof colorShades === 'object') {
      Object.entries(colorShades).forEach(([shade, value]) => {
        cssVars.push(`  --color-${colorName}-${shade}: ${value};`);
      });
    }
  });
  
  // Generate spacing variables
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars.push(`  --spacing-${key}: ${value};`);
  });
  
  // Generate other token variables
  Object.entries(borderRadius).forEach(([key, value]) => {
    cssVars.push(`  --border-radius-${key}: ${value};`);
  });
  
  Object.entries(boxShadow).forEach(([key, value]) => {
    cssVars.push(`  --box-shadow-${key}: ${value};`);
  });
  
  Object.entries(zIndex).forEach(([key, value]) => {
    cssVars.push(`  --z-index-${key}: ${value};`);
  });
  
  return `:root {\n${cssVars.join('\n')}\n}`;
}

export default tokens;
