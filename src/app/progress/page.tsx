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
import { useBodyWeights } from "@/hooks/useBodyWeights";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDisplayDate, cn } from "@/lib/utils";
import { TrendingUp, Award, Flame, BarChart2, Plus, Trash2, Scale, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

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


/**
 * @description Progress Page rendering line charts and statistics.
 * @returns {React.ReactElement} The Progress page.
 */
export default function ProgressPage(): React.ReactElement {
  const { exercises, loading: exercisesLoading } = useExercises();
  const { workoutLogs, loading: logsLoading } = useWorkoutLogs();
  const { workoutDays } = useWorkoutDays();
  const { bodyWeights, addBodyWeight, deleteBodyWeight } = useBodyWeights();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [workoutMetric, setWorkoutMetric] = useState<"weight" | "volume" | "oneRepMax">("weight");
  const [workoutTimeRange, setWorkoutTimeRange] = useState<"1W" | "3M" | "1Y" | "ALL">("3M");
  const [bodyWeightTimeRange, setBodyWeightTimeRange] = useState<"1W" | "3M" | "1Y" | "ALL">("3M");

  // Body weight modal logging state
  const [isWeightModalOpen, setIsWeightModalOpen] = useState<boolean>(false);
  const [logWeightInput, setLogWeightInput] = useState<string>("");
  const [logWeightDate, setLogWeightDate] = useState<string>("");

  const [chartData, setChartData] = useState<any[]>([]);
  const [personalBest, setPersonalBest] = useState<{ weight: number; reps: number; date: string } | null>(null);

  // Filter out archived exercises
  const activeExercises = exercises.filter((item) => !item.archived);

  // Set default selected exercise
  useEffect(() => {
    if (activeExercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(activeExercises[0].id);
    }
  }, [activeExercises, selectedExerciseId]);

  // Set default logging date to today in local YYYY-MM-DD
  useEffect(() => {
    const todayDateObj = new Date();
    const yearString = todayDateObj.getFullYear();
    const monthString = String(todayDateObj.getMonth() + 1).padStart(2, "0");
    const dayString = String(todayDateObj.getDate()).padStart(2, "0");
    setLogWeightDate(`${yearString}-${monthString}-${dayString}`);
  }, [isWeightModalOpen]);

  // Helper to filter dates based on selected range
  const filterByDateRange = (dateString: string, range: "1W" | "3M" | "1Y" | "ALL"): boolean => {
    const itemDate = new Date(dateString + "T00:00:00");
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const diffTime = todayDate.getTime() - itemDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (range === "1W") return diffDays <= 7 && diffDays >= -1;
    if (range === "3M") return diffDays <= 90 && diffDays >= -1;
    if (range === "1Y") return diffDays <= 365 && diffDays >= -1;
    return true; // "ALL"
  };

  // Compute chart points and stats whenever selected exercise, metric, logs, or range changes
  useEffect(() => {
    if (!selectedExerciseId || workoutLogs.length === 0) {
      setChartData([]);
      setPersonalBest(null);
      return;
    }

    const dataPoints: any[] = [];
    let absoluteMaxWeight = 0;
    let absoluteMaxWeightReps = 0;
    let absoluteMaxWeightDate = "";

    // Iterate chronologically through logs to generate progression data
    const chronologicalWorkoutLogs = [...workoutLogs].reverse();

    for (let logIndex = 0; logIndex < chronologicalWorkoutLogs.length; logIndex++) {
      const logItem = chronologicalWorkoutLogs[logIndex];
      const matchingEntry = logItem.entries.find((entry) => entry.exerciseId === selectedExerciseId);

      if (matchingEntry && matchingEntry.sets.length > 0) {
        let sessionMaxWeight = 0;
        let sessionMaxWeightReps = 0;
        let sessionTotalVolume = 0;
        let sessionMax1RM = 0;

        for (let setIndex = 0; setIndex < matchingEntry.sets.length; setIndex++) {
          const setItem = matchingEntry.sets[setIndex];
          const setVolume = setItem.weight * setItem.reps;
          const set1RM = setItem.weight * (1 + setItem.reps / 30);

          if (setItem.weight > sessionMaxWeight) {
            sessionMaxWeight = setItem.weight;
            sessionMaxWeightReps = setItem.reps;
          }
          sessionTotalVolume += setVolume;
          if (set1RM > sessionMax1RM) {
            sessionMax1RM = set1RM;
          }
        }

        if (sessionMaxWeight > 0) {
          let metricValue = sessionMaxWeight;
          if (workoutMetric === "volume") {
            metricValue = sessionTotalVolume;
          } else if (workoutMetric === "oneRepMax") {
            metricValue = Math.round(sessionMax1RM * 10) / 10;
          }

          if (filterByDateRange(logItem.date, workoutTimeRange)) {
            dataPoints.push({
              date: logItem.date,
              displayDate: formatDisplayDate(logItem.date),
              weight: sessionMaxWeight,
              reps: sessionMaxWeightReps,
              value: metricValue,
            });
          }

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
  }, [selectedExerciseId, workoutLogs, workoutMetric, workoutTimeRange]);

  const getWorkoutDayName = (dayId: string): string => {
    const matchingDay = workoutDays.find((dayItem) => dayItem.id === dayId);
    return matchingDay ? matchingDay.name : "Workout Session";
  };

  const handleAddWeightLog = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const weightVal = parseFloat(logWeightInput);
    if (isNaN(weightVal) || weightVal <= 0) {
      toast.error("Please enter a valid weight.");
      return;
    }
    if (!logWeightDate) {
      toast.error("Please select a date.");
      return;
    }

    try {
      await addBodyWeight(weightVal, logWeightDate);
      toast.success("Weight log added successfully.");
      setIsWeightModalOpen(false);
      setLogWeightInput("");
    } catch (saveError) {
      console.error("Failed to save body weight:", saveError);
      toast.error("Failed to save body weight.");
    }
  };

  const handleDeleteWeightLog = async (logDocumentId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this weight log?")) {
      return;
    }
    try {
      await deleteBodyWeight(logDocumentId);
      toast.success("Weight log deleted.");
    } catch (deleteError) {
      console.error("Failed to delete weight log:", deleteError);
      toast.error("Failed to delete weight log.");
    }
  };

  const isPageLoading = exercisesLoading || logsLoading;

  if (isPageLoading) {
    return React.createElement(
      PageShell,
      { className: "flex items-center justify-center min-h-[50vh]" },
      React.createElement("p", { className: "text-muted-foreground text-sm" }, "Loading progress charts...")
    );
  }

  const selectedExercise = exercises.find((exerciseItem) => exerciseItem.id === selectedExerciseId);

  // Helper to render range buttons
  const renderRangePills = (
    currentRangeValue: "1W" | "3M" | "1Y" | "ALL",
    setRangeCallback: (val: "1W" | "3M" | "1Y" | "ALL") => void
  ) => {
    const rangeOptionsList: ("1W" | "3M" | "1Y" | "ALL")[] = ["1W", "3M", "1Y", "ALL"];
    return React.createElement(
      "div",
      { className: "flex border rounded-md overflow-hidden bg-background text-[10px]" },
      rangeOptionsList.map((rangeOptionItem) =>
        React.createElement(
          "button",
          {
            key: rangeOptionItem,
            onClick: () => setRangeCallback(rangeOptionItem),
            className: cn(
              "px-2 py-1 font-semibold transition-all cursor-pointer",
              currentRangeValue === rangeOptionItem
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            ),
          },
          rangeOptionItem
        )
      )
    );
  };

  // Helper to render metric buttons
  const renderMetricPills = () => {
    const metricOptionsList = [
      { value: "weight", label: "Max Weight" },
      { value: "volume", label: "Volume" },
      { value: "oneRepMax", label: "Est. 1RM" },
    ] as const;

    return React.createElement(
      "div",
      { className: "flex border rounded-md overflow-hidden bg-background text-[10px]" },
      metricOptionsList.map((metricOptionItem) =>
        React.createElement(
          "button",
          {
            key: metricOptionItem.value,
            onClick: () => setWorkoutMetric(metricOptionItem.value),
            className: cn(
              "px-2 py-1 font-semibold transition-all cursor-pointer",
              workoutMetric === metricOptionItem.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            ),
          },
          metricOptionItem.label
        )
      )
    );
  };

  // Process body weight chart data & calculations
  const reversedBodyWeightsList = [...bodyWeights].reverse();
  const currentWeightRecord = bodyWeights[0];
  const startingWeightRecord = bodyWeights[bodyWeights.length - 1];
  const totalWeightDifference =
    currentWeightRecord && startingWeightRecord
      ? Math.round((currentWeightRecord.weight - startingWeightRecord.weight) * 10) / 10
      : 0;

  const filteredBodyWeightsList = reversedBodyWeightsList.filter((weightLogItem) =>
    filterByDateRange(weightLogItem.date, bodyWeightTimeRange)
  );

  const bodyWeightChartDataPoints = filteredBodyWeightsList.map((weightLogItem) => ({
    date: weightLogItem.date,
    displayDate: formatDisplayDate(weightLogItem.date),
    weight: weightLogItem.weight,
  }));

  const exerciseWorkoutLineLabel =
    workoutMetric === "weight"
      ? "Max Weight (kg)"
      : workoutMetric === "volume"
      ? "Volume (kg)"
      : "Est. 1RM (kg)";

  return React.createElement(
    PageShell,
    { className: "space-y-6 pb-12" },
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
          // -------------------------------------------------------------
          // SECTION 1: WORKOUT PROGRESS
          // -------------------------------------------------------------
          React.createElement(
            Card,
            { className: "border-border bg-card shadow-none" },
            React.createElement(
              "div",
              { className: "p-4 pb-0 space-y-3" },
              React.createElement(
                "div",
                { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" },
                React.createElement(
                  "div",
                  null,
                  React.createElement(CardTitle, { className: "text-sm font-semibold flex items-center gap-2 text-foreground" }, React.createElement(TrendingUp, { className: "h-4 w-4 text-primary" }), "Workout Progression"),
                  React.createElement(CardDescription, { className: "text-xs text-muted-foreground" }, "Track lift progression with different metrics and time ranges")
                ),
                renderRangePills(workoutTimeRange, setWorkoutTimeRange)
              ),
              React.createElement(
                "div",
                { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
                React.createElement(
                  "div",
                  { className: "space-y-1" },
                  React.createElement(Label, { htmlFor: "exercise-select", className: "text-[10px] uppercase font-bold text-muted-foreground" }, "Select Exercise"),
                  React.createElement(
                    Select,
                    {
                      value: selectedExerciseId,
                      onValueChange: (value: unknown) => setSelectedExerciseId(value as string),
                    },
                    React.createElement(
                      SelectTrigger,
                      { id: "exercise-select", className: "bg-background text-xs h-8" },
                      React.createElement(
                        SelectValue,
                        { placeholder: "Select an exercise..." },
                        activeExercises.find((exerciseItem) => exerciseItem.id === selectedExerciseId)?.name
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
                  )
                ),
                React.createElement(
                  "div",
                  { className: "space-y-1 flex flex-col justify-end" },
                  React.createElement(Label, { className: "text-[10px] uppercase font-bold text-muted-foreground mb-1" }, "Metric to Plot"),
                  renderMetricPills()
                )
              )
            ),
            React.createElement(
              CardContent,
              { className: "space-y-4" },
              selectedExercise &&
                React.createElement(
                  "p",
                  { className: "text-[10px] text-muted-foreground px-1 -mt-2" },
                  "Typically performed on: ",
                  getWorkoutDayName(selectedExercise.dayId)
                ),

              personalBest &&
                React.createElement(
                  "div",
                  { className: "grid grid-cols-2 gap-3" },
                  React.createElement(
                    "div",
                    { className: "border border-border/80 rounded p-2.5 bg-muted/5 flex items-center gap-2 min-w-0" },
                    React.createElement(
                      "div",
                      { className: "h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0" },
                      React.createElement(Award, { className: "h-3.5 w-3.5" })
                    ),
                    React.createElement(
                      "div",
                      { className: "min-w-0" },
                      React.createElement("p", { className: "text-[9px] font-bold text-muted-foreground uppercase leading-tight" }, "Max Weight"),
                      React.createElement("p", { className: "text-xs font-bold truncate" }, personalBest.weight, " kg"),
                      React.createElement("p", { className: "text-[8px] text-muted-foreground truncate" }, "on ", formatDisplayDate(personalBest.date))
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "border border-border/80 rounded p-2.5 bg-muted/5 flex items-center gap-2 min-w-0" },
                    React.createElement(
                      "div",
                      { className: "h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0" },
                      React.createElement(Flame, { className: "h-3.5 w-3.5" })
                    ),
                    React.createElement(
                      "div",
                      { className: "min-w-0" },
                      React.createElement("p", { className: "text-[9px] font-bold text-muted-foreground uppercase leading-tight" }, "Best Reps"),
                      React.createElement("p", { className: "text-xs font-bold truncate" }, personalBest.reps, " reps"),
                      React.createElement("p", { className: "text-[8px] text-muted-foreground truncate" }, "@ ", personalBest.weight, " kg")
                    )
                  )
                ),

              React.createElement(
                "div",
                { className: "h-56 pt-2" },
                chartData.length === 0
                  ? React.createElement(
                      "div",
                      { className: "flex flex-col items-center justify-center h-full text-center gap-2 border border-dashed rounded-lg bg-muted/5" },
                      React.createElement(BarChart2, { className: "h-6 w-6 text-muted-foreground/60" }),
                      React.createElement("p", { className: "text-[11px] text-muted-foreground" }, "No workout logs found in this range.")
                    )
                  : React.createElement(
                      ResponsiveContainer,
                      {
                        width: "100%",
                        height: "100%",
                      } as any,
                      React.createElement(
                        LineChart,
                        { data: chartData, margin: { top: 5, right: 10, left: -25, bottom: 5 } },
                        React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)", opacity: 0.5 }),
                        React.createElement(XAxis, {
                          dataKey: "displayDate",
                          tick: { fontSize: 9 },
                          stroke: "var(--muted-foreground)",
                        }),
                        React.createElement(YAxis, {
                          tick: { fontSize: 9 },
                          stroke: "var(--muted-foreground)",
                        }),
                        React.createElement(Tooltip, {
                          contentStyle: {
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "10px",
                          },
                        }),
                        React.createElement(Line, {
                          type: "monotone",
                          dataKey: "value",
                          name: exerciseWorkoutLineLabel,
                          stroke: "var(--primary)",
                          strokeWidth: 2,
                          activeDot: { r: 5 },
                          dot: { r: 2.5 },
                        })
                      )
                    )
              )
            )
          ),

          // -------------------------------------------------------------
          // SECTION 2: BODY WEIGHT PROGRESS
          // -------------------------------------------------------------
          React.createElement(
            Card,
            { className: "border-border bg-card shadow-none" },
            React.createElement(
              "div",
              { className: "p-4 pb-0 flex flex-col gap-3" },
              React.createElement(
                "div",
                { className: "flex items-center justify-between" },
                React.createElement(
                  "div",
                  null,
                  React.createElement(CardTitle, { className: "text-sm font-semibold flex items-center gap-2 text-foreground" }, React.createElement(Scale, { className: "h-4 w-4 text-primary" }), "Body Weight Tracker"),
                  React.createElement(CardDescription, { className: "text-xs text-muted-foreground" }, "Log weight to visualize your progress over time")
                ),
                React.createElement(
                  Button,
                  {
                    onClick: () => setIsWeightModalOpen(true),
                    size: "sm",
                    className: "h-8 text-xs gap-1"
                  },
                  React.createElement(Plus, { className: "h-3.5 w-3.5" }),
                  "Add Weight"
                )
              ),
              React.createElement(
                "div",
                { className: "flex items-center justify-between border-t border-border/40 pt-3" },
                React.createElement(
                  "div",
                  { className: "flex gap-4" },
                  React.createElement(
                    "div",
                    null,
                    React.createElement("p", { className: "text-[9px] uppercase font-bold text-muted-foreground" }, "Current"),
                    React.createElement("p", { className: "text-sm font-bold text-foreground" }, currentWeightRecord ? `${currentWeightRecord.weight} kg` : "--")
                  ),
                  React.createElement(
                    "div",
                    null,
                    React.createElement("p", { className: "text-[9px] uppercase font-bold text-muted-foreground" }, "Starting"),
                    React.createElement("p", { className: "text-sm font-bold text-foreground" }, startingWeightRecord ? `${startingWeightRecord.weight} kg` : "--")
                  ),
                  React.createElement(
                    "div",
                    null,
                    React.createElement("p", { className: "text-[9px] uppercase font-bold text-muted-foreground" }, "Net Change"),
                    React.createElement(
                      "p",
                      {
                        className: cn(
                          "text-sm font-bold",
                          totalWeightDifference > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : totalWeightDifference < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-foreground"
                        )
                      },
                      totalWeightDifference > 0 ? `+${totalWeightDifference} kg` : `${totalWeightDifference} kg`
                    )
                  )
                ),
                renderRangePills(bodyWeightTimeRange, setBodyWeightTimeRange)
              )
            ),
            React.createElement(
              CardContent,
              { className: "space-y-4" },
              React.createElement(
                "div",
                { className: "h-48 pt-2" },
                bodyWeights.length === 0
                  ? React.createElement(
                      "div",
                      { className: "flex flex-col items-center justify-center h-full text-center gap-2 border border-dashed rounded-lg bg-muted/5" },
                      React.createElement(Scale, { className: "h-6 w-6 text-muted-foreground/60" }),
                      React.createElement("p", { className: "text-[11px] text-muted-foreground" }, "No body weight records logged yet.")
                    )
                  : React.createElement(
                      ResponsiveContainer,
                      {
                        width: "100%",
                        height: "100%",
                      } as any,
                      React.createElement(
                        LineChart,
                        { data: bodyWeightChartDataPoints, margin: { top: 5, right: 10, left: -25, bottom: 5 } },
                        React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)", opacity: 0.5 }),
                        React.createElement(XAxis, {
                          dataKey: "displayDate",
                          tick: { fontSize: 9 },
                          stroke: "var(--muted-foreground)",
                        }),
                        React.createElement(YAxis, {
                          tick: { fontSize: 9 },
                          stroke: "var(--muted-foreground)",
                          domain: ["dataMin - 2", "dataMax + 2"],
                        }),
                        React.createElement(Tooltip, {
                          contentStyle: {
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "10px",
                          },
                        }),
                        React.createElement(Line, {
                          type: "monotone",
                          dataKey: "weight",
                          name: "Body Weight (kg)",
                          stroke: "var(--primary)",
                          strokeWidth: 2,
                          activeDot: { r: 5 },
                          dot: { r: 2.5 },
                        })
                      )
                    )
              ),

              // Recent Weight Log Records List
              bodyWeights.length > 0 &&
                React.createElement(
                  "div",
                  { className: "space-y-2 border-t border-border/40 pt-3" },
                  React.createElement("p", { className: "text-[10px] uppercase font-bold text-muted-foreground px-0.5" }, "Recent Weight Logs"),
                  React.createElement(
                    "div",
                    { className: "max-h-36 overflow-y-auto border border-border/60 rounded-md bg-muted/5 divide-y divide-border/50" },
                    bodyWeights.slice(0, 5).map((weightLogItem) =>
                      React.createElement(
                        "div",
                        { key: weightLogItem.id, className: "flex items-center justify-between p-2 text-xs" },
                        React.createElement(
                          "div",
                          { className: "flex items-center gap-2" },
                          React.createElement(CalendarIcon, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                          React.createElement("span", { className: "font-semibold" }, formatDisplayDate(weightLogItem.date))
                        ),
                        React.createElement(
                          "div",
                          { className: "flex items-center gap-3" },
                          React.createElement("span", { className: "font-bold text-foreground" }, weightLogItem.weight, " kg"),
                          React.createElement(
                            Button,
                            {
                              variant: "ghost",
                              size: "icon",
                              onClick: () => handleDeleteWeightLog(weightLogItem.id),
                              className: "h-5 w-5 text-muted-foreground hover:text-destructive",
                              title: "Delete log"
                            },
                            React.createElement(Trash2, { className: "h-3 w-3" })
                          )
                        )
                      )
                    )
                  )
                )
            )
          )
        ),

    // -------------------------------------------------------------
    // MODAL DIALOG: LOG BODY WEIGHT
    // -------------------------------------------------------------
    React.createElement(
      Dialog,
      { open: isWeightModalOpen, onOpenChange: setIsWeightModalOpen },
      React.createElement(
        DialogContent,
        { className: "bg-card border-border max-w-[320px] rounded-lg" },
        React.createElement(
          DialogHeader,
          null,
          React.createElement(DialogTitle, null, "Log Body Weight"),
          React.createElement(
            DialogDescription,
            { className: "text-xs text-muted-foreground" },
            "Add body weight record to visualize progress."
          )
        ),
        React.createElement(
          "form",
          {
            onSubmit: (event) => {
              handleAddWeightLog(event);
            },
            className: "space-y-4 py-2"
          },
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "weight-input" }, "Body Weight (kg)"),
            React.createElement(Input, {
              id: "weight-input",
              type: "number",
              step: "0.1",
              placeholder: "e.g. 72.5",
              value: logWeightInput,
              onChange: (event) => setLogWeightInput(event.target.value),
              className: "bg-background h-9 text-sm"
            })
          ),
          React.createElement(
            "div",
            { className: "space-y-1.5" },
            React.createElement(Label, { htmlFor: "weight-date-input" }, "Log Date"),
            React.createElement(Input, {
              id: "weight-date-input",
              type: "date",
              value: logWeightDate,
              onChange: (event) => setLogWeightDate(event.target.value),
              className: "bg-background h-9 text-sm"
            })
          ),
          React.createElement(
            DialogFooter,
            { className: "flex flex-row justify-end gap-2 pt-2" },
            React.createElement(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => setIsWeightModalOpen(false),
                className: "h-9 text-xs"
              },
              "Cancel"
            ),
            React.createElement(
              Button,
              {
                type: "submit",
                className: "h-9 text-xs"
              },
              "Save Weight"
            )
          )
        )
      )
    )
  );
}
