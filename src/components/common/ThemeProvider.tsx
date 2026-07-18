"use client";

/**
 * @file ThemeProvider.tsx
 * @description Theme provider component wrapping next-themes for managing light/dark mode.
 */

import React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * @description Master theme provider context wrapper.
 * @param {ThemeProviderProps} props - Component properties.
 * @returns {React.ReactElement} The ThemeProvider component.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps): React.ReactElement {
  return React.createElement(NextThemesProvider, props, children);
}
