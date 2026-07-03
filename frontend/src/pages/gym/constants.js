import { Utensils, Dumbbell, Pill, Scale, Droplets, StickyNote, Sunrise, UtensilsCrossed, Coffee, Activity, MoonStar, Zap, HeartPulse, Footprints, Target, Bike, Swords, FlaskConical, Fish, BicepsFlexed, Cable, Shield, Gauge } from 'lucide-react';

// Entry type metadata — icon, emoji, colors (matches Purple theme accents)
export const ENTRY_TYPES = [
  { key: 'meal',       label: 'Meal',       icon: Utensils,   emoji: '🍽', color: '#FF7E5F', bg: 'rgba(255,126,95,0.12)' },
  { key: 'workout',    label: 'Workout',    icon: Dumbbell,   emoji: '🏋', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'supplement', label: 'Supplement', icon: Pill,       emoji: '💊', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'weight',     label: 'Weight',     icon: Scale,      emoji: '⚖', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'water',      label: 'Water',      icon: Droplets,   emoji: '💧', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  { key: 'note',       label: 'Note',       icon: StickyNote, emoji: '📝', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
];

export const TYPE_META = ENTRY_TYPES.reduce((acc, t) => { acc[t.key] = t; return acc; }, {});

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack', 'Pre Workout', 'Post Workout', 'Dinner', 'Before Bed'];

// Meal type -> lucide icon (no emojis)
export const MEAL_TYPE_ICONS = {
  'Breakfast': Sunrise,
  'Lunch': UtensilsCrossed,
  'Snack': Coffee,
  'Pre Workout': Dumbbell,
  'Post Workout': Activity,
  'Dinner': Utensils,
  'Before Bed': MoonStar,
};
export const MEAL_TYPE_OPTIONS = MEAL_TYPES.map(m => ({ value: m, label: m, icon: MEAL_TYPE_ICONS[m] }));

export const WORKOUT_TYPES = ['Push', 'Pull', 'Legs', 'Chest', 'Back', 'Shoulder', 'Arms', 'Bicep', 'Triceps', 'Full Body', 'Cardio', 'Custom'];
export const WORKOUT_TYPE_ICONS = {
  'Push': Zap,
  'Pull': Cable,
  'Legs': Footprints,
  'Chest': Shield,
  'Back': Swords,
  'Shoulder': Dumbbell,
  'Arms': BicepsFlexed,
  'Bicep': BicepsFlexed,
  'Triceps': Gauge,
  'Full Body': HeartPulse,
  'Cardio': Bike,
  'Custom': Target,
};
export const WORKOUT_TYPE_OPTIONS = WORKOUT_TYPES.map(w => ({ value: w, label: w, icon: WORKOUT_TYPE_ICONS[w] || Dumbbell }));

export const SUPPLEMENTS = ['Whey Protein', 'Creatine', 'Coffee', 'Pre Workout', 'Fish Oil', 'Multivitamin', 'Vitamin D', 'Custom'];
export const SUPPLEMENT_ICONS = {
  'Whey Protein': FlaskConical, 'Creatine': Zap, 'Coffee': Coffee, 'Pre Workout': Dumbbell,
  'Fish Oil': Fish, 'Multivitamin': Pill, 'Vitamin D': Sunrise, 'Custom': Pill,
};
export const SUPPLEMENT_OPTIONS = SUPPLEMENTS.map(s => ({ value: s, label: s, icon: SUPPLEMENT_ICONS[s] || Pill }));
export const WATER_PRESETS = [250, 500, 750, 1000];
export const MOODS = ['💪 Strong', '🔥 Energized', '😌 Good', '😐 Okay', '😩 Tired', '🤕 Sore'];

// Local date helpers (avoid UTC shift so "today" is the user's local day)
export const toYMD = (d) => {
  const off = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return off.toISOString().split('T')[0];
};
export const todayYMD = () => toYMD(new Date());

export const prettyDate = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
};

export const shortDate = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

export const to12h = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

// Human-readable one-line summary for a timeline entry
export const entryTitle = (e) => {
  const d = e.data || {};
  switch (e.type) {
    case 'meal': return d.mealType || 'Meal';
    case 'workout': return d.workoutName || d.workoutType || 'Workout';
    case 'supplement': return d.name || 'Supplement';
    case 'weight': return 'Body Metrics';
    case 'water': return `${d.amount || 0} ml Water`;
    case 'note': return 'Note';
    default: return e.type;
  }
};

export const entrySubtitle = (e) => {
  const d = e.data || {};
  switch (e.type) {
    case 'meal': {
      const macros = [];
      if (d.protein) macros.push(`${d.protein}g P`);
      if (d.carbs) macros.push(`${d.carbs}g C`);
      if (d.fat) macros.push(`${d.fat}g F`);
      if (d.calories) macros.push(`${d.calories} kcal`);
      return [d.foodItems, macros.join(' · ')].filter(Boolean).join(' — ');
    }
    case 'workout': {
      const parts = [];
      if (d.workoutType) parts.push(d.workoutType);
      if (d.duration) parts.push(`${d.duration}h`);
      if (d.cardioMinutes) parts.push(`${d.cardioMinutes} min cardio`);
      return parts.join(' · ');
    }
    case 'supplement': {
      const parts = [];
      if (d.protein) parts.push(`${d.protein}g protein`);
      if (d.notes) parts.push(d.notes);
      return parts.join(' · ');
    }
    case 'weight': {
      const parts = [];
      if (d.bodyWeight) parts.push(`${d.bodyWeight} kg`);
      if (d.bodyFat) parts.push(`${d.bodyFat}% fat`);
      if (d.waist) parts.push(`waist ${d.waist}`);
      if (d.chest) parts.push(`chest ${d.chest}`);
      if (d.arms) parts.push(`arms ${d.arms}`);
      return parts.join(' · ');
    }
    case 'note': return d.text || '';
    default: return '';
  }
};
