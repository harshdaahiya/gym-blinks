import { Timestamp } from "firebase/firestore";

/**
 * Represents a progress photo entry with the base64-encoded image content.
 */
export interface ProgressPhoto {
  id: string;
  date: string; // YYYY-MM-DD format
  imageUrl: string; // Base64 Data URL (e.g. data:image/jpeg;base64,...)
  note: string | null;
  createdAt: Timestamp;
}
