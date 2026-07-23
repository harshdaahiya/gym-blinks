"use client";

/**
 * @file page.tsx
 * @description The Meals & Diet management dashboard.
 */

import React, { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useMeals } from "@/hooks/useMeals";
import { Meal, MealOption } from "@/types/meal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Apple,
  PlusCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MealTheme {
  bgClass: string;
  borderClass: string;
  accentTextClass: string;
  badgeBgClass: string;
  emojis: string[];
}

const getMealTheme = (mealName: string, order: number): MealTheme => {
  const normalized = mealName.toLowerCase();

  if (normalized.includes("breakfast") || normalized.includes("meal 1") || order === 1) {
    return {
      bgClass: "from-amber-500/10 to-orange-500/5 border-amber-500/20 dark:from-amber-500/15 dark:to-orange-500/5 dark:border-amber-500/30",
      borderClass: "border-amber-500/20 dark:border-amber-500/30",
      accentTextClass: "text-amber-600 dark:text-amber-400",
      badgeBgClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      emojis: ["🥣", "🍌", "🥛"],
    };
  }

  if (normalized.includes("lunch") || normalized.includes("meal 2") || order === 2) {
    return {
      bgClass: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20 dark:from-emerald-500/15 dark:to-teal-500/5 dark:border-emerald-500/30",
      borderClass: "border-emerald-500/20 dark:border-emerald-500/30",
      accentTextClass: "text-emerald-600 dark:text-emerald-400",
      badgeBgClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      emojis: ["🍚", "🥦", "🧀"],
    };
  }

  if (normalized.includes("snack") || normalized.includes("pre-workout") || normalized.includes("meal 3") || order === 3) {
    return {
      bgClass: "from-sky-500/10 to-blue-500/5 border-sky-500/20 dark:from-sky-500/15 dark:to-blue-500/5 dark:border-sky-500/30",
      borderClass: "border-sky-500/20 dark:border-sky-500/30",
      accentTextClass: "text-sky-600 dark:text-sky-400",
      badgeBgClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
      emojis: ["🍎", "🥜", "🍞"],
    };
  }

  if (normalized.includes("dinner") || normalized.includes("meal 4") || order === 4) {
    return {
      bgClass: "from-purple-500/10 to-pink-500/5 border-purple-500/20 dark:from-purple-500/15 dark:to-pink-500/5 dark:border-purple-500/30",
      borderClass: "border-purple-500/20 dark:border-purple-500/30",
      accentTextClass: "text-purple-600 dark:text-purple-400",
      badgeBgClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
      emojis: ["🫓", "🍛", "🥗"],
    };
  }

  return {
    bgClass: "from-rose-500/10 to-pink-500/5 border-rose-500/20 dark:from-rose-500/15 dark:to-pink-500/5 dark:border-rose-500/30",
    borderClass: "border-rose-500/20 dark:border-rose-500/30",
    accentTextClass: "text-rose-600 dark:text-rose-400",
    badgeBgClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    emojis: ["🥑", "🥗", "🍠"],
  };
};

