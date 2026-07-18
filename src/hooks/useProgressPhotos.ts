"use client";

/**
 * @file useProgressPhotos.ts
 * @description Provides a hook to query, sync, and add progress photos directly in Firestore (as Base64 data URLs).
 */

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-collections";
import { ProgressPhoto } from "@/types/progress-photo";

/**
 * @description Custom hook for managing progress photos stored as Base64 strings in Firestore.
 * @returns {Object} Photos list, loading state, and mutate functions.
 */
export function useProgressPhotos() {
  const [photosList, setPhotosList] = useState<ProgressPhoto[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  useEffect(() => {
    const photosCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.PROGRESS_PHOTOS);
    const sortedPhotosQuery = query(photosCollection, orderBy("date", "desc"), orderBy("createdAt", "desc"));

    const unsubscribeFromPhotos = onSnapshot(sortedPhotosQuery, (querySnapshot) => {
      const parsedPhotos: ProgressPhoto[] = [];
      querySnapshot.forEach((documentSnapshot) => {
        parsedPhotos.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        } as ProgressPhoto);
      });
      setPhotosList(parsedPhotos);
      setLoadingState(false);
    });

    return () => unsubscribeFromPhotos();
  }, []);

  /**
   * @description Adds a new progress photo.
   * @param {string} dateString - Date of the photo ("YYYY-MM-DD").
   * @param {string} base64DataUrl - Base64 Data URL representation of the image.
   * @param {string | null} noteText - Optional caption.
   * @returns {Promise<string>} The new Firestore document ID.
   * @throws {Error} Throws if writing to Firestore fails.
   */
  const addProgressPhoto = async (
    dateString: string,
    base64DataUrl: string,
    noteText: string | null
  ): Promise<string> => {
    try {
      const photosCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.PROGRESS_PHOTOS);
      const newDocReference = await addDoc(photosCollection, {
        date: dateString,
        imageUrl: base64DataUrl, // Saved directly to Firestore document
        note: noteText ? noteText.trim() : null,
        createdAt: serverTimestamp(),
      });
      return newDocReference.id;
    } catch (writeError) {
      console.error("Failed to add progress photo:", writeError);
      throw writeError;
    }
  };

  /**
   * @description Deletes a progress photo.
   * @param {string} photoId - ID of the progress photo document.
   * @returns {Promise<void>} Resolves when the delete is complete.
   * @throws {Error} Throws if deleting from Firestore fails.
   */
  const deleteProgressPhoto = async (photoId: string): Promise<void> => {
    try {
      const photoDocReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.PROGRESS_PHOTOS, photoId);
      await deleteDoc(photoDocReference);
    } catch (deleteError) {
      console.error("Failed to delete progress photo:", deleteError);
      throw deleteError;
    }
  };

  return {
    photos: photosList,
    loading: loadingState,
    addProgressPhoto,
    deleteProgressPhoto,
  };
}
