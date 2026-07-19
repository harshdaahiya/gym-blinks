"use client";

/**
 * @file page.tsx (home)
 * @description Main dashboard showing today's status, recent history list, and logging shortcuts.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useWorkoutDays } from "@/hooks/useWorkoutDays";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocalDateString, formatDisplayDate, cn } from "@/lib/utils";
import { Plus, ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Clipboard } from "lucide-react";
import { toast } from "sonner";

/**
 * @description Home dashboard page displaying recent workouts and logging CTA.
 * @returns {React.ReactElement} The Dashboard page.
 */
export default function HomePage(): React.ReactElement {
  const { workoutLogs, loading: logsLoading, deleteWorkoutLog } = useWorkoutLogs();
  const { workoutDays, loading: daysLoading } = useWorkoutDays();
  const router = useRouter();

  // Keep track of which past log IDs are expanded in the history list
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Collapsed state for dashboard cards. Default: all are open (false).
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({
    todaysStatus: false,
    consistency: false,
  });

  /**
   * @description Toggles the collapse state of a dashboard card.
   * @param {string} cardKey - Identifier of the card.
   */
  const toggleCardCollapse = (cardKey: string): void => {
    setCollapsedCards((prevCollapsed) => ({
      ...prevCollapsed,
      [cardKey]: !prevCollapsed[cardKey],
    }));
  };

  const localTodayDateString = getLocalDateString();
  const todaysWorkoutLog = workoutLogs.find((logItem) => logItem.date === localTodayDateString);

  // Consistency tracker view: "month" | "year"
  const [consistencyView, setConsistencyView] = useState<"month" | "year">("month");

  // Calculate consistency statistics
  const currentYearNumber = new Date().getFullYear();
  const currentMonthNumber = new Date().getMonth(); // 0-indexed
  const currentMonthLabel = new Date().toLocaleString("default", { month: "long" });

  // Get active workout dates
  const activeWorkoutDatesSet = new Set(workoutLogs.map((logItem) => logItem.date));

  // Count active days in current month
  const activeDaysThisMonthCount = Array.from(activeWorkoutDatesSet).filter((dateString) => {
    const dateParts = dateString.split("-");
    return (
      parseInt(dateParts[0], 10) === currentYearNumber &&
      parseInt(dateParts[1], 10) === currentMonthNumber + 1
    );
  }).length;

  // Count active days in current year
  const activeDaysThisYearCount = Array.from(activeWorkoutDatesSet).filter((dateString) => {
    const dateParts = dateString.split("-");
    return parseInt(dateParts[0], 10) === currentYearNumber;
  }).length;

  // Days in current month
  const totalDaysInCurrentMonth = new Date(currentYearNumber, currentMonthNumber + 1, 0).getDate();
  let firstDayOfMonthWeekdayIndex = new Date(currentYearNumber, currentMonthNumber, 1).getDay();
  // Adjust to start week on Monday: 0 = Mon, 1 = Tue, ..., 6 = Sun
  firstDayOfMonthWeekdayIndex = firstDayOfMonthWeekdayIndex === 0 ? 6 : firstDayOfMonthWeekdayIndex - 1;

  const calendarGridDaysList: (number | null)[] = [];
  for (let offsetIndex = 0; offsetIndex < firstDayOfMonthWeekdayIndex; offsetIndex++) {
    calendarGridDaysList.push(null);
  }
  for (let dayNumber = 1; dayNumber <= totalDaysInCurrentMonth; dayNumber++) {
    calendarGridDaysList.push(dayNumber);
  }

  // Calculate month statistics (workouts, rest days, missed days) up to today
  const todayDate = new Date();
  const todayDayNumber = todayDate.getDate();
  const isCurrentMonth = todayDate.getFullYear() === currentYearNumber && todayDate.getMonth() === currentMonthNumber;
  const limitDayNumber = isCurrentMonth ? todayDayNumber : totalDaysInCurrentMonth;

  let workoutsCount = 0;
  let restDaysCount = 0;
  let missedDaysCount = 0;

  for (let dayNumber = 1; dayNumber <= limitDayNumber; dayNumber++) {
    const dayDateString = `${currentYearNumber}-${String(currentMonthNumber + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    const isDayLogged = activeWorkoutDatesSet.has(dayDateString);
    const dateObject = new Date(currentYearNumber, currentMonthNumber, dayNumber);
    const isSunday = dateObject.getDay() === 0;

    if (isDayLogged) {
      workoutsCount++;
    } else if (isSunday) {
      restDaysCount++;
    } else {
      // If it's today and not logged yet, don't count it as missed
      if (!(isCurrentMonth && dayNumber === todayDayNumber)) {
        missedDaysCount++;
      }
    }
  }

  /**
   * @description Toggle expansion state for a historical workout log card.
   * @param {string} logId - The ID of the log card.
   */
  const toggleLogCardExpansion = (logId: string): void => {
    setExpandedLogIds((previousExpandedLogIds) => ({
      ...previousExpandedLogIds,
      [logId]: !previousExpandedLogIds[logId],
    }));
  };

  /**
   * @description Handles deletion of a workout log with user confirmation.
   * @param {string} logId - The ID of the log to delete.
   */
  const handleLogDeletion = async (logId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this workout log?")) {
      return;
    }

    try {
      await deleteWorkoutLog(logId);
      toast.success("Workout log deleted successfully.");
    } catch (deleteError) {
      console.error("Failed to delete log:", deleteError);
      toast.error("Failed to delete workout log.");
    }
  };

  // Helper to lookup day name by ID
  const getWorkoutDayName = (dayId: string): string => {
    const matchingDay = workoutDays.find((dayItem) => dayItem.id === dayId);
    return matchingDay ? matchingDay.name : "Workout Session";
  };

  const isPageLoading = logsLoading || daysLoading;

  if (isPageLoading) {
    return React.createElement(
      PageShell,
      { className: "flex items-center justify-center min-h-[50vh]" },
      React.createElement("p", { className: "text-muted-foreground text-sm" }, "Loading your logs...")
    );
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      PageShell,
      { className: "space-y-6" },
    React.createElement(
      Card,
      { className: "border-border bg-card shadow-none" },
      React.createElement(
        "div",
        {
          onClick: () => toggleCardCollapse("todaysStatus"),
          className: "flex items-center justify-between p-4 cursor-pointer select-none border-b border-border/50",
        },
        React.createElement(
          "div",
          { className: "flex items-center gap-2" },
          React.createElement(collapsedCards.todaysStatus ? ChevronDown : ChevronUp, { className: "h-4 w-4 text-muted-foreground shrink-0" }),
          React.createElement("span", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider" }, "Today's Status")
        ),
        todaysWorkoutLog &&
          React.createElement(
            Badge,
            { variant: "outline", className: "border-primary/30 text-primary text-[10px]" },
            "Completed"
          )
      ),
      !collapsedCards.todaysStatus &&
        React.createElement(
          CardContent,
          { className: "pt-4 pb-4 space-y-4" },
          todaysWorkoutLog
            ? React.createElement(
                "div",
                { className: "space-y-3" },
                React.createElement(
                  "div",
                  { className: "flex items-center justify-between" },
                  React.createElement(
                    "h4",
                    { className: "text-base font-bold text-foreground" },
                    getWorkoutDayName(todaysWorkoutLog.dayId)
                  ),
                  React.createElement(
                    Link,
                    { href: `/log/${todaysWorkoutLog.id}`, className: "text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" },
                    React.createElement(Edit2, { className: "h-3.5 w-3.5" }),
                    "Edit"
                  )
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-muted-foreground" },
                  todaysWorkoutLog.entries.length,
                  " exercises performed • ",
                  todaysWorkoutLog.entries.reduce((totalSetsCount, currentExercise) => totalSetsCount + currentExercise.sets.length, 0),
                  " total sets"
                ),
                React.createElement(
                  "ul",
                  { className: "space-y-1.5 list-disc list-inside text-sm text-muted-foreground border-t border-border/50 pt-3" },
                  todaysWorkoutLog.entries.slice(0, 3).map((exerciseEntryItem) =>
                    React.createElement(
                      "li",
                      { key: exerciseEntryItem.exerciseId, className: "truncate" },
                      exerciseEntryItem.exerciseName,
                      ": ",
                      exerciseEntryItem.sets.length,
                      " sets"
                    )
                  ),
                  todaysWorkoutLog.entries.length > 3 &&
                    React.createElement("li", { className: "list-none italic text-xs pt-1" }, "+ ", todaysWorkoutLog.entries.length - 3, " more exercises")
                )
              )
            : React.createElement(
                "div",
                { className: "flex flex-col gap-4 text-center py-4 px-4 border border-dashed rounded-lg bg-card/50" },
                React.createElement(
                  "div",
                  { className: "mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground" },
                  React.createElement(Clipboard, { className: "h-5 w-5" })
                ),
                React.createElement(
                  "div",
                  { className: "space-y-1" },
                  React.createElement("h2", { className: "font-semibold text-sm" }, "No workout logged today"),
                  React.createElement("p", { className: "text-xs text-muted-foreground max-w-[240px] mx-auto" }, "Track your progressive overload and stay consistent.")
                ),
                React.createElement(
                  Button,
                  {
                    onClick: () => router.push("/log/new"),
                    className: "w-full mt-2 flex items-center justify-center gap-2",
                  },
                  React.createElement(Plus, { className: "h-4 w-4" }),
                  "Log Today's Workout"
                )
              )
        )
    ),
    React.createElement(
      Card,
      { className: "border-border bg-card shadow-none" },
      React.createElement(
        CardHeader,
        { className: "pb-4 flex flex-row items-center justify-between space-y-0" },
        React.createElement(
          "div",
          {
            onClick: () => toggleCardCollapse("consistency"),
            className: "flex items-center gap-2 cursor-pointer select-none py-1 flex-1"
          },
          React.createElement(collapsedCards.consistency ? ChevronDown : ChevronUp, { className: "h-4 w-4 text-muted-foreground shrink-0" }),
          React.createElement(
            "div",
            { className: "space-y-1" },
            React.createElement(CardTitle, { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider" }, "Consistency"),
            React.createElement(
              "p",
              { className: "text-xs text-muted-foreground font-medium" },
              consistencyView === "month"
                ? `${activeDaysThisMonthCount} workouts in ${currentMonthLabel}`
                : `${activeDaysThisYearCount} workouts in ${currentYearNumber}`
            )
          )
        ),
        React.createElement(
          "div",
          { className: "flex border rounded-md overflow-hidden bg-background shrink-0 ml-4" },
          React.createElement(
            "button",
            {
              onClick: (event) => {
                event.stopPropagation();
                setConsistencyView("month");
              },
              className: cn(
                "px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer",
                consistencyView === "month"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              ),
            },
            "Month"
          ),
          React.createElement(
            "button",
            {
              onClick: (event) => {
                event.stopPropagation();
                setConsistencyView("year");
              },
              className: cn(
                "px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer",
                consistencyView === "year"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              ),
            },
            "Year"
          )
        )
      ),
      !collapsedCards.consistency &&
        React.createElement(
          CardContent,
          { className: "pt-0 pb-5" },
          consistencyView === "month"
            ? React.createElement(
                "div",
                { className: "space-y-3" },
                React.createElement(
                  "div",
                  { className: "grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold text-muted-foreground" },
                  ["M", "T", "W", "T", "F", "S", "S"].map((weekdayAbbreviation, index) =>
                    React.createElement("div", { key: index }, weekdayAbbreviation)
                  )
                ),
                React.createElement(
                  "div",
                  { className: "grid grid-cols-7 gap-1.5 justify-items-center" },
                  calendarGridDaysList.map((dayNumber, index) => {
                    if (dayNumber === null) {
                      return React.createElement("div", { key: `empty-${index}`, className: "h-7 w-7" });
                    }

                    const dayDateString = `${currentYearNumber}-${String(currentMonthNumber + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
                    const isDayLogged = activeWorkoutDatesSet.has(dayDateString);
                    const isDayToday = localTodayDateString === dayDateString;
                    const dateObject = new Date(currentYearNumber, currentMonthNumber, dayNumber);
                    const isSunday = dateObject.getDay() === 0;

                    return React.createElement(
                      "div",
                      {
                        key: dayNumber,
                        className: cn(
                          "h-7 w-7 aspect-square flex items-center justify-center text-[10px] rounded-full transition-all",
                          isDayLogged
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                            : isDayToday
                            ? "border border-primary text-foreground font-medium"
                            : isSunday
                            ? "border border-dashed border-muted-foreground/30 bg-muted/5 text-muted-foreground/60"
                            : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                        ),
                        title: isDayLogged
                          ? `Workout logged on ${dayDateString}`
                          : isSunday
                          ? `Rest Day (${dayDateString})`
                          : dayDateString,
                      },
                      dayNumber
                    );
                  })
                ),
                React.createElement(
                  "div",
                  { className: "flex justify-around items-center pt-3 border-t border-border/50 text-[10px] sm:text-[11px] text-muted-foreground" },
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-1.5" },
                    React.createElement("div", { className: "h-2 w-2 rounded-full bg-primary" }),
                    React.createElement("span", null, `${workoutsCount} Workouts`)
                  ),
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-1.5" },
                    React.createElement("div", { className: "h-2 w-2 rounded-full border border-dashed border-muted-foreground/40 bg-muted/5" }),
                    React.createElement("span", null, `${restDaysCount} Rest Days`)
                  ),
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-1.5" },
                    React.createElement("div", { className: "h-2 w-2 rounded-full bg-muted/30" }),
                    React.createElement("span", null, `${missedDaysCount} Missed`)
                  )
                )
              )
            : React.createElement(
                "div",
                { className: "grid grid-cols-3 gap-3" },
                Array.from({ length: 12 }).map((_, monthIndex) => {
                  const monthNameString = new Date(currentYearNumber, monthIndex, 1).toLocaleString("default", { month: "short" });
                  const logsInThisMonth = Array.from(activeWorkoutDatesSet).filter((dateString) => {
                    const dateParts = dateString.split("-");
                    return (
                      parseInt(dateParts[0], 10) === currentYearNumber &&
                      parseInt(dateParts[1], 10) === monthIndex + 1
                    );
                  });
                  const activeDaysInMonthCount = logsInThisMonth.length;
                  const totalDaysInThisMonth = new Date(currentYearNumber, monthIndex + 1, 0).getDate();
                  const activePercentage = (activeDaysInMonthCount / totalDaysInThisMonth) * 100;

                  return React.createElement(
                    "div",
                    {
                      key: monthIndex,
                      className: "border rounded-md p-2 bg-muted/10 space-y-1 text-center"
                    },
                    React.createElement("div", { className: "text-[11px] font-semibold text-foreground" }, monthNameString),
                    React.createElement(
                      "div",
                      { className: "text-[10px] text-muted-foreground font-medium" },
                      activeDaysInMonthCount,
                      activeDaysInMonthCount === 1 ? " day" : " days"
                    ),
                    React.createElement(
                      "div",
                      { className: "h-1 w-full bg-muted/50 rounded-full overflow-hidden mt-1.5" },
                      React.createElement("div", {
                        className: "bg-primary h-full rounded-full transition-all duration-500",
                        style: { width: `${activePercentage}%` }
                      })
                    )
                  );
                })
              )
        )
    ),
    React.createElement(
      "div",
      { className: "space-y-3" },
      React.createElement("h3", { className: "text-sm font-semibold text-muted-foreground tracking-wider uppercase" }, "Recent History"),
      workoutLogs.length === 0
        ? React.createElement(
            "div",
            { className: "text-center py-12 border border-dashed rounded-lg" },
            React.createElement("p", { className: "text-sm text-muted-foreground" }, "Your logged workouts will appear here.")
          )
        : React.createElement(
            "div",
            { className: "space-y-3" },
            workoutLogs.slice(0, 10).map((logItem) => {
              const isCardExpanded = !!expandedLogIds[logItem.id];
              return React.createElement(
                Card,
                { key: logItem.id, className: "border-border bg-card" },
                React.createElement(
                  "div",
                  {
                    onClick: () => toggleLogCardExpansion(logItem.id),
                    className: "flex items-center justify-between p-4 cursor-pointer select-none",
                  },
                  React.createElement(
                    "div",
                    { className: "space-y-1" },
                    React.createElement(
                      "div",
                      { className: "flex items-center gap-2" },
                      React.createElement(Calendar, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                      React.createElement("span", { className: "text-sm font-semibold" }, formatDisplayDate(logItem.date))
                    ),
                    React.createElement(
                      "div",
                      { className: "flex items-center gap-2" },
                      React.createElement(
                        Badge,
                        { variant: "secondary", className: "text-[10px] py-0 px-1.5" },
                        getWorkoutDayName(logItem.dayId)
                      ),
                      React.createElement(
                        "span",
                        { className: "text-[11px] text-muted-foreground" },
                        logItem.entries.length,
                        " exercises performed"
                      )
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-1" },
                    isCardExpanded
                      ? React.createElement(ChevronUp, { className: "h-5 w-5 text-muted-foreground" })
                      : React.createElement(ChevronDown, { className: "h-5 w-5 text-muted-foreground" })
                  )
                ),
                isCardExpanded &&
                  React.createElement(
                    CardContent,
                    { className: "border-t border-border pt-4 pb-3 text-sm space-y-4" },
                    React.createElement(
                      "div",
                      { className: "space-y-3" },
                      logItem.entries.map((exerciseEntryItem) =>
                        React.createElement(
                          "div",
                          { key: exerciseEntryItem.exerciseId, className: "space-y-1" },
                          React.createElement("div", { className: "font-semibold text-xs text-foreground" }, exerciseEntryItem.exerciseName),
                          React.createElement(
                            "div",
                            { className: "text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1" },
                            exerciseEntryItem.sets.map((setItem, index) =>
                              React.createElement(
                                "span",
                                { key: index },
                                "S",
                                index + 1,
                                ": ",
                                setItem.weight,
                                "kg × ",
                                setItem.reps
                              )
                            )
                          )
                        )
                      )
                    ),
                    logItem.notes &&
                      React.createElement(
                        "div",
                        { className: "border-t border-border/50 pt-2 text-xs text-muted-foreground" },
                        React.createElement("span", { className: "font-semibold text-foreground" }, "Notes: "),
                        logItem.notes
                      ),
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-end gap-2 border-t border-border/50 pt-3" },
                      React.createElement(
                        Button,
                        {
                          variant: "outline",
                          size: "sm",
                          onClick: () => router.push(`/log/${logItem.id}`),
                          className: "h-8 px-2 text-xs gap-1.5",
                        },
                        React.createElement(Edit2, { className: "h-3.5 w-3.5" }),
                        "Edit"
                      ),
                      React.createElement(
                        Button,
                        {
                          variant: "destructive",
                          size: "sm",
                          onClick: () => handleLogDeletion(logItem.id),
                          className: "h-8 px-2 text-xs gap-1.5",
                        },
                        React.createElement(Trash2, { className: "h-3.5 w-3.5" }),
                        "Delete"
                      )
                    )
                  )
              );
            })
          )
        )
    ),
    React.createElement(
      "button",
      {
        onClick: () => router.push("/log/new"),
        className:
          "fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer",
        title: "Log Workout",
      },
      React.createElement(Plus, { className: "h-6 w-6" })
    )
  );
}