export default function MealsPage(): React.ReactElement {
  const {
    meals,
    loading,
    addMealSection,
    updateMealSection,
    deleteMealSection,
    addMealOption,
    updateMealOption,
    deleteMealOption,
  } = useMeals();

  // Collapsible state for sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Meal Section Modal states
  const [sectionModalOpen, setSectionModalOpen] = useState<boolean>(false);
  const [editingSection, setEditingSection] = useState<Meal | null>(null);
  const [sectionName, setSectionName] = useState<string>("");
  const [sectionTime, setSectionTime] = useState<string>("");
  const [sectionCalories, setSectionCalories] = useState<string>("");
  const [sectionProtein, setSectionProtein] = useState<string>("");

  // Meal Option Modal states
  const [optionModalOpen, setOptionModalOpen] = useState<boolean>(false);
  const [editingOptionParentMealId, setEditingOptionParentMealId] = useState<string>("");
  const [editingOption, setEditingOption] = useState<MealOption | null>(null);
  const [optionName, setOptionName] = useState<string>("");
  const [optionContent, setOptionContent] = useState<string>("");
  const [optionCalories, setOptionCalories] = useState<string>("");
  const [optionProtein, setOptionProtein] = useState<string>("");

  /**
   * @description Toggles the collapse state of a meal section.
   * @param {string} sectionId - ID of the section to toggle.
   */
  const toggleSectionCollapse = (sectionId: string): void => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  /**
   * @description Opens the Section Modal for creating a new section.
   */
  const handleOpenAddSection = (): void => {
    setEditingSection(null);
    setSectionName("");
    setSectionTime("");
    setSectionCalories("");
    setSectionProtein("");
    setSectionModalOpen(true);
  };

  /**
   * @description Opens the Section Modal for editing an existing section.
   * @param {Meal} meal - The meal section object to edit.
   */
  const handleOpenEditSection = (meal: Meal): void => {
    setEditingSection(meal);
    setSectionName(meal.name);
    setSectionTime(meal.timeRange);
    setSectionCalories(meal.targetCalories.toString());
    setSectionProtein(meal.targetProtein.toString());
    setSectionModalOpen(true);
  };

  /**
   * @description Submits the Section Modal form.
   */
  const handleSaveSection = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!sectionName.trim()) {
      toast.error("Please enter a section name.");
      return;
    }

    try {
      const caloriesVal = parseInt(sectionCalories, 10) || 0;
      const proteinVal = parseInt(sectionProtein, 10) || 0;

      if (editingSection) {
        await updateMealSection(editingSection.id, sectionName.trim(), sectionTime.trim(), caloriesVal, proteinVal);
        toast.success("Meal section updated successfully.");
      } else {
        await addMealSection(sectionName.trim(), sectionTime.trim(), caloriesVal, proteinVal);
        toast.success("Meal section created successfully.");
      }
      setSectionModalOpen(false);
    } catch (saveError) {
      console.error("Failed to save meal section:", saveError);
      toast.error("An error occurred while saving.");
    }
  };

  /**
   * @description Handles deletion of a meal section with confirmation.
   * @param {string} mealId - ID of the section to delete.
   */
  const handleDeleteSection = async (mealId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this entire meal section?")) {
      return;
    }

    try {
      await deleteMealSection(mealId);
      toast.success("Meal section deleted.");
    } catch (deleteError) {
      console.error("Failed to delete meal section:", deleteError);
      toast.error("Failed to delete section.");
    }
  };

  /**
   * @description Opens the Option Modal for adding a meal option to a section.
   * @param {string} mealId - ID of the parent meal section.
   */
  const handleOpenAddOption = (mealId: string): void => {
    setEditingOptionParentMealId(mealId);
    setEditingOption(null);
    setOptionName("");
    setOptionContent("");
    setOptionCalories("");
    setOptionProtein("");
    setOptionModalOpen(true);
  };

  /**
   * @description Opens the Option Modal for editing an existing option.
   * @param {string} mealId - ID of the parent meal section.
   * @param {MealOption} option - The option object to edit.
   */
  const handleOpenEditOption = (mealId: string, option: MealOption): void => {
    setEditingOptionParentMealId(mealId);
    setEditingOption(option);
    setOptionName(option.name);
    setOptionContent(option.content);
    setOptionCalories(option.calories.toString());
    setOptionProtein(option.protein.toString());
    setOptionModalOpen(true);
  };

  /**
   * @description Submits the Option Modal form.
   */
  const handleSaveOption = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!optionName.trim()) {
      toast.error("Please enter an option name (e.g. Option A).");
      return;
    }
    if (!optionContent.trim()) {
      toast.error("Please enter food contents.");
      return;
    }

    try {
      const caloriesVal = parseInt(optionCalories, 10) || 0;
      const proteinVal = parseInt(optionProtein, 10) || 0;

      if (editingOption) {
        await updateMealOption(
          editingOptionParentMealId,
          editingOption.id,
          optionName.trim(),
          optionContent.trim(),
          caloriesVal,
          proteinVal
        );
        toast.success("Meal option updated.");
      } else {
        await addMealOption(
          editingOptionParentMealId,
          optionName.trim(),
          optionContent.trim(),
          caloriesVal,
          proteinVal
        );
        toast.success("Meal option added.");
      }
      setOptionModalOpen(false);
    } catch (saveError) {
      console.error("Failed to save option:", saveError);
      toast.error("An error occurred while saving option.");
    }
  };

  /**
   * @description Deletes a meal option with confirmation.
   * @param {string} mealId - ID of the parent meal section.
   * @param {string} optionId - ID of the option to delete.
   */
  const handleDeleteOption = async (mealId: string, optionId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this meal option?")) {
      return;
    }

    try {
      await deleteMealOption(mealId, optionId);
      toast.success("Meal option deleted.");
    } catch (deleteError) {
      console.error("Failed to delete meal option:", deleteError);
      toast.error("Failed to delete option.");
    }
  };

  if (loading) {
    return React.createElement(
      PageShell,
      { className: "flex items-center justify-center min-h-[50vh]" },
      React.createElement("p", { className: "text-muted-foreground text-sm" }, "Loading meal plans...")
    );
  }

  // Calculate totals
  const totalCaloriesSum = meals.reduce((sum, currentMeal) => sum + currentMeal.targetCalories, 0);
  const totalProteinSum = meals.reduce((sum, currentMeal) => sum + currentMeal.targetProtein, 0);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      PageShell,
      { className: "space-y-6" },
      // Title and Top Add Button
      React.createElement(
        "div",
        { className: "flex items-center justify-between" },
        React.createElement(
          "div",
          { className: "space-y-0.5" },
          React.createElement("h1", { className: "text-2xl font-bold tracking-tight" }, "Diet & Meals"),
          React.createElement(
            "p",
            { className: "text-xs text-muted-foreground" },
            "Plan and track your vegetarian lean bulk nutrition"
          )
        ),
        React.createElement(
          Button,
          {
            onClick: handleOpenAddSection,
            size: "sm",
            className: "text-xs gap-1.5 h-9",
          },
          React.createElement(PlusCircle, { className: "h-4 w-4" }),
          "Add Meal"
        )
      ),

      // Summary Banner Card
      React.createElement(
        Card,
        { className: "border-primary bg-card/80 backdrop-blur-sm" },
        React.createElement(
          CardContent,
          { className: "p-4 flex items-center justify-between" },
          React.createElement(
            "div",
            { className: "flex items-center gap-3" },
            React.createElement(
              "div",
              { className: "p-2 bg-primary/10 rounded-full text-primary" },
              React.createElement(Apple, { className: "h-5 w-5" })
            ),
            React.createElement(
              "div",
              { className: "space-y-0.5" },
              React.createElement("div", { className: "text-sm font-semibold text-foreground" }, "Daily Total Target"),
              React.createElement("div", { className: "text-[11px] text-muted-foreground" }, "Ramp up target from diet plan")
            )
          ),
          React.createElement(
            "div",
            { className: "text-right" },
            React.createElement(
              "div",
              { className: "text-base font-bold text-primary" },
              totalCaloriesSum,
              " kcal"
            ),
            React.createElement(
              "div",
              { className: "text-xs font-semibold text-muted-foreground" },
              totalProteinSum,
              "g Protein"
            )
          )
        )
      ),

      // List of Meal Sections
      React.createElement(
        "div",
        { className: "space-y-4" },
        meals.map((mealItem) => {
          const isCollapsed = !!collapsedSections[mealItem.id];
          const theme = getMealTheme(mealItem.name, mealItem.order);

          return React.createElement(
            Card,
            { key: mealItem.id, className: cn("relative border shadow-none overflow-hidden bg-gradient-to-br transition-all duration-300", theme.bgClass, theme.borderClass) },
            // Blurred floating background emojis
            React.createElement(
              "div",
              {
                className: "absolute right-4 top-3 select-none opacity-[0.06] text-5xl filter blur-[1.5px] pointer-events-none transition-transform duration-500 hover:scale-110",
              },
              theme.emojis.join(" ")
            ),
            // Card Header area (Clickable to collapse)
            React.createElement(
              "div",
              {
                className: "relative flex items-center justify-between p-4 cursor-pointer select-none border-b border-border/20",
                onClick: () => toggleSectionCollapse(mealItem.id),
              },
              React.createElement(
                "div",
                { className: "flex items-center gap-2 flex-1 min-w-0" },
                React.createElement(isCollapsed ? ChevronDown : ChevronUp, { className: "h-4 w-4 text-muted-foreground shrink-0" }),
                React.createElement(
                  "div",
                  { className: "min-w-0" },
                  React.createElement(
                    "h3",
                    { className: cn("text-sm font-bold truncate", theme.accentTextClass) },
                    mealItem.name
                  ),
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground" },
                    React.createElement(Clock, { className: "h-3 w-3 shrink-0" }),
                    React.createElement("span", null, mealItem.timeRange || "No time set")
                  )
                )
              ),
              React.createElement(
                "div",
                { className: "flex items-center gap-3 shrink-0 ml-4" },
                React.createElement(
                  "div",
                  { className: "text-right" },
                  React.createElement(
                    "div",
                    { className: "text-xs font-bold text-foreground" },
                    mealItem.targetCalories,
                    " kcal"
                  ),
                  React.createElement(
                    "div",
                    { className: "text-[10px] text-muted-foreground font-semibold" },
                    mealItem.targetProtein,
                    "g Pro"
                  )
                ),
                // Section options/controls (stop propagation to avoid triggering collapse)
                React.createElement(
                  "div",
                  {
                    className: "flex items-center gap-1.5 border-l border-border/20 pl-3",
                    onClick: (event) => event.stopPropagation(),
                  },
                  React.createElement(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7 text-muted-foreground hover:text-foreground",
                      onClick: () => handleOpenEditSection(mealItem),
                      title: "Edit Section",
                    },
                    React.createElement(Edit2, { className: "h-3.5 w-3.5" })
                  ),
                  React.createElement(
                    Button,
                    {
                      variant: "ghost",
                      size: "icon",
                      className: "h-7 w-7 text-muted-foreground hover:text-destructive",
                      onClick: () => handleDeleteSection(mealItem.id),
                      title: "Delete Section",
                    },
                    React.createElement(Trash2, { className: "h-3.5 w-3.5" })
                  )
                )
              )
            ),

            // Card Options list (shown when expanded)
            !isCollapsed &&
              React.createElement(
                CardContent,
                { className: "relative p-4 space-y-4 bg-background/20 dark:bg-background/5" },
                mealItem.options && mealItem.options.length > 0
                  ? React.createElement(
                      "div",
                      { className: "space-y-3" },
                      mealItem.options.map((optionItem) =>
                        React.createElement(
                          "div",
                          {
                            key: optionItem.id,
                            className: "group relative border border-border/30 rounded-md p-3 bg-background/50 hover:bg-background/85 dark:bg-background/25 dark:hover:bg-background/45 transition-all space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                          },
                          React.createElement(
                            "div",
                            { className: "flex items-center justify-between" },
                            React.createElement(
                              "span",
                              { className: cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-border/20", theme.badgeBgClass) },
                              optionItem.name
                            ),
                            React.createElement(
                              "div",
                              { className: "flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity" },
                              React.createElement(
                                Button,
                                {
                                  variant: "ghost",
                                  size: "icon",
                                  className: "h-6 w-6 text-muted-foreground hover:text-foreground",
                                  onClick: () => handleOpenEditOption(mealItem.id, optionItem),
                                },
                                React.createElement(Edit2, { className: "h-3 w-3" })
                              ),
                              React.createElement(
                                Button,
                                {
                                  variant: "ghost",
                                  size: "icon",
                                  className: "h-6 w-6 text-muted-foreground hover:text-destructive",
                                  onClick: () => handleDeleteOption(mealItem.id, optionItem.id),
                                },
                                React.createElement(Trash2, { className: "h-3 w-3" })
                              )
                            )
                          ),
                          React.createElement(
                            "p",
                            { className: "text-xs font-medium text-foreground leading-relaxed pr-12" },
                            optionItem.content
                          ),
                          React.createElement(
                            "div",
                            { className: "flex items-center gap-3 text-[10px] text-muted-foreground font-semibold pt-1 border-t border-border/20" },
                            React.createElement("span", null, optionItem.calories, " kcal"),
                            React.createElement("span", { className: "text-border/80" }, "•"),
                            React.createElement("span", null, optionItem.protein, "g protein")
                          )
                        )
                      )
                    )
                  : React.createElement(
                      "div",
                      { className: "text-center py-6 border border-dashed rounded-lg bg-muted/5" },
                      React.createElement("p", { className: "text-xs text-muted-foreground" }, "No rotating options added yet.")
                    ),
                React.createElement(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    className: "w-full text-xs font-semibold gap-1.5 h-9 bg-background border-dashed",
                    onClick: () => handleOpenAddOption(mealItem.id),
                  },
                  React.createElement(Plus, { className: "h-3.5 w-3.5 text-primary" }),
                  "Add Meal Option"
                )
              )
          );
        })
      )
    ),

    // 1. Meal Section Dialog (Custom modal layout)
    sectionModalOpen &&
      React.createElement(
        "div",
        { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm animate-fade-in" },
        React.createElement(
          "form",
          {
            onSubmit: handleSaveSection,
            className: "w-full max-w-md border border-border bg-card p-6 rounded-lg shadow-lg space-y-4"
          },
          React.createElement(
            "div",
            { className: "flex items-center justify-between border-b border-border/50 pb-3" },
            React.createElement(
              "h3",
              { className: "text-base font-bold text-foreground" },
              editingSection ? "Edit Meal Section" : "Add Meal Section"
            ),
            React.createElement(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8 rounded-full",
                onClick: () => setSectionModalOpen(false)
              },
              React.createElement(X, { className: "h-4 w-4" })
            )
          ),
          React.createElement(
            "div",
            { className: "space-y-3 pt-1" },
            React.createElement(
              "div",
              { className: "space-y-1.5" },
              React.createElement(Label, { htmlFor: "secName" }, "Section Name"),
              React.createElement(Input, {
                id: "secName",
                placeholder: "e.g. Meal 1 (Post-gym)",
                value: sectionName,
                onChange: (e) => setSectionName(e.target.value),
              })
            ),
            React.createElement(
              "div",
              { className: "space-y-1.5" },
              React.createElement(Label, { htmlFor: "secTime" }, "Time Range"),
              React.createElement(Input, {
                id: "secTime",
                placeholder: "e.g. 8:30–9:00 AM",
                value: sectionTime,
                onChange: (e) => setSectionTime(e.target.value),
              })
            ),
            React.createElement(
              "div",
              { className: "grid grid-cols-2 gap-3" },
              React.createElement(
                "div",
                { className: "space-y-1.5" },
                React.createElement(Label, { htmlFor: "secCals" }, "Target Calories (kcal)"),
                React.createElement(Input, {
                  id: "secCals",
                  type: "number",
                  placeholder: "700",
                  value: sectionCalories,
                  onChange: (e) => setSectionCalories(e.target.value),
                })
              ),
              React.createElement(
                "div",
                { className: "space-y-1.5" },
                React.createElement(Label, { htmlFor: "secProt" }, "Target Protein (g)"),
                React.createElement(Input, {
                  id: "secProt",
                  type: "number",
                  placeholder: "28",
                  value: sectionProtein,
                  onChange: (e) => setSectionProtein(e.target.value),
                })
              )
            )
          ),
          React.createElement(
            "div",
            { className: "flex items-center justify-end gap-2 border-t border-border/50 pt-4 mt-2" },
            React.createElement(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => setSectionModalOpen(false)
              },
              "Cancel"
            ),
            React.createElement(
              Button,
              { type: "submit" },
              "Save Section"
            )
          )
        )
      ),

    // 2. Meal Option Dialog (Custom modal layout)
    optionModalOpen &&
      React.createElement(
        "div",
        { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm animate-fade-in" },
        React.createElement(
          "form",
          {
            onSubmit: handleSaveOption,
            className: "w-full max-w-md border border-border bg-card p-6 rounded-lg shadow-lg space-y-4"
          },
          React.createElement(
            "div",
            { className: "flex items-center justify-between border-b border-border/50 pb-3" },
            React.createElement(
              "h3",
              { className: "text-base font-bold text-foreground" },
              editingOption ? "Edit Meal Option" : "Add Meal Option"
            ),
            React.createElement(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8 rounded-full",
                onClick: () => setOptionModalOpen(false)
              },
              React.createElement(X, { className: "h-4 w-4" })
            )
          ),
          React.createElement(
            "div",
            { className: "space-y-3 pt-1" },
            React.createElement(
              "div",
              { className: "space-y-1.5" },
              React.createElement(Label, { htmlFor: "optName" }, "Option Name"),
              React.createElement(Input, {
                id: "optName",
                placeholder: "e.g. Option A",
                value: optionName,
                onChange: (e) => setOptionName(e.target.value),
              })
            ),
            React.createElement(
              "div",
              { className: "space-y-1.5" },
              React.createElement(Label, { htmlFor: "optContent" }, "Food Contents"),
              React.createElement("textarea", {
                id: "optContent",
                placeholder: "e.g. 60g oats + 2 bananas + 300ml milk...",
                value: optionContent,
                onChange: (e) => setOptionContent((e.target as HTMLTextAreaElement).value),
                className: "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              })
            ),
            React.createElement(
              "div",
              { className: "grid grid-cols-2 gap-3" },
              React.createElement(
                "div",
                { className: "space-y-1.5" },
                React.createElement(Label, { htmlFor: "optCals" }, "Calories (kcal)"),
                React.createElement(Input, {
                  id: "optCals",
                  type: "number",
                  placeholder: "700",
                  value: optionCalories,
                  onChange: (e) => setOptionCalories(e.target.value),
                })
              ),
              React.createElement(
                "div",
                { className: "space-y-1.5" },
                React.createElement(Label, { htmlFor: "optProt" }, "Protein (g)"),
                React.createElement(Input, {
                  id: "optProt",
                  type: "number",
                  placeholder: "27",
                  value: optionProtein,
                  onChange: (e) => setOptionProtein(e.target.value),
                })
              )
            )
          ),
          React.createElement(
            "div",
            { className: "flex items-center justify-end gap-2 border-t border-border/50 pt-4 mt-2" },
            React.createElement(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => setOptionModalOpen(false)
              },
              "Cancel"
            ),
            React.createElement(
              Button,
              { type: "submit" },
              "Save Option"
            )
          )
        )
      )
  );
}
