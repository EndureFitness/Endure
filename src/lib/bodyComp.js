// Body composition + nutrition planning.
//
// Two things are calculated, independently:
//
// 1. Calorie + macro targets — driven ONLY by Mifflin-St Jeor BMR,
//    activity multiplier, and bodyweight. Waist circumference does NOT
//    enter this path. Protein is bodyweight × 1g/lb; fat and carbs fill
//    the remaining calories.
//
// 2. Body composition reference — Height-to-Abdomen Ratio (HRS) as the
//    primary number (this is what AR 600-9 actually uses since 2023; the
//    old multi-site neck+hip method is retired). RFM (Relative Fat Mass,
//    Woolcott & Bergman 2018) gives a rough body-fat percentage from the
//    same inputs for those who want a number. Both are shown as
//    informational; neither feeds into calories.

const ARMY_TARGET_BF = 13.0;
const HRS_STANDARD   = 0.55;   // AR 600-9: must be ≤ 0.55 to meet height-abdomen standard

const ACTIVITY_MULTIPLIERS = {
  sedentary:  1.2,
  light:      1.35,
  moderate:   1.45,
  active:     1.6,
  veryActive: 1.8,
};

// ── Body fat reference (informational only, never feeds calorie math) ─────

// Height-to-abdomen ratio. Lower is leaner. ≤ 0.55 meets the Army standard.
export function calcHRS(waistIn, heightIn) {
  if (!waistIn || !heightIn) return null;
  return parseFloat((waistIn / heightIn).toFixed(3));
}

export function hrsCategory(hrs) {
  if (hrs == null) return null;
  if (hrs <= 0.43) return 'VERY LEAN';
  if (hrs <= 0.49) return 'ATHLETIC';
  if (hrs <= 0.55) return 'WITHIN STANDARD';
  return 'OVER STANDARD';
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
    return { bf: clamp(rfm({ heightIn, waistIn, gender }), 3, 50), method: 'rfm' };
  }
  return { bf: clamp(deurenberg({ weightLbs, heightIn, age, gender }), 5, 50), method: 'bmi' };
}

// ── Plan ──────────────────────────────────────────────────────────────────

// Per-goal calorie + protein config.
//
// CUT:      ~1.75 lb/wk fat loss (middle of 1.5–2 lb/wk band). 875 kcal/day
//           deficit. Protein at 1g/lb bodyweight with a 190g floor — anyone
//           under ~190 lb still gets enough protein to preserve muscle in
//           the deficit. Larger soldiers scale past the floor.
// MAINTAIN: 0 delta. Protein 1g/lb.
// BULK:     +400 kcal/day for ~0.8 lb/wk lean gain. Protein 1.1g/lb (10%
//           bump on top of maintain, per spec) to support muscle synthesis.
//
// The 1200 kcal/day floor in calcPlan() catches small users whose TDEE-deficit
// math would otherwise drop into starvation territory.
const GOAL_CONFIG = {
  cut:      { delta: -875, proteinPerLb: 1.0, minProtein: 190 },
  maintain: { delta:    0, proteinPerLb: 1.0, minProtein: 0   },
  bulk:     { delta:  400, proteinPerLb: 1.1, minProtein: 0   },
};

export function calcPlan({
  weightLbs, heightIn, age, gender,
  waistIn,                      // reference only — does not affect cals/macros
  activityLevel,
  goal = 'cut',
}) {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;

  // BMR — Mifflin-St Jeor only.
  const bmr = gender === 'M'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.45));

  const cfg = GOAL_CONFIG[goal] || GOAL_CONFIG.cut;
  const goalCals = Math.max(1200, tdee + cfg.delta);

  // Protein straight from bodyweight, multiplier varies by goal, with a
  // per-goal floor (190g for cut so undersized soldiers still get enough
  // to preserve muscle in a deficit).
  const proteinG    = Math.max(cfg.minProtein || 0, Math.round(weightLbs * cfg.proteinPerLb));
  // 25% of total cals from fat — minimum for hormonal health.
  const fatG        = Math.round((goalCals * 0.25) / 9);
  const proteinCals = proteinG * 4;
  const fatCals     = fatG * 9;
  const carbCals    = Math.max(0, goalCals - proteinCals - fatCals);
  const carbG       = Math.round(carbCals / 4);

  // Body comp reference — does NOT influence the math above.
  const hrs = calcHRS(waistIn, heightIn);
  const { bf, method } = estimateBodyFat({ weightLbs, heightIn, age, gender, waistIn });
  const overStandard = hrs != null && hrs > HRS_STANDARD;

  // Fat-to-lose estimate — informational only (uses BF for the projection).
  const atTarget        = bf <= ARMY_TARGET_BF + 0.5;
  const fatToLoseLbs    = atTarget ? 0 : Math.max(0, parseFloat(((bf - ARMY_TARGET_BF) / 100 * weightLbs).toFixed(1)));
  const targetWeightLbs = atTarget ? weightLbs : parseFloat((weightLbs - fatToLoseLbs).toFixed(1));
  const weeksToGoal     = Math.ceil(fatToLoseLbs / 1.75); // ~1.75 lb/wk at -875 deficit

  const waterOz = Math.round(weightLbs * 0.55);
  const weeklyMiles = activityLevel === 'sedentary' ? 8
    : activityLevel === 'light'      ? 12
    : activityLevel === 'moderate'   ? 16
    : activityLevel === 'active'     ? 20 : 25;

  return {
    // Reference (informational only)
    bf: parseFloat(bf.toFixed(1)),
    bfMethod: method,
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
    goal,
    goalCals,

    // Macros
    protein: proteinG,
    carbs: carbG,
    fat: fatG,

    // Targets
    waterOz,
    weeklyMiles,
  };
}

export const GOALS = [
  { id: 'cut',      label: 'CUT',      sub: '~1.5–2 lb/week · 190g+ protein', delta: '−875 kcal' },
  { id: 'maintain', label: 'MAINTAIN', sub: 'Hold weight, recomp',            delta: 'TDEE' },
  { id: 'bulk',     label: 'BULK',     sub: 'Lean muscle gain · +10% protein', delta: '+400 kcal' },
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
