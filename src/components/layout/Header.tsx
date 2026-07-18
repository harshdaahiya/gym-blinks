"use client";

/**
 * @file Header.tsx
 * @description Application header with branding and action buttons (like Logout).
 */

import React, { useState, useEffect } from "react";
import { LogOut, Dumbbell, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/config/site";

/**
 * @description Responsive application header displaying the app title, theme toggle, and logout button.
 * @returns {React.ReactElement} The Header component.
 */
export function Header(): React.ReactElement {
  const { user, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mountedState, setMountedState] = useState<boolean>(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMountedState(true);
  }, []);

  /**
   * @description Handles logout action.
   */
  const handleLogoutAction = (): void => {
    logout().catch((logoutError) => {
      console.error("Failed to log out user:", logoutError);
    });
  };

  const isDarkMode = resolvedTheme === "dark";

  return React.createElement(
    "header",
    {
      className:
        "sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md",
    },
    React.createElement(
      "div",
      {
        className: "mx-auto flex h-14 max-w-md md:max-w-2xl items-center justify-between px-4",
      },
      React.createElement(
        "div",
        { className: "flex items-center gap-2 font-bold text-lg tracking-tight" },
        React.createElement(Dumbbell, { className: "h-5 w-5 text-primary" }),
        React.createElement("span", null, SITE_CONFIG.name)
      ),
      React.createElement(
        "div",
        { className: "flex items-center gap-1" },
        React.createElement(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: () => setTheme(isDarkMode ? "light" : "dark"),
            className: "h-9 w-9 text-muted-foreground hover:text-foreground",
            title: "Toggle Theme",
          },
          mountedState
            ? React.createElement(isDarkMode ? Sun : Moon, { className: "h-5 w-5" })
            : React.createElement("div", { className: "h-5 w-5" })
        ),
        user &&
          React.createElement(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: handleLogoutAction,
              className: "h-9 w-9 text-muted-foreground hover:text-foreground",
              title: "Sign Out",
            },
            React.createElement(LogOut, { className: "h-5 w-5" })
          )
      )
    )
  );
}
