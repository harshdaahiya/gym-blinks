"use client";

/**
 * @file useLastSession.ts
 * @description Provides a custom hook to fetch the most recent performance logs for a specific exercise.
 */

import { useState, useCallback } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-collections";
import { WorkoutLog, SetEntry } from "@/types/workout-log";

/**
 * Result structure for the last session fetch.
 */
export interface LastSessionDetails {
  date: string;
  sets: SetEntry[];
  formattedString: string;
}

/**
 * @description Custom hook for retrieving the previous workout session details for an exercise.
 * @returns {Object} A set of utilities to fetch last session details for an exercise.
 */
export function useLastSession() {
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * @description Fetches the most recent session set data for the given exercise.
   * @param {string} exerciseId - ID of the exercise.
   * @returns {Promise<LastSessionDetails | null>} Details of the last session, or null if never performed.
   */
  const fetchLastSession = useCallback(async (exerciseId: string): Promise<LastSessionDetails | null> => {
    setLoading(true);
    try {
      const logsCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.WORKOUT_LOGS);
      // Query all logs ordered by date desc
      const logsQuery = query(logsCollection, orderBy("date", "desc"), limit(20));
      const querySnapshot = await getDocs(logsQuery);

      if (querySnapshot.empty) {
        return null;
      }

      for (let documentIndex = 0; documentIndex < querySnapshot.docs.length; documentIndex++) {
        const documentSnapshot = querySnapshot.docs[documentIndex];
        const logData = documentSnapshot.data() as WorkoutLog;
        const matchingEntry = logData.entries.find((entry) => entry.exerciseId === exerciseId);

        if (matchingEntry && matchingEntry.sets.length > 0) {
          const formattedString = matchingEntry.sets
            .map((setItem) => `${setItem.weight}kg × ${setItem.reps}`)
            .join(", ");

          return {
            date: logData.date,
            sets: matchingEntry.sets,
            formattedString,
          };
        }
      }

      return null;
    } catch (fetchError) {
      console.error("Failed to fetch last session for exercise:", fetchError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * @description Fetches the most recent workout log document matching the given dayId.
   * @param {string} dayId - ID of the workout day type.
   * @returns {Promise<WorkoutLog | null>} The last workout log, or null if none logged yet.
   */
  const fetchLastWorkoutLogForDay = useCallback(async (dayId: string): Promise<WorkoutLog | null> => {
    setLoading(true);
    try {
      const logsCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.WORKOUT_LOGS);
      const logsQuery = query(logsCollection, orderBy("date", "desc"), limit(20));
      const querySnapshot = await getDocs(logsQuery);

      if (querySnapshot.empty) {
        return null;
      }

      for (let documentIndex = 0; documentIndex < querySnapshot.docs.length; documentIndex++) {
        const documentSnapshot = querySnapshot.docs[documentIndex];
        const logData = {
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        } as WorkoutLog;

        if (logData.dayId === dayId) {
          return logData;
        }
      }

      return null;
    } catch (fetchError) {
      console.error("Failed to fetch last workout log for day:", fetchError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchLastSession,
    fetchLastWorkoutLogForDay,
  };
}
