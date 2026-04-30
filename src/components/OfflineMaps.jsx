import { useEffect, useState } from 'react';
import {
  loadOfflineAreas, saveOfflineAreas,
  downloadArea, deleteArea,
  totalCachedBytes, fmtBytes,
} from '../lib/offlineMaps.js';

export default function OfflineMaps({ onBack }) {
  const [areas, setAreas] = useState(loadOfflineAreas);
  const [view, setView] = useState('list'); // list | add
  const [totalSize, setTotalSize] = useState(null);

  useEffect(() => { totalCachedBytes().then(setTotalSize); }, [areas]);

  const persist = (next) => { setAreas(next); saveOfflineAreas(next); };

  const onDelete = async (area) => {
    if (!confirm(`Delete offline area "${area.name}"?`)) return;
    await deleteArea(area);
    persist(areas.filter(a => a.id !== area.id));
  };

  if (view === 'add') {
    return <AddArea onBack={() => setView('list')} onSaved={(area) => { persist([area, ...areas]); setView('list'); }} />;
  }

  return (
    <div style={st.screen}>
      <div style={st.header}>
        <button style={st.backBtn} onClick={onBack}>←</button>
        <span style={st.title}>OFFLINE MAPS</span>
        <button style={st.addBtn} onClick={() => setView('add')}>+ ADD</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 24px' }}>
        <div style={st.intro}>
          Pre-download map tiles for areas where you train. Tiles render even
          with no signal — useful at remote training sites or on airplane mode.
        </div>

        {areas.length === 0 ? (
          <div style={st.empty}>
            No offline areas saved yet.
            <div style={st.emptyHint}>Tap + ADD to download tiles for your training area.</div>
          </div>
        ) : (
          areas.map(a => (
            <div key={a.id} style={st.areaCard}>
              <div style={{ flex:1 }}>
                <div style={st.areaName}>{a.name}</div>
                <div style={st.areaMeta}>
                  {a.miles} mi radius · {a.tiles} tiles · {fmtBytes(a.bytes)}
                </div>
                <div style={st.areaDate}>
                  Saved {new Date(a.savedAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                </div>
              </div>
              <button style={st.delBtn} onClick={() => onDelete(a)}>DELETE</button>
            </div>
          ))
        )}

        <div style={st.footer}>
          Total cached on device: <strong>{fmtBytes(totalSize)}</strong>
          <div style={st.footerNote}>Includes app shell, fonts, and all map tiles.</div>
        </div>
      </div>
    </div>
  );
}

function AddArea({ onBack, onSaved }) {
  const [stage, setStage] = useState('locating'); // locating | configure | downloading | done | error
  const [error, setError] = useState('');
  const [pos, setPos] = useState(null);
  const [name, setName] = useState('');
  const [miles, setMiles] = useState(3);
  const [progress, setProgress] = useState({ done: 0, total: 0, bytes: 0 });
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not available on this device.');
      setStage('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setStage('configure');
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. Enable location to pick an area.'
          : 'Could not get your location. Try again outdoors.');
        setStage('error');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  const start = async () => {
    setStage('downloading');
    try {
      const r = await downloadArea(
        { lat: pos.lat, lng: pos.lng, miles, minZ: 13, maxZ: 17 },
        (done, total, bytes) => setProgress({ done, total, bytes }),
      );
      setResult(r);
      setStage('done');
    } catch (err) {
      setError(err.message || 'Download failed.');
      setStage('error');
    }
  };

  const finish = () => {
    onSaved({
      id: Date.now(),
      name: name || `Area ${new Date().toLocaleDateString()}`,
      lat: pos.lat,
      lng: pos.lng,
      miles,
      minZ: 13,
      maxZ: 17,
      tiles: result.tiles,
      bytes: result.bytes,
      savedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={st.screen}>
      <div style={st.header}>
        <button style={st.backBtn} onClick={onBack}>←</button>
        <span style={st.title}>ADD OFFLINE AREA</span>
        <div style={{ width:32 }}></div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 24px' }}>
        {stage === 'locating' && <div style={st.loading}>Acquiring GPS…</div>}

        {stage === 'error' && (
          <>
            <div style={st.errorBox}>{error}</div>
            <button style={st.btn} onClick={onBack}>BACK</button>
          </>
        )}

        {stage === 'configure' && (
          <>
            <div style={st.fieldGroup}>
              <label style={st.label}>NAME</label>
              <input
                style={st.input}
                placeholder="e.g. Fort Bragg, Home Loop"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div style={st.fieldGroup}>
              <label style={st.label}>RADIUS</label>
              <div style={st.radiusRow}>
                {[1, 3, 5, 10].map(m => (
                  <button key={m} type="button"
                    style={{ ...st.radiusBtn, ...(miles === m ? st.radiusBtnActive : {}) }}
                    onClick={() => setMiles(m)}
                  >{m} mi</button>
                ))}
              </div>
            </div>
            <div style={st.estimate}>
              Estimated download: {estimateTiles(miles)} tiles, ≈{estimateMB(miles)} MB
            </div>
            <button style={st.btn} onClick={start}>DOWNLOAD AREA</button>
            <div style={st.warn}>
              Tiles count against device storage. Stays on this device — never uploaded anywhere.
            </div>
          </>
        )}

        {stage === 'downloading' && (
          <div style={st.progressWrap}>
            <div style={st.progressLabel}>DOWNLOADING TILES</div>
            <div style={st.progressBar}>
              <div style={{ ...st.progressFill, width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}></div>
            </div>
            <div style={st.progressText}>{progress.done} / {progress.total}</div>
            <div style={st.progressBytes}>{fmtBytes(progress.bytes)} downloaded</div>
          </div>
        )}

        {stage === 'done' && (
          <>
            <div style={st.successBox}>
              ✓ Downloaded {result.succeeded} of {result.tiles} tiles
              <div style={st.successMeta}>{fmtBytes(result.bytes)} now cached for offline use.</div>
            </div>
            <button style={st.btn} onClick={finish}>SAVE AREA</button>
          </>
        )}
      </div>
    </div>
  );
}

// Rough tile-count estimates by radius @ z13–z17 inclusive. Empirical.
function estimateTiles(miles) {
  // Squared scaling — area ∝ miles²
  return Math.round(60 + (miles * miles) * 18);
}
function estimateMB(miles) {
  return Math.round(estimateTiles(miles) * 0.012); // ~12KB/tile avg for CARTO Dark
}

const st = {
  screen: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, borderBottom:'1px solid var(--border)', flexShrink:0 },
  backBtn: { background:'none', border:'none', color:'var(--text)', fontSize:20, cursor:'pointer', width:32 },
  title: { fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', color:'var(--text)', fontWeight:700 },
  addBtn: { height:32, padding:'0 12px', background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:11, letterSpacing:'0.1em', cursor:'pointer', borderRadius:3, fontWeight:700 },
  intro: { fontSize:12, color:'var(--text-muted)', lineHeight:1.5, padding:'14px 0 18px' },
  empty: { textAlign:'center', padding:'40px 16px', fontSize:13, color:'var(--text-muted)', fontWeight:600 },
  emptyHint: { fontSize:11, marginTop:6, opacity:0.7 },
  areaCard: { display:'flex', alignItems:'center', gap:12, padding:14, background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, marginBottom:8 },
  areaName: { fontSize:14, fontWeight:700, letterSpacing:'0.04em', color:'var(--text)' },
  areaMeta: { fontSize:11, color:'var(--text-dim)', marginTop:3 },
  areaDate: { fontSize:10, color:'var(--text-muted)', marginTop:3 },
  delBtn: { background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:9, letterSpacing:'0.1em', padding:'5px 10px', cursor:'pointer', borderRadius:2, fontFamily:'var(--font-body)', fontWeight:700 },
  footer: { marginTop:18, padding:'12px 14px', background:'var(--surface-1)', border:'1px solid var(--border-subtle)', borderRadius:3, fontSize:12, color:'var(--text-dim)' },
  footerNote: { fontSize:10, color:'var(--text-muted)', marginTop:4 },
  fieldGroup: { marginBottom:14, paddingTop:14 },
  label: { display:'block', fontSize:10, letterSpacing:'0.12em', color:'var(--text-muted)', marginBottom:6, fontWeight:700 },
  input: { width:'100%', height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, padding:'0 12px', borderRadius:3, fontFamily:'var(--font-body)', boxSizing:'border-box', outline:'none' },
  radiusRow: { display:'flex', gap:8 },
  radiusBtn: { flex:1, height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:12, letterSpacing:'0.06em', cursor:'pointer', borderRadius:3, fontFamily:'var(--font-body)', fontWeight:700 },
  radiusBtnActive: { background:'rgba(122,140,66,0.12)', borderColor:'var(--accent)', color:'var(--accent)' },
  estimate: { fontSize:11, color:'var(--text-muted)', marginBottom:14, fontStyle:'italic' },
  btn: { width:'100%', height:52, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:700 },
  warn: { fontSize:11, color:'var(--text-muted)', marginTop:14, lineHeight:1.5 },
  loading: { textAlign:'center', padding:'48px 0', fontSize:12, color:'var(--text-muted)', letterSpacing:'0.1em' },
  errorBox: { padding:'14px', background:'rgba(180,80,40,0.12)', border:'1px solid rgba(180,80,40,0.3)', color:'#d4926a', borderRadius:3, fontSize:12, marginTop:18, marginBottom:14 },
  progressWrap: { padding:'40px 0' },
  progressLabel: { fontSize:11, letterSpacing:'0.14em', color:'var(--accent)', textAlign:'center', marginBottom:14, fontWeight:700 },
  progressBar: { height:6, background:'var(--surface-2)', borderRadius:3, overflow:'hidden' },
  progressFill: { height:'100%', background:'var(--accent)', transition:'width 0.2s' },
  progressText: { fontFamily:'var(--font-head)', fontSize:24, color:'var(--text)', fontWeight:700, textAlign:'center', marginTop:14 },
  progressBytes: { fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:4 },
  successBox: { padding:'18px 14px', background:'rgba(122,140,66,0.12)', border:'1px solid rgba(122,140,66,0.3)', color:'var(--accent)', borderRadius:3, fontSize:14, fontWeight:700, marginTop:18, marginBottom:14, textAlign:'center' },
  successMeta: { fontSize:11, color:'var(--text-dim)', marginTop:6, fontWeight:400 },
};
