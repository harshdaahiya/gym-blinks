"use client";

/**
 * @file BottomNav.tsx
 * @description Mobile-first bottom navigation bar for application navigation.
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BarChart3, Camera, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Exercises",
    href: "/exercises",
    icon: Dumbbell,
  },
  {
    label: "Meals",
    href: "/meals",
    icon: Utensils,
  },
  {
    label: "Progress",
    href: "/progress",
    icon: BarChart3,
  },
  {
    label: "Photos",
    href: "/progress/photos",
    icon: Camera,
  },
];

/**
 * @description Bottom navigation bar containing page shortcuts.
 * @returns {React.ReactElement} The BottomNav component.
 */
export function BottomNav(): React.ReactElement {
  const currentPathname = usePathname();

  return React.createElement(
    "nav",
    {
      className:
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-md pb-safe",
    },
    React.createElement(
      "div",
      {
        className: "mx-auto flex h-16 max-w-md md:max-w-2xl items-center justify-around px-4",
      },
      NAVIGATION_ITEMS.map((navigationItem) => {
        const isActiveRoute =
          navigationItem.href === "/"
            ? currentPathname === "/"
            : currentPathname.startsWith(navigationItem.href);

        return React.createElement(
          Link,
          {
            key: navigationItem.href,
            href: navigationItem.href,
            className: cn(
              "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-foreground focus-visible:outline-none",
              isActiveRoute ? "text-primary" : "text-muted-foreground"
            ),
          },
          React.createElement(navigationItem.icon, {
            className: cn("h-5 w-5", isActiveRoute ? "stroke-[2.5px]" : "stroke-[2px]"),
          }),
          React.createElement("span", null, navigationItem.label)
        );
      })
    )
  );
}
