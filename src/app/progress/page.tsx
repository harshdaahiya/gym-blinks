"use client";

/**
 * @file page.tsx (progress charts)
 * @description Page route for displaying progressive overload charts and personal records for exercises.
 */

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useExercises } from "@/hooks/useExercises";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useWorkoutDays } from "@/hooks/useWorkoutDays";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDisplayDate } from "@/lib/utils";
import { TrendingUp, Award, Flame, BarChart2 } from "lucide-react";

// Dynamically import Recharts to prevent hydration errors during Next.js SSR
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);

interface ChartDataPoint {
  date: string;
  displayDate: string;
  weight: number;
  reps: number;
}

/**
 * @description Progress Page rendering line charts and statistics.
 * @returns {React.ReactElement} The Progress page.
 */
export default function ProgressPage(): React.ReactElement {
  const { exercises, loading: exercisesLoading } = useExercises();
  const { workoutLogs, loading: logsLoading } = useWorkoutLogs();
  const { workoutDays } = useWorkoutDays();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [personalBest, setPersonalBest] = useState<{ weight: number; reps: number; date: string } | null>(null);

  // Filter out archived exercises
  const activeExercises = exercises.filter((item) => !item.archived);

  // Set default selected exercise
  useEffect(() => {
    if (activeExercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(activeExercises[0].id);
    }
  }, [activeExercises, selectedExerciseId]);

  // Compute chart points and stats whenever selected exercise or logs change
  useEffect(() => {
    if (!selectedExerciseId || workoutLogs.length === 0) {
      setChartData([]);
      setPersonalBest(null);
      return;
    }

    const dataPoints: ChartDataPoint[] = [];
    let absoluteMaxWeight = 0;
    let absoluteMaxWeightReps = 0;
    let absoluteMaxWeightDate = "";

    // Iterate chronologically through logs to generate progression data
    const chronologicalWorkoutLogs = [...workoutLogs].reverse();

    for (let logIndex = 0; logIndex < chronologicalWorkoutLogs.length; logIndex++) {
      const logItem = chronologicalWorkoutLogs[logIndex];
      const matchingEntry = logItem.entries.find((entry) => entry.exerciseId === selectedExerciseId);

      if (matchingEntry && matchingEntry.sets.length > 0) {
        // Find maximum weight in this session
        let sessionMaxWeight = 0;
        let sessionMaxWeightReps = 0;

        for (let setIndex = 0; setIndex < matchingEntry.sets.length; setIndex++) {
          const setItem = matchingEntry.sets[setIndex];
          if (setItem.weight > sessionMaxWeight) {
            sessionMaxWeight = setItem.weight;
            sessionMaxWeightReps = setItem.reps;
          }
        }

        if (sessionMaxWeight > 0) {
          dataPoints.push({
            date: logItem.date,
            displayDate: formatDisplayDate(logItem.date),
            weight: sessionMaxWeight,
            reps: sessionMaxWeightReps,
          });

          // Check if this set is the personal record
          if (sessionMaxWeight > absoluteMaxWeight) {
            absoluteMaxWeight = sessionMaxWeight;
            absoluteMaxWeightReps = sessionMaxWeightReps;
            absoluteMaxWeightDate = logItem.date;
          }
        }
      }
    }

    setChartData(dataPoints);

    if (absoluteMaxWeight > 0) {
      setPersonalBest({
        weight: absoluteMaxWeight,
        reps: absoluteMaxWeightReps,
        date: absoluteMaxWeightDate,
      });
    } else {
      setPersonalBest(null);
    }
  }, [selectedExerciseId, workoutLogs]);

  const getWorkoutDayName = (dayId: string): string => {
    const matchingDay = workoutDays.find((dayItem) => dayItem.id === dayId);
    return matchingDay ? matchingDay.name : "Workout Session";
  };

  const isPageLoading = exercisesLoading || logsLoading;

  if (isPageLoading) {
    return React.createElement(
      PageShell,
      { className: "flex items-center justify-center min-h-[50vh]" },
      React.createElement("p", { className: "text-muted-foreground text-sm" }, "Loading progress charts...")
    );
  }

  const selectedExercise = exercises.find((item) => item.id === selectedExerciseId);

  return React.createElement(
    PageShell,
    { className: "space-y-6" },
    React.createElement("h2", { className: "text-xl font-bold tracking-tight" }, "Progress Charts"),
    activeExercises.length === 0
      ? React.createElement(
          "div",
          { className: "text-center py-12 border border-dashed rounded-lg bg-card" },
          React.createElement("p", { className: "text-sm text-muted-foreground" }, "Add exercises and log workouts to view charts.")
        )
      : React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "exercise-select" }, "Select Exercise"),
            React.createElement(
              Select,
              {
                value: selectedExerciseId,
                onValueChange: (value: unknown) => setSelectedExerciseId(value as string),
              },
              React.createElement(
                SelectTrigger,
                { id: "exercise-select", className: "bg-background text-xs" },
                React.createElement(
                  SelectValue,
                  { placeholder: "Select an exercise..." },
                  activeExercises.find((e) => e.id === selectedExerciseId)?.name
                )
              ),
              React.createElement(
                SelectContent,
                null,
                activeExercises.map((exerciseItem) =>
                  React.createElement(
                    SelectItem,
                    { key: exerciseItem.id, value: exerciseItem.id, className: "text-xs" },
                    exerciseItem.name
                  )
                )
              )
            ),
            selectedExercise &&
              React.createElement(
                "p",
                { className: "text-[10px] text-muted-foreground px-1" },
                "Typically performed on: ",
                getWorkoutDayName(selectedExercise.dayId)
              )
          ),
          personalBest &&
            React.createElement(
              "div",
              { className: "grid grid-cols-2 gap-4" },
              React.createElement(
                Card,
                { className: "border-border bg-card shadow-none" },
                React.createElement(
                  CardContent,
                  { className: "p-4 flex items-center gap-3" },
                  React.createElement(
                    "div",
                    { className: "h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0" },
                    React.createElement(Award, { className: "h-4 w-4" })
                  ),
                  React.createElement(
                    "div",
                    { className: "min-w-0" },
                    React.createElement("p", { className: "text-[10px] font-medium text-muted-foreground uppercase" }, "Max Weight"),
                    React.createElement("p", { className: "text-base font-bold truncate" }, personalBest.weight, " kg"),
                    React.createElement("p", { className: "text-[9px] text-muted-foreground truncate" }, "on ", formatDisplayDate(personalBest.date))
                  )
                )
              ),
              React.createElement(
                Card,
                { className: "border-border bg-card shadow-none" },
                React.createElement(
                  CardContent,
                  { className: "p-4 flex items-center gap-3" },
                  React.createElement(
                    "div",
                    { className: "h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0" },
                    React.createElement(Flame, { className: "h-4 w-4" })
                  ),
                  React.createElement(
                    "div",
                    { className: "min-w-0" },
                    React.createElement("p", { className: "text-[10px] font-medium text-muted-foreground uppercase" }, "Best Reps"),
                    React.createElement("p", { className: "text-base font-bold truncate" }, personalBest.reps, " reps"),
                    React.createElement("p", { className: "text-[9px] text-muted-foreground truncate" }, "@ ", personalBest.weight, " kg")
                  )
                )
              )
            ),
          React.createElement(
            Card,
            { className: "border-border bg-card" },
            React.createElement(
              CardHeader,
              { className: "pb-4" },
              React.createElement(CardTitle, { className: "text-sm font-semibold flex items-center gap-2" }, React.createElement(TrendingUp, { className: "h-4 w-4 text-primary" }), "Weight Progression Over Time"),
              React.createElement(CardDescription, { className: "text-xs text-muted-foreground" }, "Line chart shows your max weight lifted per workout session.")
            ),
            React.createElement(
              CardContent,
              { className: "h-64 pt-2" },
              chartData.length === 0
                ? React.createElement(
                    "div",
                    { className: "flex flex-col items-center justify-center h-full text-center gap-2" },
                    React.createElement(BarChart2, { className: "h-8 w-8 text-muted-foreground" }),
                    React.createElement("p", { className: "text-xs text-muted-foreground" }, "No logged logs yet for this exercise.")
                  )
                // eslint-disable-next-line react/no-children-prop
                : React.createElement(
                    ResponsiveContainer,
                    {
                      width: "100%",
                      height: "100%",
                      children: React.createElement(
                        LineChart,
                        { data: chartData, margin: { top: 5, right: 10, left: -20, bottom: 5 } },
                        React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)", opacity: 0.5 }),
                        React.createElement(XAxis, {
                          dataKey: "displayDate",
                          tick: { fontSize: 10 },
                          stroke: "var(--muted-foreground)",
                        }),
                        React.createElement(YAxis, {
                          tick: { fontSize: 10 },
                          stroke: "var(--muted-foreground)",
                        }),
                        React.createElement(Tooltip, {
                          contentStyle: {
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "11px",
                          },
                        }),
                        React.createElement(Line, {
                          type: "monotone",
                          dataKey: "weight",
                          name: "Weight (kg)",
                          stroke: "var(--primary)",
                          strokeWidth: 2,
                          activeDot: { r: 6 },
                          dot: { r: 3 },
                        })
                      ),
                    }
                  )
            )
          )
        )
  );
}
