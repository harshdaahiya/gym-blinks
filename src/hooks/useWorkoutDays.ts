"use client";

/**
 * @file useWorkoutDays.ts
 * @description Provides a hook to query, sync, and manage workout days.
 * Includes auto-seeding logic for first-time runs.
 */

import { useEffect, useState, useCallback } from "react";
import { onSnapshot, query, orderBy, getDocs, writeBatch, doc } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, getUserCollection } from "@/lib/firestore-collections";
import { WorkoutDay } from "@/types/exercise";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_WORKOUT_DAYS: WorkoutDay[] = [
  { id: "chest_shoulders", name: "Chest & Shoulders", order: 1 },
  { id: "back_biceps", name: "Back & Biceps", order: 2 },
  { id: "legs_triceps", name: "Legs & Triceps", order: 3 },
  { id: "general_fitness", name: "General Fitness", order: 4 },
];

/**
 * @description Custom hook for fetching and automatically seeding workout days.
 * @returns {Object} An object containing the list of workout days, loading state, and seed function.
 */
export function useWorkoutDays() {
  const { user } = useAuth();
  const userId = user?.uid;

  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync workout days from Firestore
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const workoutDaysCollection = getUserCollection(userId, FIRESTORE_COLLECTIONS.WORKOUT_DAYS);
    const sortedWorkoutDaysQuery = query(workoutDaysCollection, orderBy("order", "asc"));

    const unsubscribeFromWorkoutDays = onSnapshot(sortedWorkoutDaysQuery, (querySnapshot) => {
      const daysList: WorkoutDay[] = [];
      querySnapshot.forEach((documentSnapshot) => {
        daysList.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        } as WorkoutDay);
      });
      setWorkoutDays(daysList);
      setLoading(false);
    });

    return () => unsubscribeFromWorkoutDays();
  }, [userId]);

  /**
   * @description Checks if the workoutDays collection is empty and seeds it if necessary.
   * Also cleans up any old duplicate auto-generated document IDs.
   * @returns {Promise<void>} Resolves when the check and seeding operations are complete.
   * @throws {Error} Throws if Firestore batch write fails.
   */
  const seedWorkoutDaysIfEmpty = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const workoutDaysCollection = getUserCollection(userId, FIRESTORE_COLLECTIONS.WORKOUT_DAYS);
      const querySnapshot = await getDocs(workoutDaysCollection);

      const validDocumentIds = DEFAULT_WORKOUT_DAYS.map((dayItem) => dayItem.id);
      const writeBatchInstance = writeBatch(firestoreDb);
      let needsBatchCommit = false;

      // Delete any duplicate/legacy auto-generated ID documents
      querySnapshot.forEach((documentSnapshot) => {
        if (!validDocumentIds.includes(documentSnapshot.id)) {
          writeBatchInstance.delete(documentSnapshot.ref);
          needsBatchCommit = true;
        }
      });

      // Ensure standard static ID documents are set
      DEFAULT_WORKOUT_DAYS.forEach((defaultDay) => {
        const documentReference = doc(workoutDaysCollection, defaultDay.id);
        writeBatchInstance.set(documentReference, {
          name: defaultDay.name,
          order: defaultDay.order,
        });
        needsBatchCommit = true;
      });

      if (needsBatchCommit) {
        console.log("Cleaning up and seeding static workout day types...");
        await writeBatchInstance.commit();
        console.log("Seeding and cleanup completed successfully.");
      }
    } catch (seedingError) {
      console.error("Failed to seed default workout days:", seedingError);
      throw seedingError;
    }
  }, [userId]);

  return {
    workoutDays,
    loading,
    seedWorkoutDaysIfEmpty,
  };
}
