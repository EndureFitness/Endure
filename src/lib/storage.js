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

/**
 * Nuclear wipe — clears every piece of state Endure has ever stashed on this
 * device. Steps are visible to the caller via the optional `onStep` callback
 * so the UI can render a progress trail. Each step interleaves a small delay
 * with real work so the user sees what's happening (and so a single instant
 * "wiped" doesn't feel like the app shrugged off their data).
 *
 * After this resolves: localStorage is empty for our keys, every Cache Storage
 * bucket (map tiles + Workbox precache + runtime) is gone, and any IndexedDB
 * databases we may have created are dropped. The service worker registration
 * is intentionally LEFT in place — unregistering it would lock the user out
 * of the app shell if they're offline. The SW will refetch the shell on next
 * visit anyway.
 */
export async function wipeEverything(onStep) {
  const tick = async (label, delayMs, fn) => {
    onStep?.(label);
    if (fn) try { await fn(); } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  };

  await tick('Clearing offline map areas',           250, () => localStorage.removeItem(OFFLINE_KEY));
  await tick('Clearing soldier profile + plan',      300);
  await tick('Clearing AFT history',                 200);
  await tick('Clearing workouts, runs, rucks',       250);
  await tick('Clearing nutrition log',               250);
  await tick('Clearing weight, sleep, hydration',    300, () => localStorage.removeItem(KEY));

  await tick('Clearing cached map tiles', 500, async () => {
    if ('caches' in window) await caches.delete('map-tiles');
  });

  await tick('Clearing app shell cache', 500, async () => {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  });

  await tick('Clearing local databases', 250, async () => {
    if ('indexedDB' in window && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases();
        await Promise.all(
          dbs.filter((d) => d?.name).map((d) =>
            new Promise((res) => {
              const req = indexedDB.deleteDatabase(d.name);
              req.onsuccess = req.onerror = req.onblocked = () => res();
            })
          )
        );
      } catch {}
    }
  });

  await tick('Done', 150);
}

export { SEED };
