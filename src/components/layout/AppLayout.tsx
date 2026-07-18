"use client";

/**
 * @file AppLayout.tsx
 * @description Manages routing guard (authentication checks), database auto-seeding, and layout structure (Header, BottomNav).
 */

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useWorkoutDays } from "@/hooks/useWorkoutDays";
import { useMeals } from "@/hooks/useMeals";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { Toaster } from "@/components/ui/sonner";
import { Dumbbell } from "lucide-react";

/**
 * Inner layout wrapper that handles client-side state, auth guards, and database seeding.
 */
function AppLayoutInner({ children }: { children: React.ReactNode }): React.ReactElement {
  const { user, loading } = useAuth();
  const { seedWorkoutDaysIfEmpty } = useWorkoutDays();
  const { seedMealsIfEmpty } = useMeals();
  const currentPathname = usePathname();
  const router = useRouter();

  // Handle route protection and redirection
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user && currentPathname !== "/login") {
      router.replace("/login");
    } else if (user && currentPathname === "/login") {
      router.replace("/");
    }
  }, [user, loading, currentPathname, router]);

  // Seed default database collections if empty upon successful user login
  useEffect(() => {
    if (user) {
      seedWorkoutDaysIfEmpty().catch((seedingError) => {
        console.error("Auto-seeding workout days failed:", seedingError);
      });
      seedMealsIfEmpty().catch((seedingError) => {
        console.error("Auto-seeding meals failed:", seedingError);
      });
    }
  }, [user, seedWorkoutDaysIfEmpty, seedMealsIfEmpty]);

  // Loading indicator
  if (loading) {
    return React.createElement(
      "div",
      { className: "flex min-h-screen flex-col items-center justify-center bg-background" },
      React.createElement(
        "div",
        { className: "flex flex-col items-center gap-4 text-center animate-pulse" },
        React.createElement(Dumbbell, { className: "h-12 w-12 text-primary animate-bounce" }),
        React.createElement("p", { className: "text-sm text-muted-foreground" }, "Loading your progress...")
      )
    );
  }

  // If user is not authenticated and on login page, render clean page
  if (!user) {
    if (currentPathname === "/login") {
      return React.createElement(React.Fragment, null, children, React.createElement(Toaster, { position: "top-center" }));
    }
    // Render blank while redirecting
    return React.createElement("div", { className: "min-h-screen bg-background" });
  }

  // Render full application frame for logged-in user
  return React.createElement(
    "div",
    { className: "flex min-h-screen flex-col bg-background" },
    React.createElement(Header, null),
    React.createElement("div", { className: "flex-1" }, children),
    React.createElement(BottomNav, null),
    React.createElement(Toaster, { position: "top-center", closeButton: true })
  );
}

/**
 * @description Master application layout provider containing Auth and Toast context layers.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Sub-page component trees.
 * @returns {React.ReactElement} The complete layout-guarded tree.
 */
export function AppLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return React.createElement(
    AuthProvider,
    null,
    React.createElement(AppLayoutInner, null, children)
  );
}
