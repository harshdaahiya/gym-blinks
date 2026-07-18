"use client";

/**
 * @file useWorkoutLogs.ts
 * @description Provides a hook to query, sync, and manage (CRUD) workout logs in Firestore.
 * Handles lightweight Personal Record (PR) detection and updates.
 */

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-collections";
import { WorkoutLog, ExerciseEntry, PersonalRecord } from "@/types/workout-log";

/**
 * Details of a newly achieved Personal Record (PR).
 */
export interface NewlyAchievedPR {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
}

/**
 * @description Custom hook for workout logs data synchronization and mutation.
 * Includes progressive overload PR validation logic.
 * @returns {Object} Logs array, loading state, and CRUD helper methods.
 */
export function useWorkoutLogs() {
  const [workoutLogsList, setWorkoutLogsList] = useState<WorkoutLog[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  useEffect(() => {
    const logsCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.WORKOUT_LOGS);
    const sortedLogsQuery = query(logsCollection, orderBy("date", "desc"), orderBy("createdAt", "desc"));

    const unsubscribeFromLogs = onSnapshot(sortedLogsQuery, (querySnapshot) => {
      const parsedLogs: WorkoutLog[] = [];
      querySnapshot.forEach((documentSnapshot) => {
        parsedLogs.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        } as WorkoutLog);
      });
      setWorkoutLogsList(parsedLogs);
      setLoadingState(false);
    });

    return () => unsubscribeFromLogs();
  }, []);

  /**
   * @description Internal helper to update personal records for any set exceeding previous max.
   * @param {string} dateString - Date of the session ("YYYY-MM-DD").
   * @param {ExerciseEntry[]} exerciseEntriesList - Entries from the logged session.
   * @returns {Promise<NewlyAchievedPR[]>} List of newly achieved PRs during this save.
   */
  const processPersonalRecords = async (
    dateString: string,
    exerciseEntriesList: ExerciseEntry[]
  ): Promise<NewlyAchievedPR[]> => {
    const newlyAchievedPRsList: NewlyAchievedPR[] = [];

    for (let exerciseIndex = 0; exerciseIndex < exerciseEntriesList.length; exerciseIndex++) {
      const exerciseEntryItem = exerciseEntriesList[exerciseIndex];
      const { exerciseId, exerciseName, sets } = exerciseEntryItem;

      // Find max weight in the current set entries
      let sessionMaxWeight = 0;
      let sessionMaxWeightReps = 0;

      for (let setIndex = 0; setIndex < sets.length; setIndex++) {
        const setEntryItem = sets[setIndex];
        if (setEntryItem.weight > sessionMaxWeight) {
          sessionMaxWeight = setEntryItem.weight;
          sessionMaxWeightReps = setEntryItem.reps;
        }
      }

      if (sessionMaxWeight === 0) {
        continue;
      }

      // Check current PR from Firestore
      const personalRecordDocReference = doc(
        firestoreDb,
        FIRESTORE_COLLECTIONS.PERSONAL_RECORDS,
        exerciseId
      );
      const personalRecordSnapshot = await getDoc(personalRecordDocReference);

      let isNewPR = false;
      if (personalRecordSnapshot.exists()) {
        const currentRecordData = personalRecordSnapshot.data() as PersonalRecord;
        if (sessionMaxWeight > currentRecordData.maxWeight) {
          isNewPR = true;
        }
      } else {
        // No record exists yet, so this is a PR
        isNewPR = true;
      }

      if (isNewPR) {
        const newRecordObject: PersonalRecord = {
          exerciseId,
          maxWeight: sessionMaxWeight,
          maxWeightReps: sessionMaxWeightReps,
          achievedDate: dateString,
        };
        await setDoc(personalRecordDocReference, newRecordObject);
        newlyAchievedPRsList.push({
          exerciseId,
          exerciseName,
          weight: sessionMaxWeight,
          reps: sessionMaxWeightReps,
        });
      }
    }

    return newlyAchievedPRsList;
  };

  /**
   * @description Logs a new workout session.
   * @param {Omit<WorkoutLog, "id" | "createdAt">} logDetails - Details of the workout session.
   * @returns {Promise<{ logId: string; newPRs: NewlyAchievedPR[] }>} The new document ID and hit PRs.
   * @throws {Error} Throws if writing to Firestore fails.
   */
  const addWorkoutLog = async (
    logDetails: Omit<WorkoutLog, "id" | "createdAt">
  ): Promise<{ logId: string; newPRs: NewlyAchievedPR[] }> => {
    try {
      const logsCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.WORKOUT_LOGS);
      const newDocReference = await addDoc(logsCollection, {
        date: logDetails.date,
        dayId: logDetails.dayId,
        entries: logDetails.entries,
        notes: logDetails.notes ? logDetails.notes.trim() : null,
        createdAt: serverTimestamp(),
      });

      // Analyze and update personal records
      const newPRs = await processPersonalRecords(logDetails.date, logDetails.entries);

      return {
        logId: newDocReference.id,
        newPRs,
      };
    } catch (writeError) {
      console.error("Failed to add workout log:", writeError);
      throw writeError;
    }
  };

  /**
   * @description Updates an existing workout session log.
   * @param {string} logId - ID of the log to update.
   * @param {Partial<WorkoutLog>} updatedFields - Fields to update.
   * @returns {Promise<NewlyAchievedPR[]>} List of newly achieved PRs during this save.
   * @throws {Error} Throws if updating Firestore fails.
   */
  const updateWorkoutLog = async (
    logId: string,
    updatedFields: Partial<WorkoutLog>
  ): Promise<NewlyAchievedPR[]> => {
    try {
      const logDocReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.WORKOUT_LOGS, logId);
      
      const updatePayload: Record<string, any> = {};
      if (updatedFields.date !== undefined) updatePayload.date = updatedFields.date;
      if (updatedFields.dayId !== undefined) updatePayload.dayId = updatedFields.dayId;
      if (updatedFields.entries !== undefined) updatePayload.entries = updatedFields.entries;
      if (updatedFields.notes !== undefined) updatePayload.notes = updatedFields.notes ? updatedFields.notes.trim() : null;

      await updateDoc(logDocReference, updatePayload);

      // Recalculate PRs if entries were modified
      if (updatedFields.entries !== undefined && updatedFields.date !== undefined) {
        return await processPersonalRecords(updatedFields.date, updatedFields.entries);
      }

      return [];
    } catch (updateError) {
      console.error("Failed to update workout log:", updateError);
      throw updateError;
    }
  };

  /**
   * @description Deletes a workout session log.
   * @param {string} logId - ID of the log to delete.
   * @returns {Promise<void>} Resolves when the delete operation is complete.
   * @throws {Error} Throws if deleting from Firestore fails.
   */
  const deleteWorkoutLog = async (logId: string): Promise<void> => {
    try {
      const logDocReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.WORKOUT_LOGS, logId);
      await deleteDoc(logDocReference);
    } catch (deleteError) {
      console.error("Failed to delete workout log:", deleteError);
      throw deleteError;
    }
  };

  return {
    workoutLogs: workoutLogsList,
    loading: loadingState,
    addWorkoutLog,
    updateWorkoutLog,
    deleteWorkoutLog,
  };
}
