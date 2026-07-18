import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @description Returns the local date formatted as YYYY-MM-DD.
 * @param {Date} [inputDate] - Optional date object, defaults to today.
 * @returns {string} The formatted local date string.
 */
export function getLocalDateString(inputDate: Date = new Date()): string {
  const yearNumber = inputDate.getFullYear();
  const monthString = String(inputDate.getMonth() + 1).padStart(2, "0");
  const dayString = String(inputDate.getDate()).padStart(2, "0");
  return `${yearNumber}-${monthString}-${dayString}`;
}

/**
 * @description Formats a YYYY-MM-DD string into a user-friendly display date (e.g. Sat, Jul 18).
 * @param {string} dateString - The raw YYYY-MM-DD date string.
 * @returns {string} The formatted user-friendly date.
 */
export function formatDisplayDate(dateString: string): string {
  if (!dateString) return "";
  const [yearComponent, monthComponent, dayComponent] = dateString.split("-").map(Number);
  // Create Date using local time parameters
  const dateObject = new Date(yearComponent, monthComponent - 1, dayComponent);
  
  return dateObject.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

