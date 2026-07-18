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
import { cn } from "@/lib/utils";

const AVATAR_COLORS_LIST = [
  "bg-red-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
];

/**
 * @description Generates a deterministic color class based on the user's UID.
 * @param {string} userId - User UID string.
 * @returns {string} Tailwind CSS background class name.
 */
const getUserAvatarColorClass = (userId: string): string => {
  if (!userId) return "bg-primary";
  let characterSum = 0;
  for (let characterIndex = 0; characterIndex < userId.length; characterIndex++) {
    characterSum += userId.charCodeAt(characterIndex);
  }
  return AVATAR_COLORS_LIST[characterSum % AVATAR_COLORS_LIST.length];
};

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
        { className: "flex items-center gap-1.5" },
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
            React.Fragment,
            null,
            React.createElement(
              "div",
              {
                className: cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm ml-1 select-none",
                  getUserAvatarColorClass(user.uid)
                ),
                title: user.email || "User Profile",
              },
              React.createElement(
                "svg",
                {
                  viewBox: "0 0 24 24",
                  className: "h-4 w-4",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                },
                React.createElement("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
                React.createElement("circle", { cx: "12", cy: "7", r: "4" })
              )
            ),
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
    )
  );
}
