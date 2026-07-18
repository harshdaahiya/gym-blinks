"use client";

/**
 * @file page.tsx (edit log)
 * @description Page route for editing an existing gym session log.
 */

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { WorkoutForm } from "@/components/workout-log/WorkoutForm";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * @description Page component to edit a specific workout log.
 * @returns {React.ReactElement} The Edit Log page.
 */
export default function EditLogPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const logId = params.logId as string;
  const { workoutLogs, loading, updateWorkoutLog } = useWorkoutLogs();

  const activeWorkoutLog = workoutLogs.find((logItem) => logItem.id === logId);

  /**
   * @description Handles form saving for the edited workout log.
   * @param {Object} logPayload - The updated workout log details.
   */
  const handleSaveWorkoutSession = async (logPayload: {
    date: string;
    dayId: string;
    entries: any[];
    notes: string | null;
  }) => {
    return await updateWorkoutLog(logId, logPayload);
  };

  if (loading) {
    return React.createElement(
      PageShell,
      { className: "flex items-center justify-center min-h-[50vh]" },
      React.createElement("p", { className: "text-muted-foreground text-sm" }, "Loading workout details...")
    );
  }

  if (!activeWorkoutLog) {
    return React.createElement(
      PageShell,
      { className: "flex flex-col items-center justify-center gap-4 min-h-[50vh] text-center" },
      React.createElement("p", { className: "text-muted-foreground text-sm" }, "Workout log not found."),
      React.createElement(
        Button,
        { variant: "outline", size: "sm", onClick: () => router.push("/") },
        "Go back home"
      )
    );
  }

  return React.createElement(
    PageShell,
    null,
    React.createElement(
      "div",
      { className: "flex items-center gap-2 mb-4" },
      React.createElement(
        Button,
        {
          variant: "ghost",
          size: "icon",
          onClick: () => router.back(),
          className: "h-8 w-8 text-muted-foreground hover:text-foreground",
        },
        React.createElement(ArrowLeft, { className: "h-5 w-5" })
      ),
      React.createElement("h2", { className: "text-xl font-bold tracking-tight" }, "Edit Workout Log")
    ),
    React.createElement(WorkoutForm, {
      initialLogData: activeWorkoutLog,
      onSave: handleSaveWorkoutSession,
    })
  );
}
