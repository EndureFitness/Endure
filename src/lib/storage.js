// Local-only persistence. Anything that lives here never leaves the device.
//
// `endure_data_v1` is the entire app state as one JSON blob. localStorage caps at
// ~5 MB per origin in practice; even a year of dense GPS tracks fits easily.

const KEY = 'endure_data_v1';
const SCHEMA_VERSION = 1;

const SEED = {
  schemaVersion: SCHEMA_VERSION,
  workouts: [],
  weights: [],
  nutrition: [],
  // Default macros — overwritten by the personalised plan once Onboarding completes.
  nutritionGoals: { calories: 2500, protein: 180, carbs: 250, fat: 80 },
  water: [],
  waterGoal: 120,
  sleep: [],
  acft: [],
  profile: {
    rank: '', name: '', unit: '', mos: '', branch: '',
    age: '', gender: '', height: '', weight: '', waist: '',
    activityLevel: 'moderate', notes: '',
  },
  plan: null, // BMR/TDEE/macros bundle from lib/bodyComp.js — set by Onboarding.
};

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw);
    // Fill in any missing top-level keys from SEED (forward-compat).
    return { ...SEED, ...parsed };
  } catch (err) {
    // Don't silently swallow — leaves the user thinking everything's fine when
    // their data is wedged. They can decide whether to reset.
    console.error('Failed to load saved data, falling back to seed:', err);
    return SEED;
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // Quota exceeded or storage disabled — surface to user, don't silently lose data.
    console.error('Failed to persist data:', e);
    alert('Could not save — device storage is full or disabled.');
  }
}

// Offline-areas index lives under a separate localStorage key (managed by
// lib/offlineMaps.js). Bundle it into the export so a backup→wipe→restore
// round-trip preserves saved training-area metadata too.
const OFFLINE_KEY = 'endure_offline_v1';

export function exportJSON(data) {
  let offlineAreas = null;
  try { offlineAreas = JSON.parse(localStorage.getItem(OFFLINE_KEY) || 'null'); } catch {}
  const payload = { ...data, _offlineAreas: offlineAreas };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `endure-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
        // Restore the offline-areas index if present, then strip it from the
        // returned payload so the main store stays clean.
        if (parsed._offlineAreas) {
          try { localStorage.setItem(OFFLINE_KEY, JSON.stringify(parsed._offlineAreas)); } catch {}
        }
        const { _offlineAreas, ...mainData } = parsed;
        resolve({ ...SEED, ...mainData });
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function wipeData() {
  localStorage.removeItem(KEY);
}

export { SEED };
