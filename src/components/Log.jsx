import { useRef, useState } from 'react';
import { exportJSON, importJSON } from '../lib/storage.js';

const Log = ({ data, saveData }) => {
  const [filter, setFilter] = useState('All');
  const fileInputRef = useRef(null);
  const types = ['All', 'Ruck', 'Run', 'Walk', 'Cardio'];

  const fmtTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const ss = sec % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  };

  const workouts = [...(data.workouts || [])].reverse();
  const filtered = filter === 'All' ? workouts : workouts.filter(w => w.type === filter);

  const deleteWorkout = (id) => {
    if (!confirm('Delete this session?')) return;
    saveData({ ...data, workouts: (data.workouts || []).filter(w => w.id !== id) });
  };

  const grouped = {};
  filtered.forEach(w => {
    const key = new Date(w.date).toLocaleDateString('en-US', { month:'long', year:'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(w);
  });

  const typeColors = { Ruck:'#7a8c42', Run:'#4a8a6e', Walk:'#8a7a3e', Cardio:'#7a4a6e' };

  const onImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('This will replace all your current data. Continue?')) {
      e.target.value = '';
      return;
    }
    importJSON(file)
      .then((imported) => { saveData(imported); alert('Backup restored.'); })
      .catch(() => alert('Could not read that file. It may be corrupt or not an Endure backup.'));
    e.target.value = '';
  };

  return (
    <div style={st.screen}>
      <div style={st.header}>
        <span style={st.title}>ACTIVITY LOG</span>
        <div style={st.actions}>
          <button style={st.actionBtn} onClick={() => exportJSON(data)} title="Export">↑ EXPORT</button>
          <button style={st.actionBtn} onClick={() => fileInputRef.current?.click()} title="Import">↓ IMPORT</button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display:'none' }} onChange={onImport} />
        </div>
      </div>

      <div style={st.filterRow}>
        {types.map(t => (
          <button
            key={t}
            style={{ ...st.filterBtn, ...(filter === t ? st.filterActive : {}) }}
            onClick={() => setFilter(t)}
          >{t}</button>
        ))}
      </div>

      <div style={st.list}>
        {Object.keys(grouped).length === 0 && (
          <div style={st.empty}>
            <div style={st.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div style={st.emptyText}>No sessions logged yet.</div>
            <div style={st.emptyHint}>Start a session in the Cardio tab.</div>
          </div>
        )}
        {Object.entries(grouped).map(([month, sessions]) => (
          <div key={month}>
            <div style={st.monthHeader}>{month}</div>
            {sessions.map(w => (
              <div key={w.id} style={st.sessionCard}>
                <div style={{ ...st.typeIndicator, background: typeColors[w.type] || 'var(--accent)' }}></div>
                <div style={st.sessionInfo}>
                  <div style={st.sessionType}>
                    {w.type?.toUpperCase()}
                    {w.source === 'manual' && <span style={st.manualTag}> · MANUAL</span>}
                  </div>
                  <div style={st.sessionDate}>{new Date(w.date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</div>
                </div>
                <div style={st.sessionStats}>
                  <div style={st.statItem}>
                    <div style={st.statVal}>{(w.distance || 0).toFixed(2)}</div>
                    <div style={st.statLbl}>MI</div>
                  </div>
                  <div style={st.statItem}>
                    <div style={st.statVal}>{fmtTime(w.duration || 0)}</div>
                    <div style={st.statLbl}>TIME</div>
                  </div>
                  <div style={st.statItem}>
                    <div style={st.statVal}>{w.pace || '--'}</div>
                    <div style={st.statLbl}>PACE</div>
                  </div>
                </div>
                <button style={st.delBtn} onClick={() => deleteWorkout(w.id)}>✕</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const st = {
  screen: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, borderBottom:'1px solid var(--border)', flexShrink:0 },
  title: { fontFamily:'var(--font-head)', fontSize:18, letterSpacing:'0.14em', color:'var(--text)', fontWeight:700 },
  actions: { display:'flex', gap:8 },
  actionBtn: { background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:9, letterSpacing:'0.1em', padding:'5px 10px', cursor:'pointer', borderRadius:2, fontFamily:'var(--font-body)', fontWeight:700 },
  filterRow: { display:'flex', gap:0, borderBottom:'1px solid var(--border)', flexShrink:0 },
  filterBtn: { flex:1, height:36, background:'none', border:'none', color:'var(--text-muted)', fontSize:10, letterSpacing:'0.06em', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', borderBottom:'2px solid transparent', transition:'all 0.15s' },
  filterActive: { color:'var(--accent)', borderBottomColor:'var(--accent)' },
  list: { flex:1, overflowY:'auto', padding:'0 16px' },
  monthHeader: { fontSize:10, letterSpacing:'0.14em', color:'var(--text-muted)', fontWeight:700, padding:'14px 0 8px' },
  sessionCard: { display:'flex', alignItems:'center', gap:10, padding:'12px 0', borderBottom:'1px solid var(--border-subtle)' },
  typeIndicator: { width:3, height:40, borderRadius:2, flexShrink:0 },
  sessionInfo: { flex:1 },
  sessionType: { fontSize:13, fontWeight:700, letterSpacing:'0.06em', color:'var(--text)' },
  manualTag: { fontSize:9, color:'var(--text-muted)', letterSpacing:'0.08em', fontWeight:600 },
  sessionDate: { fontSize:10, color:'var(--text-muted)', marginTop:2 },
  sessionStats: { display:'flex', gap:14, alignItems:'center' },
  statItem: { textAlign:'center' },
  statVal: { fontFamily:'var(--font-head)', fontSize:14, color:'var(--text)', fontWeight:700 },
  statLbl: { fontSize:8, color:'var(--text-muted)', letterSpacing:'0.1em' },
  delBtn: { background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', padding:4, opacity:0.5 },
  empty: { textAlign:'center', padding:'48px 0' },
  emptyIcon: { marginBottom:12, opacity:0.4 },
  emptyText: { fontSize:14, color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.06em' },
  emptyHint: { fontSize:11, color:'var(--text-muted)', marginTop:6, opacity:0.6 },
};

export default Log;
