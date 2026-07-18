import { Timestamp } from "firebase/firestore";

/**
 * Represents a single set performance.
 */
export interface SetEntry {
  weight: number; // In kilograms
  reps: number;
}

/**
 * Represents an exercise performed within a workout session log.
 */
export interface ExerciseEntry {
  exerciseId: string;
  exerciseName: string; // Denormalized name to preserve history if renamed
  sets: SetEntry[];
}

/**
 * Represents a full daily workout session log.
 */
export interface WorkoutLog {
  id: string;
  date: string; // YYYY-MM-DD format for timezone-independent local comparisons
  dayId: string; // Foreign key referencing WorkoutDay.id
  entries: ExerciseEntry[];
  notes: string | null;
  createdAt: Timestamp;
}

/**
 * Represents the personal record details for a specific exercise.
 */
export interface PersonalRecord {
  exerciseId: string;
  maxWeight: number; // Max weight ever lifted for this exercise
  maxWeightReps: number; // Number of reps performed at the max weight
  achievedDate: string; // Date of achievement (YYYY-MM-DD)
}
