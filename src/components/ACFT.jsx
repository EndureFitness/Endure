import { useState } from 'react';
import { ACFT_SCALES, scoreEvent, gradeTotal, EVENTS } from '../lib/acftScoring.js';

const ScoreRing = ({ score, size = 56 }) => {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const pct = Math.min((score || 0) / 100, 1);
  const color = score >= 90 ? 'var(--accent)' : score >= 70 ? '#8a9a4a' : score >= 60 ? '#8a7a3e' : '#8a3a3e';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:'stroke-dasharray 0.5s ease' }}/>
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill="var(--text)"
        fontSize={score != null ? 16 : 11} fontFamily="var(--font-head)" fontWeight="700">
        {score != null ? score : '--'}
      </text>
    </svg>
  );
};

const ACFT = ({ data, saveData }) => {
  const [view, setView] = useState('current');
  const [form, setForm] = useState({ MDL:'', HRP:'', SDC:'', PLK:'', TMR_m:'', TMR_s:'' });
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));

  const aftHistory = data.aft || data.acft || []; // 'data.acft' kept for legacy storage
  const latest = aftHistory.length ? aftHistory[aftHistory.length - 1] : null;

  const scoreEntry = (raw) => {
    const scores = {};
    for (const ev of EVENTS) {
      const val = ev.key === 'TMR'
        ? (parseInt(raw.TMR_m || 0) * 60 + parseInt(raw.TMR_s || 0))
        : parseInt(raw[ev.key]);
      scores[ev.key] = scoreEvent(ev.key, val);
    }
    return scores;
  };

  const latestScores = latest ? latest.scores : null;
  const { total: latestTotal, pass: isPassing, maxTotal: latestMax } =
    latestScores ? gradeTotal(latestScores) : { total: null, pass: null, maxTotal: 500 };

  const saveEntry = () => {
    const scores = scoreEntry(form);
    const { total } = gradeTotal(scores);
    const entry = { id: Date.now(), date: entryDate, raw: { ...form }, scores, total };
    // Storage key remains 'acft' for backwards-compatibility with existing
    // installs; the UI is the only thing renamed.
    saveData({ ...data, acft: [...aftHistory, entry] });
    setView('current');
    setForm({ MDL:'', HRP:'', SDC:'', PLK:'', TMR_m:'', TMR_s:'' });
  };

  if (view === 'entry') {
    return (
      <div style={st.screen}>
        <div style={st.header}>
          <button style={st.backBtn} onClick={() => setView('current')}>←</button>
          <span style={st.headerTitle}>LOG AFT</span>
          <div style={{ width:32 }}></div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'0 16px 24px' }}>
          <div style={st.dateRow}>
            <label style={st.fieldLabel}>Test Date</label>
            <input style={st.dateInput} type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
          </div>
          {EVENTS.map(ev => (
            <div key={ev.key} style={st.eventInput}>
              <div style={st.eventInputLabel}>
                <span style={st.eventIcon}>{ev.icon}</span>
                <span>{ev.label}</span>
                <span style={st.eventUnit}>{ev.unit}</span>
              </div>
              {ev.key === 'TMR' ? (
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input style={{ ...st.inputField, flex:1 }} type="number" placeholder="MM" min="0" max="59"
                    value={form.TMR_m} onChange={e => setForm(p => ({ ...p, TMR_m: e.target.value }))} />
                  <span style={st.timeSep}>:</span>
                  <input style={{ ...st.inputField, flex:1 }} type="number" placeholder="SS" min="0" max="59"
                    value={form.TMR_s} onChange={e => setForm(p => ({ ...p, TMR_s: e.target.value }))} />
                </div>
              ) : (
                <input style={st.inputField} type="number" placeholder={ev.placeholder}
                  value={form[ev.key]} onChange={e => setForm(p => ({ ...p, [ev.key]: e.target.value }))} />
              )}
              {(() => {
                const val = ev.key === 'TMR'
                  ? (parseInt(form.TMR_m||0)*60 + parseInt(form.TMR_s||0))
                  : parseInt(form[ev.key]);
                const sc = val ? scoreEvent(ev.key, val) : null;
                return sc !== null && sc !== undefined ? (
                  <div style={{ ...st.liveScore, color: sc >= 60 ? 'var(--accent)' : '#cc5555' }}>
                    → {sc} pts {sc < 60 ? '⚠ BELOW MIN' : sc >= 90 ? '✓ EXCELLENT' : '✓ PASS'}
                  </div>
                ) : null;
              })()}
            </div>
          ))}
          <button style={st.saveBtn} onClick={saveEntry}>SAVE TEST RESULTS</button>
        </div>
      </div>
    );
  }

  if (view === 'log') {
    return (
      <div style={st.screen}>
        <div style={st.header}>
          <button style={st.backBtn} onClick={() => setView('current')}>←</button>
          <span style={st.headerTitle}>AFT HISTORY</span>
          <div style={{ width:32 }}></div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'0 16px' }}>
          {aftHistory.length === 0 && <div style={st.empty}>No AFT tests logged yet.</div>}
          {[...aftHistory].reverse().map(entry => {
            const { pass } = gradeTotal(entry.scores);
            return (
              <div key={entry.id} style={st.histCard}>
                <div style={st.histCardHeader}>
                  <span style={st.histDate}>{new Date(entry.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
                  <span style={{ ...st.histBadge, background: pass ? 'rgba(122,140,66,0.15)' : 'rgba(180,60,60,0.15)', color: pass ? 'var(--accent)' : '#cc6666', border:`1px solid ${pass ? 'rgba(122,140,66,0.3)' : 'rgba(180,60,60,0.3)'}` }}>
                    {pass ? 'PASS' : 'FAIL'}
                  </span>
                  <span style={st.histTotal}>{entry.total} pts</span>
                </div>
                <div style={st.histEventsRow}>
                  {EVENTS.map(ev => (
                    <div key={ev.key} style={st.histEventCell}>
                      <div style={{ ...st.histEventScore, color: (entry.scores[ev.key] || 0) >= 60 ? 'var(--text)' : '#cc5555' }}>
                        {entry.scores[ev.key] ?? '--'}
                      </div>
                      <div style={st.histEventKey}>{ev.key}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={st.screen}>
      <div style={st.header}>
        <span style={st.headerTitle}>AFT</span>
        <div style={{ display:'flex', gap:8 }}>
          <button style={st.iconBtn} onClick={() => setView('log')}>HISTORY</button>
          <button style={st.logNewBtn} onClick={() => setView('entry')}>+ LOG</button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 24px' }}>
        <div style={st.scoreHero}>
          <div>
            <div style={st.scoreBig}>{latestTotal ?? '--'}</div>
            <div style={st.scoreMax}>/{latestMax}</div>
            <div style={st.scoreLabel}>TOTAL SCORE</div>
            {latestTotal !== null && (
              <div style={{ ...st.passBadge, background: isPassing ? 'rgba(122,140,66,0.12)' : 'rgba(180,60,60,0.12)', color: isPassing ? 'var(--accent)' : '#cc6666', borderColor: isPassing ? 'rgba(122,140,66,0.3)' : 'rgba(180,60,60,0.3)' }}>
                {isPassing ? '✓ PASSING' : '✗ BELOW STANDARD'}
              </div>
            )}
            {latest && <div style={st.testDate}>{new Date(latest.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</div>}
          </div>
          <div>
            {latestTotal !== null && (
              <svg width="90" height="104" viewBox="0 0 90 104">
                <polygon points="45,2 87,26 87,78 45,102 3,78 3,26"
                  fill="rgba(122,140,66,0.08)" stroke="rgba(122,140,66,0.4)" strokeWidth="1.5"/>
                <text x="45" y="58" textAnchor="middle" fill="var(--text)" fontSize="28" fontFamily="var(--font-head)" fontWeight="800">{latestTotal}</text>
                <text x="45" y="74" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-head)" letterSpacing="2">PTS</text>
              </svg>
            )}
            {latestTotal === null && <div style={st.noTestMsg}>No test logged</div>}
          </div>
        </div>

        <div style={st.sectionLabel}>EVENT SCORES</div>
        {EVENTS.map(ev => {
          const score = latestScores ? latestScores[ev.key] : null;
          const raw = latest?.raw?.[ev.key];
          const rawDisplay = ev.key === 'TMR'
            ? (latest?.raw?.TMR_m ? `${latest.raw.TMR_m}:${String(latest.raw.TMR_s || 0).padStart(2,'0')}` : '--')
            : (raw || '--');
          const barPct = score ? Math.min(score / 100, 1) : 0;
          const barColor = score >= 90 ? 'var(--accent)' : score >= 70 ? '#8a9a4a' : score >= 60 ? '#8a7a3e' : '#8a3a3e';
          return (
            <div key={ev.key} style={st.eventRow}>
              <div style={st.eventLeft}>
                <div style={st.eventName}>{ev.label}</div>
                <div style={st.eventRaw}>{rawDisplay} {ev.unit}</div>
                <div style={st.eventBar}>
                  <div style={{ ...st.eventBarFill, width:`${barPct*100}%`, background:barColor }}></div>
                </div>
              </div>
              <ScoreRing score={score} size={56} />
            </div>
          );
        })}

        {aftHistory.length > 1 && (
          <>
            <div style={st.sectionLabel}>SCORE TREND</div>
            <div style={st.trendCard}>
              {(() => {
                const pts = aftHistory.map(e => e.total);
                const min = Math.min(...pts) - 10;
                const max = Math.max(...pts) + 10;
                const W = 280, H = 60;
                const polyPts = pts.map((p, i) => {
                  const x = (i / (pts.length - 1)) * W;
                  const y = H - ((p - min) / (max - min)) * (H - 8) - 4;
                  return `${x},${y}`;
                }).join(' ');
                return (
                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height:60 }}>
                    <defs>
                      <linearGradient id="acftGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <polyline points={`0,${H} ${polyPts} ${W},${H}`} fill="url(#acftGrad)"/>
                    <polyline points={polyPts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round"/>
                    {pts.map((p,i) => {
                      const x = (i/(pts.length-1))*W;
                      const y = H - ((p-min)/(max-min))*(H-8) - 4;
                      return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)"/>;
                    })}
                  </svg>
                );
              })()}
            </div>
          </>
        )}

        {!latestTotal && (
          <button style={st.startBtn} onClick={() => setView('entry')}>LOG YOUR FIRST AFT</button>
        )}
      </div>
    </div>
  );
};

const st = {
  screen: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, borderBottom:'1px solid var(--border)', flexShrink:0 },
  headerTitle: { fontFamily:'var(--font-head)', fontSize:20, letterSpacing:'0.14em', color:'var(--text)', fontWeight:700 },
  backBtn: { background:'none', border:'none', color:'var(--text)', fontSize:20, cursor:'pointer', width:32 },
  iconBtn: { background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:10, letterSpacing:'0.08em', padding:'5px 10px', cursor:'pointer', borderRadius:2, fontFamily:'var(--font-body)', fontWeight:700 },
  logNewBtn: { height:34, padding:'0 14px', background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:12, letterSpacing:'0.1em', cursor:'pointer', borderRadius:3, fontWeight:700 },
  scoreHero: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'20px 0 16px' },
  scoreBig: { fontFamily:'var(--font-head)', fontSize:52, color:'var(--text)', fontWeight:800, lineHeight:1 },
  scoreMax: { fontSize:14, color:'var(--text-muted)', display:'inline', marginLeft:4 },
  scoreLabel: { fontSize:9, letterSpacing:'0.14em', color:'var(--text-muted)', marginTop:2, fontWeight:600 },
  passBadge: { display:'inline-block', marginTop:8, padding:'3px 10px', borderRadius:2, fontSize:10, letterSpacing:'0.1em', fontWeight:700, border:'1px solid' },
  testDate: { fontSize:10, color:'var(--text-muted)', marginTop:6 },
  noTestMsg: { fontSize:11, color:'var(--text-muted)', textAlign:'center', width:90 },
  sectionLabel: { fontSize:10, letterSpacing:'0.14em', color:'var(--text-muted)', fontWeight:700, marginBottom:10, marginTop:4 },
  eventRow: { display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border-subtle)' },
  eventLeft: { flex:1 },
  eventName: { fontSize:12, fontWeight:700, color:'var(--text)', letterSpacing:'0.04em' },
  eventRaw: { fontSize:10, color:'var(--text-muted)', marginTop:2 },
  eventBar: { height:3, background:'var(--surface-2)', borderRadius:2, marginTop:6, overflow:'hidden' },
  eventBarFill: { height:'100%', borderRadius:2, transition:'width 0.4s ease' },
  trendCard: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:12, marginBottom:16 },
  startBtn: { width:'100%', height:52, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:700, marginTop:20 },
  dateRow: { marginBottom:16, paddingTop:16 },
  fieldLabel: { display:'block', fontSize:10, letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:6, fontWeight:600 },
  dateInput: { height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, padding:'0 12px', borderRadius:3, fontFamily:'var(--font-body)', outline:'none', width:160 },
  eventInput: { marginBottom:14 },
  eventInputLabel: { display:'flex', alignItems:'center', gap:8, fontSize:11, fontWeight:700, letterSpacing:'0.06em', color:'var(--text-dim)', marginBottom:6 },
  eventIcon: { fontSize:10, fontFamily:'var(--font-head)', letterSpacing:'0.1em', color:'var(--accent)' },
  eventUnit: { fontSize:9, color:'var(--text-muted)', letterSpacing:'0.08em', marginLeft:'auto' },
  inputField: { width:'100%', height:48, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:18, padding:'0 14px', borderRadius:3, fontFamily:'var(--font-head)', fontWeight:700, outline:'none', boxSizing:'border-box' },
  timeSep: { fontSize:22, color:'var(--text-muted)' },
  liveScore: { fontSize:11, marginTop:4, letterSpacing:'0.06em', fontWeight:700 },
  saveBtn: { width:'100%', height:52, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:700, marginTop:16 },
  empty: { textAlign:'center', padding:'48px 0', fontSize:12, color:'var(--text-muted)' },
  histCard: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:14, marginTop:12 },
  histCardHeader: { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  histDate: { fontSize:12, color:'var(--text-muted)', flex:1 },
  histBadge: { fontSize:9, letterSpacing:'0.1em', padding:'2px 8px', borderRadius:2, fontWeight:700 },
  histTotal: { fontFamily:'var(--font-head)', fontSize:20, color:'var(--text)', fontWeight:700 },
  histEventsRow: { display:'flex', gap:4 },
  histEventCell: { flex:1, textAlign:'center' },
  histEventScore: { fontFamily:'var(--font-head)', fontSize:16, fontWeight:700 },
  histEventKey: { fontSize:8, color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:2 },
};

export default ACFT;
