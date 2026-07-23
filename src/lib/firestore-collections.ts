/**
 * @file firestore-collections.ts
 * @description Single source of truth for Firestore collection path constants and user subcollection helpers.
 */

import { collection, doc, DocumentReference, CollectionReference } from "firebase/firestore";
import { firestoreDb } from "./firebase";

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
  BODY_WEIGHTS: "bodyWeights",
} as const;

export type FirestoreCollectionName = typeof FIRESTORE_COLLECTIONS[keyof typeof FIRESTORE_COLLECTIONS];

/**
 * @description Gets a Firestore CollectionReference scoped to the specified user to prevent data leakage.
 * @param {string} userId - The user's UID.
 * @param {string} collectionName - The collection name.
 * @returns {CollectionReference} The collection reference.
 */
export function getUserCollection(userId: string, collectionName: string): CollectionReference {
  return collection(firestoreDb, "users", userId, collectionName);
}

/**
 * @description Gets a Firestore DocumentReference scoped to the specified user to prevent data leakage.
 * @param {string} userId - The user's UID.
 * @param {string} collectionName - The collection name.
 * @param {string} documentId - The document ID.
 * @returns {DocumentReference} The document reference.
 */
export function getUserDoc(userId: string, collectionName: string, documentId: string): DocumentReference {
  return doc(firestoreDb, "users", userId, collectionName, documentId);
}
