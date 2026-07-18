"use client";

/**
 * @file useMeals.ts
 * @description Hook for querying, seeding, and mutating meal plans and meal options.
 */

import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, query, orderBy, getDocs, writeBatch, doc, updateDoc } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-collections";
import { Meal, MealOption } from "@/types/meal";

const DEFAULT_MEALS: Meal[] = [
  {
    id: "meal_1",
    name: "Meal 1 (Breakfast)",
    timeRange: "8:30–9:00 AM",
    targetCalories: 700,
    targetProtein: 28,
    order: 1,
    options: [
      { id: "opt_1_a", name: "Oatmeal Shake", content: "60g oats + 2 bananas + 300ml milk + 1.5 tbsp peanut butter", calories: 700, protein: 27 },
      { id: "opt_1_b", name: "Peanut Butter Toast", content: "4 slices whole wheat bread + 2 tbsp peanut butter + 1 banana + glass of milk", calories: 700, protein: 27 },
      { id: "opt_1_c", name: "Vegetable Poha/Upma", content: "Vegetable poha/upma (1.5 cups) + handful roasted peanuts + glass of milk + banana", calories: 680, protein: 24 }
    ]
  },
  {
    id: "meal_2",
    name: "Meal 2 (Lunch)",
    timeRange: "1:00–1:30 PM",
    targetCalories: 850,
    targetProtein: 42,
    order: 2,
    options: [
      { id: "opt_2_a", name: "Paneer Curry & Rice", content: "1.5–2 cups rice + 150g paneer curry + 1 bowl curd + salad", calories: 880, protein: 44 },
      { id: "opt_2_b", name: "Soya Chunk Curry & Rice", content: "1.5–2 cups rice + soya chunk curry (60g dry soya) + 1 bowl curd + salad", calories: 830, protein: 47 },
      { id: "opt_2_c", name: "Rajma/Chana & Roti", content: "3 rotis + rajma/chana curry (1.5 cups) + curd + salad", calories: 840, protein: 39 }
    ]
  },
  {
    id: "meal_3",
    name: "Meal 3 (Afternoon Snack)",
    timeRange: "4:30–5:00 PM",
    targetCalories: 380,
    targetProtein: 16,
    order: 3,
    options: [
      { id: "opt_3_a", name: "Roasted Chana & Fruit", content: "Roasted chana (60g) + 1 fruit (banana/guava/seasonal)", calories: 380, protein: 16 },
      { id: "opt_3_b", name: "Peanut Butter Toast", content: "Peanut butter (2 tbsp) + 2 slices bread", calories: 370, protein: 13 },
      { id: "opt_3_c", name: "Sprouts Chaat & Milk", content: "Sprouts chaat (1 cup) + glass of milk", calories: 360, protein: 18 }
    ]
  },
  {
    id: "meal_4",
    name: "Meal 4 (Dinner)",
    timeRange: "7:00–7:30 PM",
    targetCalories: 800,
    targetProtein: 38,
    order: 4,
    options: [
      { id: "opt_4_a", name: "Paneer/Soya Sabzi, Roti & Dal", content: "3 rotis + paneer/soya sabzi (150g) + dal (1 bowl) + veg, 1 tsp ghee mixed in", calories: 810, protein: 40 },
      { id: "opt_4_b", name: "Chole/Rajma & Rice", content: "1.5 cups rice + chole/rajma (1.5 cups) + veg + curd", calories: 780, protein: 34 },
      { id: "opt_4_c", name: "Vegetable Khichdi & Curd", content: "Vegetable khichdi (2 cups) with roasted peanuts on top + curd, 1 tsp ghee", calories: 800, protein: 32 }
    ]
  }
];

/**
 * @description Hook managing meal plan sections and options synced with Firestore.
 * @returns An object containing the list of meals, loading state, and CRUD utilities.
 */
