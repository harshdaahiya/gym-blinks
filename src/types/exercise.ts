import { Timestamp } from "firebase/firestore";

/**
 * Represents a workout day type (e.g., "Chest & Shoulders").
 */
export interface WorkoutDay {
  id: string;
  name: string;
  order: number;
}

/**
 * Represents an exercise (e.g., "Bench Press") associated with a workout day.
 */
export interface Exercise {
  id: string;
  name: string;
  dayId: string; // Foreign key referencing WorkoutDay.id
  createdAt: Timestamp;
  archived: boolean; // Soft-delete flag to preserve workout logs history
}
