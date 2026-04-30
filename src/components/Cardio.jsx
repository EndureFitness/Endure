import { useEffect, useRef, useState } from 'react';
import MapView from './MapView.jsx';
import { useGeolocationTracker, useWakeLock, paceFromPoints, metersToMiles } from '../lib/geo.js';

// Calorie burn rate per minute, by activity. Rough values matching the mockup.
const CAL_PER_MIN = { Ruck: 9, Run: 11, Walk: 6, Cardio: 10 };

const fmtTime = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
};

const TYPES = ['Ruck', 'Run', 'Walk', 'Cardio'];

export default function Cardio({ data, saveData }) {
  const [mode, setMode] = useState('hub'); // hub | active | summary | manual
  const [activityType, setActivityType] = useState('Ruck');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pausedDurations, setPausedDurations] = useState(0); // total ms paused
  const [lastSession, setLastSession] = useState(null);

  const startTimeRef = useRef(null);
  const pauseStartRef = useRef(null);
  const tickRef = useRef(null);

  const tracker = useGeolocationTracker({ active: mode === 'active', activityType });
  useWakeLock(mode === 'active' && running);

  const distanceM = tracker.distanceM;
  const distanceMi = metersToMiles(distanceM);

  // Tick the elapsed clock once per second while running (regardless of GPS).
  useEffect(() => {
    if (mode !== 'active') {
      clearInterval(tickRef.current);
      return;
    }
    if (running) {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      if (pauseStartRef.current) {
        // Coming out of pause — accumulate paused duration.
        setPausedDurations((d) => d + (Date.now() - pauseStartRef.current));
        pauseStartRef.current = null;
      }
      tickRef.current = setInterval(() => {
        const now = Date.now();
        const ms = now - startTimeRef.current - pausedDurations;
        setElapsed(Math.max(0, Math.floor(ms / 1000)));
      }, 1000);
    } else {
      if (!pauseStartRef.current) pauseStartRef.current = Date.now();
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
    // pausedDurations intentionally left out — we read its current value when needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  const startSession = () => {
    setElapsed(0);
    setPausedDurations(0);
    startTimeRef.current = Date.now();
    pauseStartRef.current = null;
    setRunning(true);
    setMode('active');
  };

  const cancelSession = () => {
    if (elapsed > 30 && !confirm('Discard this session?')) return;
    setRunning(false);
    setMode('hub');
    startTimeRef.current = null;
    pauseStartRef.current = null;
    setElapsed(0);
  };

  const finishSession = () => {
    setRunning(false);
    const session = {
      id: Date.now(),
      type: activityType,
      date: new Date().toISOString(),
      duration: elapsed,
      distance: parseFloat(distanceMi.toFixed(2)),
      calories: Math.floor((elapsed / 60) * (CAL_PER_MIN[activityType] || 10)),
      pace: paceFromPoints(tracker.points, 60, 'mi'),
      elevGainFt: Math.round(tracker.elevGainM * 3.2808),
      route: tracker.points.map(({ lat, lng, t }) => ({ lat, lng, t })),
      source: tracker.points.length > 0 ? 'gps' : 'manual',
    };
    setLastSession(session);
    saveData({ ...data, workouts: [...(data.workouts || []), session] });
    setMode('summary');
  };

  const pace = paceFromPoints(tracker.points, 60, 'mi');

  // ── Manual entry fallback ────────────────────────────────────────────────
  if (mode === 'manual') {
    return <ManualEntry
      activityType={activityType}
      onCancel={() => setMode('hub')}
      onSave={(session) => {
        saveData({ ...data, workouts: [...(data.workouts || []), session] });
        setLastSession(session);
        setMode('summary');
      }}
    />;
  }

  // ── Active session ───────────────────────────────────────────────────────
  if (mode === 'active') {
    const showDeniedBanner = tracker.status === 'denied' || tracker.status === 'unavailable' || tracker.status === 'error';
    return (
      <div style={st.screen}>
        <div style={st.activeHeader}>
          <button style={st.backBtn} onClick={cancelSession}>✕</button>
          <span style={st.activeTitle}>{activityType.toUpperCase()}</span>
          <div style={st.gpsIndicator}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: tracker.status === 'tracking' ? 'var(--accent)' : '#cc6666',
              display: 'inline-block', marginRight: 6,
            }}/>
            <span style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              {tracker.status === 'tracking' ? 'GPS' : tracker.status === 'requesting' ? 'WAIT' : 'NO GPS'}
            </span>
          </div>
        </div>

        {showDeniedBanner && (
          <div style={st.banner}>
            GPS unavailable. {tracker.status === 'denied' ? 'Enable location in browser settings to track distance and route.' : 'Track time only or log manually after your session.'}
          </div>
        )}

        <MapView points={tracker.points} lastPoint={tracker.lastPoint} height={220} />

        <div style={st.timerBlock}>
          <div style={st.timerValue}>{fmtTime(elapsed)}</div>
          <div style={st.timerLabel}>DURATION {!running && '· PAUSED'}</div>
        </div>

        <div style={st.statsGrid}>
          {[
            { val: distanceMi.toFixed(2), unit: 'MI', label: 'DISTANCE' },
            { val: pace, unit: '/MI', label: 'PACE' },
            { val: tracker.elevGainM > 0 ? Math.round(tracker.elevGainM * 3.2808) : '--', unit: 'FT', label: 'ELEV GAIN' },
            { val: Math.floor((elapsed / 60) * (CAL_PER_MIN[activityType] || 10)), unit: 'CAL', label: 'CALORIES' },
          ].map((s, i) => (
            <div key={i} style={st.statCell}>
              <div style={st.cellVal}>{s.val}</div>
              <div style={st.cellUnit}>{s.unit}</div>
              <div style={st.cellLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={st.controls}>
          <button style={st.pauseBtn} onClick={() => setRunning(r => !r)}>
            {running ? 'PAUSE' : 'RESUME'}
          </button>
          <button style={st.finishBtn} onClick={finishSession}>FINISH</button>
        </div>
      </div>
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  if (mode === 'summary' && lastSession) {
    return (
      <div style={st.screen}>
        <div style={st.header}>
          <span style={st.headerTitle}>SESSION COMPLETE</span>
          <button style={st.iconBtn} onClick={() => setMode('hub')}>DONE</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={st.summaryHero}>
            <div style={st.summaryType}>{lastSession.type.toUpperCase()}</div>
            <div style={st.summaryTime}>{fmtTime(lastSession.duration)}</div>
            <div style={st.summarySub}>
              {lastSession.distance.toFixed(2)} mi · {lastSession.pace} pace · {lastSession.calories} cal
            </div>
            {lastSession.elevGainFt > 0 && (
              <div style={st.summarySub}>{lastSession.elevGainFt} ft elevation gain</div>
            )}
            <div style={{ ...st.summarySub, marginTop: 6, fontSize: 9, letterSpacing: '0.14em' }}>
              {lastSession.source === 'gps' ? '✓ GPS TRACKED' : '· MANUAL ENTRY'}
            </div>
          </div>
          {lastSession.route && lastSession.route.length > 1 && (
            <MapView
              points={lastSession.route}
              lastPoint={lastSession.route[lastSession.route.length - 1]}
              height={200}
            />
          )}
          <button style={st.startBtn} onClick={() => setMode('hub')}>BACK TO HUB</button>
        </div>
      </div>
    );
  }

  // ── Hub ──────────────────────────────────────────────────────────────────
  return (
    <div style={st.screen}>
      <div style={st.header}>
        <span style={st.headerTitle}>CARDIO</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        <div style={st.hubLabel}>SELECT ACTIVITY</div>
        <div style={st.typeGrid}>
          {TYPES.map(t => (
            <button key={t}
              type="button"
              style={{ ...st.typeCard, ...(activityType === t ? st.typeCardActive : {}) }}
              onClick={() => setActivityType(t)}
            >
              <div style={st.typeName}>{t.toUpperCase()}</div>
              <div style={st.typeRate}>{CAL_PER_MIN[t]} cal/min</div>
            </button>
          ))}
        </div>

        <button style={st.startBtn} onClick={startSession}>
          ▸ START {activityType.toUpperCase()}
        </button>

        <button style={st.manualBtn} onClick={() => setMode('manual')}>
          + LOG MANUAL SESSION
        </button>

        <div style={st.tip}>
          Keep the screen on during your session. Browsers can't track GPS in the background — Endure will keep the display awake while you train.
        </div>
      </div>
    </div>
  );
}

function ManualEntry({ activityType: initialType, onCancel, onSave }) {
  const [activityType, setActivityType] = useState(initialType);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState({ h: '', m: '', s: '' });
  const [distance, setDistance] = useState('');

  const submit = () => {
    const sec = (parseInt(duration.h) || 0) * 3600 + (parseInt(duration.m) || 0) * 60 + (parseInt(duration.s) || 0);
    const dist = parseFloat(distance) || 0;
    if (sec === 0) { alert('Enter a duration.'); return; }
    const session = {
      id: Date.now(),
      type: activityType,
      date: new Date(date).toISOString(),
      duration: sec,
      distance: dist,
      calories: Math.floor((sec / 60) * (CAL_PER_MIN[activityType] || 10)),
      pace: dist > 0 ? (() => {
        const pm = (sec / 60) / dist;
        const m = Math.floor(pm);
        const s = Math.round((pm - m) * 60);
        return `${m}:${String(s).padStart(2, '0')}`;
      })() : '--:--',
      route: [],
      source: 'manual',
    };
    onSave(session);
  };

  return (
    <div style={st.screen}>
      <div style={st.header}>
        <button style={st.backBtn} onClick={onCancel}>←</button>
        <span style={st.headerTitle}>LOG MANUAL</span>
        <div style={{ width: 32 }}></div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        <div style={{ ...st.hubLabel, marginTop: 16 }}>ACTIVITY TYPE</div>
        <div style={st.typeGrid}>
          {TYPES.map(t => (
            <button key={t} type="button"
              style={{ ...st.typeCard, ...(activityType === t ? st.typeCardActive : {}) }}
              onClick={() => setActivityType(t)}
            ><div style={st.typeName}>{t.toUpperCase()}</div></button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={st.fieldLabel}>WHEN</label>
          <input style={st.input} type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={st.fieldLabel}>DURATION</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={st.input} type="number" inputMode="numeric" placeholder="H" min="0" value={duration.h} onChange={e => setDuration(d => ({ ...d, h: e.target.value }))}/>
            <input style={st.input} type="number" inputMode="numeric" placeholder="M" min="0" max="59" value={duration.m} onChange={e => setDuration(d => ({ ...d, m: e.target.value }))}/>
            <input style={st.input} type="number" inputMode="numeric" placeholder="S" min="0" max="59" value={duration.s} onChange={e => setDuration(d => ({ ...d, s: e.target.value }))}/>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={st.fieldLabel}>DISTANCE (MI)</label>
          <input style={st.input} type="number" inputMode="decimal" placeholder="e.g. 3.5" value={distance} onChange={e => setDistance(e.target.value)}/>
        </div>

        <button style={st.startBtn} onClick={submit}>SAVE SESSION</button>
      </div>
    </div>
  );
}

const st = {
  screen: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, borderBottom:'1px solid var(--border)', flexShrink:0 },
  headerTitle: { fontFamily:'var(--font-head)', fontSize:20, letterSpacing:'0.14em', color:'var(--text)', fontWeight:700 },
  activeHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', flexShrink:0 },
  activeTitle: { fontFamily:'var(--font-head)', fontSize:18, letterSpacing:'0.16em', color:'var(--text)', fontWeight:700 },
  backBtn: { background:'none', border:'none', color:'var(--text)', fontSize:20, cursor:'pointer', width:32 },
  iconBtn: { background:'var(--accent)', border:'none', color:'var(--bg)', fontSize:11, letterSpacing:'0.1em', padding:'6px 14px', cursor:'pointer', borderRadius:3, fontFamily:'var(--font-head)', fontWeight:700 },
  gpsIndicator: { display:'flex', alignItems:'center' },
  banner: { background:'rgba(180,80,40,0.12)', border:'1px solid rgba(180,80,40,0.3)', color:'#d4926a', fontSize:11, padding:'8px 14px', margin:'0 16px 8px', borderRadius:3, lineHeight:1.5 },
  timerBlock: { textAlign:'center', padding:'18px 0 6px' },
  timerValue: { fontFamily:'var(--font-head)', fontSize:54, color:'var(--text)', fontWeight:800, letterSpacing:'0.04em', lineHeight:1 },
  timerLabel: { fontSize:10, letterSpacing:'0.16em', color:'var(--text-muted)', marginTop:2, fontWeight:600 },
  statsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)', margin:'12px 0 0' },
  statCell: { background:'var(--surface-1)', padding:'14px 8px', textAlign:'center' },
  cellVal: { fontFamily:'var(--font-head)', fontSize:24, color:'var(--text)', fontWeight:700, lineHeight:1 },
  cellUnit: { fontSize:9, color:'var(--accent)', letterSpacing:'0.1em', marginTop:2 },
  cellLabel: { fontSize:8, color:'var(--text-muted)', letterSpacing:'0.12em', marginTop:3 },
  controls: { display:'flex', gap:8, padding:16, flexShrink:0 },
  pauseBtn: { flex:1, height:54, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:'var(--font-head)', fontSize:13, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:700 },
  finishBtn: { flex:1, height:54, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:13, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:700 },
  hubLabel: { fontSize:10, letterSpacing:'0.14em', color:'var(--text-muted)', fontWeight:600, marginTop:20, marginBottom:10 },
  typeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 },
  typeCard: { background:'var(--surface-1)', border:'1px solid var(--border)', padding:'18px 12px', borderRadius:3, cursor:'pointer', textAlign:'left' },
  typeCardActive: { background:'rgba(122,140,66,0.12)', borderColor:'var(--accent)' },
  typeName: { fontFamily:'var(--font-head)', fontSize:16, color:'var(--text)', fontWeight:700, letterSpacing:'0.08em' },
  typeRate: { fontSize:9, color:'var(--text-muted)', letterSpacing:'0.08em', marginTop:4 },
  startBtn: { width:'100%', height:54, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.16em', cursor:'pointer', borderRadius:3, fontWeight:800, marginTop:20 },
  manualBtn: { width:'100%', height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text-muted)', fontFamily:'var(--font-body)', fontSize:11, letterSpacing:'0.12em', cursor:'pointer', borderRadius:3, fontWeight:700, marginTop:8 },
  tip: { fontSize:11, color:'var(--text-muted)', lineHeight:1.5, marginTop:18, padding:'12px', background:'var(--surface-1)', border:'1px solid var(--border-subtle)', borderRadius:3 },
  fieldLabel: { display:'block', fontSize:10, letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:6, fontWeight:600 },
  input: { width:'100%', height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, padding:'0 12px', borderRadius:3, fontFamily:'var(--font-body)', boxSizing:'border-box', outline:'none' },
  summaryHero: { textAlign:'center', padding:'20px 0' },
  summaryType: { fontSize:11, letterSpacing:'0.18em', color:'var(--accent)', fontWeight:700 },
  summaryTime: { fontFamily:'var(--font-head)', fontSize:48, color:'var(--text)', fontWeight:800, marginTop:6, letterSpacing:'0.04em' },
  summarySub: { fontSize:12, color:'var(--text-dim)', marginTop:6 },
};
