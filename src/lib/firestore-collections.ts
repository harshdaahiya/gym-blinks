/**
 * @file firestore-collections.ts
 * @description Single source of truth for Firestore collection path constants.
 */

/**
 * Constants representing the Firestore collections used in the application.
 */
export const FIRESTORE_COLLECTIONS = {
  WORKOUT_DAYS: "workoutDays",
  EXERCISES: "exercises",
  WORKOUT_LOGS: "workoutLogs",
  PROGRESS_PHOTOS: "progressPhotos",
  PERSONAL_RECORDS: "personalRecords",
  MEALS: "meals",
} as const;

export type FirestoreCollectionName = typeof FIRESTORE_COLLECTIONS[keyof typeof FIRESTORE_COLLECTIONS];
