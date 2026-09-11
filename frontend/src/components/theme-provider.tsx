'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export interface ThemeProviderProps {
  children?: React.ReactNode;
  attribute?: 'class' | 'data-theme' | 'data-mode' | string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
  forcedTheme?: string;
  themes?: string[];
  value?: Record<string, string>;
}

const ThemesProvider = NextThemesProvider as React.ComponentType<ThemeProviderProps>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <ThemesProvider {...props}>{children}</ThemesProvider>;
}
