"use client";

/**
 * @file PageShell.tsx
 * @description Standard layout wrapper for application screens, applying consistent padding and animations.
 */

import React from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * @description Container shell that applies page enter animation and layout spacing.
 * @param {PageShellProps} props - Component properties.
 * @returns {React.ReactElement} The PageShell component.
 */
export function PageShell({ children, className }: PageShellProps): React.ReactElement {
  return React.createElement(
    "main",
    {
      className: cn(
        "mx-auto min-h-[calc(100vh-3.5rem)] max-w-md md:max-w-2xl px-4 pb-24 pt-4 animate-page-in",
        className
      ),
    },
    children
  );
}
