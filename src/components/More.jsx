import { useState } from 'react';
import { usePWAInstall } from '../lib/install.js';

const More = ({ data, saveData, setTab }) => {
  const [view, setView] = useState('hub');
  const install = usePWAInstall();

  if (view === 'weighin') return <WeighIn data={data} saveData={saveData} onBack={() => setView('hub')} />;
  if (view === 'water') return <Water data={data} saveData={saveData} onBack={() => setView('hub')} />;
  if (view === 'sleep') return <Sleep data={data} saveData={saveData} onBack={() => setView('hub')} />;
  if (view === 'install_ios') return <IOSInstallGuide onBack={() => setView('hub')} />;

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
    </div>
  );
};

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
    if (!val || val < 50 || val > 500) return;
    const entry = { id: Date.now(), date: new Date().toISOString(), weight: val };
    saveData({ ...data, weights: [...weights, entry] });
    setInput('');
  };

  const monthAgo = new Date(Date.now() - 30 * 86_400_000);
  const recent = weights.filter(w => new Date(w.date) >= monthAgo);
  const latest = weights.length ? weights[weights.length - 1] : null;

  const SparkLine30 = () => {
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
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polyline points={`0,${H} ${pts} ${W},${H}`} fill="url(#wGrad)" stroke="none"/>
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

const Sleep = ({ data, onBack, saveData }) => {
  const [bedTime, setBedTime] = useState('23:15');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState('Good');
  const [note, setNote] = useState('');
  const [selectedDate] = useState(new Date().toDateString());

  const calcHours = (bed, wake) => {
    const [bh, bm] = bed.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins < 0) mins += 1440;
    return (mins / 60).toFixed(2);
  };

  const hours = parseFloat(calcHours(bedTime, wakeTime));
  const pct = Math.min(hours / 9, 1);

  const logSleep = () => {
    const entry = { id: Date.now(), date: new Date(selectedDate).toISOString(), bedTime, wakeTime, hours, quality, note };
    const filtered = (data.sleep || []).filter(s => new Date(s.date).toDateString() !== selectedDate);
    saveData({ ...data, sleep: [...filtered, entry] });
    onBack();
  };

  const qualities = ['Poor', 'Fair', 'Good', 'Great'];

  return (
    <div style={st.subScreen}>
      <div style={st.subHeader}>
        <button style={st.backBtn} onClick={onBack}>←</button>
        <span style={st.subTitle}>SLEEP</span>
        <div style={{ width:32 }}></div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px' }}>
        <div style={st.dateNav}>
          <span style={st.dateLabel}>{new Date(selectedDate).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</span>
        </div>
        <div style={st.ringWrap}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="72" fill="none" stroke="var(--surface-2)" strokeWidth="12"/>
            <circle cx="90" cy="90" r="72" fill="none" stroke="#5a4a8e" strokeWidth="12"
              strokeDasharray={`${pct * 452} 452`}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
              style={{ transition:'stroke-dasharray 0.4s ease' }}/>
            <text x="90" y="78" textAnchor="middle" fill="var(--text)" fontSize="32" fontFamily="var(--font-head)" fontWeight="700">{hours.toFixed(2)}</text>
            <text x="90" y="100" textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontFamily="var(--font-body)">HOURS</text>
            <text x="90" y="120" textAnchor="middle" fill="#5a4a8e" fontSize="10" fontFamily="var(--font-body)" letterSpacing="2">{quality.toUpperCase()}</text>
          </svg>
        </div>
        <div style={st.timesRow}>
          <div style={st.timeBlock}>
            <div style={st.timeLabel}>TIME TO BED</div>
            <input style={st.timeInput} type="time" value={bedTime} onChange={e => setBedTime(e.target.value)} />
          </div>
          <div style={st.timeDivider}></div>
          <div style={st.timeBlock}>
            <div style={st.timeLabel}>WAKE TIME</div>
            <input style={st.timeInput} type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
          </div>
        </div>
        <div style={st.qualityRow}>
          <div style={st.qualityLabel}>QUALITY</div>
          <div style={st.qualityBtns}>
            {qualities.map(q => (
              <button key={q} type="button" style={{ ...st.qualBtn, ...(quality === q ? st.qualBtnActive : {}) }} onClick={() => setQuality(q)}>{q}</button>
            ))}
          </div>
        </div>
        <div style={st.noteGroup}>
          <label style={st.noteLabel}>NOTE</label>
          <input style={st.noteInput} type="text" placeholder="e.g. Felt rested" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <button style={st.logSleepBtn} onClick={logSleep}>LOG SLEEP</button>
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
  logSleepBtn: { width:'100%', height:52, background:'#5a4a8e', border:'none', color:'#fff', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:700, marginBottom:24 },
};

export default More;
