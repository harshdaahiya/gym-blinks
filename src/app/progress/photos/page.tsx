"use client";

/**
 * @file page.tsx (progress photos)
 * @description Page route for uploading, displaying, and managing a timeline of fitness progress photos.
 * Compresses images to Base64 to fit within Firestore's document limits since Cloud Storage is bypassed.
 */

import React, { useState, useRef } from "react";
import { useProgressPhotos } from "@/hooks/useProgressPhotos";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getLocalDateString, formatDisplayDate } from "@/lib/utils";
import { Camera, Trash2, Calendar, MessageSquare, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { ProgressPhoto } from "@/types/progress-photo";

/**
 * @description Progress Photos Page allowing users to track visual progress.
 * @returns {React.ReactElement} The Progress Photos page.
 */
export default function ProgressPhotosPage(): React.ReactElement {
  const { photos, loading, addProgressPhoto, deleteProgressPhoto } = useProgressPhotos();
  const fileInputReference = useRef<HTMLInputElement | null>(null);

  // Upload state
  const [uploadDate, setUploadDate] = useState<string>(getLocalDateString());
  const [photoNote, setPhotoNote] = useState<string>("");
  const [selectedBase64Image, setSelectedBase64Image] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Viewer state
  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null);

  /**
   * @description Compresses an image file using an HTML5 Canvas and converts it to a Base64 JPEG data URL.
   * @param {File} imageFile - The raw image file from input.
   * @returns {Promise<string>} Promise resolving to the compressed base64 data URL.
   */
  const compressImageFile = (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(imageFile);
      fileReader.onload = (fileEvent) => {
        const imageElement = new Image();
        imageElement.src = fileEvent.target?.result as string;
        imageElement.onload = () => {
          const canvasElement = document.createElement("canvas");
          const maximumDimensionLimit = 600; // Resize image to max 600px width/height to save bandwidth & space
          let targetWidth = imageElement.width;
          let targetHeight = imageElement.height;

          if (targetWidth > targetHeight) {
            if (targetWidth > maximumDimensionLimit) {
              targetHeight = Math.round((targetHeight * maximumDimensionLimit) / targetWidth);
              targetWidth = maximumDimensionLimit;
            }
          } else {
            if (targetHeight > maximumDimensionLimit) {
              targetWidth = Math.round((targetWidth * maximumDimensionLimit) / targetHeight);
              targetHeight = maximumDimensionLimit;
            }
          }

          canvasElement.width = targetWidth;
          canvasElement.height = targetHeight;
          const canvasContext2d = canvasElement.getContext("2d");
          if (!canvasContext2d) {
            reject(new Error("Failed to get canvas context."));
            return;
          }

          canvasContext2d.drawImage(imageElement, 0, 0, targetWidth, targetHeight);
          // Compress quality to 0.6 to minimize size (typically results in ~30KB - 80KB)
          const base64CompressedUrl = canvasElement.toDataURL("image/jpeg", 0.6);
          resolve(base64CompressedUrl);
        };
        imageElement.onerror = (imageLoadError) => reject(imageLoadError);
      };
      fileReader.onerror = (fileReadError) => reject(fileReadError);
    });
  };

  /**
   * @description Handles local file selection and triggers compression.
   */
  const handleFileChange = async (changeEvent: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selectedFiles = changeEvent.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const targetedFile = selectedFiles[0];
    const compressionToastId = toast.loading("Compressing photo...");
    try {
      const base64Data = await compressImageFile(targetedFile);
      setSelectedBase64Image(base64Data);
      setUploadDate(getLocalDateString());
      setPhotoNote("");
      setIsUploadModalOpen(true);
      toast.dismiss(compressionToastId);
    } catch (compressionError) {
      console.error("Compression failed:", compressionError);
      toast.error("Failed to process image.", { id: compressionToastId });
    } finally {
      // Reset input value so same file can be re-selected if needed
      if (fileInputReference.current) {
        fileInputReference.current.value = "";
      }
    }
  };

  /**
   * @description Submits the photo upload payload to Firestore.
   */
  const handlePhotoUpload = async (): Promise<void> => {
    if (!selectedBase64Image) {
      toast.error("No image selected.");
      return;
    }

    setUploading(true);
    const saveToastId = toast.loading("Saving progress photo...");
    try {
      await addProgressPhoto(uploadDate, selectedBase64Image, photoNote);
      setIsUploadModalOpen(false);
      setSelectedBase64Image("");
      setPhotoNote("");
      toast.success("Progress photo saved successfully!", { id: saveToastId });
    } catch (saveError) {
      console.error("Save failed:", saveError);
      toast.error("Failed to save progress photo.", { id: saveToastId });
    } finally {
      setUploading(false);
    }
  };

  /**
   * @description Deletes a progress photo document.
   * @param {string} photoId - ID of the photo to delete.
   */
  const handlePhotoDeletion = async (photoId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this progress photo?")) {
      return;
    }

    try {
      await deleteProgressPhoto(photoId);
      setViewingPhoto(null);
      toast.success("Progress photo deleted.");
    } catch (deleteError) {
      console.error("Delete failed:", deleteError);
      toast.error("Failed to delete photo.");
    }
  };

  const handleTriggerFilePicker = (): void => {
    fileInputReference.current?.click();
  };

  if (loading) {
    return React.createElement(
      PageShell,
      { className: "flex items-center justify-center min-h-[50vh]" },
      React.createElement("p", { className: "text-muted-foreground text-sm" }, "Loading progress photos...")
    );
  }

  return React.createElement(
    PageShell,
    { className: "space-y-6" },
    React.createElement(
      "div",
      { className: "flex items-center justify-between" },
      React.createElement("h2", { className: "text-xl font-bold tracking-tight" }, "Progress Photos"),
      React.createElement(
        "div",
        null,
        React.createElement("input", {
          type: "file",
          ref: fileInputReference,
          onChange: handleFileChange,
          accept: "image/*",
          className: "hidden",
        }),
        React.createElement(
          Button,
          { onClick: handleTriggerFilePicker, size: "sm", className: "gap-1 text-xs" },
          React.createElement(Camera, { className: "h-4 w-4" }),
          "Add Photo"
        )
      )
    ),
    photos.length === 0
      ? React.createElement(
          "div",
          { className: "text-center py-12 border border-dashed rounded-lg bg-card" },
          React.createElement("p", { className: "text-sm text-muted-foreground" }, "Upload your first progress photo to start a timeline.")
        )
      : React.createElement(
          "div",
          { className: "grid grid-cols-2 gap-3" },
          photos.map((photoItem) =>
            React.createElement(
              Card,
              {
                key: photoItem.id,
                onClick: () => setViewingPhoto(photoItem),
                className: "overflow-hidden border-border bg-card cursor-pointer group hover:border-primary/50 transition-colors shadow-none"
              },
              React.createElement(
                "div",
                { className: "relative aspect-square bg-muted flex items-center justify-center overflow-hidden" },
                React.createElement("img", {
                  src: photoItem.imageUrl,
                  alt: photoItem.note || "Progress photo",
                  className: "object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                }),
                React.createElement(
                  "div",
                  { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" },
                  React.createElement(ZoomIn, { className: "h-6 w-6 text-white" })
                )
              ),
              React.createElement(
                CardContent,
                { className: "p-2 space-y-0.5" },
                React.createElement(
                  "div",
                  { className: "flex items-center gap-1 text-[10px] font-semibold text-muted-foreground" },
                  React.createElement(Calendar, { className: "h-3 w-3" }),
                  React.createElement("span", null, formatDisplayDate(photoItem.date))
                ),
                photoItem.note &&
                  React.createElement(
                    "p",
                    { className: "text-[11px] text-foreground truncate" },
                    photoItem.note
                  )
              )
            )
          )
        ),
    React.createElement(
      Dialog,
      { open: isUploadModalOpen, onOpenChange: setIsUploadModalOpen },
      React.createElement(
        DialogContent,
        { className: "bg-card border-border max-w-[340px] rounded-lg" },
        React.createElement(
          DialogHeader,
          null,
          React.createElement(DialogTitle, null, "Add Progress Photo"),
          React.createElement(DialogDescription, { className: "text-xs text-muted-foreground" }, "Confirm details for your progress photo.")
        ),
        React.createElement(
          "div",
          { className: "space-y-4 py-2" },
          selectedBase64Image &&
            React.createElement(
              "div",
              { className: "relative aspect-video bg-muted rounded-md overflow-hidden border border-border flex items-center justify-center" },
              React.createElement("img", {
                src: selectedBase64Image,
                alt: "Preview",
                className: "object-contain w-full h-full"
              })
            ),
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "upload-date" }, "Photo Date"),
            React.createElement(Input, {
              id: "upload-date",
              type: "date",
              value: uploadDate,
              onChange: (event) => setUploadDate(event.target.value),
              className: "bg-background",
            })
          ),
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "upload-note" }, "Caption (Optional)"),
            React.createElement(Input, {
              id: "upload-note",
              placeholder: "e.g. 3 months progress",
              value: photoNote,
              onChange: (event) => setPhotoNote(event.target.value),
              className: "bg-background",
            })
          )
        ),
        React.createElement(
          DialogFooter,
          { className: "flex-row justify-end gap-2 pt-2" },
          React.createElement(
            Button,
            { variant: "outline", size: "sm", onClick: () => setIsUploadModalOpen(false) },
            "Cancel"
          ),
          React.createElement(
            Button,
            { size: "sm", onClick: handlePhotoUpload, disabled: uploading },
            uploading ? "Saving..." : "Save Photo"
          )
        )
      )
    ),
    React.createElement(
      Dialog,
      { open: viewingPhoto !== null, onOpenChange: (open) => { if (!open) setViewingPhoto(null); } },
      viewingPhoto &&
        React.createElement(
          DialogContent,
          { className: "bg-card border-border max-w-[360px] rounded-lg p-4" },
          React.createElement(
            DialogHeader,
            null,
            React.createElement(DialogTitle, { className: "text-sm flex items-center gap-1.5" }, React.createElement(Calendar, { className: "h-4 w-4 text-muted-foreground" }), formatDisplayDate(viewingPhoto.date))
          ),
          React.createElement(
            "div",
            { className: "space-y-4 py-2" },
            React.createElement(
              "div",
              { className: "relative aspect-square bg-muted rounded-md overflow-hidden border border-border flex items-center justify-center" },
              React.createElement("img", {
                src: viewingPhoto.imageUrl,
                alt: viewingPhoto.note || "Progress photo",
                className: "object-contain w-full h-full"
              })
            ),
            viewingPhoto.note &&
              React.createElement(
                "div",
                { className: "flex items-start gap-2 p-2 bg-secondary/50 rounded-md border text-xs text-foreground" },
                React.createElement(MessageSquare, { className: "h-4 w-4 text-muted-foreground shrink-0 mt-0.5" }),
                React.createElement("p", null, viewingPhoto.note)
              )
          ),
          React.createElement(
            DialogFooter,
            { className: "flex-row justify-between items-center pt-2" },
            React.createElement(
              Button,
              {
                variant: "destructive",
                size: "sm",
                onClick: () => handlePhotoDeletion(viewingPhoto.id),
                className: "gap-1.5 h-8 text-xs",
              },
              React.createElement(Trash2, { className: "h-3.5 w-3.5" }),
              "Delete Photo"
            ),
            React.createElement(
              Button,
              { variant: "outline", size: "sm", onClick: () => setViewingPhoto(null), className: "h-8 text-xs" },
              "Close"
            )
          )
        )
    )
  );
}