export function useMeals() {
  const [mealsList, setMealsList] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync meals from Firestore
  useEffect(() => {
    const mealsCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.MEALS);
    const sortedMealsQuery = query(mealsCollection, orderBy("order", "asc"));

    const unsubscribeFromMeals = onSnapshot(sortedMealsQuery, (querySnapshot) => {
      const parsedMeals: Meal[] = [];
      querySnapshot.forEach((documentSnapshot) => {
        parsedMeals.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        } as Meal);
      });
      setMealsList(parsedMeals);
      setLoading(false);
    });

    return () => unsubscribeFromMeals();
  }, []);

  /**
   * @description Auto-seeds default meals from the vegetarian bulk plan if empty.
   */
  const seedMealsIfEmpty = useCallback(async (): Promise<void> => {
    try {
      const mealsCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.MEALS);
      const querySnapshot = await getDocs(mealsCollection);

      let needsReseed = querySnapshot.empty;
      if (!needsReseed) {
        // Detect if old option names like "Option A" exist in default seeded slots
        const hasOldSchema = querySnapshot.docs.some((docSnap) => {
          const data = docSnap.data() as Meal;
          return data.options && data.options.some((opt) => opt.name === "Option A");
        });

        if (hasOldSchema) {
          console.log("Migrating database: clearing legacy meal structures...");
          needsReseed = true;
          const deleteBatch = writeBatch(firestoreDb);
          querySnapshot.docs.forEach((docSnap) => {
            if (["meal_1", "meal_2", "meal_3", "meal_4"].includes(docSnap.id)) {
              deleteBatch.delete(docSnap.ref);
            }
          });
          await deleteBatch.commit();
        }
      }

      if (needsReseed) {
        console.log("Seeding default meal plans with descriptive options...");
        const writeBatchInstance = writeBatch(firestoreDb);

        DEFAULT_MEALS.forEach((defaultMeal) => {
          const documentReference = doc(mealsCollection, defaultMeal.id);
          writeBatchInstance.set(documentReference, {
            name: defaultMeal.name,
            timeRange: defaultMeal.timeRange,
            targetCalories: defaultMeal.targetCalories,
            targetProtein: defaultMeal.targetProtein,
            order: defaultMeal.order,
            options: defaultMeal.options,
          });
        });

        await writeBatchInstance.commit();
        console.log("Meal plans seeding complete.");
      }
    } catch (seedingError) {
      console.error("Failed to seed default meals:", seedingError);
    }
  }, []);

  /**
   * @description Adds a new meal section.
   */
  const addMealSection = async (
    name: string,
    timeRange: string,
    targetCalories: number,
    targetProtein: number
  ): Promise<void> => {
    const mealsCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.MEALS);
    const nextOrder = mealsList.length > 0 ? Math.max(...mealsList.map((m) => m.order)) + 1 : 1;
    const documentId = `meal_${Date.now()}`;
    const documentReference = doc(mealsCollection, documentId);

    await writeBatch(firestoreDb)
      .set(documentReference, {
        name,
        timeRange,
        targetCalories,
        targetProtein,
        order: nextOrder,
        options: [],
      })
      .commit();
  };

  /**
   * @description Updates an existing meal section.
   */
  const updateMealSection = async (
    mealId: string,
    name: string,
    timeRange: string,
    targetCalories: number,
    targetProtein: number
  ): Promise<void> => {
    const documentReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.MEALS, mealId);
    await updateDoc(documentReference, {
      name,
      timeRange,
      targetCalories,
      targetProtein,
    });
  };

  /**
   * @description Deletes a meal section.
   */
  const deleteMealSection = async (mealId: string): Promise<void> => {
    const documentReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.MEALS, mealId);
    const mealsCollection = collection(firestoreDb, FIRESTORE_COLLECTIONS.MEALS);
    const writeBatchInstance = writeBatch(firestoreDb);

    writeBatchInstance.delete(documentReference);

    // Re-order remaining sections
    const remainingMeals = mealsList.filter((m) => m.id !== mealId);
    remainingMeals.forEach((mealItem, index) => {
      const ref = doc(mealsCollection, mealItem.id);
      writeBatchInstance.update(ref, { order: index + 1 });
    });

    await writeBatchInstance.commit();
  };

  /**
   * @description Adds a meal option to a section.
   */
  const addMealOption = async (
    mealId: string,
    name: string,
    content: string,
    calories: number,
    protein: number
  ): Promise<void> => {
    const targetMeal = mealsList.find((m) => m.id === mealId);
    if (!targetMeal) throw new Error("Meal section not found");

    const newOption: MealOption = {
      id: `opt_${Date.now()}`,
      name,
      content,
      calories,
      protein,
    };

    const documentReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.MEALS, mealId);
    await updateDoc(documentReference, {
      options: [...targetMeal.options, newOption],
    });
  };

  /**
   * @description Updates a meal option.
   */
  const updateMealOption = async (
    mealId: string,
    optionId: string,
    name: string,
    content: string,
    calories: number,
    protein: number
  ): Promise<void> => {
    const targetMeal = mealsList.find((m) => m.id === mealId);
    if (!targetMeal) throw new Error("Meal section not found");

    const updatedOptions = targetMeal.options.map((opt) =>
      opt.id === optionId ? { ...opt, name, content, calories, protein } : opt
    );

    const documentReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.MEALS, mealId);
    await updateDoc(documentReference, {
      options: updatedOptions,
    });
  };

  /**
   * @description Deletes a meal option.
   */
  const deleteMealOption = async (mealId: string, optionId: string): Promise<void> => {
    const targetMeal = mealsList.find((m) => m.id === mealId);
    if (!targetMeal) throw new Error("Meal section not found");

    const filteredOptions = targetMeal.options.filter((opt) => opt.id !== optionId);

    const documentReference = doc(firestoreDb, FIRESTORE_COLLECTIONS.MEALS, mealId);
    await updateDoc(documentReference, {
      options: filteredOptions,
    });
  };

  return {
    meals: mealsList,
    loading,
    seedMealsIfEmpty,
    addMealSection,
    updateMealSection,
    deleteMealSection,
    addMealOption,
    updateMealOption,
    deleteMealOption,
  };
}
