"use client";

/**
 * @file useBodyWeights.ts
 * @description Hook to query, sync, and log body weight records in Firestore. Scaffolded to support user data isolation.
 */

import { useEffect, useState } from "react";
import {
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS, getUserCollection, getUserDoc } from "@/lib/firestore-collections";
import { useAuth } from "@/hooks/useAuth";

export interface BodyWeightLog {
  id: string;
  date: string;
  weight: number;
}

/**
 * @description Custom React hook to query and manage user body weight records.
 * Provides real-time synchronization with Firestore under an authenticated user path.
 * @returns {Object} Object containing logs array, loading state, and helper methods.
 */
export function useBodyWeights() {
  const { user } = useAuth();
  const authenticatedUserId = user?.uid;

  const [bodyWeightsList, setBodyWeightsList] = useState<BodyWeightLog[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  useEffect(() => {
    if (!authenticatedUserId) {
      setLoadingState(false);
      return;
    }

    const bodyWeightsCollection = getUserCollection(authenticatedUserId, FIRESTORE_COLLECTIONS.BODY_WEIGHTS);
    const sortedWeightsQuery = query(
      bodyWeightsCollection,
      orderBy("date", "desc"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeFromBodyWeights = onSnapshot(sortedWeightsQuery, (querySnapshot) => {
      const parsedBodyWeights: BodyWeightLog[] = [];
      querySnapshot.forEach((documentSnapshot) => {
        parsedBodyWeights.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        } as BodyWeightLog);
      });
      setBodyWeightsList(parsedBodyWeights);
      setLoadingState(false);
    });

    return () => unsubscribeFromBodyWeights();
  }, [authenticatedUserId]);

  /**
   * @description Logs a new body weight record to the database.
   * @param {number} bodyWeightValue - Body weight value in kilograms.
   * @param {string} logDateString - Date of the log in YYYY-MM-DD format.
   * @returns {Promise<void>} Resolves when the record is saved.
   */
  const addBodyWeight = async (bodyWeightValue: number, logDateString: string): Promise<void> => {
    if (!authenticatedUserId) {
      throw new Error("Unauthenticated user cannot log body weight.");
    }
    const bodyWeightsCollection = getUserCollection(authenticatedUserId, FIRESTORE_COLLECTIONS.BODY_WEIGHTS);
    await addDoc(bodyWeightsCollection, {
      weight: bodyWeightValue,
      date: logDateString,
      createdAt: serverTimestamp(),
    });
  };

  /**
   * @description Deletes an existing body weight record by document ID.
   * @param {string} logDocumentId - Unique ID of the body weight record.
   * @returns {Promise<void>} Resolves when the record is deleted.
   */
  const deleteBodyWeight = async (logDocumentId: string): Promise<void> => {
    if (!authenticatedUserId) {
      throw new Error("Unauthenticated user cannot delete body weight logs.");
    }
    const weightDocumentReference = getUserDoc(authenticatedUserId, FIRESTORE_COLLECTIONS.BODY_WEIGHTS, logDocumentId);
    await deleteDoc(weightDocumentReference);
  };

  return {
    bodyWeights: bodyWeightsList,
    loading: loadingState,
    addBodyWeight,
    deleteBodyWeight,
  };
}
