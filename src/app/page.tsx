'use client'

/**
 * @file page.tsx (home)
 * @description Main dashboard showing today's status, recent history list, and logging shortcuts.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs'
import { useWorkoutDays } from '@/hooks/useWorkoutDays'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getLocalDateString, cn } from '@/lib/utils'
import { Plus, ChevronDown, ChevronUp, Edit2, Trash2, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

/**
 * @description Home dashboard page displaying recent workouts and logging CTA.
 * @returns {React.ReactElement} The Dashboard page.
 */
export default function HomePage(): React.ReactElement {
  const { workoutLogs, loading: logsLoading, deleteWorkoutLog } = useWorkoutLogs()
  const { workoutDays, loading: daysLoading } = useWorkoutDays()
  const router = useRouter()

  // Keep track of which past log IDs are expanded in the history list
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({})

  const localTodayDateString = getLocalDateString()
  const todaysWorkoutLog = workoutLogs.find((logItem) => logItem.date === localTodayDateString)

  // Consistency tracker view: "month" | "year"
  const [consistencyView, setConsistencyView] = useState<'month' | 'year'>('month')

  // History view range: "week" | "month"
  const [historyViewRange, setHistoryViewRange] = useState<'week' | 'month'>('week')

  // Calculate consistency statistics
  const currentYearNumber = new Date().getFullYear()
  const currentMonthNumber = new Date().getMonth() // 0-indexed
  const currentMonthLabel = new Date().toLocaleString('default', { month: 'long' })

  // Get active workout dates
  const activeWorkoutDatesSet = new Set(workoutLogs.map((logItem) => logItem.date))

  // Count active days in current month
  const activeDaysThisMonthCount = Array.from(activeWorkoutDatesSet).filter((dateString) => {
    const dateParts = dateString.split('-')
    return parseInt(dateParts[0], 10) === currentYearNumber && parseInt(dateParts[1], 10) === currentMonthNumber + 1
  }).length

  // Count active days in current year
  const activeDaysThisYearCount = Array.from(activeWorkoutDatesSet).filter((dateString) => {
    const dateParts = dateString.split('-')
    return parseInt(dateParts[0], 10) === currentYearNumber
  }).length

  // Days in current month
  const totalDaysInCurrentMonth = new Date(currentYearNumber, currentMonthNumber + 1, 0).getDate()
  let firstDayOfMonthWeekdayIndex = new Date(currentYearNumber, currentMonthNumber, 1).getDay()
  // Adjust to start week on Monday: 0 = Mon, 1 = Tue, ..., 6 = Sun
  firstDayOfMonthWeekdayIndex = firstDayOfMonthWeekdayIndex === 0 ? 6 : firstDayOfMonthWeekdayIndex - 1

  const calendarGridDaysList: (number | null)[] = []
  for (let offsetIndex = 0; offsetIndex < firstDayOfMonthWeekdayIndex; offsetIndex++) {
    calendarGridDaysList.push(null)
  }
  for (let dayNumber = 1; dayNumber <= totalDaysInCurrentMonth; dayNumber++) {
    calendarGridDaysList.push(dayNumber)
  }

  // Calculate month statistics (workouts, rest days, missed days) up to today
  const todayDate = new Date()
  const todayDayNumber = todayDate.getDate()
  const isCurrentMonth = todayDate.getFullYear() === currentYearNumber && todayDate.getMonth() === currentMonthNumber
  const limitDayNumber = isCurrentMonth ? todayDayNumber : totalDaysInCurrentMonth

  let workoutsCount = 0
  let restDaysCount = 0
  let missedDaysCount = 0

  for (let dayNumber = 1; dayNumber <= limitDayNumber; dayNumber++) {
    const dayDateString = `${currentYearNumber}-${String(currentMonthNumber + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
    const isDayLogged = activeWorkoutDatesSet.has(dayDateString)
    const dateObject = new Date(currentYearNumber, currentMonthNumber, dayNumber)
    const isSunday = dateObject.getDay() === 0

    if (isDayLogged) {
      workoutsCount++
    } else if (isSunday) {
      restDaysCount++
    } else {
      // If it's today and not logged yet, don't count it as missed
      if (!(isCurrentMonth && dayNumber === todayDayNumber)) {
        missedDaysCount++
      }
    }
  }

  // Filter logs for selected history range (last 7 days or last 30 days)
  const filteredHistoryLogs = workoutLogs.filter((logItem) => {
    const logDate = new Date(logItem.date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - logDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (historyViewRange === 'week') {
      return diffDays <= 7 && diffDays >= -1
    } else {
      return diffDays <= 30 && diffDays >= -1
    }
  })

  const parseLogDateParts = (dateString: string) => {
    const dateObj = new Date(dateString + 'T00:00:00')
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNumber = dateObj.getDate()
    return { weekday, dayNumber }
  }

  /**
   * @description Toggle expansion state for a historical workout log card.
   * @param {string} logId - The ID of the log card.
   */
  const toggleLogCardExpansion = (logId: string): void => {
    setExpandedLogIds((previousExpandedLogIds) => ({
      ...previousExpandedLogIds,
      [logId]: !previousExpandedLogIds[logId]
    }))
  }

  /**
   * @description Handles deletion of a workout log with user confirmation.
   * @param {string} logId - The ID of the log to delete.
   */
  const handleLogDeletion = async (logId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this workout log?')) {
      return
    }

    try {
      await deleteWorkoutLog(logId)
      toast.success('Workout log deleted successfully.')
    } catch (deleteError) {
      console.error('Failed to delete log:', deleteError)
      toast.error('Failed to delete workout log.')
    }
  }

  // Helper to lookup day name by ID
  const getWorkoutDayName = (dayId: string): string => {
    const matchingDay = workoutDays.find((dayItem) => dayItem.id === dayId)
    return matchingDay ? matchingDay.name : 'Workout Session'
  }

  const isPageLoading = logsLoading || daysLoading

  if (isPageLoading) {
    return React.createElement(
      PageShell,
      { className: 'flex items-center justify-center min-h-[50vh]' },
      React.createElement('p', { className: 'text-muted-foreground text-sm' }, 'Loading your logs...')
    )
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      PageShell,
      { className: 'space-y-6' },
      React.createElement(
        Card,
        { className: 'border-border bg-card shadow-none overflow-hidden relative' },
        React.createElement('div', {
          className: cn(
            'absolute top-0 left-0 w-1 h-full',
            todaysWorkoutLog ? 'bg-primary' : 'bg-muted-foreground/20'
          )
        }),
        React.createElement(
          'div',
          { className: 'p-4 flex flex-col gap-3' },
          React.createElement(
            'div',
            { className: 'flex items-center justify-between' },
            React.createElement(
              'span',
              { className: 'text-[10px] font-bold text-muted-foreground uppercase tracking-wider' },
              "Today's Status"
            ),
            todaysWorkoutLog
              ? React.createElement(Badge, { variant: 'outline', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold' }, 'Completed')
              : React.createElement(Badge, { variant: 'outline', className: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold' }, 'Pending')
          ),
          todaysWorkoutLog
            ? React.createElement(
                'div',
                { className: 'space-y-4' },
                React.createElement(
                  'div',
                  { className: 'flex items-center justify-between gap-3' },
                  React.createElement(
                    'div',
                    null,
                    React.createElement('h4', { className: 'text-base font-bold text-foreground' }, getWorkoutDayName(todaysWorkoutLog.dayId)),
                    React.createElement(
                      'p',
                      { className: 'text-xs text-muted-foreground mt-0.5' },
                      'Nice job! You completed your workout today.'
                    )
                  ),
                  React.createElement(
                    Link,
                    {
                      href: `/log/${todaysWorkoutLog.id}`,
                      className: 'h-8 px-3 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold flex items-center gap-1 transition-all'
                    },
                    React.createElement(Edit2, { className: 'h-3 w-3' }),
                    'Edit Log'
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'grid grid-cols-2 gap-3 border-t border-b border-border/40 py-3 bg-muted/5 rounded-md px-2' },
                  React.createElement(
                    'div',
                    { className: 'text-center' },
                    React.createElement('p', { className: 'text-[10px] uppercase font-bold text-muted-foreground' }, 'Exercises'),
                    React.createElement('p', { className: 'text-lg font-extrabold text-foreground' }, todaysWorkoutLog.entries.length)
                  ),
                  React.createElement(
                    'div',
                    { className: 'text-center' },
                    React.createElement('p', { className: 'text-[10px] uppercase font-bold text-muted-foreground' }, 'Total Sets'),
                    React.createElement(
                      'p',
                      { className: 'text-lg font-extrabold text-foreground' },
                      todaysWorkoutLog.entries.reduce((totalSetsCount, currentExercise) => totalSetsCount + currentExercise.sets.length, 0)
                    )
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'space-y-2' },
                  React.createElement('p', { className: 'text-[9px] uppercase font-bold text-muted-foreground px-0.5' }, 'Exercises performed'),
                  React.createElement(
                    'div',
                    { className: 'flex flex-wrap gap-1.5' },
                    todaysWorkoutLog.entries.map((exerciseEntryItem) =>
                      React.createElement(
                        Badge,
                        {
                          key: exerciseEntryItem.exerciseId,
                          variant: 'outline',
                          className: 'bg-muted/10 border-border/80 text-[10px] py-0.5 font-medium'
                        },
                        `${exerciseEntryItem.exerciseName} (${exerciseEntryItem.sets.length} sets)`
                      )
                    )
                  )
                )
              )
            : React.createElement(
                'div',
                { className: 'flex flex-col sm:flex-row items-center gap-4 py-2 px-3 border border-dashed rounded-lg bg-muted/5' },
                React.createElement(
                  'div',
                  { className: 'h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0' },
                  React.createElement(Clipboard, { className: 'h-5 w-5' })
                ),
                React.createElement(
                  'div',
                  { className: 'flex-1 text-center sm:text-left space-y-0.5 min-w-0' },
                  React.createElement('h4', { className: 'text-xs font-bold text-foreground' }, 'No workout logged today'),
                  React.createElement('p', { className: 'text-[10px] text-muted-foreground' }, 'Track your progressive overload and stay consistent.')
                ),
                React.createElement(
                  Button,
                  {
                    onClick: () => router.push('/log/new'),
                    size: 'sm',
                    className: 'w-full sm:w-auto h-8 text-xs font-semibold shrink-0 gap-1'
                  },
                  React.createElement(Plus, { className: 'h-3.5 w-3.5 text-primary-foreground' }),
                  'Log Workout'
                )
              )
        )
      ),
      React.createElement(
        Card,
        { className: 'border-border bg-card shadow-none' },
        React.createElement(
          'div',
          { className: 'p-4 pb-0 flex flex-col gap-3' },
          React.createElement(
            'div',
            { className: 'flex items-center justify-between' },
            React.createElement(
              'div',
              { className: 'space-y-0.5' },
              React.createElement('h3', { className: 'text-sm font-semibold text-muted-foreground uppercase tracking-wider' }, 'Consistency'),
              React.createElement(
                'p',
                { className: 'text-xs text-muted-foreground font-medium' },
                consistencyView === 'month'
                  ? `${activeDaysThisMonthCount} workouts in ${currentMonthLabel}`
                  : `${activeDaysThisYearCount} workouts in ${currentYearNumber}`
              )
            ),
            React.createElement(
              'div',
              { className: 'flex border rounded-md overflow-hidden bg-background shrink-0 text-xs' },
              React.createElement(
                'button',
                {
                  onClick: () => setConsistencyView('month'),
                  className: cn(
                    'px-2.5 py-1 font-medium transition-all cursor-pointer',
                    consistencyView === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )
                },
                'Month'
              ),
              React.createElement(
                'button',
                {
                  onClick: () => setConsistencyView('year'),
                  className: cn(
                    'px-2.5 py-1 font-medium transition-all cursor-pointer',
                    consistencyView === 'year' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )
                },
                'Year'
              )
            )
          )
        ),
        React.createElement(
          CardContent,
          { className: 'pt-4 pb-4' },
          consistencyView === 'month'
            ? React.createElement(
                'div',
                { className: 'space-y-4' },
                React.createElement(
                  'div',
                  { className: 'grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider' },
                  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((weekdayAbbreviation, weekdayIndex) =>
                    React.createElement('div', { key: weekdayIndex }, weekdayAbbreviation)
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'grid grid-cols-7 gap-1 justify-items-center' },
                  calendarGridDaysList.map((dayNumber, dayNumberIndex) => {
                    if (dayNumber === null) {
                      return React.createElement('div', { key: `empty-${dayNumberIndex}`, className: 'h-8 w-8' })
                    }

                    const dayDateString = `${currentYearNumber}-${String(currentMonthNumber + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                    const isDayLogged = activeWorkoutDatesSet.has(dayDateString)
                    const isDayToday = localTodayDateString === dayDateString
                    const dateObject = new Date(currentYearNumber, currentMonthNumber, dayNumber)
                    const isSunday = dateObject.getDay() === 0

                    const todayZero = new Date()
                    todayZero.setHours(0, 0, 0, 0)
                    const itemDate = new Date(currentYearNumber, currentMonthNumber, dayNumber)
                    const isPastDay = itemDate < todayZero
                    const isMissed = isPastDay && !isDayLogged && !isSunday

                    return React.createElement(
                      'div',
                      {
                        key: dayNumber,
                        className: cn(
                          'h-8 w-8 aspect-square flex items-center justify-center text-xs rounded-md transition-all cursor-default',
                          isDayLogged
                            ? 'bg-primary text-primary-foreground font-bold shadow-sm hover:scale-105'
                            : isSunday
                              ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 dark:border-emerald-500/30 font-semibold'
                              : isDayToday
                                ? 'border-2 border-primary text-foreground font-bold'
                                : isMissed
                                  ? 'bg-rose-500/5 text-rose-500/50 border border-rose-500/15'
                                  : 'bg-muted/10 text-muted-foreground/40 hover:bg-muted/20'
                        ),
                        title: isDayLogged ? `Workout logged on ${dayDateString}` : isSunday ? `Rest Day (${dayDateString})` : isMissed ? `Missed (${dayDateString})` : dayDateString
                      },
                      dayNumber
                    )
                  })
                ),
                React.createElement(
                  'div',
                  { className: 'flex justify-around items-center pt-3 border-t border-border/40 text-[10px] sm:text-[11px] text-muted-foreground' },
                  React.createElement(
                    'div',
                    { className: 'flex items-center gap-1.5' },
                    React.createElement('div', { className: 'h-2.5 w-2.5 rounded-sm bg-primary' }),
                    React.createElement('span', null, `${workoutsCount} Workouts`)
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex items-center gap-1.5' },
                    React.createElement('div', { className: 'h-2.5 w-2.5 rounded-sm bg-emerald-500/10 border border-emerald-500/25' }),
                    React.createElement('span', null, `${restDaysCount} Rest Days`)
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex items-center gap-1.5' },
                    React.createElement('div', { className: 'h-2.5 w-2.5 rounded-sm bg-rose-500/5 border border-rose-500/15' }),
                    React.createElement('span', null, `${missedDaysCount} Missed`)
                  )
                )
              )
            : React.createElement(
                'div',
                { className: 'grid grid-cols-3 gap-3' },
                Array.from({ length: 12 }).map((monthPlaceholder, monthIndex) => {
                  const monthNameString = new Date(currentYearNumber, monthIndex, 1).toLocaleString('default', { month: 'short' })
                  const logsInThisMonth = Array.from(activeWorkoutDatesSet).filter((dateString) => {
                    const dateParts = dateString.split('-')
                    return parseInt(dateParts[0], 10) === currentYearNumber && parseInt(dateParts[1], 10) === monthIndex + 1
                  })
                  const activeDaysInMonthCount = logsInThisMonth.length
                  const totalDaysInThisMonth = new Date(currentYearNumber, monthIndex + 1, 0).getDate()
                  const activePercentage = (activeDaysInMonthCount / totalDaysInThisMonth) * 100

                  return React.createElement(
                    'div',
                    {
                      key: monthIndex,
                      className: 'border rounded-md p-2 bg-muted/10 space-y-1 text-center'
                    },
                    React.createElement('div', { className: 'text-[11px] font-semibold text-foreground' }, monthNameString),
                    React.createElement(
                      'div',
                      { className: 'text-[10px] text-muted-foreground font-medium' },
                      activeDaysInMonthCount,
                      activeDaysInMonthCount === 1 ? ' day' : ' days'
                    ),
                    React.createElement(
                      'div',
                      { className: 'h-1 w-full bg-muted/50 rounded-full overflow-hidden mt-1.5' },
                      React.createElement('div', {
                        className: 'bg-primary h-full rounded-full transition-all duration-500',
                        style: { width: `${activePercentage}%` }
                      })
                    )
                  )
                })
              )
        )
      ),
      React.createElement(
        'div',
        { className: 'space-y-3' },
        // Header with title and Week/Month switcher
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement('h3', { className: 'text-sm font-semibold text-muted-foreground tracking-wider uppercase' }, 'Recent History'),
          React.createElement(
            'div',
            { className: 'flex border rounded-md overflow-hidden bg-background shrink-0 text-xs' },
            React.createElement(
              'button',
              {
                onClick: () => setHistoryViewRange('week'),
                className: cn(
                  'px-2.5 py-1 font-medium transition-all cursor-pointer',
                  historyViewRange === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )
              },
              'Week'
            ),
            React.createElement(
              'button',
              {
                onClick: () => setHistoryViewRange('month'),
                className: cn(
                  'px-2.5 py-1 font-medium transition-all cursor-pointer',
                  historyViewRange === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )
              },
              'Month'
            )
          )
        ),

        filteredHistoryLogs.length === 0
          ? React.createElement(
              'div',
              { className: 'text-center py-12 border border-dashed rounded-lg bg-card/50' },
              React.createElement('p', { className: 'text-xs text-muted-foreground' }, `No workouts logged this ${historyViewRange}.`)
            )
          : React.createElement(
              'div',
              { className: 'space-y-2.5' },
              filteredHistoryLogs.map((logItem) => {
                const isCardExpanded = !!expandedLogIds[logItem.id]
                const { weekday, dayNumber } = parseLogDateParts(logItem.date)

                return React.createElement(
                  'div',
                  {
                    key: logItem.id,
                    className: 'border border-border/80 rounded-lg bg-card overflow-hidden transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]'
                  },
                  // Collapsed header row
                  React.createElement(
                    'div',
                    {
                      onClick: () => toggleLogCardExpansion(logItem.id),
                      className: 'flex items-center justify-between p-3 cursor-pointer select-none gap-3'
                    },
                    React.createElement(
                      'div',
                      { className: 'flex items-center gap-3 flex-1 min-w-0' },
                      // Calendar square date badge
                      React.createElement(
                        'div',
                        { className: 'h-10 w-10 shrink-0 flex flex-col items-center justify-center rounded bg-primary/10 text-primary select-none font-bold' },
                        React.createElement('span', { className: 'text-[9px] uppercase tracking-wider text-primary/75 leading-none mb-0.5' }, weekday),
                        React.createElement('span', { className: 'text-sm font-extrabold leading-none' }, dayNumber)
                      ),
                      // Workout routine details
                      React.createElement(
                        'div',
                        { className: 'min-w-0 space-y-0.5' },
                        React.createElement(
                          'div',
                          { className: 'text-xs font-bold text-foreground flex items-center gap-1.5' },
                          getWorkoutDayName(logItem.dayId),
                          React.createElement(
                            Badge,
                            { variant: 'secondary', className: 'text-[9px] py-0 px-1 font-semibold rounded-sm bg-muted/60' },
                            `${logItem.entries.length} Exercises`
                          )
                        ),
                        React.createElement(
                          'p',
                          { className: 'text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md font-medium' },
                          logItem.entries.map((e) => e.exerciseName).join(', ')
                        )
                      )
                    ),
                    // Chevron indicator
                    React.createElement(
                      'div',
                      { className: 'shrink-0 p-1 text-muted-foreground/70' },
                      isCardExpanded ? React.createElement(ChevronUp, { className: 'h-4 w-4' }) : React.createElement(ChevronDown, { className: 'h-4 w-4' })
                    )
                  ),
                  // Detailed list when expanded (mobile optimized layout)
                  isCardExpanded &&
                    React.createElement(
                      'div',
                      { className: 'border-t border-border/50 bg-muted/5 p-3 space-y-3.5' },
                      React.createElement(
                        'div',
                        { className: 'grid gap-2' },
                        logItem.entries.map((exerciseEntryItem) =>
                          React.createElement(
                            'div',
                            {
                              key: exerciseEntryItem.exerciseId,
                              className: 'p-2 rounded bg-background border border-border/40 space-y-1.5'
                            },
                            React.createElement('div', { className: 'font-semibold text-[11px] text-foreground' }, exerciseEntryItem.exerciseName),
                            React.createElement(
                              'div',
                              { className: 'flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-muted-foreground font-medium' },
                              exerciseEntryItem.sets.map((setItem, index) =>
                                React.createElement(
                                  'span',
                                  { key: index, className: 'bg-muted/40 px-1.5 py-0.5 rounded-sm' },
                                  'S',
                                  index + 1,
                                  ': ',
                                  setItem.weight,
                                  'kg × ',
                                  setItem.reps
                                )
                              )
                            )
                          )
                        )
                      ),
                      logItem.notes &&
                        React.createElement(
                          'div',
                          { className: 'p-2 border border-border/40 rounded bg-background/50 text-[10px] text-muted-foreground leading-normal' },
                          React.createElement('span', { className: 'font-bold text-foreground uppercase tracking-wider text-[9px] mr-1' }, 'Notes:'),
                          logItem.notes
                        ),
                      // Action controls
                      React.createElement(
                        'div',
                        { className: 'flex items-center justify-end gap-2 pt-1' },
                        React.createElement(
                          Button,
                          {
                            variant: 'outline',
                            size: 'sm',
                            onClick: () => router.push(`/log/${logItem.id}`),
                            className: 'h-7 px-2.5 text-[10px] font-semibold gap-1'
                          },
                          React.createElement(Edit2, { className: 'h-3 w-3 text-muted-foreground' }),
                          'Edit'
                        ),
                        React.createElement(
                          Button,
                          {
                            variant: 'destructive',
                            size: 'sm',
                            onClick: () => handleLogDeletion(logItem.id),
                            className: 'h-7 px-2.5 text-[10px] font-semibold gap-1'
                          },
                          React.createElement(Trash2, { className: 'h-3 w-3' }),
                          'Delete'
                        )
                      )
                    )
                )
              })
            )
      )
    ),
    React.createElement(
      'button',
      {
        onClick: () => router.push('/log/new'),
        className:
          'fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer',
        title: 'Log Workout'
      },
      React.createElement(Plus, { className: 'h-6 w-6 text-primary-foreground' })
    )
  )
}
