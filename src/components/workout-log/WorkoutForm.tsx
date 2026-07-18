"use client";

/**
 * @file WorkoutForm.tsx
 * @description Form for logging new workout sessions or editing existing ones.
 * Incorporates progressive overload history tips, custom set rows, and inline exercise creation.
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExercises } from "@/hooks/useExercises";
import { useWorkoutDays } from "@/hooks/useWorkoutDays";
import { useLastSession, LastSessionDetails } from "@/hooks/useLastSession";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getLocalDateString, cn } from "@/lib/utils";
import { Plus, Trash2, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { ExerciseEntry, SetEntry, WorkoutLog } from "@/types/workout-log";

interface WorkoutFormProps {
  initialLogData?: WorkoutLog;
  onSave: (logPayload: { date: string; dayId: string; entries: ExerciseEntry[]; notes: string | null }) => Promise<{ logId: string; newPRs: any[] } | any[]>;
}

/**
 * @description Master component for logging a workout session.
 * @param {WorkoutFormProps} props - Component properties.
 * @returns {React.ReactElement} The WorkoutForm component.
 */
export function WorkoutForm({ initialLogData, onSave }: WorkoutFormProps): React.ReactElement {
  const router = useRouter();
  const { exercises, addExercise } = useExercises();
  const { workoutDays } = useWorkoutDays();
  const { fetchLastSession, fetchLastWorkoutLogForDay } = useLastSession();

  // Form states
  const [sessionDate, setSessionDate] = useState<string>(initialLogData?.date || getLocalDateString());
  const [selectedDayId, setSelectedDayId] = useState<string>(initialLogData?.dayId || "");
  const [sessionNotes, setSessionNotes] = useState<string>(initialLogData?.notes || "");
  const [sessionEntries, setSessionEntries] = useState<ExerciseEntry[]>(initialLogData?.entries || []);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copyingLastSession, setCopyingLastSession] = useState<boolean>(false);

  /**
   * @description Copies the exercise and set list from the last session logged for this dayId.
   */
  const handleCopyLastSession = async (): Promise<void> => {
    if (!selectedDayId) {
      toast.error("Please select a routine day first.");
      return;
    }

    setCopyingLastSession(true);
    try {
      const lastLog = await fetchLastWorkoutLogForDay(selectedDayId);
      if (!lastLog || lastLog.entries.length === 0) {
        toast.info("No previous session found for this routine day.");
        return;
      }

      const copiedEntries: ExerciseEntry[] = lastLog.entries.map((entry) => ({
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        sets: entry.sets.map((setItem) => ({
          weight: setItem.weight,
          reps: setItem.reps,
        })),
      }));

      setSessionEntries(copiedEntries);
      toast.success("Successfully copied exercises and sets from last session.");
    } catch (copyError) {
      console.error("Failed to copy last session:", copyError);
      toast.error("An error occurred while copying your last session.");
    } finally {
      setCopyingLastSession(false);
    }
  };

  // Exercise selector states
  const [showAllExercises, setShowAllExercises] = useState<boolean>(false);
  const [selectedExerciseToAdd, setSelectedExerciseToAdd] = useState<string>("");

  // Progressive Overload hints state
  const [lastSessionHints, setLastSessionHints] = useState<Record<string, LastSessionDetails>>({});

  // Inline exercise creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>("");
  const [newExerciseDayId, setNewExerciseDayId] = useState<string>("");

  // Collapsed exercises state: keys are exercise IDs, values are true if collapsed
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});

  /**
   * @description Toggles the collapse state of an exercise card.
   * @param {string} exerciseId - ID of the exercise.
   */
  const toggleExerciseCollapse = (exerciseId: string): void => {
    setCollapsedExercises((prevCollapsedState) => ({
      ...prevCollapsedState,
      [exerciseId]: !prevCollapsedState[exerciseId],
    }));
  };

  // Load last session hints for each exercise in the current workout session
  useEffect(() => {
    const loadAllHints = async (): Promise<void> => {
      const updatedHints: Record<string, LastSessionDetails> = {};
      for (let entryIndex = 0; entryIndex < sessionEntries.length; entryIndex++) {
        const exerciseId = sessionEntries[entryIndex].exerciseId;
        const previousSessionDetails = await fetchLastSession(exerciseId);
        if (previousSessionDetails) {
          updatedHints[exerciseId] = previousSessionDetails;
        }
      }
      setLastSessionHints(updatedHints);
    };

    if (sessionEntries.length > 0) {
      loadAllHints().catch((hintError) => {
        console.error("Failed loading hints:", hintError);
      });
    }
  }, [sessionEntries, fetchLastSession]);

  // Set default Day ID to the first day type if not selected
  useEffect(() => {
    if (workoutDays.length > 0 && !selectedDayId && !initialLogData) {
      setSelectedDayId(workoutDays[0].id);
    }
  }, [workoutDays, selectedDayId, initialLogData]);

  // Filter exercises to display in the quick selection list
  const filteredExercisesList = exercises.filter(
    (exerciseItem) => !exerciseItem.archived && (showAllExercises || exerciseItem.dayId === selectedDayId)
  );

  /**
   * @description Adds an exercise to the current active session.
   * @param {string} exerciseId - ID of the exercise.
   */
  const handleAddExerciseToSession = async (exerciseId: string): Promise<void> => {
    if (!exerciseId) return;

    const matchingExercise = exercises.find((item) => item.id === exerciseId);
    if (!matchingExercise) return;

    // Avoid duplicate additions
    if (sessionEntries.some((item) => item.exerciseId === exerciseId)) {
      toast.warning(`${matchingExercise.name} is already added.`);
      return;
    }

    const previousSessionDetails = await fetchLastSession(exerciseId);
    let defaultSetRows: SetEntry[] = [{ weight: 0, reps: 0 }];

    if (previousSessionDetails && previousSessionDetails.sets.length > 0) {
      // Pre-fill sets based on the last session
      defaultSetRows = previousSessionDetails.sets.map((previousSet) => ({
        weight: previousSet.weight,
        reps: previousSet.reps,
      }));
    }

    const newSessionEntry: ExerciseEntry = {
      exerciseId: matchingExercise.id,
      exerciseName: matchingExercise.name,
      sets: defaultSetRows,
    };

    setSessionEntries((previousEntries) => [...previousEntries, newSessionEntry]);
    setSelectedExerciseToAdd("");
    toast.success(`Added ${matchingExercise.name}`);
  };

  /**
   * @description Removes an exercise from the active session.
   * @param {string} exerciseId - ID of the exercise to remove.
   */
  const handleRemoveExerciseFromSession = (exerciseId: string): void => {
    setSessionEntries((previousEntries) =>
      previousEntries.filter((item) => item.exerciseId !== exerciseId)
    );
  };

  /**
   * @description Updates weight or reps parameter for a specific set in the session.
   */
  const handleSetFieldUpdate = (
    exerciseId: string,
    setIndex: number,
    fieldKey: "weight" | "reps",
    numericValue: number
  ): void => {
    setSessionEntries((previousEntries) =>
      previousEntries.map((exerciseEntry) => {
        if (exerciseEntry.exerciseId !== exerciseId) {
          return exerciseEntry;
        }

        const updatedSetRows = exerciseEntry.sets.map((setItem, index) => {
          if (index !== setIndex) {
            return setItem;
          }
          return {
            ...setItem,
            [fieldKey]: numericValue,
          };
        });

        return {
          ...exerciseEntry,
          sets: updatedSetRows,
        };
      })
    );
  };

  /**
   * @description Adds a new set row to the exercise block.
   */
  const handleAddSetRow = (exerciseId: string): void => {
    setSessionEntries((previousEntries) =>
      previousEntries.map((exerciseEntry) => {
        if (exerciseEntry.exerciseId !== exerciseId) {
          return exerciseEntry;
        }

        // Clone the last set's weight/reps as a helper starting point
        const lastSetItem = exerciseEntry.sets[exerciseEntry.sets.length - 1];
        const newSetTemplate: SetEntry = lastSetItem
          ? { weight: lastSetItem.weight, reps: lastSetItem.reps }
          : { weight: 0, reps: 0 };

        return {
          ...exerciseEntry,
          sets: [...exerciseEntry.sets, newSetTemplate],
        };
      })
    );
  };

  /**
   * @description Removes a set row from the exercise block.
   */
  const handleRemoveSetRow = (exerciseId: string, setIndex: number): void => {
    setSessionEntries((previousEntries) =>
      previousEntries.map((exerciseEntry) => {
        if (exerciseEntry.exerciseId !== exerciseId) {
          return exerciseEntry;
        }

        // Keep at least one set
        if (exerciseEntry.sets.length <= 1) {
          return exerciseEntry;
        }

        return {
          ...exerciseEntry,
          sets: exerciseEntry.sets.filter((_, index) => index !== setIndex),
        };
      })
    );
  };

  /**
   * @description Saves the logged session and presents achievements.
   */
  const handleSaveWorkout = async (): Promise<void> => {
    if (!sessionDate) {
      toast.error("Please select a date.");
      return;
    }
    if (!selectedDayId) {
      toast.error("Please select a routine day.");
      return;
    }
    if (sessionEntries.length === 0) {
      toast.error("Please add at least one exercise.");
      return;
    }

    // Validation check: ensure weights/reps are valid numbers
    for (let entryIndex = 0; entryIndex < sessionEntries.length; entryIndex++) {
      const entryItem = sessionEntries[entryIndex];
      for (let setIndex = 0; setIndex < entryItem.sets.length; setIndex++) {
        const setItem = entryItem.sets[setIndex];
        if (setItem.weight <= 0 || setItem.reps <= 0) {
          toast.error(`Please enter valid weight and reps for ${entryItem.exerciseName}.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const saveResponse = await onSave({
        date: sessionDate,
        dayId: selectedDayId,
        entries: sessionEntries,
        notes: sessionNotes ? sessionNotes.trim() : null,
      });

      const personalRecordsArray = Array.isArray(saveResponse) ? saveResponse : saveResponse?.newPRs || [];

      // Celebrate and show success toast
      toast.success("Workout session saved!");

      if (personalRecordsArray.length > 0) {
        personalRecordsArray.forEach((prDetailsItem: any) => {
          toast(`New Personal Record on ${prDetailsItem.exerciseName}! 🎉 ${prDetailsItem.weight}kg × ${prDetailsItem.reps} reps`, {
            icon: React.createElement(Sparkles, { className: "h-5 w-5 text-amber-500" }),
            duration: 5000,
          });
        });
      }

      router.push("/");
      router.refresh();
    } catch (saveError) {
      console.error("Save error:", saveError);
      toast.error("Failed to save workout session.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * @description Submits the inline exercise creation modal.
   */
  const handleCreateExerciseInline = async (): Promise<void> => {
    if (!newExerciseName) {
      toast.error("Please enter an exercise name.");
      return;
    }
    if (!newExerciseDayId) {
      toast.error("Please assign a routine day.");
      return;
    }

    try {
      const newExerciseId = await addExercise(newExerciseName, newExerciseDayId);
      setIsCreateModalOpen(false);
      setNewExerciseName("");
      toast.success("Exercise added!");
      // Automatically add this exercise to the session if it matches the current workout day
      if (newExerciseDayId === selectedDayId) {
        await handleAddExerciseToSession(newExerciseId);
      }
    } catch (createError) {
      console.error("Failed to add exercise:", createError);
      toast.error("Failed to create exercise.");
    }
  };

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(
      Card,
      { className: "border-border bg-card" },
      React.createElement(
        CardContent,
        { className: "pt-6 space-y-4" },
        React.createElement(
          "div",
          { className: "space-y-1.5" },
          React.createElement(Label, { htmlFor: "date" }, "Workout Date"),
          React.createElement(Input, {
            id: "date",
            type: "date",
            value: sessionDate,
            onChange: (event) => setSessionDate(event.target.value),
            className: "bg-background",
          })
        ),
        React.createElement(
          "div",
          { className: "space-y-2" },
          React.createElement(Label, null, "Routine Day Type"),
          React.createElement(
            "div",
            { className: "flex flex-wrap gap-2" },
            workoutDays.map((dayItem) => {
              const isSelected = dayItem.id === selectedDayId;
              return React.createElement(
                Badge,
                {
                  key: dayItem.id,
                  onClick: () => setSelectedDayId(dayItem.id),
                  className: cn(
                    "cursor-pointer text-xs py-1.5 px-3 select-none transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground hover:bg-primary/95"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
                  ),
                },
                dayItem.name
              );
            })
          )
        ),
        !initialLogData &&
          React.createElement(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              disabled: !selectedDayId || copyingLastSession,
              onClick: handleCopyLastSession,
              className: "w-full text-xs font-semibold gap-1.5 h-9 bg-background hover:bg-muted/50 border-dashed border-primary/20",
            },
            React.createElement(Sparkles, { className: "h-3.5 w-3.5 text-primary" }),
            copyingLastSession ? "Loading Previous Session..." : "Copy Last Session"
          )
      )
    ),
    React.createElement(
      "div",
      { className: "space-y-4" },
      sessionEntries.map((sessionEntry) => {
        const exerciseHint = lastSessionHints[sessionEntry.exerciseId];
        const isCollapsed = !!collapsedExercises[sessionEntry.exerciseId];
        return React.createElement(
          Card,
          { key: sessionEntry.exerciseId, className: "border-border bg-card" },
          React.createElement(
            CardContent,
            { className: "pt-4 pb-4 space-y-4" },
            React.createElement(
              "div",
              { className: "flex items-center justify-between" },
              React.createElement(
                "div",
                {
                  onClick: () => toggleExerciseCollapse(sessionEntry.exerciseId),
                  className: "flex-1 flex items-center gap-2 cursor-pointer select-none",
                },
                React.createElement(isCollapsed ? ChevronDown : ChevronUp, {
                  className: "h-4 w-4 text-muted-foreground shrink-0",
                }),
                React.createElement(
                  "div",
                  { className: "space-y-0.5" },
                  React.createElement("h4", { className: "font-semibold text-sm" }, sessionEntry.exerciseName),
                  exerciseHint &&
                    React.createElement(
                      "p",
                      { className: "text-[11px] text-muted-foreground italic" },
                      "Last time: ",
                      exerciseHint.formattedString
                    )
                )
              ),
              React.createElement(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => handleRemoveExerciseFromSession(sessionEntry.exerciseId),
                  className: "h-8 w-8 text-muted-foreground hover:text-destructive",
                },
                React.createElement(Trash2, { className: "h-4 w-4" })
              )
            ),
            !isCollapsed &&
              React.createElement(
                React.Fragment,
                null,
                React.createElement(
                  "div",
                  { className: "space-y-2" },
                  React.createElement(
                    "div",
                    { className: "grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-2" },
                    React.createElement("div", { className: "col-span-2 text-center" }, "Set"),
                    React.createElement("div", { className: "col-span-4" }, "Weight (kg)"),
                    React.createElement("div", { className: "col-span-4" }, "Reps"),
                    React.createElement("div", { className: "col-span-2" })
                  ),
                  React.createElement(
                    "div",
                    { className: "space-y-2" },
                    sessionEntry.sets.map((setItem, index) =>
                      React.createElement(
                        "div",
                        { key: index, className: "grid grid-cols-12 gap-2 items-center" },
                        React.createElement(
                          "div",
                          { className: "col-span-2 text-center text-xs font-medium text-muted-foreground" },
                          index + 1
                        ),
                        React.createElement(
                          "div",
                          { className: "col-span-4" },
                          React.createElement(Input, {
                            type: "number",
                            inputMode: "decimal",
                            placeholder: "0",
                            value: setItem.weight || "",
                            onChange: (event) =>
                              handleSetFieldUpdate(
                                sessionEntry.exerciseId,
                                index,
                                "weight",
                                parseFloat(event.target.value) || 0
                              ),
                            className: "h-8 text-xs bg-background",
                          })
                        ),
                        React.createElement(
                          "div",
                          { className: "col-span-4" },
                          React.createElement(Input, {
                            type: "number",
                            inputMode: "numeric",
                            placeholder: "0",
                            value: setItem.reps || "",
                            onChange: (event) =>
                              handleSetFieldUpdate(
                                sessionEntry.exerciseId,
                                index,
                                "reps",
                                parseInt(event.target.value, 10) || 0
                              ),
                            className: "h-8 text-xs bg-background",
                          })
                        ),
                        React.createElement(
                          "div",
                          { className: "col-span-2 flex justify-center" },
                          React.createElement(
                            Button,
                            {
                              variant: "ghost",
                              size: "icon",
                              disabled: sessionEntry.sets.length <= 1,
                              onClick: () => handleRemoveSetRow(sessionEntry.exerciseId, index),
                              className: "h-8 w-8 text-muted-foreground hover:text-destructive",
                            },
                            React.createElement(Trash2, { className: "h-3.5 w-3.5" })
                          )
                        )
                      )
                    )
                  )
                ),
                React.createElement(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: () => handleAddSetRow(sessionEntry.exerciseId),
                    className: "w-full h-8 text-xs gap-1",
                  },
                  React.createElement(Plus, { className: "h-3.5 w-3.5" }),
                  "Add Set"
                )
              )
          )
        );
      })
    ),
    React.createElement(
      Card,
      { className: "border-border bg-card" },
      React.createElement(
        CardContent,
        { className: "pt-6 space-y-4" },
        React.createElement(
          "div",
          { className: "space-y-1.5" },
          React.createElement(Label, null, "Add Exercise to Session"),
          React.createElement(
            "div",
            { className: "flex gap-2" },
            React.createElement(
              Select,
              {
                value: selectedExerciseToAdd,
                onValueChange: (value: unknown) => setSelectedExerciseToAdd(value as string),
              },
              React.createElement(
                SelectTrigger,
                { className: "bg-background flex-1 text-xs" },
                React.createElement(SelectValue, { placeholder: "Select an exercise..." })
              ),
              React.createElement(
                SelectContent,
                null,
                filteredExercisesList.map((exerciseItem) =>
                  React.createElement(
                    SelectItem,
                    { key: exerciseItem.id, value: exerciseItem.id, className: "text-xs" },
                    exerciseItem.name
                  )
                )
              )
            ),
            React.createElement(
              Button,
              {
                variant: "secondary",
                size: "icon",
                onClick: () => handleAddExerciseToSession(selectedExerciseToAdd),
                disabled: !selectedExerciseToAdd,
                className: "h-9 w-9",
              },
              React.createElement(Check, { className: "h-4 w-4" })
            )
          ),
          React.createElement(
            "div",
            { className: "flex items-center justify-between pt-1" },
            React.createElement(
              "button",
              {
                onClick: () => {
                  setNewExerciseDayId(selectedDayId);
                  setIsCreateModalOpen(true);
                },
                className: "text-xs text-primary hover:underline font-semibold focus:outline-none",
              },
              "+ Create new exercise inline"
            ),
            React.createElement(
              "button",
              {
                onClick: () => setShowAllExercises((prev) => !prev),
                className: "text-[11px] text-muted-foreground hover:underline focus:outline-none",
              },
              showAllExercises ? "Show filtered by day" : "Show all exercises"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "space-y-1.5 pt-2" },
          React.createElement(Label, { htmlFor: "notes" }, "Session Notes"),
          React.createElement(Input, {
            id: "notes",
            placeholder: "Felt strong today, good energy...",
            value: sessionNotes,
            onChange: (event) => setSessionNotes(event.target.value),
            className: "bg-background",
          })
        )
      )
    ),
    React.createElement(
      "div",
      { className: "pt-4" },
      React.createElement(
        Button,
        {
          onClick: handleSaveWorkout,
          disabled: submitting,
          className: "w-full py-6 font-semibold text-sm",
        },
        submitting ? "Saving workout..." : "Save Workout Session"
      )
    ),
    React.createElement(
      Dialog,
      { open: isCreateModalOpen, onOpenChange: setIsCreateModalOpen },
      React.createElement(
        DialogContent,
        { className: "bg-card border-border max-w-[340px] rounded-lg" },
        React.createElement(
          DialogHeader,
          null,
          React.createElement(DialogTitle, null, "Create Exercise"),
          React.createElement(DialogDescription, { className: "text-xs text-muted-foreground" }, "Add a new exercise to your registry.")
        ),
        React.createElement(
          "div",
          { className: "space-y-4 py-2" },
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "new-name" }, "Exercise Name"),
            React.createElement(Input, {
              id: "new-name",
              placeholder: "e.g. Lateral Raises",
              value: newExerciseName,
              onChange: (event) => setNewExerciseName(event.target.value),
              className: "bg-background",
            })
          ),
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "new-day" }, "Routine Day Type"),
            React.createElement(
              Select,
              {
                value: newExerciseDayId,
                onValueChange: (value: unknown) => setNewExerciseDayId(value as string),
              },
              React.createElement(
                SelectTrigger,
                { className: "bg-background text-xs" },
                React.createElement(SelectValue, { placeholder: "Assign to a day..." })
              ),
              React.createElement(
                SelectContent,
                null,
                workoutDays.map((dayItem) =>
                  React.createElement(
                    SelectItem,
                    { key: dayItem.id, value: dayItem.id, className: "text-xs" },
                    dayItem.name
                  )
                )
              )
            )
          )
        ),
        React.createElement(
          DialogFooter,
          { className: "flex-row justify-end gap-2 pt-2" },
          React.createElement(
            Button,
            { variant: "outline", size: "sm", onClick: () => setIsCreateModalOpen(false) },
            "Cancel"
          ),
          React.createElement(
            Button,
            { size: "sm", onClick: handleCreateExerciseInline },
            "Create"
          )
        )
      )
    )
  );
}
