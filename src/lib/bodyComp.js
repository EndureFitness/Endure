// Body composition + nutrition planning.
//
// Two things are calculated, independently:
//
// 1. Calorie + macro targets — driven by Mifflin-St Jeor BMR, an activity
//    multiplier, and a per-goal percent deficit/surplus. Waist circumference
//    does NOT enter this path.
//
// 2. Body composition reference — Waist-to-Height Ratio (WHtR; called "HRS"
//    in older Army docs but the standard name is WHtR). Current DoD
//    guidance (effective 2026-01-01) uses WHtR ≤ 0.55 as the primary
//    screening test. RFM (Relative Fat Mass, Woolcott & Bergman 2018)
//    gives a rough body-fat percentage from the same inputs. Both are
//    informational; neither feeds into calories or macros.

const ARMY_TARGET_BF = 13.0;
const HRS_STANDARD   = 0.55;   // AR 600-9 / DoD WHtR screening threshold

// Sex-aware calorie floor — replaces the old flat 1200 kcal floor that
// could starve a small male trying to train. Caller passes both `bmr` and
// `gender`; final floor is `max(sex_floor, bmr × 1.1)`.
const FLOOR_M = 1500;
const FLOOR_F = 1200;
// Caps on the percent-based deficit/surplus so very-active users don't end
// up with absurd absolute deltas (e.g. 25% of a 4000 kcal TDEE = 1000 kcal).
const MAX_CUT_DEFICIT  = 850;
const MAX_BULK_SURPLUS = 500;

const ACTIVITY_MULTIPLIERS = {
  sedentary:  1.2,
  light:      1.35,
  moderate:   1.45,
  active:     1.6,
  veryActive: 1.8,
};

// ── Body fat reference (informational only, never feeds calorie math) ─────

// Waist-to-Height Ratio. Lower is leaner. ≤ 0.55 meets the Army screening.
// Function name kept as `calcHRS` for backwards-compatibility with existing
// imports; `calcWaistToHeightRatio` is the preferred alias going forward.
export function calcHRS(waistIn, heightIn) {
  if (!waistIn || !heightIn) return null;
  return parseFloat((waistIn / heightIn).toFixed(3));
}
export const calcWaistToHeightRatio = calcHRS;

export function hrsCategory(hrs) {
  if (hrs == null) return null;
  if (hrs <= 0.43) return 'LOW RISK · LEAN';
  if (hrs <= 0.49) return 'ATHLETIC';
  if (hrs <= 0.55) return 'WITHIN STANDARD';
  return 'ABOVE SCREENING THRESHOLD';
}

// Relative Fat Mass (Woolcott & Bergman, 2018). Single-site, no neck.
// Tends to overestimate slightly for athletic builds — flagged as estimate.
function rfm({ heightIn, waistIn, gender }) {
  const constant = gender === 'F' ? 76 : 64;
  return constant - 20 * (heightIn / waistIn);
}

// Deurenberg BMI fallback when no waist measurement.
function deurenberg({ weightLbs, heightIn, age, gender }) {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;
  const bmi = weightKg / (heightCm / 100) ** 2;
  return gender === 'M'
    ? 1.20 * bmi + 0.23 * age - 16.2
    : 1.20 * bmi + 0.23 * age - 5.4;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, parseFloat(v.toFixed(1))));

export function estimateBodyFat({ weightLbs, heightIn, age, gender, waistIn }) {
  if (waistIn) {
    return {
      bf: clamp(rfm({ heightIn, waistIn, gender }), 3, 50),
      method: 'rfm',
      methodLabel: 'Estimate from waist + height',
    };
  }
  return {
    bf: clamp(deurenberg({ weightLbs, heightIn, age, gender }), 5, 50),
    method: 'bmi',
    methodLabel: 'Rough estimate · add waist for better result',
  };
}

// ── Plan ──────────────────────────────────────────────────────────────────

// Per-goal config — calorie mode + protein multiplier. No fixed deltas, no
// universal protein floor; everything scales with bodyweight and TDEE.
const GOAL_CONFIG = {
  cutConservative: { mode: 'cut',  percent: 0.15, proteinPerLb: 0.9, label: 'CONSERVATIVE CUT' },
  cutStandard:     { mode: 'cut',  percent: 0.20, proteinPerLb: 0.9, label: 'STANDARD CUT' },
  cutAggressive:   { mode: 'cut',  percent: 0.25, proteinPerLb: 0.9, label: 'AGGRESSIVE CUT' },
  maintain:        { mode: 'flat', percent: 0,    proteinPerLb: 0.8, label: 'MAINTAIN' },
  bulk:            { mode: 'bulk', percent: 0.10, proteinPerLb: 0.9, label: 'BULK' },
};

// Backwards-compat shim — accept old goal IDs (`cut`) from existing
// data.plan objects so a returning user's saved plan keeps working.
const LEGACY_GOAL_MAP = { cut: 'cutStandard' };
const resolveGoal = (g) => (GOAL_CONFIG[g] ? g : (LEGACY_GOAL_MAP[g] || 'cutStandard'));

export function goalLabel(goalKey) {
  const k = resolveGoal(goalKey);
  return GOAL_CONFIG[k]?.label ?? String(goalKey).toUpperCase();
}

function goalCalories({ tdee, bmr, gender, goalKey }) {
  const cfg   = GOAL_CONFIG[resolveGoal(goalKey)];
  const floor = Math.max(gender === 'M' ? FLOOR_M : FLOOR_F, Math.round(bmr * 1.1));

  if (cfg.mode === 'cut') {
    const deficit = Math.min(Math.round(tdee * cfg.percent), MAX_CUT_DEFICIT);
    return { goalCals: Math.max(floor, tdee - deficit), deficit };
  }
  if (cfg.mode === 'bulk') {
    const surplus = Math.min(Math.round(tdee * cfg.percent), MAX_BULK_SURPLUS);
    return { goalCals: tdee + surplus, deficit: -surplus };
  }
  return { goalCals: tdee, deficit: 0 };
}

