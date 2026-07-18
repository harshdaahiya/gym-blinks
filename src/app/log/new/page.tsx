"use client";

/**
 * @file page.tsx (new log)
 * @description Page route for logging a new gym session.
 */

import React from "react";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { WorkoutForm } from "@/components/workout-log/WorkoutForm";
import { PageShell } from "@/components/layout/PageShell";

/**
 * @description Page component to log a new workout session.
 * @returns {React.ReactElement} The New Log page.
 */
export default function NewLogPage(): React.ReactElement {
  const { addWorkoutLog } = useWorkoutLogs();

  /**
   * @description Handles form submission for a new workout log.
   * @param {Object} logPayload - The workout log input details.
   * @returns {Promise<Object>} Details of the saved log and any hit PRs.
   */
  const handleSaveWorkoutSession = async (logPayload: {
    date: string;
    dayId: string;
    entries: any[];
    notes: string | null;
  }) => {
    return await addWorkoutLog(logPayload);
  };

  return React.createElement(
    PageShell,
    null,
    React.createElement("h2", { className: "text-xl font-bold tracking-tight mb-4" }, "Log Workout"),
    React.createElement(WorkoutForm, { onSave: handleSaveWorkoutSession })
  );
}
