'use client'

/**
 * @file page.tsx (exercises)
 * @description Page route for managing (CRUD) the list of available exercises, grouped by routine day type.
 */

import React, { useState } from 'react'
import { useExercises } from '@/hooks/useExercises'
import { useWorkoutDays } from '@/hooks/useWorkoutDays'
import { PageShell } from '@/components/layout/PageShell'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Archive, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Exercise } from '@/types/exercise'
import { cn } from '@/lib/utils'

/**
 * @description Exercise Manager screen allowing adding, editing, archiving, and restoring exercises.
 * @returns {React.ReactElement} The Exercises page.
 */
export default function ExercisesPage(): React.ReactElement {
  const { exercises, addExercise, updateExercise, archiveExercise, restoreExercise } = useExercises()
  const { workoutDays, loading: daysLoading } = useWorkoutDays()

  // Filter toggles
  const [showArchived, setShowArchived] = useState<boolean>(false)

  // Collapsed days state: keys are day IDs, values are true if collapsed
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({})

  /**
   * @description Toggles the collapse state of a workout day group.
   * @param {string} dayId - ID of the workout day.
   */
  const toggleDayCollapse = (dayId: string): void => {
    setCollapsedDays((prevCollapsed) => ({
      ...prevCollapsed,
      [dayId]: !prevCollapsed[dayId]
    }))
  }

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingExerciseId, setEditingExerciseId] = useState<string>('')
  const [exerciseName, setExerciseName] = useState<string>('')
  const [exerciseDayId, setExerciseDayId] = useState<string>('')

  // const getWorkoutDayName = (dayId: string): string => {
  //   const matchingDay = workoutDays.find((dayItem) => dayItem.id === dayId);
  //   return matchingDay ? matchingDay.name : "Unassigned";
  // };

  /**
   * @description Opens the modal in creation mode.
   */
  const openCreateModal = (): void => {
    setModalMode('create')
    setExerciseName('')
    setExerciseDayId(workoutDays[0]?.id || '')
    setIsModalOpen(true)
  }

  /**
   * @description Opens the modal in editing mode.
   * @param {Exercise} exerciseToEdit - The exercise details.
   */
  const openEditModal = (exerciseToEdit: Exercise): void => {
    setModalMode('edit')
    setEditingExerciseId(exerciseToEdit.id)
    setExerciseName(exerciseToEdit.name)
    setExerciseDayId(exerciseToEdit.dayId)
    setIsModalOpen(true)
  }

  /**
   * @description Submits the exercise creation or edit form.
   */
  const handleFormSubmission = async (): Promise<void> => {
    if (!exerciseName.trim()) {
      toast.error('Please enter an exercise name.')
      return
    }
    if (!exerciseDayId) {
      toast.error('Please assign a routine day.')
      return
    }

    try {
      if (modalMode === 'create') {
        await addExercise(exerciseName, exerciseDayId)
        toast.success('Exercise added successfully.')
      } else {
        await updateExercise(editingExerciseId, exerciseName, exerciseDayId)
        toast.success('Exercise updated successfully.')
      }
      setIsModalOpen(false)
    } catch (saveError) {
      console.error('Failed to save exercise:', saveError)
      toast.error('An error occurred while saving the exercise.')
    }
  }

  /**
   * @description Soft-deletes (archives) an exercise.
   * @param {string} exerciseId - ID of the exercise.
   */
  const handleArchive = async (exerciseId: string): Promise<void> => {
    try {
      await archiveExercise(exerciseId)
      toast.success('Exercise archived. Existing logs will keep this exercise.')
    } catch (archiveError) {
      console.error('Failed to archive exercise:', archiveError)
      toast.error('Failed to archive exercise.')
    }
  }

  /**
   * @description Restores an archived exercise.
   * @param {string} exerciseId - ID of the exercise.
   */
  const handleRestore = async (exerciseId: string): Promise<void> => {
    try {
      await restoreExercise(exerciseId)
      toast.success('Exercise restored.')
    } catch (restoreError) {
      console.error('Failed to restore exercise:', restoreError)
      toast.error('Failed to restore exercise.')
    }
  }

  const isPageLoading = daysLoading

  if (isPageLoading) {
    return React.createElement(
      PageShell,
      { className: 'flex items-center justify-center min-h-[50vh]' },
      React.createElement('p', { className: 'text-muted-foreground text-sm' }, 'Loading exercises list...')
    )
  }

  // Filter exercises
  const activeExercises = exercises.filter((item) => !item.archived)
  const archivedExercises = exercises.filter((item) => item.archived)

  return React.createElement(
    PageShell,
    { className: 'space-y-6' },
    React.createElement(
      'div',
      { className: 'flex items-center justify-between' },
      React.createElement('h2', { className: 'text-xl font-bold tracking-tight' }, 'Exercises'),
      React.createElement(
        Button,
        { onClick: openCreateModal, size: 'sm', className: 'gap-1 text-xs' },
        React.createElement(Plus, { className: 'h-4 w-4' }),
        'Add Exercise'
      )
    ),
    React.createElement(
      'div',
      { className: 'flex items-center justify-end' },
      React.createElement(
        'button',
        {
          onClick: () => setShowArchived((prev) => !prev),
          className: 'text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none'
        },
        showArchived ? 'Hide Archived Exercises' : `Show Archived Exercises (${archivedExercises.length})`
      )
    ),
    React.createElement(
      'div',
      { className: 'space-y-6' },
      workoutDays.map((dayItem) => {
        const dayExercises = (showArchived ? exercises : activeExercises).filter((exerciseItem) => exerciseItem.dayId === dayItem.id)
        const isCollapsed = !!collapsedDays[dayItem.id]

        return React.createElement(
          'div',
          { key: dayItem.id, className: 'space-y-2.5' },
          React.createElement(
            'div',
            {
              onClick: () => toggleDayCollapse(dayItem.id),
              className: 'flex items-center gap-2 px-1 cursor-pointer select-none py-1 hover:text-foreground/80 transition-colors'
            },
            React.createElement(isCollapsed ? ChevronDown : ChevronUp, {
              className: 'h-4 w-4 text-muted-foreground shrink-0'
            }),
            React.createElement('h3', { className: 'text-sm font-semibold text-foreground' }, dayItem.name),
            React.createElement(Badge, { variant: 'secondary', className: 'text-[10px] py-0 px-1.5' }, dayExercises.length)
          ),
          !isCollapsed &&
            (dayExercises.length === 0
              ? React.createElement(
                  'div',
                  { className: 'text-center py-6 border border-dashed rounded-lg bg-card/50' },
                  React.createElement('p', { className: 'text-xs text-muted-foreground' }, 'No exercises added for this day.')
                )
              : React.createElement(
                  'div',
                  { className: 'border border-border/80 bg-card rounded-lg overflow-hidden divide-y divide-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.01)]' },
                  dayExercises.map((exerciseItem, exerciseIndex) =>
                    React.createElement(
                      'div',
                      { key: exerciseItem.id, className: 'flex items-center justify-between p-2.5 text-xs hover:bg-muted/10 transition-colors group' },
                      React.createElement(
                        'div',
                        { className: 'flex items-center gap-2 min-w-0' },
                        React.createElement(
                          'span',
                          { className: 'text-[10px] text-muted-foreground/50 w-4 font-mono text-center shrink-0' },
                          exerciseIndex + 1
                        ),
                        React.createElement(
                          'span',
                          { className: cn('truncate font-medium text-foreground', exerciseItem.archived && 'line-through text-muted-foreground') },
                          exerciseItem.name
                        ),
                        exerciseItem.archived &&
                          React.createElement(Badge, { variant: 'outline', className: 'text-[8px] py-0 px-1 border-muted/80 text-muted-foreground' }, 'Archived')
                      ),
                      React.createElement(
                        'div',
                        { className: 'flex items-center gap-1 shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity' },
                        !exerciseItem.archived &&
                          React.createElement(
                            React.Fragment,
                            null,
                            React.createElement(
                              Button,
                              {
                                variant: 'ghost',
                                size: 'icon',
                                onClick: () => openEditModal(exerciseItem),
                                className: 'h-6 w-6 text-muted-foreground hover:text-foreground',
                                title: 'Edit'
                              },
                              React.createElement(Edit2, { className: 'h-3 w-3' })
                            ),
                            React.createElement(
                              Button,
                              {
                                variant: 'ghost',
                                size: 'icon',
                                onClick: () => handleArchive(exerciseItem.id),
                                className: 'h-6 w-6 text-muted-foreground hover:text-destructive',
                                title: 'Archive'
                              },
                              React.createElement(Archive, { className: 'h-3 w-3' })
                            )
                          ),
                        exerciseItem.archived &&
                          React.createElement(
                            Button,
                            {
                              variant: 'ghost',
                              size: 'icon',
                              onClick: () => handleRestore(exerciseItem.id),
                              className: 'h-6 w-6 text-muted-foreground hover:text-foreground',
                              title: 'Restore'
                            },
                            React.createElement(RotateCcw, { className: 'h-3 w-3' })
                          )
                      )
                    )
                  )
                ))
        )
      })
    ),
    React.createElement(
      Dialog,
      { open: isModalOpen, onOpenChange: setIsModalOpen },
      React.createElement(
        DialogContent,
        { className: 'bg-card border-border max-w-[340px] rounded-lg' },
        React.createElement(
          DialogHeader,
          null,
          React.createElement(DialogTitle, null, modalMode === 'create' ? 'Create Exercise' : 'Edit Exercise'),
          React.createElement(
            DialogDescription,
            { className: 'text-xs text-muted-foreground' },
            'Fill in the exercise name and select its typical routine day.'
          )
        ),
        React.createElement(
          'div',
          { className: 'space-y-4 py-2' },
          React.createElement(
            'div',
            { className: 'space-y-1.5' },
            React.createElement(Label, { htmlFor: 'modal-exercise-name' }, 'Exercise Name'),
            React.createElement(Input, {
              id: 'modal-exercise-name',
              placeholder: 'e.g. Incline Bench Press',
              value: exerciseName,
              onChange: (event) => setExerciseName(event.target.value),
              className: 'bg-background'
            })
          ),
          React.createElement(
            'div',
            { className: 'space-y-1.5' },
            React.createElement(Label, { htmlFor: 'modal-exercise-day' }, 'Routine Day Type'),
            React.createElement(
              Select,
              {
                value: exerciseDayId,
                onValueChange: (value: unknown) => setExerciseDayId(value as string)
              },
              React.createElement(
                SelectTrigger,
                { className: 'bg-background text-xs' },
                React.createElement(
                  SelectValue,
                  { placeholder: 'Assign to a day...' },
                  workoutDays.find((d) => d.id === exerciseDayId)?.name
                )
              ),
              React.createElement(
                SelectContent,
                null,
                workoutDays.map((dayItem) => React.createElement(SelectItem, { key: dayItem.id, value: dayItem.id, className: 'text-xs' }, dayItem.name))
              )
            )
          )
        ),
        React.createElement(
          DialogFooter,
          { className: 'flex-row justify-end gap-2 pt-2' },
          React.createElement(Button, { variant: 'outline', size: 'sm', onClick: () => setIsModalOpen(false) }, 'Cancel'),
          React.createElement(Button, { size: 'sm', onClick: handleFormSubmission }, modalMode === 'create' ? 'Create' : 'Save')
        )
      )
    )
  )
}
