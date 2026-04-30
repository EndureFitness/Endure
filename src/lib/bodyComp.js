// Body composition + nutrition planning.
//
// Three BMR formulas blended for robustness:
//   - Mifflin-St Jeor (modern, well-validated): 35% weight
//   - Revised Harris-Benedict:                   35% weight
//   - Katch-McArdle (uses LBM from BF%):         30% weight
// Body fat is estimated from BMI + age + sex (Deurenberg) and refined with
// waist circumference if provided. Target is the Army standard: 13% BF for males.

const ARMY_TARGET_BF = 13.0;

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export function estimateBodyFat({ weightLbs, heightIn, age, gender, waistIn }) {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;
  const bmi = weightKg / (heightCm / 100) ** 2;

  // Deurenberg BF% from BMI/age/sex
  const bfBMI = gender === 'M'
    ? 1.20 * bmi + 0.23 * age - 16.2
    : 1.20 * bmi + 0.23 * age - 5.4;

  // Waist refinement (simplified US-Navy without neck)
  let bfWaist = null;
  if (waistIn) {
    const waistCm = waistIn * 2.54;
    bfWaist = gender === 'M'
      ? 0.567 * waistCm - 0.40 * heightCm + 23.0
      : 0.439 * waistCm - 0.221 * heightCm + 26.5;
  }

  const bf = waistIn ? bfBMI * 0.60 + bfWaist * 0.40 : bfBMI;
  return Math.max(4, Math.min(50, parseFloat(bf.toFixed(1))));
}

export function calcPlan({ weightLbs, heightIn, age, gender, waistIn, activityLevel }) {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;

  // BMR — three formulas, blended.
  const mifflin = gender === 'M'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const harrisBenedict = gender === 'M'
    ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
    : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age;

  const bf = estimateBodyFat({ weightLbs, heightIn, age, gender, waistIn });
  const lbmKg = weightKg * (1 - bf / 100);
  const katchMcArdle = 370 + 21.6 * lbmKg;

  const bmr = mifflin * 0.35 + harrisBenedict * 0.35 + katchMcArdle * 0.30;
  const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.55));

  // Fat-loss target — keep current LBM, drop body fat to Army standard 13%.
  const fatMassLbs = weightLbs * (bf / 100);
  const leanMassLbs = weightLbs - fatMassLbs;
  const targetWeightLbs = leanMassLbs / (1 - ARMY_TARGET_BF / 100);
  const fatToLoseLbs = Math.max(0, parseFloat((weightLbs - targetWeightLbs).toFixed(1)));
  const weeksToGoal = Math.ceil(fatToLoseLbs); // 1 lb/wk @ 500 kcal deficit

  // Daily targets
  const fatLossCals = Math.max(1200, tdee - 500);
  const aggressiveCals = Math.max(1200, tdee - 750);

  // Macros — high protein for muscle retention during a deficit.
  // 1g protein per lb of lean mass; remainder ~30% fat / 70% carb by kcal.
  const proteinG = Math.round(leanMassLbs * 1.0);
  const proteinCals = proteinG * 4;
  const remainingCals = fatLossCals - proteinCals;
  const fatG = Math.round((remainingCals * 0.30) / 9);
  const carbG = Math.round((remainingCals * 0.70) / 4);

  // Hydration target ~½ body weight (oz).
  const waterOz = Math.round(weightLbs * 0.55);

  // Weekly cardio mileage scales with reported activity level.
  const weeklyMiles = activityLevel === 'sedentary' ? 8
    : activityLevel === 'light' ? 12
    : activityLevel === 'moderate' ? 16
    : activityLevel === 'active' ? 20 : 25;

  return {
    bf: parseFloat(bf.toFixed(1)),
    targetBF: ARMY_TARGET_BF,
    fatToLoseLbs,
    targetWeightLbs: parseFloat(targetWeightLbs.toFixed(1)),
    weeksToGoal,
    tdee,
    fatLossCals,
    aggressiveCals,
    protein: proteinG,
    carbs: carbG,
    fat: fatG,
    waterOz,
    weeklyMiles,
    leanMassLbs: parseFloat(leanMassLbs.toFixed(1)),
    bmr: Math.round(bmr),
  };
}

// Convert a plan into nutrition goals — what Nutrition.jsx consumes.
export function planToGoals(plan) {
  return {
    calories: plan.fatLossCals,
    protein: plan.protein,
    carbs: plan.carbs,
    fat: plan.fat,
  };
}

export const ALL_RANKS = [
  { group: 'Enlisted', ranks: ['PVT','PV2','PFC','SPC','CPL','SGT','SSG','SFC','MSG','1SG','SGM','CSM','SMA'] },
  { group: 'Warrant Officer', ranks: ['WO1','CW2','CW3','CW4','CW5'] },
  { group: 'Officer', ranks: ['2LT','1LT','CPT','MAJ','LTC','COL','BG','MG','LTG','GEN'] },
];

export const ACTIVITY_LEVELS = [
  { id: 'sedentary',  label: 'SEDENTARY',   sub: 'Desk job, little exercise' },
  { id: 'light',      label: 'LIGHT',       sub: '1–3 days/week training' },
  { id: 'moderate',   label: 'MODERATE',    sub: '3–5 days/week training' },
  { id: 'active',     label: 'ACTIVE',      sub: 'Hard training 6–7 days/week' },
  { id: 'veryActive', label: 'VERY ACTIVE', sub: 'Physical job + daily training' },
];

// Has the user given us enough to compute a plan?
export function isProfileComplete(profile) {
  return Boolean(
    profile?.gender &&
    profile?.age &&
    profile?.height &&
    profile?.weight,
  );
}
