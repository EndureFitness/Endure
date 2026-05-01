// AFT (Army Fitness Test) scoring tables.
//
// As of the 2025 ACFT → AFT rename, the test is FIVE events: 3RM Deadlift,
// Hand-Release Push-Ups, Sprint-Drag-Carry, Plank, 2-Mile Run. Standing Power
// Throw was retired. Total is now /500, pass = each event ≥ 60 AND total
// ≥ 300 (60% of max).
//
// SPT scoring table is kept here (unused by the form) so legacy entries
// logged before the rename still score correctly in history view. Step-banded;
// do NOT interpolate. Format: descending [minRaw, points] for higher-is-better
// events (MDL, SPT, HRP, PLK), `raw <= threshold` for lower-is-better (SDC, TMR).

export const ACFT_SCALES = {
  MDL: [ // 3-rep max deadlift, lbs
    [340,100],[330,97],[320,94],[310,91],[300,88],[290,85],[280,82],[270,79],[260,76],
    [250,73],[240,70],[230,67],[220,64],[210,61],[200,58],[190,55],[180,52],[170,49],
    [160,46],[150,43],[140,40],[130,37],[120,34],[110,31],[100,28],[90,25],[80,22],
  ],
  SPT: [ // standing power throw, meters * 10 (so 12.5 m → 125)
    [125,100],[120,97],[115,94],[110,91],[105,88],[100,85],[95,82],[90,79],[85,76],
    [80,73],[75,70],[70,67],[65,64],[60,61],[55,58],[50,55],[45,52],[40,49],[35,46],
  ],
  HRP: [ // hand-release push-ups, reps
    [100,100],[90,97],[80,94],[70,91],[60,88],[55,85],[50,82],[45,79],[40,76],
    [35,73],[30,70],[25,67],[20,64],[15,61],[10,58],[5,55],[1,52],
  ],
  SDC: [ // sprint-drag-carry, seconds (lower is better)
    [98,100],[100,98],[105,95],[110,92],[115,89],[120,86],[125,83],[130,80],[135,77],
    [140,74],[145,71],[150,68],[155,65],[160,62],[165,59],[170,56],[175,53],[180,50],
    [185,47],[190,44],[200,40],[210,36],[220,32],[230,28],[240,24],
  ],
  PLK: [ // plank, seconds
    [270,100],[260,97],[250,94],[240,91],[230,88],[220,85],[210,82],[200,79],[190,76],
    [180,73],[170,70],[160,67],[150,64],[140,61],[130,58],[120,55],[110,52],[100,49],
    [90,46],[80,43],[70,40],[60,37],
  ],
  TMR: [ // 2-mile run, seconds (lower is better)
    [780,100],[795,98],[810,96],[825,94],[840,92],[855,90],[870,88],[885,86],
    [900,84],[915,82],[930,80],[945,78],[960,76],[975,74],[990,72],[1005,70],
    [1020,68],[1035,66],[1050,64],[1065,62],[1080,60],[1100,58],[1120,56],
    [1140,54],[1160,52],[1180,50],[1200,48],[1220,46],[1240,44],[1260,40],
  ],
};

const LOWER_IS_BETTER = new Set(['SDC', 'TMR']);

export function scoreEvent(event, raw) {
  if (raw === '' || raw === null || raw === undefined || Number.isNaN(raw)) return null;
  const scale = ACFT_SCALES[event];
  if (!scale) return null;
  const lower = LOWER_IS_BETTER.has(event);
  for (const [threshold, pts] of scale) {
    if (lower ? raw <= threshold : raw >= threshold) return pts;
  }
  return 0;
}

export function gradeTotal(scores) {
  const values = Object.values(scores);
  const total = values.reduce((s, v) => s + (v || 0), 0);
  const allEntered = values.length > 0 && values.every((v) => v !== null && v !== undefined);
  // Pass = each event ≥ 60 AND total ≥ 60% of max (300 for 5-event AFT,
  // 360 for legacy 6-event ACFT entries that still include SPT).
  const minTotal = values.length * 60;
  const pass = allEntered && values.every((v) => v >= 60) && total >= minTotal;
  const maxTotal = values.length * 100;
  return { total, pass, allEntered, maxTotal };
}

// Current AFT events (5). SPT (Standing Power Throw) was retired in the 2025
// update; legacy entries that include an SPT score still render in history
// via EVENT_LABELS below.
export const EVENTS = [
  { key: 'MDL', label: '3-Rep Max Deadlift',    unit: 'lbs',  inputType: 'number',     placeholder: 'e.g. 280', icon: 'MDL' },
  { key: 'HRP', label: 'Hand-Release Push-Ups', unit: 'reps', inputType: 'number',     placeholder: 'e.g. 42',  icon: 'HRP' },
  { key: 'SDC', label: 'Sprint-Drag-Carry',     unit: 'sec',  inputType: 'number',     placeholder: 'e.g. 118', icon: 'SDC' },
  { key: 'PLK', label: 'Plank',                 unit: 'sec',  inputType: 'number',     placeholder: 'e.g. 180', icon: 'PLK' },
  { key: 'TMR', label: '2-Mile Run',            unit: '',     inputType: 'time-input', placeholder: 'MM:SS total', icon: '2MR' },
];

// Display labels for all event keys ever used, including retired SPT. The
// history view iterates over the entry's actual scores object (not EVENTS)
// and looks up labels here so legacy 6-event entries still render their SPT
// score with the correct abbreviation and full label.
export const EVENT_LABELS = {
  MDL: { abbr: 'MDL', label: '3-Rep Max Deadlift',    unit: 'lbs'  },
  SPT: { abbr: 'SPT', label: 'Standing Power Throw',  unit: 'm×10' },
  HRP: { abbr: 'HRP', label: 'Hand-Release Push-Ups', unit: 'reps' },
  SDC: { abbr: 'SDC', label: 'Sprint-Drag-Carry',     unit: 'sec'  },
  PLK: { abbr: 'PLK', label: 'Plank',                 unit: 'sec'  },
  TMR: { abbr: '2MR', label: '2-Mile Run',            unit: ''     },
};

// Canonical render order so history displays MDL first, TMR last,
// regardless of object-key iteration order.
const EVENT_ORDER = ['MDL', 'SPT', 'HRP', 'SDC', 'PLK', 'TMR'];

export function orderedScoreKeys(scores) {
  return EVENT_ORDER.filter((k) => k in scores);
}
