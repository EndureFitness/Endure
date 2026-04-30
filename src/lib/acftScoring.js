// ACFT scoring tables — extracted verbatim from the mockup so the totals
// remain reproducible. These are simplified representative brackets aligned
// with the gender-/age-neutral baseline (FM 7-22 Appendix A, 22–26 male
// reference). Step-banded; do NOT interpolate.
//
// Format: descending [minRaw, points] pairs. For lower-is-better events
// (SDC, TMR), the table is read with `raw <= threshold`.

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
  const pass = allEntered && values.every((v) => v >= 60) && total >= 360;
  return { total, pass, allEntered };
}

export const EVENTS = [
  { key: 'MDL', label: '3-Rep Max Deadlift',  unit: 'lbs',  inputType: 'number', placeholder: 'e.g. 280', icon: 'MDL' },
  { key: 'SPT', label: 'Standing Power Throw', unit: 'm×10', inputType: 'number', placeholder: '10.5 m → enter 105', icon: 'SPT' },
  { key: 'HRP', label: 'Hand-Release Push-Ups', unit: 'reps', inputType: 'number', placeholder: 'e.g. 42', icon: 'HRP' },
  { key: 'SDC', label: 'Sprint-Drag-Carry',    unit: 'sec',  inputType: 'number', placeholder: 'e.g. 118', icon: 'SDC' },
  { key: 'PLK', label: 'Plank',                unit: 'sec',  inputType: 'number', placeholder: 'e.g. 180', icon: 'PLK' },
  { key: 'TMR', label: '2-Mile Run',           unit: '',     inputType: 'time-input', placeholder: 'MM:SS total', icon: '2MR' },
];
