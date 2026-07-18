/**
 * @file meal.ts
 * @description TypeScript interface definitions for meal plans and options.
 */

export interface MealOption {
  id: string;
  name: string; // e.g. "Option A"
  content: string; // e.g. "60g oats + 2 bananas..."
  calories: number; // kcal
  protein: number; // grams
}

export interface Meal {
  id: string; // doc ID
  name: string; // e.g. "Meal 1 — Post-Gym"
  timeRange: string; // e.g. "8:30–9:00 AM"
  targetCalories: number;
  targetProtein: number;
  order: number;
  options: MealOption[];
}
