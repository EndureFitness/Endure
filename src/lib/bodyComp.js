// Body composition + nutrition planning.
//
// Body fat: AR 600-9 (Army Body Composition Program) when neck (and hip for
// women) circumference is provided — this is the official Army standard and is
// the most accurate no-equipment method. Falls back to a clamped Deurenberg
// BMI estimate when the user skips the tape-measure steps, with a flag so the
// UI can warn that the number is rough.
//
// BMR: Mifflin-St Jeor only. Long-running comparisons (Frankenfield 2005)
// found it the single most accurate prediction equation; blending three
// formulas just averages in the weaker ones. Katch-McArdle would be more
// accurate IF we had a precise body-fat number — we don't, so it isn't.
//
// TDEE: BMR × activity multiplier. Multipliers are at the conservative end of
// the published range; soldiers (and everyone) tend to over-pick activity, so
// pull the answer back toward "you probably move less than you think."

const ARMY_TARGET_BF = 13.0;

// Slightly conservative vs. the textbook 1.2 / 1.375 / 1.55 / 1.725 / 1.9.
// Same idea, less inflation.
const ACTIVITY_MULTIPLIERS = {
  sedentary:  1.2,
  light:      1.35,
  moderate:   1.45,
  active:     1.6,
  veryActive: 1.8,
};

const log10 = (x) => Math.log10(x);

// ── Body fat ──────────────────────────────────────────────────────────────

// AR 600-9 (the official Army formula — what your S-1 uses for tape tests).
// Inputs in inches. Returns BF% as a number.
export function bodyFatArmy({ gender, heightIn, waistIn, neckIn, hipIn }) {
  if (gender === 'M') {
    if (!waistIn || !neckIn || waistIn <= neckIn) return null;
    return 86.010 * log10(waistIn - neckIn) - 70.041 * log10(heightIn) + 36.76;
  }
  if (gender === 'F') {
    if (!waistIn || !neckIn || !hipIn || waistIn + hipIn <= neckIn) return null;
    return 163.205 * log10(waistIn + hipIn - neckIn) - 97.684 * log10(heightIn) - 78.387;
  }
  return null;
}

// Deurenberg BMI-based fallback when the user skipped circumferences.
// Tends to overestimate for athletic builds; flagged so UI can warn.
export function bodyFatDeurenberg({ weightLbs, heightIn, age, gender }) {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;
  const bmi = weightKg / (heightCm / 100) ** 2;
  return gender === 'M'
    ? 1.20 * bmi + 0.23 * age - 16.2
    : 1.20 * bmi + 0.23 * age - 5.4;
}

export function estimateBodyFat(input) {
  const army = bodyFatArmy(input);
  if (army != null && army > 0) {
    return { bf: clamp(army, 3, 50), method: 'army', accurate: true };
  }
  const fallback = bodyFatDeurenberg(input);
  return { bf: clamp(fallback, 5, 50), method: 'bmi', accurate: false };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, parseFloat(v.toFixed(1))));

// ── Plan ──────────────────────────────────────────────────────────────────

