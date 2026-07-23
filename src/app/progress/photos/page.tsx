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
import { getLocalDateString, formatDisplayDate, cn } from "@/lib/utils";
import { Camera, Trash2, Calendar, MessageSquare, ZoomIn, List, LayoutGrid, Grid } from "lucide-react";
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
  const [mobileColumns, setMobileColumns] = useState<1 | 2 | 3>(2);

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

  // Helper to render columns selector
  const renderColumnsSelector = () => {
    const selectorOptions = [
      { count: 1, icon: List, label: "Detailed" },
      { count: 2, icon: LayoutGrid, label: "Grid" },
      { count: 3, icon: Grid, label: "Overview" },
    ] as const;

    return React.createElement(
      "div",
      { className: "flex border border-border/60 rounded-md overflow-hidden bg-background" },
      selectorOptions.map((optionItem) =>
        React.createElement(
          "button",
          {
            key: optionItem.count,
            onClick: () => setMobileColumns(optionItem.count),
            className: cn(
              "p-1.5 transition-all cursor-pointer flex items-center justify-center",
              mobileColumns === optionItem.count
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            ),
            title: optionItem.label
          },
          React.createElement(optionItem.icon, { className: "h-3.5 w-3.5" })
        )
      )
    );
  };

  // Group photos chronologically by Month/Year
  const groupedProgressPhotos = (() => {
    const photoGroupsMap: Record<string, ProgressPhoto[]> = {};
    
    for (let photoIndex = 0; photoIndex < photos.length; photoIndex++) {
      const photoItem = photos[photoIndex];
      const parsedDate = new Date(photoItem.date + "T00:00:00");
      const monthYearLabel = parsedDate.toLocaleString("default", { month: "long", year: "numeric" });
      
      if (!photoGroupsMap[monthYearLabel]) {
        photoGroupsMap[monthYearLabel] = [];
      }
      photoGroupsMap[monthYearLabel].push(photoItem);
    }
    
    return Object.entries(photoGroupsMap);
  })();

  const columnsClass =
    mobileColumns === 1
      ? "columns-1 sm:columns-2 md:columns-3 gap-4"
      : mobileColumns === 2
      ? "columns-2 sm:columns-3 md:columns-4 gap-3"
      : "columns-3 sm:columns-4 md:columns-6 gap-2";

  return React.createElement(
    PageShell,
    { className: "space-y-6 pb-12" },
    React.createElement(
      "div",
      { className: "flex items-center justify-between" },
      React.createElement(
        "div",
        null,
        React.createElement("h2", { className: "text-xl font-bold tracking-tight" }, "Progress Photos"),
        React.createElement(
          "p",
          { className: "text-xs text-muted-foreground mt-0.5" },
          photos.length === 0 
            ? "Log visual milestones to track body recomposition"
            : `${photos.length} visual milestones logged`
        )
      ),
      React.createElement(
        "div",
        { className: "flex items-center gap-2 shrink-0" },
        photos.length > 0 && renderColumnsSelector(),
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
          { className: "text-center py-16 border border-dashed rounded-lg bg-card flex flex-col items-center justify-center gap-3 px-4" },
          React.createElement(
            "div",
            { className: "h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0" },
            React.createElement(Camera, { className: "h-6 w-6" })
          ),
          React.createElement(
            "div",
            { className: "space-y-1" },
            React.createElement("h3", { className: "font-semibold text-sm" }, "No progress photos"),
            React.createElement(
              "p",
              { className: "text-xs text-muted-foreground max-w-[260px]" },
              "Upload regular physical check-ins to monitor visual muscle gains and fat loss."
            )
          ),
          React.createElement(
            Button,
            { onClick: handleTriggerFilePicker, size: "sm", className: "mt-1 text-xs gap-1.5" },
            React.createElement(Camera, { className: "h-4 w-4" }),
            "Upload First Photo"
          )
        )
      : React.createElement(
          "div",
          { className: "space-y-6" },
          groupedProgressPhotos.map(([monthYearName, photoGroupList]) =>
            React.createElement(
              "div",
              { key: monthYearName, className: "space-y-3" },
              React.createElement(
                "h3",
                { className: "text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1" },
                monthYearName
              ),
              React.createElement(
                "div",
                { className: columnsClass },
                photoGroupList.map((photoItem) => {
                  const dateBadgeClass =
                    mobileColumns === 3
                      ? "absolute bottom-1 right-1 px-1 py-0.5 rounded-sm bg-background/25 backdrop-blur-[1px] text-[7.5px] font-bold text-foreground/80 flex items-center border border-border/5 select-none"
                      : mobileColumns === 2
                      ? "absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-background/20 backdrop-blur-[2px] text-[8px] font-bold text-foreground/80 flex items-center border border-border/10 select-none gap-1"
                      : "absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-background/20 backdrop-blur-[2px] text-[9px] font-bold text-foreground/80 flex items-center border border-border/10 select-none gap-1";

                  const showCalendarIcon = mobileColumns < 3;

                  return React.createElement(
                    Card,
                    {
                      key: photoItem.id,
                      onClick: () => setViewingPhoto(photoItem),
                      className: cn(
                        "break-inside-avoid overflow-hidden border border-border bg-card cursor-pointer group hover:border-primary/50 transition-all duration-300 shadow-none rounded-lg flex flex-col",
                        mobileColumns === 3 ? "mb-2" : mobileColumns === 2 ? "mb-3" : "mb-4"
                      )
                    },
                    React.createElement(
                      "div",
                      { className: "relative bg-muted/5 overflow-hidden" },
                      React.createElement("img", {
                        src: photoItem.imageUrl,
                        alt: photoItem.note || "Progress photo",
                        className: "w-full h-auto block group-hover:scale-[1.01] transition-transform duration-500"
                      }),
                      React.createElement(
                        "div",
                        { className: "absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300" },
                        React.createElement(ZoomIn, { className: "h-6 w-6 text-white" })
                      ),
                      React.createElement(
                        "div",
                        { className: dateBadgeClass },
                        showCalendarIcon && React.createElement(Calendar, { className: "h-2.5 w-2.5 text-foreground/60" }),
                        formatDisplayDate(photoItem.date)
                      )
                    ),
                    photoItem.note && mobileColumns < 3 &&
                      React.createElement(
                        CardContent,
                        { className: "p-3 border-t border-border/20 bg-muted/5" },
                        React.createElement(
                          "p",
                          { className: "text-xs text-foreground font-medium" },
                          photoItem.note
                        )
                      )
                  );
                })
              )
            )
          )
        ),

    // -------------------------------------------------------------
    // MODAL DIALOG: ADD PROGRESS PHOTO
    // -------------------------------------------------------------
    React.createElement(
      Dialog,
      { open: isUploadModalOpen, onOpenChange: setIsUploadModalOpen },
      React.createElement(
        DialogContent,
        { className: "bg-card border-border max-w-[340px] rounded-lg p-4" },
        React.createElement(
          DialogHeader,
          null,
          React.createElement(DialogTitle, null, "Add Progress Photo"),
          React.createElement(
            DialogDescription,
            { className: "text-xs text-muted-foreground" },
            "Add a caption and verify the check-in date."
          )
        ),
        React.createElement(
          "div",
          { className: "space-y-4 py-2" },
          selectedBase64Image &&
            React.createElement(
              "div",
              { className: "relative aspect-square max-w-[200px] mx-auto bg-muted rounded-md overflow-hidden border border-border/80 p-1 flex items-center justify-center bg-card shadow-sm" },
              React.createElement("img", {
                src: selectedBase64Image,
                alt: "Preview",
                className: "object-cover w-full h-full rounded"
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
              className: "bg-background h-9 text-sm",
            })
          ),
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "upload-note" }, "Caption (Optional)"),
            React.createElement(Input, {
              id: "upload-note",
              placeholder: "e.g. Back muscles definition",
              value: photoNote,
              onChange: (event) => setPhotoNote(event.target.value),
              className: "bg-background h-9 text-sm",
            })
          )
        ),
        React.createElement(
          DialogFooter,
          { className: "flex flex-row justify-end gap-2 pt-2" },
          React.createElement(
            Button,
            {
              variant: "outline",
              onClick: () => setIsUploadModalOpen(false),
              className: "h-9 text-xs"
            },
            "Cancel"
          ),
          React.createElement(
            Button,
            {
              onClick: handlePhotoUpload,
              disabled: uploading,
              className: "h-9 text-xs"
            },
            uploading ? "Saving..." : "Save Photo"
          )
        )
      )
    ),

    // -------------------------------------------------------------
    // MODAL DIALOG: VIEW PROGRESS PHOTO
    // -------------------------------------------------------------
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
            React.createElement(
              DialogTitle,
              { className: "text-sm flex items-center gap-1.5" },
              React.createElement(Calendar, { className: "h-4 w-4 text-primary" }),
              formatDisplayDate(viewingPhoto.date)
            )
          ),
          React.createElement(
            "div",
            { className: "space-y-4 py-2" },
            React.createElement(
              "div",
              { className: "relative aspect-square bg-black/90 rounded-md overflow-hidden border border-border flex items-center justify-center" },
              React.createElement("img", {
                src: viewingPhoto.imageUrl,
                alt: viewingPhoto.note || "Progress photo",
                className: "object-contain w-full h-full"
              })
            ),
            viewingPhoto.note &&
              React.createElement(
                "div",
                { className: "flex items-start gap-2 p-2.5 bg-muted/20 rounded-md border text-xs text-foreground" },
                React.createElement(MessageSquare, { className: "h-4 w-4 text-muted-foreground shrink-0 mt-0.5" }),
                React.createElement("p", null, viewingPhoto.note)
              )
          ),
          React.createElement(
            DialogFooter,
            { className: "flex flex-row justify-between items-center pt-2" },
            React.createElement(
              Button,
              {
                variant: "destructive",
                onClick: () => handlePhotoDeletion(viewingPhoto.id),
                className: "gap-1 h-8 px-2.5 text-xs font-semibold",
              },
              React.createElement(Trash2, { className: "h-3.5 w-3.5" }),
              "Delete"
            ),
            React.createElement(
              Button,
              {
                variant: "outline",
                onClick: () => setViewingPhoto(null),
                className: "h-8 px-3 text-xs"
              },
              "Close"
            )
          )
        )
    )
  );
}
