import { useEffect, useId, useMemo, useState } from 'react';
import { usePWAInstall } from '../lib/install.js';
import { wipeEverything } from '../lib/storage.js';
import OfflineMaps from './OfflineMaps.jsx';

const More = ({ data, saveData, setTab, onResetComplete }) => {
  const [view, setView] = useState('hub');
  const install = usePWAInstall();

  if (view === 'weighin') return <WeighIn data={data} saveData={saveData} onBack={() => setView('hub')} />;
  if (view === 'water') return <Water data={data} saveData={saveData} onBack={() => setView('hub')} />;
  if (view === 'sleep') return <Sleep data={data} saveData={saveData} onBack={() => setView('hub')} />;
  if (view === 'install_ios') return <IOSInstallGuide onBack={() => setView('hub')} />;
  if (view === 'offline_maps') return <OfflineMaps onBack={() => setView('hub')} />;
  if (view === 'reset') return <ResetFlow onCancel={() => setView('hub')} onResetComplete={onResetComplete} />;

  const today = new Date().toDateString();
  const waterTodayOz = (data.water || []).filter(w => new Date(w.date).toDateString() === today).reduce((s, e) => s + e.oz, 0);
  const sleepToday = (data.sleep || []).find(s => new Date(s.date).toDateString() === today);

  const menuItems = [
    { id:'weighin', icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ), label:'WEIGH IN', sub:'Body weight tracking', val: data.weights?.length ? `${data.weights[data.weights.length-1].weight} lbs` : '—' },
    { id:'water', icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>
    ), label:'HYDRATION', sub:'Daily water intake', val: waterTodayOz ? `${waterTodayOz} oz` : '—' },
    { id:'sleep', icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    ), label:'SLEEP', sub:'Rest & recovery log', val: sleepToday ? `${sleepToday.hours}h` : '—' },
    { id:'offline_maps', icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    ), label:'OFFLINE MAPS', sub:'Pre-download tiles for training areas', val: '' },
    { id:'log_nav', nav:'log', icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ), label:'ACTIVITY LOG', sub:'Full workout history', val: `${(data.workouts||[]).length} sessions` },
    { id:'profile_nav', nav:'profile', icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ), label:'SOLDIER PROFILE', sub:'Rank, unit, MOS', val: data.profile?.rank ? `${data.profile.rank} ${data.profile.name||''}`.trim() : '—' },
  ];

  const shareLink = async () => {
    const url = window.location.href.split('#')[0];
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Endure', text: 'Privacy-first military fitness tracker.', url });
      } catch { /* user cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard.');
    } catch {
      prompt('Copy this link:', url);
    }
  };

  return (
    <div style={st.screen}>
      <div style={st.header}>MORE</div>

      {!install.isStandalone && (install.canInstall || install.isIOS) && (
        <div style={st.installCard}>
          <div style={{ flex:1 }}>
            <div style={st.installTitle}>INSTALL ENDURE</div>
            <div style={st.installSub}>
              {install.canInstall
                ? 'Add to your home screen for offline access and a full-screen, app-like experience.'
                : 'Tap below for instructions to add Endure to your iPhone home screen.'}
            </div>
          </div>
          <button
            style={st.installBtn}
            onClick={() => install.canInstall ? install.install() : setView('install_ios')}
          >
            INSTALL
          </button>
        </div>
      )}

      {menuItems.map(item => (
        <button key={item.id} style={st.menuItem} onClick={() => {
          if (item.nav) setTab(item.nav);
          else setView(item.id);
        }}>
          <span style={st.menuIcon}>{item.icon}</span>
          <div style={{ flex:1 }}>
            <div style={st.menuLabel}>{item.label}</div>
            <div style={st.menuSub}>{item.sub}</div>
          </div>
          <div style={st.menuVal}>{item.val}</div>
          <span style={st.menuArrow}>›</span>
        </button>
      ))}

      <button style={st.menuItem} onClick={shareLink}>
        <span style={st.menuIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </span>
        <div style={{ flex:1 }}>
          <div style={st.menuLabel}>SHARE LINK</div>
          <div style={st.menuSub}>Send Endure to a battle buddy</div>
        </div>
        <span style={st.menuArrow}>›</span>
      </button>

      <div style={st.privacyNote}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ marginRight: 6, flexShrink: 0 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        All data stored locally on your device. No accounts. No cloud. No tracking.
      </div>

      <div style={st.dangerLabel}>DANGER ZONE</div>
      <button style={st.resetBtn} onClick={() => setView('reset')}>
        RESET ALL DATA
      </button>
    </div>
  );
};

// ── Reset flow ──────────────────────────────────────────────────────────────
//
// Three sub-views: confirm → progress → done. The actual wipe runs during
// progress so the user sees real-time deletion, not a fake loader.
function ResetFlow({ onCancel, onResetComplete }) {
  const [stage, setStage] = useState('confirm');
  const [steps, setSteps] = useState([]); // completed step labels
  const [currentStep, setCurrentStep] = useState('');

  const begin = async () => {
    setStage('progress');
    await wipeEverything((label) => {
      if (label === 'Done') {
        setCurrentStep('');
        return;
      }
      setCurrentStep(label);
      setSteps((prev) => [...prev, label]);
    });
    setStage('done');
  };

  if (stage === 'confirm') {
    return (
      <div style={st.subScreen}>
        <div style={st.subHeader}>
          <button style={st.backBtn} onClick={onCancel}>←</button>
          <span style={st.subTitle}>RESET ALL DATA</span>
          <div style={{ width: 32 }}></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={st.resetWarnIcon}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cc6666" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div style={st.resetWarnTitle}>This will permanently delete</div>
          <ul style={st.resetList}>
            <li>Soldier profile + plan</li>
            <li>AFT history</li>
            <li>All workouts (rucks, runs, walks)</li>
            <li>Nutrition log + custom foods</li>
            <li>Weight, sleep, hydration log</li>
            <li>Saved offline map areas + cached tiles</li>
            <li>App shell + service worker caches</li>
          </ul>
          <div style={st.resetHardWarn}>
            This cannot be undone. If you want to keep a backup, tap CANCEL and use Activity Log → EXPORT first.
          </div>
          <button style={st.resetConfirmBtn} onClick={begin}>I UNDERSTAND — RESET</button>
          <button style={st.resetCancelBtn} onClick={onCancel}>CANCEL</button>
        </div>
      </div>
    );
  }

  if (stage === 'progress') {
    return (
      <div style={st.subScreen}>
        <div style={st.subHeader}>
          <div style={{ width: 32 }}></div>
          <span style={st.subTitle}>RESETTING…</span>
          <div style={{ width: 32 }}></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
          <div style={st.progressHeadline}>{currentStep || 'Starting…'}</div>
          <div style={st.progressList}>
            {steps.map((label, i) => (
              <div key={i} style={st.progressItem}>
                <span style={{ color: 'var(--accent)', marginRight: 8 }}>✓</span>
                <span style={st.progressItemText}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // stage === 'done'
  return (
    <div style={st.subScreen}>
      <div style={st.subHeader}>
        <div style={{ width: 32 }}></div>
        <span style={st.subTitle}>RESET COMPLETE</span>
        <div style={{ width: 32 }}></div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', textAlign: 'center' }}>
        <div style={st.resetDoneIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={st.resetDoneTitle}>ALL DATA CLEARED</div>
        <div style={st.resetDoneSub}>
          Endure has been reset to factory defaults. Tap below to start fresh — you'll go through the intake again to generate a new plan.
        </div>
        <button style={st.resetFinishBtn} onClick={onResetComplete}>
          FINISHED — START FRESH
        </button>
      </div>
    </div>
  );
}

// iOS doesn't expose an install API. Show step-by-step instructions instead.
const IOSInstallGuide = ({ onBack }) => (
  <div style={st.subScreen}>
    <div style={st.subHeader}>
      <button style={st.backBtn} onClick={onBack}>←</button>
      <span style={st.subTitle}>INSTALL ON iOS</span>
      <div style={{ width:32 }}></div>
    </div>
    <div style={{ flex:1, overflowY:'auto', padding:'0 16px 24px' }}>
      <div style={st.iosCard}>
        <div style={st.iosStep}>
          <div style={st.iosStepNum}>1</div>
          <div style={st.iosStepText}>
            <div style={st.iosStepTitle}>Tap the Share button</div>
            <div style={st.iosStepSub}>The square-with-arrow icon at the bottom of Safari (or the top, on iPad).</div>
          </div>
        </div>
        <div style={st.iosStep}>
          <div style={st.iosStepNum}>2</div>
          <div style={st.iosStepText}>
            <div style={st.iosStepTitle}>Scroll down → "Add to Home Screen"</div>
            <div style={st.iosStepSub}>You may need to scroll past the share targets.</div>
          </div>
        </div>
        <div style={st.iosStep}>
          <div style={st.iosStepNum}>3</div>
          <div style={st.iosStepText}>
            <div style={st.iosStepTitle}>Tap "Add"</div>
            <div style={st.iosStepSub}>Endure now lives on your home screen and launches full-screen, no browser bar.</div>
          </div>
        </div>
      </div>
      <div style={st.iosNote}>
        Endure must be opened in Safari to install. Chrome on iOS doesn't support home-screen installs.
      </div>
    </div>
  </div>
);

const WeighIn = ({ data, onBack, saveData }) => {
  const [input, setInput] = useState('');
  const weights = data.weights || [];

  const logWeight = () => {
    const val = parseFloat(input);
    if (!val || val < 50 || val > 500) {
      alert('Enter a weight between 50 and 500 lbs.');
      return;
    }
    // Replace today's entry instead of stacking duplicates — most users weigh
    // in once a day; logging twice should overwrite, not graph the same point
    // twice.
    const todayStr = new Date().toDateString();
    const filtered = weights.filter(w => new Date(w.date).toDateString() !== todayStr);
    const entry = { id: Date.now(), date: new Date().toISOString(), weight: val };
    saveData({ ...data, weights: [...filtered, entry] });
    setInput('');
  };

  const monthAgo = new Date(Date.now() - 30 * 86_400_000);
  const recent = weights.filter(w => new Date(w.date) >= monthAgo);
  const latest = weights.length ? weights[weights.length - 1] : null;

  const SparkLine30 = () => {
    const gradId = useId();
    if (recent.length < 2) return <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:11 }}>Log more data to see trend</div>;
    const vals = recent.map(w => w.weight);
    const min = Math.min(...vals) - 2;
    const max = Math.max(...vals) + 2;
    const W = 320, H = 80;
    const pts = recent.map((w, i) => {
      const x = (i / (recent.length - 1)) * W;
      const y = H - ((w.weight - min) / (max - min)) * (H - 10) - 5;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display:'block', height:80 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polyline points={`0,${H} ${pts} ${W},${H}`} fill={`url(#${gradId})`} stroke="none"/>
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round"/>
        {recent.map((w, i) => {
          const x = (i / (recent.length - 1)) * W;
          const y = H - ((w.weight - min) / (max - min)) * (H - 10) - 5;
          return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--accent)"/>;
        })}
      </svg>
    );
  };

  return (
    <div style={st.subScreen}>
      <div style={st.subHeader}>
        <button style={st.backBtn} onClick={onBack}>←</button>
        <span style={st.subTitle}>WEIGH IN</span>
        <div style={{ width:32 }}></div>
      </div>
      <div style={{ padding:'0 16px', flex:1, overflowY:'auto' }}>
        {latest && (
          <div style={st.bigStat}>
            <span style={st.bigVal}>{latest.weight}</span>
            <span style={st.bigUnit}> LBS</span>
            <div style={st.bigDate}>{new Date(latest.date).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</div>
          </div>
        )}
        <div style={st.chartCard}>
          <div style={st.chartLabel}>30-DAY TREND</div>
          <SparkLine30 />
        </div>
        <div style={st.inputRow}>
          <input
            style={st.weightInput}
            type="number"
            inputMode="decimal"
            placeholder="206.4"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && logWeight()}
          />
          <span style={st.weightInputUnit}>LBS</span>
          <button style={st.logBtn} onClick={logWeight}>LOG</button>
        </div>
        <div style={st.historyLabel}>HISTORY</div>
        {[...weights].reverse().slice(0, 30).map(w => (
          <div key={w.id} style={st.histRow}>
            <span style={st.histDate}>{new Date(w.date).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</span>
            <span style={st.histVal}>{w.weight} lbs</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Water = ({ data, onBack, saveData }) => {
  const today = new Date().toDateString();
  const todayEntries = (data.water || []).filter(e => new Date(e.date).toDateString() === today);
  const totalOz = todayEntries.reduce((s, e) => s + e.oz, 0);
  const goal = data.waterGoal || 120;
  const pct = Math.min(totalOz / goal, 1);

  const addWater = (oz) => {
    const entry = { id: Date.now(), date: new Date().toISOString(), oz };
    saveData({ ...data, water: [...(data.water || []), entry] });
  };

  const removeLastWater = () => {
    const water = [...(data.water || [])];
    let lastIdx = -1;
    water.forEach((e, i) => { if (new Date(e.date).toDateString() === today) lastIdx = i; });
    if (lastIdx >= 0) {
      water.splice(lastIdx, 1);
      saveData({ ...data, water });
    }
  };

  const quickAmounts = [8, 12, 16, 24];

  return (
    <div style={st.subScreen}>
      <div style={st.subHeader}>
        <button style={st.backBtn} onClick={onBack}>←</button>
        <span style={st.subTitle}>WATER</span>
        <div style={{ width:32 }}></div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px' }}>
        <div style={st.dateNav}>
          <span style={st.dateLabel}>{new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</span>
        </div>
        <div style={st.ringWrap}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="72" fill="none" stroke="var(--surface-2)" strokeWidth="12"/>
            <circle cx="90" cy="90" r="72" fill="none" stroke="#4a7a8e" strokeWidth="12"
              strokeDasharray={`${pct * 452} 452`}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
              style={{ transition:'stroke-dasharray 0.4s ease' }}/>
            <text x="90" y="82" textAnchor="middle" fill="var(--text)" fontSize="30" fontFamily="var(--font-head)" fontWeight="700">{totalOz}</text>
            <text x="90" y="100" textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontFamily="var(--font-body)">oz / {goal} oz</text>
            <text x="90" y="120" textAnchor="middle" fill="#4a7a8e" fontSize="10" fontFamily="var(--font-body)" letterSpacing="2">{Math.round(pct * 100)}%</text>
          </svg>
        </div>
        <div style={st.waterControls}>
          <button style={st.waterMinus} onClick={removeLastWater}>−</button>
          <button style={st.waterPlusBtn} onClick={() => addWater(8)}>+8 oz</button>
        </div>
        <div style={st.quickLabel}>QUICK ADD</div>
        <div style={st.quickRow}>
          {quickAmounts.map(oz => (
            <button key={oz} style={st.quickBtn} onClick={() => addWater(oz)}>{oz} oz</button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Sleep ───────────────────────────────────────────────────────────────────
//
// Army recommendation (FM 7-22): 7–9 hours nightly. We use 8 h as the target
// for sleep-debt math; the streak counter requires ≥7 h consistent with the
// minimum. Color is the sleep-specific indigo (#5a4a8e) — kept distinct from
// the olive accent and water blue so the Dashboard glance can tell sections
// apart at a peripheral read.
const SLEEP_COLOR = '#7a6ab8';
const SLEEP_TARGET = 8.0;
const SLEEP_MIN = 7.0;

const calcHours = (bed, wake) => {
  if (!bed || !wake) return 0;
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 1440;
  return mins / 60;
};

const QUALITIES = ['Poor', 'Fair', 'Good', 'Great'];

function computeSleepStats(sleep) {
  const now = new Date();
  const todayStr = now.toDateString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  const recent = sleep
    .filter((s) => new Date(s.date) >= sevenDaysAgo)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const avg = recent.length > 0
    ? recent.reduce((s, e) => s + (e.hours || 0), 0) / recent.length
    : 0;

  // Sleep debt — sum of (target - hours), positive only, over last 7 nights.
  // Days without an entry count as 0 logged hours, full target debt.
  let debt = 0;
  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(now.getTime() - d * 86_400_000);
    const entry = sleep.find((s) => new Date(s.date).toDateString() === dayDate.toDateString());
    const hrs = entry?.hours || 0;
    if (hrs < SLEEP_TARGET) debt += SLEEP_TARGET - hrs;
  }

  // Streak — consecutive days from today (inclusive of yesterday if today not logged)
  // with hours ≥ SLEEP_MIN. Today not yet logged doesn't break the streak.
  let streak = 0;
  for (let d = 0; d < 60; d++) {
    const dayDate = new Date(now.getTime() - d * 86_400_000);
    const entry = sleep.find((s) => new Date(s.date).toDateString() === dayDate.toDateString());
    if (!entry) {
      if (d === 0 && dayDate.toDateString() === todayStr) continue; // today empty, fine
      break;
    }
    if ((entry.hours || 0) >= SLEEP_MIN) streak++;
    else break;
  }

  return { avg, debt, streak, recent };
}

const Sleep = ({ data, onBack, saveData }) => {
  const sleep = data.sleep || [];
  const [selectedDate, setSelectedDate] = useState(() => new Date().toDateString());
  const [savedFlash, setSavedFlash] = useState(false);
  const sparkId = useId();

  // Re-init form when the selected date changes — pre-fill from existing entry,
  // or fall back to sensible defaults for a new entry.
  const existing = sleep.find((s) => new Date(s.date).toDateString() === selectedDate);
  const [bedTime, setBedTime] = useState(existing?.bedTime || '23:00');
  const [wakeTime, setWakeTime] = useState(existing?.wakeTime || '06:30');
  const [quality, setQuality] = useState(existing?.quality || 'Good');
  const [note, setNote] = useState(existing?.note || '');

  // Sync form to selectedDate's existing entry (or defaults) on date change.
  useEffect(() => {
    const e = sleep.find((s) => new Date(s.date).toDateString() === selectedDate);
    setBedTime(e?.bedTime || '23:00');
    setWakeTime(e?.wakeTime || '06:30');
    setQuality(e?.quality || 'Good');
    setNote(e?.note || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const hours = calcHours(bedTime, wakeTime);
  const pct = Math.min(hours / SLEEP_TARGET, 1);
  // Memoize — computeSleepStats does O(60) date lookups across `sleep`, only
  // changes when `sleep` changes.
  const stats = useMemo(() => computeSleepStats(sleep), [sleep]);

  const todayStr = new Date().toDateString();
  const isToday = selectedDate === todayStr;
  const dateLabel = isToday
    ? 'Last Night'
    : new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const shiftDate = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    if (d > new Date()) return; // no future entries
    setSelectedDate(d.toDateString());
  };

  const logSleep = () => {
    if (hours <= 0) { alert('Wake time must be after bed time.'); return; }
    const entry = {
      id: existing?.id || Date.now(),
      date: new Date(selectedDate).toISOString(),
      bedTime, wakeTime,
      hours: parseFloat(hours.toFixed(2)),
      quality, note,
    };
    const filtered = sleep.filter((s) => new Date(s.date).toDateString() !== selectedDate);
    saveData({ ...data, sleep: [...filtered, entry] });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const deleteEntry = (id) => {
    if (!confirm('Delete this sleep entry?')) return;
    const deleted = sleep.find((s) => s.id === id);
    saveData({ ...data, sleep: sleep.filter((s) => s.id !== id) });
    // If the deleted entry was the one currently loaded in the form, reset
    // the form so a follow-up UPDATE doesn't silently re-create what was
    // just deleted.
    if (deleted && new Date(deleted.date).toDateString() === selectedDate) {
      setBedTime('23:00');
      setWakeTime('06:30');
      setQuality('Good');
      setNote('');
    }
  };

  // Trend sparkline — last 14 days, target line at SLEEP_TARGET.
  const trendDays = 14;
  const trendData = [];
  for (let d = trendDays - 1; d >= 0; d--) {
    const day = new Date(Date.now() - d * 86_400_000);
    const entry = sleep.find((s) => new Date(s.date).toDateString() === day.toDateString());
    trendData.push({ day, hours: entry?.hours ?? null });
  }
  const hasTrendData = trendData.some((p) => p.hours != null);

  const recentNights = [...sleep]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);

  return (
    <div style={st.subScreen}>
      <div style={st.subHeader}>
        <button style={st.backBtn} onClick={onBack} aria-label="Back">←</button>
        <span style={st.subTitle}>SLEEP</span>
        <div style={{ width: 32 }}></div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        {/* Date navigation */}
        <div style={st.sleepDateRow}>
          <button style={st.sleepDateBtn} onClick={() => shiftDate(-1)} aria-label="Previous day">‹</button>
          <span style={st.sleepDateLabel}>{dateLabel}</span>
          <button
            style={{ ...st.sleepDateBtn, opacity: isToday ? 0.3 : 1, cursor: isToday ? 'not-allowed' : 'pointer' }}
            disabled={isToday}
            onClick={() => shiftDate(1)}
            aria-label="Next day"
          >›</button>
        </div>

        {/* Stats row */}
        <div style={st.sleepStatsRow}>
          <div style={st.sleepStatBox}>
            <div style={st.sleepStatVal}>{stats.recent.length > 0 ? stats.avg.toFixed(1) : '—'}</div>
            <div style={st.sleepStatLbl}>7-DAY AVG</div>
          </div>
          <div style={st.sleepStatBox}>
            <div style={{ ...st.sleepStatVal, color: stats.debt > 7 ? 'var(--error)' : stats.debt > 3 ? 'var(--warn)' : 'var(--accent)' }}>
              {stats.debt.toFixed(1)}h
            </div>
            <div style={st.sleepStatLbl}>SLEEP DEBT</div>
          </div>
          <div style={st.sleepStatBox}>
            <div style={{ ...st.sleepStatVal, color: stats.streak > 0 ? SLEEP_COLOR : 'var(--text-muted)' }}>
              {stats.streak}
            </div>
            <div style={st.sleepStatLbl}>STREAK</div>
          </div>
        </div>

        {/* Big ring */}
        <div style={st.ringWrap}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="72" fill="none" stroke="var(--surface-2)" strokeWidth="12"/>
            <circle cx="90" cy="90" r="72" fill="none" stroke={SLEEP_COLOR} strokeWidth="12"
              strokeDasharray={`${pct * 452} 452`}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
              style={{ transition: 'stroke-dasharray 0.4s ease' }}/>
            <text x="90" y="78" textAnchor="middle" fill="var(--text)" fontSize="34" fontFamily="var(--font-head)" fontWeight="800">{hours.toFixed(2)}</text>
            <text x="90" y="98" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontFamily="var(--font-body)" letterSpacing="2">HOURS</text>
            <text x="90" y="120" textAnchor="middle" fill={SLEEP_COLOR} fontSize="10" fontFamily="var(--font-body)" letterSpacing="2">
              {hours >= SLEEP_TARGET ? '✓ AT TARGET' : `${(SLEEP_TARGET - hours).toFixed(1)}H UNDER`}
            </text>
          </svg>
        </div>

        {/* Bed / wake times */}
        <div style={st.timesRow}>
          <div style={st.timeBlock}>
            <div style={st.timeLabel}>TIME TO BED</div>
            <input style={st.timeInput} type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} />
          </div>
          <div style={st.timeDivider}></div>
          <div style={st.timeBlock}>
            <div style={st.timeLabel}>WAKE TIME</div>
            <input style={st.timeInput} type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
          </div>
        </div>

        {/* Quality */}
        <div style={st.qualityRow}>
          <div style={st.qualityLabel}>QUALITY</div>
          <div style={st.qualityBtns}>
            {QUALITIES.map((q) => (
              <button key={q} type="button"
                style={{ ...st.qualBtn, ...(quality === q ? st.qualBtnActive : {}) }}
                onClick={() => setQuality(q)}
              >{q}</button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={st.noteGroup}>
          <label style={st.noteLabel}>NOTE</label>
          <input
            style={st.noteInput} type="text"
            placeholder="e.g. Felt rested · Poor due to staff duty · Hard to fall asleep"
            value={note} onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          style={{ ...st.logSleepBtn, ...(savedFlash ? st.logSleepBtnSaved : {}) }}
          onClick={logSleep}
        >
          {savedFlash ? '✓ SAVED' : existing ? 'UPDATE SLEEP' : 'LOG SLEEP'}
        </button>

        {/* 14-day trend */}
        <div style={st.sleepSectionLabel}>14-DAY TREND</div>
        <div style={st.sleepTrendCard}>
          {hasTrendData ? (() => {
            const W = 320, H = 80;
            const yMax = Math.max(SLEEP_TARGET + 1, ...trendData.filter((p) => p.hours != null).map((p) => p.hours));
            const yMin = 0;
            const xFor = (i) => (i / (trendData.length - 1)) * W;
            const yFor = (h) => H - ((h - yMin) / (yMax - yMin)) * (H - 12) - 6;
            const targetY = yFor(SLEEP_TARGET);
            return (
              <svg width="100%" viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" style={{ display:'block', height:94 }}>
                <defs>
                  <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SLEEP_COLOR} stopOpacity="0.3"/>
                    <stop offset="100%" stopColor={SLEEP_COLOR} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* Target reference line */}
                <line x1="0" x2={W} y1={targetY} y2={targetY} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
                <text x={W} y={targetY - 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" letterSpacing="1">TARGET 8H</text>
                {/* Per-day bars */}
                {trendData.map((p, i) => {
                  if (p.hours == null) return null;
                  const x = xFor(i);
                  const y = yFor(p.hours);
                  const color = p.hours >= SLEEP_TARGET ? 'var(--accent)' : p.hours >= SLEEP_MIN ? SLEEP_COLOR : 'var(--warn)';
                  return (
                    <g key={i}>
                      <line x1={x} x2={x} y1={H} y2={y} stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.85"/>
                      <circle cx={x} cy={y} r="3" fill={color}/>
                    </g>
                  );
                })}
                {/* Day-of-week labels at the ends */}
                <text x="0" y={H + 12} fontSize="9" fill="var(--text-muted)" letterSpacing="0.5">
                  {trendData[0].day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
                <text x={W} y={H + 12} textAnchor="end" fontSize="9" fill="var(--text-muted)" letterSpacing="0.5">
                  {trendData[trendData.length - 1].day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              </svg>
            );
          })() : (
            <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:11 }}>
              No sleep logged in the last 14 days.
            </div>
          )}
        </div>

        {/* Recent nights — tappable to edit, with delete action */}
        {recentNights.length > 0 && (
          <>
            <div style={st.sleepSectionLabel}>RECENT NIGHTS</div>
            {recentNights.map((entry) => {
              const dayStr = new Date(entry.date).toDateString();
              const isSel = dayStr === selectedDate;
              const fmtDate = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const hoursColor = (entry.hours || 0) >= SLEEP_TARGET ? 'var(--accent)' : (entry.hours || 0) >= SLEEP_MIN ? SLEEP_COLOR : 'var(--warn)';
              return (
                <div key={entry.id} style={{ ...st.sleepHistRow, ...(isSel ? st.sleepHistRowActive : {}) }}>
                  <button
                    style={st.sleepHistMain}
                    onClick={() => setSelectedDate(dayStr)}
                    aria-label={`Edit sleep for ${fmtDate}`}
                  >
                    <div style={st.sleepHistDate}>{fmtDate}</div>
                    <div style={st.sleepHistMeta}>
                      <span>{entry.bedTime} → {entry.wakeTime}</span>
                      {entry.quality && <span style={st.sleepHistQual}> · {entry.quality.toUpperCase()}</span>}
                    </div>
                    {entry.note && <div style={st.sleepHistNote}>{entry.note}</div>}
                  </button>
                  <div style={st.sleepHistRight}>
                    <div style={{ ...st.sleepHistHours, color: hoursColor }}>{(entry.hours || 0).toFixed(2)}h</div>
                    <button
                      style={st.sleepHistDel}
                      onClick={() => deleteEntry(entry.id)}
                      aria-label="Delete sleep entry"
                    >✕</button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

const st = {
  screen: { flex:1, overflowY:'auto', padding:0 },
  header: { fontFamily:'var(--font-head)', fontSize:22, letterSpacing:'0.14em', color:'var(--text)', fontWeight:700, padding:'20px 16px 12px' },
  installCard: { display:'flex', alignItems:'center', gap:12, margin:'0 16px 16px', padding:'14px', background:'rgba(122,140,66,0.10)', border:'1px solid rgba(122,140,66,0.35)', borderRadius:4 },
  installTitle: { fontFamily:'var(--font-head)', fontSize:13, color:'var(--accent)', letterSpacing:'0.14em', fontWeight:700 },
  installSub: { fontSize:11, color:'var(--text-dim)', marginTop:4, lineHeight:1.4 },
  installBtn: { height:44, padding:'0 18px', background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:12, letterSpacing:'0.12em', cursor:'pointer', borderRadius:3, fontWeight:800, flexShrink:0 },
  iosCard: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:'8px 0', marginTop:16 },
  iosStep: { display:'flex', alignItems:'flex-start', gap:14, padding:'14px 16px', borderBottom:'1px solid var(--border-subtle)' },
  iosStepNum: { width:28, height:28, borderRadius:'50%', background:'rgba(122,140,66,0.15)', color:'var(--accent)', fontFamily:'var(--font-head)', fontSize:14, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  iosStepText: { flex:1 },
  iosStepTitle: { fontSize:13, fontWeight:700, color:'var(--text)', letterSpacing:'0.04em' },
  iosStepSub: { fontSize:11, color:'var(--text-muted)', marginTop:3, lineHeight:1.5 },
  iosNote: { fontSize:11, color:'var(--text-muted)', marginTop:14, padding:'12px', background:'var(--surface-1)', border:'1px solid var(--border-subtle)', borderRadius:3, lineHeight:1.5 },
  menuItem: { display:'flex', alignItems:'center', gap:14, width:'100%', padding:16, background:'none', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', textAlign:'left' },
  menuIcon: { color:'var(--accent)', width:28, flexShrink:0, display:'flex' },
  menuLabel: { fontSize:13, fontWeight:700, letterSpacing:'0.08em', color:'var(--text)' },
  menuSub: { fontSize:10, color:'var(--text-muted)', marginTop:2 },
  menuVal: { fontFamily:'var(--font-head)', fontSize:14, color:'var(--accent)', fontWeight:700, textAlign:'right' },
  menuArrow: { fontSize:18, color:'var(--text-muted)', marginLeft:6 },
  privacyNote: { display:'flex', alignItems:'flex-start', gap:4, margin:'20px 16px', padding:12, background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:3, fontSize:11, color:'var(--text-muted)', lineHeight:1.5 },
  dangerLabel: { fontSize:9, letterSpacing:'0.18em', color:'#cc6666', fontWeight:700, padding:'12px 16px 8px' },
  resetBtn: { width:'calc(100% - 32px)', height:48, margin:'0 16px 24px', background:'rgba(180,60,60,0.08)', border:'1px solid rgba(180,60,60,0.4)', color:'#cc6666', fontFamily:'var(--font-head)', fontSize:13, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:700 },
  resetWarnIcon: { display:'flex', justifyContent:'center', padding:'16px 0 8px' },
  resetWarnTitle: { fontFamily:'var(--font-head)', fontSize:18, color:'var(--text)', fontWeight:800, letterSpacing:'0.08em', textAlign:'center', marginBottom:14 },
  resetList: { color:'var(--text-dim)', fontSize:13, lineHeight:1.7, paddingLeft:24, marginBottom:18 },
  resetHardWarn: { background:'rgba(180,60,60,0.08)', border:'1px solid rgba(180,60,60,0.3)', color:'#cc6666', fontSize:12, padding:'12px 14px', borderRadius:3, lineHeight:1.5, marginBottom:20 },
  resetConfirmBtn: { width:'100%', height:52, background:'#a83a3a', border:'none', color:'#fff', fontFamily:'var(--font-head)', fontSize:13, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:800, marginBottom:8 },
  resetCancelBtn: { width:'100%', height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:'var(--font-head)', fontSize:12, letterSpacing:'0.12em', cursor:'pointer', borderRadius:3, fontWeight:700 },
  progressHeadline: { fontFamily:'var(--font-head)', fontSize:16, color:'var(--accent)', letterSpacing:'0.12em', textAlign:'center', minHeight:24, marginBottom:24 },
  progressList: { display:'flex', flexDirection:'column', gap:10 },
  progressItem: { display:'flex', alignItems:'center', padding:'8px 12px', background:'var(--surface-1)', border:'1px solid var(--border-subtle)', borderRadius:3 },
  progressItemText: { fontSize:12, color:'var(--text-dim)', letterSpacing:'0.04em' },
  resetDoneIcon: { display:'flex', justifyContent:'center', padding:'24px 0 12px' },
  resetDoneTitle: { fontFamily:'var(--font-head)', fontSize:20, color:'var(--accent)', fontWeight:800, letterSpacing:'0.12em', marginBottom:12 },
  resetDoneSub: { fontSize:13, color:'var(--text-dim)', lineHeight:1.6, marginBottom:24, padding:'0 8px' },
  resetFinishBtn: { width:'100%', height:52, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:800 },
  subScreen: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  subHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, borderBottom:'1px solid var(--border)', flexShrink:0 },
  backBtn: { background:'none', border:'none', color:'var(--text)', fontSize:20, cursor:'pointer', width:32 },
  subTitle: { fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', color:'var(--text)', fontWeight:700 },
  bigStat: { textAlign:'center', padding:'24px 0 8px' },
  bigVal: { fontFamily:'var(--font-head)', fontSize:56, color:'var(--text)', fontWeight:700 },
  bigUnit: { fontSize:16, color:'var(--text-muted)' },
  bigDate: { fontSize:11, color:'var(--text-muted)', marginTop:4 },
  chartCard: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:'12px 14px', marginBottom:14 },
  chartLabel: { fontSize:9, letterSpacing:'0.14em', color:'var(--text-muted)', marginBottom:8, fontWeight:600 },
  inputRow: { display:'flex', alignItems:'center', gap:8, marginBottom:20 },
  weightInput: { flex:1, height:52, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:24, padding:'0 14px', borderRadius:3, fontFamily:'var(--font-head)', fontWeight:700, outline:'none' },
  weightInputUnit: { fontSize:12, color:'var(--text-muted)', letterSpacing:'0.1em' },
  logBtn: { height:52, width:80, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:13, letterSpacing:'0.12em', cursor:'pointer', borderRadius:3, fontWeight:700 },
  historyLabel: { fontSize:10, letterSpacing:'0.14em', color:'var(--text-muted)', fontWeight:600, marginBottom:8 },
  histRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--border-subtle)' },
  histDate: { fontSize:12, color:'var(--text-muted)' },
  histVal: { fontFamily:'var(--font-head)', fontSize:16, color:'var(--text)', fontWeight:700 },
  dateNav: { display:'flex', justifyContent:'center', alignItems:'center', padding:'12px 0' },
  dateLabel: { fontSize:12, color:'var(--text-muted)', letterSpacing:'0.06em' },
  ringWrap: { display:'flex', justifyContent:'center', padding:'8px 0 16px' },
  waterControls: { display:'flex', justifyContent:'center', alignItems:'center', gap:24, marginBottom:20 },
  waterMinus: { width:48, height:48, borderRadius:'50%', background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  waterPlusBtn: { height:48, padding:'0 20px', borderRadius:24, background:'#4a7a8e', border:'none', color:'#fff', fontSize:14, fontWeight:700, letterSpacing:'0.06em', cursor:'pointer', fontFamily:'var(--font-head)' },
  quickLabel: { fontSize:10, letterSpacing:'0.14em', color:'var(--text-muted)', fontWeight:600, marginBottom:8, textAlign:'center' },
  quickRow: { display:'flex', gap:8, justifyContent:'center', marginBottom:20 },
  quickBtn: { flex:1, height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:3, fontFamily:'var(--font-body)', letterSpacing:'0.04em' },
  timesRow: { display:'flex', background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, overflow:'hidden', marginBottom:14 },
  timeBlock: { flex:1, padding:14, textAlign:'center' },
  timeDivider: { width:1, background:'var(--border)' },
  timeLabel: { fontSize:9, letterSpacing:'0.12em', color:'var(--text-muted)', marginBottom:8, fontWeight:600 },
  timeInput: { background:'none', border:'none', color:'var(--text)', fontSize:18, fontFamily:'var(--font-head)', fontWeight:700, textAlign:'center', width:'100%', outline:'none', cursor:'pointer' },
  qualityRow: { marginBottom:14 },
  qualityLabel: { fontSize:10, letterSpacing:'0.12em', color:'var(--text-muted)', marginBottom:8, fontWeight:600 },
  qualityBtns: { display:'flex', gap:6 },
  qualBtn: { flex:1, height:36, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:10, letterSpacing:'0.06em', cursor:'pointer', borderRadius:3, fontFamily:'var(--font-body)', fontWeight:700 },
  qualBtnActive: { borderColor:'#5a4a8e', color:'#9a8aee', background:'rgba(90,74,142,0.12)' },
  noteGroup: { marginBottom:14 },
  noteLabel: { display:'block', fontSize:10, letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:6, fontWeight:600 },
  noteInput: { width:'100%', height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, padding:'0 12px', borderRadius:3, fontFamily:'var(--font-body)', boxSizing:'border-box', outline:'none' },
  logSleepBtn: { width:'100%', height:52, background:'#7a6ab8', border:'none', color:'#fff', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:700, marginBottom:24, transition:'background 0.2s' },
  logSleepBtnSaved: { background:'var(--accent)', color:'var(--bg)' },
  // Sleep — date nav, stats, trend, history
  sleepDateRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:14, padding:'14px 0 8px' },
  sleepDateBtn: { width:32, height:32, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:18, cursor:'pointer', borderRadius:3, lineHeight:'30px' },
  sleepDateLabel: { fontFamily:'var(--font-head)', fontSize:14, color:'var(--text)', letterSpacing:'0.1em', fontWeight:700, minWidth:140, textAlign:'center' },
  sleepStatsRow: { display:'flex', gap:8, marginBottom:14 },
  sleepStatBox: { flex:1, background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:3, padding:'10px 6px', textAlign:'center' },
  sleepStatVal: { fontFamily:'var(--font-head)', fontSize:20, color:'var(--text)', fontWeight:800, lineHeight:1 },
  sleepStatLbl: { fontSize:8, color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:4, fontWeight:600 },
  sleepSectionLabel: { fontSize:10, letterSpacing:'0.14em', color:'var(--text-muted)', fontWeight:700, marginTop:18, marginBottom:10 },
  sleepTrendCard: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:'12px 14px', marginBottom:6 },
  sleepHistRow: { display:'flex', alignItems:'center', gap:8, padding:'10px 0', borderBottom:'1px solid var(--border-subtle)' },
  sleepHistRowActive: { background:'rgba(122,106,184,0.08)', borderRadius:3, paddingLeft:8, paddingRight:8 },
  sleepHistMain: { flex:1, minWidth:0, background:'none', border:'none', textAlign:'left', cursor:'pointer', padding:0, color:'inherit' },
  sleepHistDate: { fontSize:12, color:'var(--text)', fontWeight:700, letterSpacing:'0.04em' },
  sleepHistMeta: { fontSize:10, color:'var(--text-muted)', marginTop:2 },
  sleepHistQual: { color:'var(--text-dim)' },
  sleepHistNote: { fontSize:10, color:'var(--text-dim)', marginTop:2, fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  sleepHistRight: { display:'flex', alignItems:'center', gap:8, flexShrink:0 },
  sleepHistHours: { fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, minWidth:50, textAlign:'right' },
  sleepHistDel: { width:32, height:32, background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:12, cursor:'pointer', borderRadius:3, padding:0 },
};

export default More;