function getMacros({ goalCals, weightLbs, goalKey }) {
  const cfg = GOAL_CONFIG[resolveGoal(goalKey)];
  const proteinG = Math.round(weightLbs * cfg.proteinPerLb);
  // Fat floor: max(0.3 g/lb bodyweight, 22% of calories). 0.3 g/lb is the
  // commonly-cited hormonal-health minimum; 22% is the lower bound of the
  // 20–30% recommended fat share when calories are high enough to support it.
  const fatG = Math.max(
    Math.round(weightLbs * 0.3),
    Math.round((goalCals * 0.22) / 9),
  );
  const carbG = Math.max(0, Math.round((goalCals - proteinG * 4 - fatG * 9) / 4));
  return { protein: proteinG, fat: fatG, carbs: carbG };
}

export function calcPlan({
  weightLbs, heightIn, age, gender,
  waistIn,                      // reference only — does not affect cals/macros
  activityLevel,
  goal = 'cutStandard',
}) {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;

  // BMR — Mifflin-St Jeor only.
  const bmr = gender === 'M'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.45));
  const resolvedGoal = resolveGoal(goal);

  const { goalCals, deficit } = goalCalories({ tdee, bmr, gender, goalKey: resolvedGoal });
  const { protein: proteinG, fat: fatG, carbs: carbG } =
    getMacros({ goalCals, weightLbs, goalKey: resolvedGoal });

  // Body comp reference — does NOT influence the math above.
  const hrs = calcHRS(waistIn, heightIn);
  const { bf, method, methodLabel } = estimateBodyFat({ weightLbs, heightIn, age, gender, waistIn });
  const overStandard = hrs != null && hrs > HRS_STANDARD;

  // Fat-to-lose estimate — informational only (uses BF for the projection).
  const atTarget        = bf <= ARMY_TARGET_BF + 0.5;
  const fatToLoseLbs    = atTarget ? 0 : Math.max(0, parseFloat(((bf - ARMY_TARGET_BF) / 100 * weightLbs).toFixed(1)));
  const targetWeightLbs = atTarget ? weightLbs : parseFloat((weightLbs - fatToLoseLbs).toFixed(1));
  // Derive weeks-to-goal from the actual deficit instead of a hard-coded rate.
  // 3500 kcal/lb of fat. weeklyDeficit = deficit × 7. weeks = lbs / lbs-per-week.
  const lbPerWeek = deficit > 0 ? (deficit * 7) / 3500 : 0;
  const weeksToGoal = lbPerWeek > 0 ? Math.ceil(fatToLoseLbs / lbPerWeek) : 0;

  const waterOz = Math.round(weightLbs * 0.55);
  const weeklyMiles = activityLevel === 'sedentary' ? 8
    : activityLevel === 'light'      ? 12
    : activityLevel === 'moderate'   ? 16
    : activityLevel === 'active'     ? 20 : 25;

  return {
    // Reference (informational only)
    bf: parseFloat(bf.toFixed(1)),
    bfMethod: method,
    bfMethodLabel: methodLabel,
    // Deprecated alias — kept for one release so any existing call site
    // checking `plan.bfAccurate` doesn't crash. Will be removed once
    // consumers all switch to `bfMethodLabel`.
    bfAccurate: method === 'rfm',
    hrs,
    hrsCategory: hrsCategory(hrs),
    overStandard,
    targetBF: ARMY_TARGET_BF,
    atTarget,
    fatToLoseLbs,
    targetWeightLbs,
    weeksToGoal,

    // Energy
    bmr: Math.round(bmr),
    tdee,
    goal: resolvedGoal,
    goalCals,
    cutDeficit: deficit > 0 ? deficit : null, // null for maintain/bulk

    // Macros
    protein: proteinG,
    carbs: carbG,
    fat: fatG,

    // Targets
    waterOz,
    weeklyMiles,
  };
}

// `chipLabel` is the short form used in Profile's compact goal-switcher row;
// `label` is the full form used in Onboarding's tall cards.
export const GOALS = [
  { id: 'cutConservative', label: 'CONSERVATIVE CUT', chipLabel: 'CUT 15%',  sub: '~0.5–1 lb/wk · gentle deficit', delta: '−15% TDEE' },
  { id: 'cutStandard',     label: 'STANDARD CUT',     chipLabel: 'CUT 20%',  sub: '~1–1.5 lb/wk · most common',    delta: '−20% TDEE' },
  { id: 'cutAggressive',   label: 'AGGRESSIVE CUT',   chipLabel: 'CUT 25%',  sub: '~1.5–2 lb/wk · short cycles',   delta: '−25% TDEE' },
  { id: 'maintain',        label: 'MAINTAIN',         chipLabel: 'MAINTAIN', sub: 'Hold weight, recomp',           delta: 'TDEE' },
  { id: 'bulk',            label: 'BULK',             chipLabel: 'BULK',     sub: 'Lean muscle gain',              delta: '+10% TDEE' },
];

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

// ── Constants ─────────────────────────────────────────────────────────────

export const ALL_RANKS = [
  { group: 'Enlisted',        ranks: ['PVT','PV2','PFC','SPC','CPL','SGT','SSG','SFC','MSG','1SG','SGM','CSM','SMA'] },
  { group: 'Warrant Officer', ranks: ['WO1','CW2','CW3','CW4','CW5'] },
  { group: 'Officer',         ranks: ['2LT','1LT','CPT','MAJ','LTC','COL','BG','MG','LTG','GEN'] },
];

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