export function calcPlan({
  weightLbs, heightIn, age, gender,
  waistIn, neckIn, hipIn,
  activityLevel,
}) {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;

  // BMR — Mifflin-St Jeor only.
  const bmr = gender === 'M'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.45));

  // Body fat & lean mass
  const { bf, method, accurate } = estimateBodyFat({ weightLbs, heightIn, age, gender, waistIn, neckIn, hipIn });
  const leanMassLbs = weightLbs * (1 - bf / 100);

  // Fat-loss math: hold LBM constant, drop body fat to Army standard 13%.
  const targetWeightLbs = leanMassLbs / (1 - ARMY_TARGET_BF / 100);
  const fatToLoseLbs = Math.max(0, parseFloat((weightLbs - targetWeightLbs).toFixed(1)));
  const weeksToGoal = Math.ceil(fatToLoseLbs); // ~1 lb/wk @ 500 kcal deficit
  const alreadyLean = bf <= ARMY_TARGET_BF + 0.5;

  // Daily calorie targets — three options, capped at 1200 floor.
  const maintenanceCals = tdee;
  const fatLossCals     = Math.max(1200, tdee - 500);   // 1 lb/wk
  const aggressiveCals  = Math.max(1200, tdee - 750);   // 1.5 lb/wk
  // Calorie goal we actually save: maintenance if already at standard, else moderate cut.
  const goalCals = alreadyLean ? maintenanceCals : fatLossCals;

  // Macros — 1g protein per lb LBM, ~30% fat / 70% carb of remainder.
  const proteinG = Math.round(leanMassLbs * 1.0);
  const proteinCals = proteinG * 4;
  const remainingCals = Math.max(0, goalCals - proteinCals);
  const fatG = Math.round((remainingCals * 0.30) / 9);
  const carbG = Math.round((remainingCals * 0.70) / 4);

  const waterOz = Math.round(weightLbs * 0.55);

  const weeklyMiles = activityLevel === 'sedentary' ? 8
    : activityLevel === 'light'      ? 12
    : activityLevel === 'moderate'   ? 16
    : activityLevel === 'active'     ? 20 : 25;

  return {
    bf: parseFloat(bf.toFixed(1)),
    bfMethod: method,
    bfAccurate: accurate,
    targetBF: ARMY_TARGET_BF,
    alreadyLean,
    fatToLoseLbs,
    targetWeightLbs: parseFloat(targetWeightLbs.toFixed(1)),
    weeksToGoal,
    bmr: Math.round(bmr),
    tdee,
    maintenanceCals,
    fatLossCals,
    aggressiveCals,
    goalCals,
    protein: proteinG,
    carbs: carbG,
    fat: fatG,
    waterOz,
    weeklyMiles,
    leanMassLbs: parseFloat(leanMassLbs.toFixed(1)),
  };
}

export function planToGoals(plan) {
  return {
    calories: plan.goalCals,
    protein:  plan.protein,
    carbs:    plan.carbs,
    fat:      plan.fat,
  };
}

// ── Display helpers ───────────────────────────────────────────────────────

export function formatHeight(totalInches) {
  if (!totalInches) return '—';
  const n = parseInt(totalInches);
  const ft = Math.floor(n / 12);
  const inch = n % 12;
  return `${ft}′${inch}″`;
}

export function formatWaist(inches) {
  if (!inches) return '—';
  return `${inches} in`;
}

// ── Constants ─────────────────────────────────────────────────────────────

export const ALL_RANKS = [
  { group: 'Enlisted',        ranks: ['PVT','PV2','PFC','SPC','CPL','SGT','SSG','SFC','MSG','1SG','SGM','CSM','SMA'] },
  { group: 'Warrant Officer', ranks: ['WO1','CW2','CW3','CW4','CW5'] },
  { group: 'Officer',         ranks: ['2LT','1LT','CPT','MAJ','LTC','COL','BG','MG','LTG','GEN'] },
];

// Tightened descriptions — most active-duty soldiers genuinely fall in MODERATE,
// not ACTIVE. Reading these carefully should pull people toward an honest pick.
export const ACTIVITY_LEVELS = [
  { id: 'sedentary',  label: 'SEDENTARY',   sub: 'Desk job, no scheduled training' },
  { id: 'light',      label: 'LIGHT',       sub: '1–2 short workouts/week' },
  { id: 'moderate',   label: 'MODERATE',    sub: 'Most soldiers — 3–5 sessions/week' },
  { id: 'active',     label: 'HIGH',        sub: 'Hard training 6–7 days/week' },
  { id: 'veryActive', label: 'EXTREME',     sub: 'Two-a-days, ranger school, train-up' },
];

export function isProfileComplete(profile) {
  return Boolean(
    profile?.gender &&
    profile?.age &&
    profile?.height &&
    profile?.weight,
  );
}
