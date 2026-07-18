"use client";

/**
 * @file page.tsx (login)
 * @description Sign in screen for single-user authentication.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";

/**
 * @description Login page component containing the email/password sign-in form.
 * @returns {React.ReactElement} The Login page.
 */
export default function LoginPage(): React.ReactElement {
  const { login } = useAuth();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [passwordText, setPasswordText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  /**
   * @description Handles form submission and triggers Firebase Authentication.
   * @param {React.FormEvent} formEvent - Form submission event.
   */
  const handleFormSubmission = async (formEvent: React.FormEvent): Promise<void> => {
    formEvent.preventDefault();

    if (!emailAddress || !passwordText) {
      toast.error("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(emailAddress, passwordText);
      toast.success("Welcome back!");
      router.replace("/");
    } catch (authError: any) {
      console.error("Sign in error:", authError);
      toast.error(authError.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return React.createElement(
    "div",
    { className: "flex min-h-screen w-full items-center justify-center bg-background px-6 py-12 sm:px-8" },
    React.createElement(
      "div",
      { className: "w-full max-w-md space-y-8 animate-page-in" },
      React.createElement(
        "div",
        { className: "flex flex-col items-center text-center" },
        React.createElement(
          "div",
          { className: "flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 transition-transform duration-300 hover:scale-105" },
          React.createElement(Dumbbell, { className: "h-7 w-7" })
        ),
        React.createElement("h2", { className: "text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" }, "Sign In"),
        React.createElement("p", { className: "mt-3 text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto" }, "Access your gym dashboard and track progressive overload.")
      ),
      React.createElement(
        "form",
        { onSubmit: handleFormSubmission, className: "mt-8 space-y-6" },
        React.createElement(
          "div",
          { className: "space-y-4" },
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "email", className: "text-xs sm:text-sm font-semibold" }, "Email"),
            React.createElement(Input, {
              id: "email",
              type: "email",
              placeholder: "trainer@example.com",
              value: emailAddress,
              onChange: (changeEvent) => setEmailAddress(changeEvent.target.value),
              disabled: submitting,
              required: true,
              className: "bg-background border-input h-11 text-xs sm:text-sm focus:ring-2",
            })
          ),
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "password", className: "text-xs sm:text-sm font-semibold" }, "Password"),
            React.createElement(Input, {
              id: "password",
              type: "password",
              placeholder: "••••••••",
              value: passwordText,
              onChange: (changeEvent) => setPasswordText(changeEvent.target.value),
              disabled: submitting,
              required: true,
              className: "bg-background border-input h-11 text-xs sm:text-sm focus:ring-2",
            })
          )
        ),
        React.createElement(
          "div",
          { className: "pt-2" },
          React.createElement(
            Button,
            {
              type: "submit",
              disabled: submitting,
              className: "w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-xs sm:text-sm font-semibold shadow-sm transition-all",
            },
            submitting ? "Signing In..." : "Sign In"
          )
        )
      )
    )
  );
}
