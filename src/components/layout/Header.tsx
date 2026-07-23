"use client";

/**
 * @file Header.tsx
 * @description Application header with branding, theme switcher, and popover profile menu with gym bro avatars.
 */

import React, { useState, useEffect } from "react";
import { LogOut, Dumbbell, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/config/site";

// Deterministic index generator based on user UID
const getDeterministicAvatarIndex = (userId: string): number => {
  if (!userId) return 0;
  let characterCodeSum = 0;
  for (let charIndex = 0; charIndex < userId.length; charIndex++) {
    characterCodeSum += userId.charCodeAt(charIndex);
  }
  return characterCodeSum % 5;
};

// SVG render functions for 5 premium Gym Bro Avatars
const GYM_BRO_AVATARS = [
  // Avatar 1: Peach Background + Curly Hair + Beard + Tank top (like shared picture)
  (key: string) => React.createElement(
    "svg",
    { key, viewBox: "0 0 100 100", className: "h-full w-full select-none" },
    React.createElement("circle", { cx: "50", cy: "50", r: "50", fill: "#ffdcb9" }),
    React.createElement("path", { d: "M15 90 C15 70, 30 65, 50 65 C70 65, 85 70, 85 90 Z", fill: "#f7a278" }),
    React.createElement("path", { d: "M38 78 Q50 82 62 78", stroke: "#1d1a39", strokeWidth: "1", fill: "none", opacity: "0.3" }),
    React.createElement("path", { d: "M32 68 C30 75, 28 85, 30 100 L70 100 C72 85, 70 75, 68 68 C65 72, 60 75, 50 75 C40 75, 35 72, 32 68 Z", fill: "#4791ff" }),
    React.createElement("path", { d: "M32 68 C34 68, 35 75, 36 78 M68 68 C66 68, 65 75, 64 78", stroke: "#ffffff", strokeWidth: "1.5", fill: "none" }),
    React.createElement("path", { d: "M42 55 L42 68 Q50 72 58 68 L58 55 Z", fill: "#e08b60" }),
    React.createElement("path", { d: "M38 35 C38 25, 62 25, 62 35 C62 48, 57 52, 50 52 C43 52, 38 48, 38 35 Z", fill: "#f7a278" }),
    React.createElement("circle", { cx: "36", cy: "35", r: "4.5", fill: "#f7a278" }),
    React.createElement("ellipse", { cx: "46", cy: "33", rx: "1.5", ry: "1", fill: "#1d1a39" }),
    React.createElement("ellipse", { cx: "54", cy: "33", rx: "1.5", ry: "1", fill: "#1d1a39" }),
    React.createElement("path", { d: "M43 30 Q46 29 48 31", stroke: "#1d1a39", strokeWidth: "1", fill: "none" }),
    React.createElement("path", { d: "M57 30 Q54 29 52 31", stroke: "#1d1a39", strokeWidth: "1", fill: "none" }),
    React.createElement("path", { d: "M50 32 L51 36 L49 37", stroke: "#1d1a39", strokeWidth: "0.8", fill: "none" }),
    React.createElement("path", { d: "M46 41 Q50 39 54 41", stroke: "#1d1a39", strokeWidth: "2.5", fill: "none", strokeLinecap: "round" }),
    React.createElement("path", { d: "M38 38 C38 48, 43 54, 50 54 C57 54, 62 48, 62 38 C62 43, 60 52, 50 52 C40 52, 38 43, 38 38 Z", fill: "#1d1a39" }),
    React.createElement("path", { d: "M38 30 C34 26, 38 18, 45 15 C50 12, 58 13, 62 18 C66 22, 64 30, 62 30 C58 24, 42 24, 38 30 Z", fill: "#1d1a39" })
  ),
  // Avatar 2: Blue Background + Buzzcut + Beard + Crimson Tank
  (key: string) => React.createElement(
    "svg",
    { key, viewBox: "0 0 100 100", className: "h-full w-full select-none" },
    React.createElement("circle", { cx: "50", cy: "50", r: "50", fill: "#d2e5ff" }),
    React.createElement("path", { d: "M15 90 C15 72, 30 67, 50 67 C70 67, 85 72, 85 90 Z", fill: "#fca5a5" }),
    React.createElement("path", { d: "M32 70 C30 75, 28 85, 30 100 L70 100 C72 85, 70 75, 68 70 C65 74, 60 76, 50 76 C40 76, 35 74, 32 70 Z", fill: "#dc2626" }),
    React.createElement("path", { d: "M32 70 C34 70, 35 76, 36 79 M68 70 C66 70, 65 76, 64 79", stroke: "#ffffff", strokeWidth: "1.5", fill: "none" }),
    React.createElement("path", { d: "M42 57 L42 70 Q50 73, 58 70 L58 57 Z", fill: "#f87171" }),
    React.createElement("path", { d: "M38 36 C38 26, 62 26, 62 36 C62 48, 57 53, 50 53 C43 53, 38 48, 38 36 Z", fill: "#fca5a5" }),
    React.createElement("ellipse", { cx: "46", cy: "34", rx: "1.5", ry: "1", fill: "#27272a" }),
    React.createElement("ellipse", { cx: "54", cy: "34", rx: "1.5", ry: "1", fill: "#27272a" }),
    React.createElement("path", { d: "M43 31 Q46 30 48 32 M57 31 Q54 30 52 32", stroke: "#27272a", strokeWidth: "1", fill: "none" }),
    React.createElement("path", { d: "M50 33 L51 37 M46 42 Q50 40 54 42", stroke: "#27272a", strokeWidth: "1", fill: "none" }),
    React.createElement("path", { d: "M38 38 C38 49, 43 55, 50 55 C57 55, 62 49, 62 38 C62 44, 60 53, 50 53 C40 53, 38 44, 38 38 Z", fill: "#27272a" }),
    React.createElement("path", { d: "M38 30 C38 26, 42 22, 50 22 C58 22, 62 26, 62 30 Z", fill: "#27272a" })
  ),
  // Avatar 3: Yellow Background + Sweatband + Green Tank
  (key: string) => React.createElement(
    "svg",
    { key, viewBox: "0 0 100 100", className: "h-full w-full select-none" },
    React.createElement("circle", { cx: "50", cy: "50", r: "50", fill: "#fef3c7" }),
    React.createElement("path", { d: "M15 90 C15 72, 30 67, 50 67 C70 67, 85 72, 85 90 Z", fill: "#f59e0b" }),
    React.createElement("path", { d: "M32 70 C30 75, 28 85, 30 100 L70 100 C72 85, 70 75, 68 70 C65 74, 60 76, 50 76 C40 76, 35 74, 32 70 Z", fill: "#10b981" }),
    React.createElement("path", { d: "M32 70 C34 70, 35 76, 36 79 M68 70 C66 70, 65 76, 64 79", stroke: "#ffffff", strokeWidth: "1.5", fill: "none" }),
    React.createElement("path", { d: "M42 57 L42 70 Q50 73, 58 70 L58 57 Z", fill: "#d97706" }),
    React.createElement("path", { d: "M38 36 C38 26, 62 26, 62 36 C62 48, 57 53, 50 53 C43 53, 38 48, 38 36 Z", fill: "#f59e0b" }),
    React.createElement("ellipse", { cx: "46", cy: "35", rx: "1.5", ry: "1", fill: "#78350f" }),
    React.createElement("ellipse", { cx: "54", cy: "35", rx: "1.5", ry: "1", fill: "#78350f" }),
    React.createElement("path", { d: "M48 39 Q50 37 52 39", stroke: "#78350f", strokeWidth: "1", fill: "none" }),
    React.createElement("rect", { x: "37", y: "27", width: "26", height: "5", rx: "1", fill: "#3b82f6" }),
    React.createElement("path", { d: "M38 27 Q42 22 50 22 Q58 22 62 27 Z", fill: "#78350f" })
  ),
  // Avatar 4: Gray Background + Cap Backward + Charcoal Tank
  (key: string) => React.createElement(
    "svg",
    { key, viewBox: "0 0 100 100", className: "h-full w-full select-none" },
    React.createElement("circle", { cx: "50", cy: "50", r: "50", fill: "#e5e7eb" }),
    React.createElement("path", { d: "M15 90 C15 72, 30 67, 50 67 C70 67, 85 72, 85 90 Z", fill: "#fcd34d" }),
    React.createElement("path", { d: "M32 70 C30 75, 28 85, 30 100 L70 100 C72 85, 70 75, 68 70 C65 74, 60 76, 50 76 C40 76, 35 74, 32 70 Z", fill: "#1f2937" }),
    React.createElement("path", { d: "M32 70 C34 70, 35 76, 36 79 M68 70 C66 70, 65 76, 64 79", stroke: "#ffffff", strokeWidth: "1.5", fill: "none" }),
    React.createElement("path", { d: "M42 57 L42 70 Q50 73, 58 70 L58 57 Z", fill: "#f59e0b" }),
    React.createElement("path", { d: "M38 36 C38 26, 62 26, 62 36 C62 48, 57 53, 50 53 C43 53, 38 48, 38 36 Z", fill: "#fcd34d" }),
    React.createElement("ellipse", { cx: "46", cy: "34", rx: "1.5", ry: "1", fill: "#1f2937" }),
    React.createElement("ellipse", { cx: "54", cy: "34", rx: "1.5", ry: "1", fill: "#1f2937" }),
    React.createElement("path", { d: "M48 39 Q50 37 52 39", stroke: "#1f2937", strokeWidth: "1", fill: "none" }),
    React.createElement("path", { d: "M38 38 C38 49, 43 55, 50 55 C57 55, 62 49, 62 38 C62 44, 60 53, 50 53 C40 53, 38 44, 38 38 Z", fill: "#1f2937" }),
    React.createElement("path", { d: "M37 28 C37 20, 63 20, 63 28 Z", fill: "#ef4444" }),
    React.createElement("rect", { x: "42", y: "27", width: "16", height: "2", fill: "#ef4444" }),
    React.createElement("path", { d: "M35 28 L30 25 L34 22 Z", fill: "#ef4444" })
  ),
  // Avatar 5: Purple Background + Sleek Bun + Violet Tank
  (key: string) => React.createElement(
    "svg",
    { key, viewBox: "0 0 100 100", className: "h-full w-full select-none" },
    React.createElement("circle", { cx: "50", cy: "50", r: "50", fill: "#fae8ff" }),
    React.createElement("path", { d: "M15 90 C15 72, 30 67, 50 67 C70 67, 85 72, 85 90 Z", fill: "#fca5a5" }),
    React.createElement("path", { d: "M32 70 C30 75, 28 85, 30 100 L70 100 C72 85, 70 75, 68 70 C65 74, 60 76, 50 76 C40 76, 35 74, 32 70 Z", fill: "#8b5cf6" }),
    React.createElement("path", { d: "M32 70 C34 70, 35 76, 36 79 M68 70 C66 70, 65 76, 64 79", stroke: "#ffffff", strokeWidth: "1.5", fill: "none" }),
    React.createElement("path", { d: "M42 57 L42 70 Q50 73, 58 70 L58 57 Z", fill: "#f87171" }),
    React.createElement("path", { d: "M38 36 C38 26, 62 26, 62 36 C62 48, 57 53, 50 53 C43 53, 38 48, 38 36 Z", fill: "#fca5a5" }),
    React.createElement("ellipse", { cx: "46", cy: "34", rx: "1.5", ry: "1", fill: "#7c2d12" }),
    React.createElement("ellipse", { cx: "54", cy: "34", rx: "1.5", ry: "1", fill: "#7c2d12" }),
    React.createElement("path", { d: "M46 41 Q50 39 54 41", stroke: "#7c2d12", strokeWidth: "1", fill: "none" }),
    React.createElement("path", { d: "M38 28 C38 20, 62 20, 62 28 Z", fill: "#7c2d12" }),
    React.createElement("circle", { cx: "50", cy: "18", r: "4.5", fill: "#7c2d12" })
  )
];

/**
 * @description Responsive application header displaying the app title, theme toggle, and dropdown profile menu.
 * @returns {React.ReactElement} The Header component.
 */
export function Header(): React.ReactElement {
  const { user, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mountedState, setMountedState] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMountedState(true);
  }, []);

  /**
   * @description Handles logout action.
   */
  const handleLogoutAction = (): void => {
    setIsProfileMenuOpen(false);
    logout().catch((logoutError) => {
      console.error("Failed to log out user:", logoutError);
    });
  };

  const isDarkMode = resolvedTheme === "dark";
  const avatarIndex = user ? getDeterministicAvatarIndex(user.uid) : 0;

  return React.createElement(
    "header",
    {
      className:
        "sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md",
    },
    React.createElement(
      "div",
      {
        className: "mx-auto flex h-14 max-w-md md:max-w-2xl items-center justify-between px-4 relative",
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
            className: "h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer",
            title: "Toggle Theme",
          },
          mountedState
            ? React.createElement(isDarkMode ? Sun : Moon, { className: "h-5 w-5" })
            : React.createElement("div", { className: "h-5 w-5" })
        ),
        user &&
          React.createElement(
            "div",
            { className: "relative" },
            React.createElement(
              "button",
              {
                onClick: () => setIsProfileMenuOpen((previousState) => !previousState),
                className: "flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border border-border/80 shadow-sm ml-1 select-none hover:opacity-85 transition-opacity cursor-pointer",
                title: user.email || "User Profile",
              },
              GYM_BRO_AVATARS[avatarIndex]("gym-bro-avatar")
            ),
            isProfileMenuOpen &&
              React.createElement(
                React.Fragment,
                null,
                // Backdrop screen overlay to close menu on click outside
                React.createElement("div", {
                  className: "fixed inset-0 z-40 bg-transparent cursor-default",
                  onClick: () => setIsProfileMenuOpen(false),
                }),
                // Dropdown Card Popover
                React.createElement(
                  "div",
                  {
                    className:
                      "absolute right-0 top-10 w-44 bg-card border border-border shadow-lg rounded-lg z-50 p-1.5 flex flex-col gap-0.5 animate-page-in",
                  },
                  React.createElement(
                    "div",
                    {
                      className:
                        "px-2 py-1 text-[10px] text-muted-foreground font-semibold truncate border-b border-border/40 mb-1.5 select-none",
                    },
                    user.email || "GymBlinks User"
                  ),
                  React.createElement(
                    "button",
                    {
                      onClick: handleLogoutAction,
                      className:
                        "w-full text-left px-2 py-1.5 rounded hover:bg-muted text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 transition-all cursor-pointer select-none",
                    },
                    React.createElement(LogOut, { className: "h-3.5 w-3.5" }),
                    "Sign Out"
                  )
                )
              )
          )
      )
    )
  );
}
