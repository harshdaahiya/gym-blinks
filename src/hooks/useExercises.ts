"use client";

/**
 * @file useExercises.ts
 * @description Provides a hook to query, sync, and manage (CRUD) exercises in Firestore.
 */

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-collections";
import { Exercise } from "@/types/exercise";

/**
 * @description Custom hook for exercises data synchronization and mutation.
 * @returns {Object} Exercises array, loading state, and CRUD helper methods.
 */
export function useExercises() {
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  useEffect(() => {
    const exercisesCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.EXERCISES);
    const sortedExercisesQuery = query(exercisesCollection, orderBy("createdAt", "desc"));

    const unsubscribeFromExercises = onSnapshot(sortedExercisesQuery, (querySnapshot) => {
      const parsedExercises: Exercise[] = [];
      querySnapshot.forEach((documentSnapshot) => {
        parsedExercises.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        } as Exercise);
      });
      setExercisesList(parsedExercises);
      setLoadingState(false);
    });

    return () => unsubscribeFromExercises();
  }, []);

  /**
   * @description Adds a new exercise.
   * @param {string} exerciseName - Name of the exercise.
   * @param {string} targetDayId - Associated workout day ID.
   * @returns {Promise<string>} The new exercise document ID.
   * @throws {Error} Throws if writing to Firestore fails.
   */
  const addExercise = async (exerciseName: string, targetDayId: string): Promise<string> => {
    try {
      const exercisesCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.EXERCISES);
      const newDocReference = await addDoc(exercisesCollection, {
        name: exerciseName.trim(),
        dayId: targetDayId,
        createdAt: serverTimestamp(),
        archived: false,
      });
      return newDocReference.id;
    } catch (writeError) {
      console.error("Failed to add exercise:", writeError);
      throw writeError;
    }
  };

  /**
   * @description Updates an existing exercise's name or day details.
   * @param {string} exerciseId - ID of the exercise to update.
   * @param {string} updatedName - New name of the exercise.
   * @param {string} updatedDayId - New workout day ID.
   * @returns {Promise<void>} Resolves when the update is complete.
   * @throws {Error} Throws if updating Firestore fails.
   */
  const updateExercise = async (
    exerciseId: string,
    updatedName: string,
    updatedDayId: string
  ): Promise<void> => {
    try {
      const exerciseDocReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.EXERCISES, exerciseId);
      await updateDoc(exerciseDocReference, {
        name: updatedName.trim(),
        dayId: updatedDayId,
      });
    } catch (updateError) {
      console.error("Failed to update exercise:", updateError);
      throw updateError;
    }
  };

  /**
   * @description Soft-deletes (archives) an exercise.
   * @param {string} exerciseId - ID of the exercise to archive.
   * @returns {Promise<void>} Resolves when the archiving is complete.
   * @throws {Error} Throws if archiving in Firestore fails.
   */
  const archiveExercise = async (exerciseId: string): Promise<void> => {
    try {
      const exerciseDocReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.EXERCISES, exerciseId);
      await updateDoc(exerciseDocReference, {
        archived: true,
      });
    } catch (archiveError) {
      console.error("Failed to archive exercise:", archiveError);
      throw archiveError;
    }
  };

  /**
   * @description Restores an archived exercise.
   * @param {string} exerciseId - ID of the exercise to restore.
   * @returns {Promise<void>} Resolves when the restore is complete.
   * @throws {Error} Throws if updating Firestore fails.
   */
  const restoreExercise = async (exerciseId: string): Promise<void> => {
    try {
      const exerciseDocReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.EXERCISES, exerciseId);
      await updateDoc(exerciseDocReference, {
        archived: false,
      });
    } catch (restoreError) {
      console.error("Failed to restore exercise:", restoreError);
      throw restoreError;
    }
  };

  return {
    exercises: exercisesList,
    loading: loadingState,
    addExercise,
    updateExercise,
    archiveExercise,
    restoreExercise,
  };
}
