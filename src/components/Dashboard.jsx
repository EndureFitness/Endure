import { useId } from 'react';
import { gradeTotal } from '../lib/acftScoring.js';
import RankInsignia from './RankInsignia.jsx';

const Dashboard = ({ data, setScreen }) => {
  const { workouts = [], weights = [], nutrition = [] } = data;

  const now = new Date();
  const weekAgo = new Date(now - 7 * 86_400_000);
  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
  const totalDist = weekWorkouts.reduce((s, w) => s + (w.distance || 0), 0);
  const totalDuration = weekWorkouts.reduce((s, w) => s + (w.duration || 0), 0);
  const totalCals = weekWorkouts.reduce((s, w) => s + (w.calories || 0), 0);

  const fmtDuration = (sec) => {
    const s = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  };

  const latestWeight = weights.length ? weights[weights.length - 1].weight : null;
  const prevWeight = weights.length > 1 ? weights[weights.length - 2].weight : null;
  const weightDelta = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  const acftHistory = data.acft || [];
  const latestACFT = acftHistory.length ? acftHistory[acftHistory.length - 1] : null;
  const prevACFT = acftHistory.length > 1 ? acftHistory[acftHistory.length - 2] : null;
  const acftDelta = latestACFT && prevACFT ? latestACFT.total - prevACFT.total : null;
  const acftPass = latestACFT ? gradeTotal(latestACFT.scores).pass : null;

  const profile = data.profile || {};

  const monthAgo = new Date(now - 30 * 86_400_000);
  const recentWeights = weights.filter(w => new Date(w.date) >= monthAgo);

  const SparkLine = ({ points, width = 220, height = 50, color = '#7a8c42' }) => {
    // useId guarantees a unique gradient id per SparkLine instance — reusing
    // the same SVG id across multiple instances breaks rendering of the later
    // ones (the browser resolves url(#x) to the first match in the document).
    const gradId = useId();
    if (points.length < 2) return <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:11 }}>No data</div>;
    const vals = points.map(p => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const pts = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p.value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <polyline points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${gradId})`} stroke="none"/>
      </svg>
    );
  };

  const today = new Date().toDateString();
  const todayNutrition = nutrition.filter(n => new Date(n.date).toDateString() === today);
  const todayCals = todayNutrition.reduce((s, n) => s + (n.calories || 0), 0);
  const todayProtein = todayNutrition.reduce((s, n) => s + (n.protein || 0), 0);

  const recentWorkouts = [...workouts].reverse().slice(0, 3);

  return (
    <div style={st.screen}>
      <div style={st.header}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
          {profile.rank && <RankInsignia rank={profile.rank} size={40} />}
          <div style={{ minWidth:0 }}>
            <div style={st.greeting}>
              {profile.rank ? `${profile.rank} ${(profile.name||'').split(',')[0]}` : 'ENDURE'}
            </div>
            <div style={st.subGreeting}>
              {profile.unit ? `${profile.unit} · ${profile.mos || ''}` : 'Track. Improve. Endure.'}
            </div>
          </div>
        </div>
        <div><span style={st.badge}>LOCAL</span></div>
      </div>

      <div style={st.section}>
        <div style={st.sectionLabel}>WEEKLY OVERVIEW</div>
        <div style={st.statsRow}>
          <div style={st.statBox}>
            <div style={st.statValue}>{totalDist.toFixed(1)}</div>
            <div style={st.statUnit}>MI</div>
            <div style={st.statLabel}>DISTANCE</div>
          </div>
          <div style={{...st.statBox, ...st.statBoxAccent}}>
            <div style={{...st.statValue, fontSize:24}}>{fmtDuration(totalDuration)}</div>
            <div style={st.statLabel}>DURATION</div>
          </div>
          <div style={st.statBox}>
            <div style={st.statValue}>{weekWorkouts.length}</div>
            <div style={st.statLabel}>SESSIONS</div>
          </div>
        </div>
      </div>

      <div style={{...st.section, ...st.calSection}}>
        <div>
          <div style={st.calValue}>{totalCals.toLocaleString()}</div>
          <div style={st.calLabel}>CALORIES BURNED THIS WEEK</div>
        </div>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
          <path d="M12 2C8 2 5 6 5 10c0 5.25 7 12 7 12s7-6.75 7-12c0-4-3-8-7-8z"/>
        </svg>
      </div>

      <div style={{...st.section, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer'}} onClick={() => setScreen('acft')}>
        <div>
          <div style={st.sectionLabel}>LATEST ACFT</div>
          {latestACFT ? (
            <>
              <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                <span style={{ fontFamily:'var(--font-head)', fontSize:36, fontWeight:800, color:'var(--text)', lineHeight:1 }}>{latestACFT.total}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>/600</span>
                {acftDelta !== null && (
                  <span style={{ fontSize:11, color: acftDelta >= 0 ? 'var(--accent)' : '#cc6666', fontWeight:700 }}>
                    {acftDelta > 0 ? '+' : ''}{acftDelta}
                  </span>
                )}
              </div>
              <div style={{ ...st.sectionLabel, marginTop:4, marginBottom:0 }}>
                <span style={{ color: acftPass ? 'var(--accent)' : '#cc6666' }}>
                  {acftPass ? '✓ PASSING' : '✗ BELOW STANDARD'}
                </span>
                <span style={{ color:'var(--text-muted)', marginLeft:8 }}>
                  {new Date(latestACFT.date).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                </span>
              </div>
            </>
          ) : (
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>No test logged — tap to add</div>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          {latestACFT && Object.entries(latestACFT.scores).map(([key, score]) => (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:8, color:'var(--text-muted)', width:26, letterSpacing:'0.06em' }}>{key}</span>
              <div style={{ width:48, height:3, background:'var(--surface-2)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${Math.min((score||0),100)}%`, height:'100%', background: score >= 90 ? 'var(--accent)' : score >= 70 ? '#8a9a4a' : score >= 60 ? '#8a7a3e' : '#8a3a3e', borderRadius:2 }}></div>
              </div>
              <span style={{ fontSize:9, color:'var(--text-dim)', width:22, textAlign:'right', fontFamily:'var(--font-head)', fontWeight:700 }}>{score ?? '--'}</span>
            </div>
          ))}
          {!latestACFT && (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.4">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          )}
        </div>
      </div>

      <div style={st.section}>
        <div style={st.sectionHeader}>
          <div style={st.sectionLabel}>WEIGHT TREND</div>
          <div style={st.sectionMeta}>30 DAYS</div>
        </div>
        <div style={st.weightRow}>
          <div>
            {latestWeight ? (
              <>
                <span style={st.weightValue}>{latestWeight}</span>
                <span style={st.weightUnit}> LBS</span>
                {weightDelta !== null && (
                  <span style={{ fontSize:11, color: parseFloat(weightDelta) < 0 ? 'var(--accent)' : '#a05a3a', marginLeft:8 }}>
                    {parseFloat(weightDelta) > 0 ? '+' : ''}{weightDelta}
                  </span>
                )}
              </>
            ) : <span style={st.weightMuted}>No data</span>}
          </div>
          <SparkLine points={recentWeights.map(w => ({ value: w.weight }))} width={140} height={44}/>
        </div>
      </div>

      <div style={st.section}>
        <div style={st.sectionHeader}>
          <div style={st.sectionLabel}>TODAY'S NUTRITION</div>
          <button style={st.linkBtn} onClick={() => setScreen('nutrition')}>VIEW →</button>
        </div>
        <div style={st.macroRow}>
          <div style={st.macroItem}>
            <div style={st.macroVal}>{todayCals}</div>
            <div style={st.macroLbl}>KCAL</div>
          </div>
          <div style={st.macroDivider}></div>
          <div style={st.macroItem}>
            <div style={st.macroVal}>{todayProtein}g</div>
            <div style={st.macroLbl}>PROTEIN</div>
          </div>
        </div>
      </div>

      <div style={st.section}>
        <div style={st.sectionHeader}>
          <div style={st.sectionLabel}>RECENT ACTIVITY</div>
          <button style={st.linkBtn} onClick={() => setScreen('log')}>ALL →</button>
        </div>
        {recentWorkouts.length === 0 ? (
          <div style={st.emptyState}>No workouts logged yet. Start a session in Cardio.</div>
        ) : recentWorkouts.map((w, i) => (
          <div key={i} style={st.activityRow}>
            <div style={st.activityType}>
              <span style={st.activityDot}></span>
              <span style={st.activityName}>{w.type?.toUpperCase() || 'WORKOUT'}</span>
            </div>
            <div style={st.activityMeta}>
              <span>{w.distance?.toFixed(1)} mi</span>
              <span style={{ color:'var(--text-muted)' }}>{fmtDuration(w.duration || 0)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }}></div>
    </div>
  );
};

const st = {
  screen: { flex:1, overflowY:'auto', padding:'0 16px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'20px 0 12px' },
  greeting: { fontFamily:'var(--font-head)', fontSize:28, letterSpacing:'0.12em', color:'var(--text)', fontWeight:700 },
  subGreeting: { fontSize:10, color:'var(--text-muted)', letterSpacing:'0.14em', marginTop:2 },
  badge: { background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--accent)', fontSize:9, letterSpacing:'0.1em', padding:'3px 8px', borderRadius:2 },
  section: { background:'var(--surface-1)', borderRadius:4, border:'1px solid var(--border)', padding:14, marginBottom:10 },
  sectionLabel: { fontSize:10, letterSpacing:'0.14em', color:'var(--text-muted)', marginBottom:10, fontWeight:600 },
  sectionHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  sectionMeta: { fontSize:9, color:'var(--text-muted)', letterSpacing:'0.08em' },
  statsRow: { display:'flex', gap:8 },
  statBox: { flex:1, background:'var(--surface-2)', borderRadius:3, padding:'10px 8px', textAlign:'center', border:'1px solid var(--border)' },
  statBoxAccent: { background:'rgba(122,140,66,0.12)', borderColor:'rgba(122,140,66,0.3)' },
  statValue: { fontFamily:'var(--font-head)', fontSize:24, color:'var(--text)', fontWeight:700, lineHeight:1 },
  statUnit: { fontSize:9, color:'var(--accent)', letterSpacing:'0.1em', marginTop:2 },
  statLabel: { fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:3 },
  calSection: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  calValue: { fontFamily:'var(--font-head)', fontSize:36, color:'var(--text)', fontWeight:700, letterSpacing:'0.02em' },
  calLabel: { fontSize:9, color:'var(--text-muted)', letterSpacing:'0.12em', marginTop:2 },
  weightRow: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  weightValue: { fontFamily:'var(--font-head)', fontSize:32, color:'var(--text)', fontWeight:700 },
  weightUnit: { fontSize:12, color:'var(--text-muted)' },
  weightMuted: { color:'var(--text-muted)', fontSize:14 },
  macroRow: { display:'flex', alignItems:'center', gap:16 },
  macroItem: { textAlign:'center' },
  macroVal: { fontFamily:'var(--font-head)', fontSize:26, color:'var(--text)', fontWeight:700 },
  macroLbl: { fontSize:9, color:'var(--text-muted)', letterSpacing:'0.12em', marginTop:2 },
  macroDivider: { width:1, height:40, background:'var(--border)' },
  activityRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border-subtle)' },
  activityType: { display:'flex', alignItems:'center', gap:8 },
  activityDot: { width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block' },
  activityName: { fontSize:12, fontWeight:700, letterSpacing:'0.06em', color:'var(--text)' },
  activityMeta: { display:'flex', gap:12, fontSize:11, color:'var(--text-dim)' },
  emptyState: { fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'16px 0' },
  linkBtn: { background:'none', border:'none', color:'var(--accent)', fontSize:10, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:700 },
};

export default Dashboard;
