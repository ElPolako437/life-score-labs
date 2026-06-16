export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealTag = 'fast' | 'warm' | 'cold' | 'veg';

export interface Meal {
  name: string;
  protein: number; // g per portion (orientation)
  slots: MealSlot[];
  tags: MealTag[];
}

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittag',
  dinner: 'Abend',
  snack: 'Snack',
};

// Curated, simple, everyday protein-rich meals. Protein values are rounded
// orientation figures, not lab-exact.
const MEALS: Meal[] = [
  // Breakfast
  { name: 'Skyr mit Beeren & Nüssen', protein: 30, slots: ['breakfast'], tags: ['fast', 'cold', 'veg'] },
  { name: 'Rührei (3 Eier) mit Vollkornbrot', protein: 25, slots: ['breakfast'], tags: ['warm', 'veg'] },
  { name: 'Protein-Porridge mit Banane', protein: 35, slots: ['breakfast'], tags: ['warm', 'veg'] },
  { name: 'Hüttenkäse mit Tomate & Brot', protein: 28, slots: ['breakfast'], tags: ['fast', 'cold', 'veg'] },
  // Lunch
  { name: 'Hähnchen-Reis-Bowl mit Gemüse', protein: 50, slots: ['lunch', 'dinner'], tags: ['warm'] },
  { name: 'Linsen-Feta-Salat', protein: 35, slots: ['lunch'], tags: ['cold', 'veg'] },
  { name: 'Thunfisch mit Vollkornnudeln', protein: 45, slots: ['lunch', 'dinner'], tags: ['fast', 'warm'] },
  { name: 'Putenwrap mit Gemüse', protein: 40, slots: ['lunch'], tags: ['fast', 'cold'] },
  // Dinner
  { name: 'Lachs mit Ofengemüse', protein: 40, slots: ['dinner'], tags: ['warm'] },
  { name: 'Tofu-Gemüse-Pfanne mit Reis', protein: 35, slots: ['dinner'], tags: ['warm', 'veg'] },
  { name: 'Magerquark mit Beeren', protein: 30, slots: ['dinner', 'snack'], tags: ['fast', 'cold', 'veg'] },
  { name: 'Hähnchen mit Süßkartoffel', protein: 50, slots: ['dinner'], tags: ['warm'] },
  // Snack
  { name: 'Proteinshake', protein: 25, slots: ['snack'], tags: ['fast', 'cold', 'veg'] },
  { name: 'Handvoll Nüsse mit Käse', protein: 15, slots: ['snack'], tags: ['fast', 'cold', 'veg'] },
  { name: '2 hartgekochte Eier', protein: 13, slots: ['snack'], tags: ['fast', 'cold', 'veg'] },
];

/**
 * Suggest protein-rich meals for a slot, optionally filtered by preference,
 * sorted by protein content. Returns up to `count` ideas.
 */
export function suggestMeals(slot: MealSlot, pref: MealTag | null, count = 2): Meal[] {
  let pool = MEALS.filter(m => m.slots.includes(slot));
  if (pref) {
    const filtered = pool.filter(m => m.tags.includes(pref));
    if (filtered.length) pool = filtered;
  }
  return [...pool].sort((a, b) => b.protein - a.protein).slice(0, count);
}
