import { useState } from 'react';
import RankInsignia from './RankInsignia.jsx';
import { formatHeight } from '../lib/bodyComp.js';

const RANKS = [
  'PVT','PV2','PFC','SPC','CPL',
  'SGT','SSG','SFC','MSG','1SG','SGM','CSM','SMA',
  'WO1','CW2','CW3','CW4','CW5',
  '2LT','1LT','CPT','MAJ','LTC','COL','BG','MG','LTG','GEN',
];

const BRANCHES = [
  'Infantry','Armor','Aviation','Field Artillery','Air Defense Artillery',
  'Special Forces','Rangers','Military Police','Signal Corps','Military Intelligence',
  'Corps of Engineers','Chemical','Medical','Finance','Adjutant General',
  'Quartermaster','Transportation','Ordnance','Cyber','Other',
];

const Profile = ({ data, saveData, onReonboard }) => {
  const profile = data.profile || {};
  const [form, setForm] = useState({
    rank: profile.rank || '',
    name: profile.name || '',
    unit: profile.unit || '',
    mos: profile.mos || '',
    branch: profile.branch || '',
    age: profile.age || '',
    gender: profile.gender || 'M',
    height: profile.height || '',
    notes: profile.notes || '',
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveData({ ...data, profile: { ...form } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({ label, children }) => (
    <div style={st.field}>
      <label style={st.label}>{label}</label>
      {children}
    </div>
  );

  const inp = (key, props = {}) => (
    <input
      style={st.input}
      value={form[key]}
      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      {...props}
    />
  );

  return (
    <div style={st.screen}>
      <div style={st.header}>
        <span style={st.title}>SOLDIER PROFILE</span>
        <button style={{ ...st.saveBtn, ...(saved ? st.saveBtnDone : {}) }} onClick={save}>
          {saved ? '✓ SAVED' : 'SAVE'}
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 24px' }}>
        <div style={st.sectionLabel}>IDENTITY</div>

        <div style={st.twoCol}>
          <Field label="RANK">
            <select style={st.select} value={form.rank} onChange={e => setForm(p => ({ ...p, rank: e.target.value }))}>
              <option value="">Select</option>
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="NAME / CALLSIGN">
            {inp('name', { placeholder: 'Last, First' })}
          </Field>
        </div>

        <div style={st.twoCol}>
          <Field label="MOS / AFSC">
            {inp('mos', { placeholder: 'e.g. 11B' })}
          </Field>
          <Field label="UNIT">
            {inp('unit', { placeholder: 'e.g. 1-75 RGR' })}
          </Field>
        </div>

        <Field label="BRANCH / COMPONENT">
          <select style={st.select} value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>
            <option value="">Select</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>

        <div style={st.sectionLabel}>PHYSICAL</div>
        <div style={st.twoCol}>
          <Field label="AGE">
            {inp('age', { type: 'number', placeholder: 'e.g. 28', min: 17, max: 65 })}
          </Field>
          <Field label="HEIGHT (IN)">
            {inp('height', { type: 'number', placeholder: 'e.g. 70' })}
          </Field>
        </div>
        <Field label="GENDER">
          <div style={st.genderRow}>
            {['M', 'F'].map(g => (
              <button key={g} type="button" style={{ ...st.genderBtn, ...(form.gender === g ? st.genderActive : {}) }}
                onClick={() => setForm(p => ({ ...p, gender: g }))}>
                {g === 'M' ? 'MALE' : 'FEMALE'}
              </button>
            ))}
          </div>
        </Field>

        <div style={st.sectionLabel}>NOTES / LIMITATIONS</div>
        <textarea
          style={st.textarea}
          rows={3}
          placeholder="e.g. Profile limitations, current injuries, training focus..."
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
        />

        {(form.rank || form.name) && (
          <div style={st.idCard}>
            <div style={st.idCardAccent}></div>
            {form.rank && <div style={{ flexShrink:0 }}><RankInsignia rank={form.rank} size={44} /></div>}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={st.idRank}>{form.rank}</div>
              <div style={st.idName}>{form.name || 'SOLDIER'}</div>
              <div style={st.idMeta}>
                {[form.mos, form.unit, form.branch].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
        )}

        {(profile.height || profile.weight || profile.waist) && (
          <div style={st.measureSummary}>
            <div style={st.planSummaryLabel}>MEASUREMENTS</div>
            <div style={st.planSummaryRow}>
              <div style={st.planSummaryStat}>
                <span style={st.planSummaryVal}>{formatHeight(profile.height)}</span>
                <span style={st.planSummaryLbl}>HEIGHT</span>
              </div>
              <div style={st.planSummaryStat}>
                <span style={st.planSummaryVal}>{profile.weight ? `${profile.weight} lb` : '—'}</span>
                <span style={st.planSummaryLbl}>WEIGHT</span>
              </div>
              <div style={st.planSummaryStat}>
                <span style={st.planSummaryVal}>{profile.waist ? `${profile.waist} in` : '—'}</span>
                <span style={st.planSummaryLbl}>WAIST</span>
              </div>
              <div style={st.planSummaryStat}>
                <span style={st.planSummaryVal}>{data.plan?.hrs ?? '—'}</span>
                <span style={st.planSummaryLbl}>HRS</span>
              </div>
            </div>
          </div>
        )}

        {data.plan && (
          <div style={st.planSummary}>
            <div style={st.planSummaryLabel}>CURRENT PLAN</div>
            <div style={st.planSummaryRow}>
              <div style={st.planSummaryStat}>
                <span style={st.planSummaryVal}>{data.plan.goalCals}</span>
                <span style={st.planSummaryLbl}>KCAL/DAY</span>
              </div>
              <div style={st.planSummaryStat}>
                <span style={st.planSummaryVal}>{data.plan.protein}g</span>
                <span style={st.planSummaryLbl}>PROTEIN</span>
              </div>
              <div style={st.planSummaryStat}>
                <span style={st.planSummaryVal}>{data.plan.carbs}g</span>
                <span style={st.planSummaryLbl}>CARBS</span>
              </div>
              <div style={st.planSummaryStat}>
                <span style={st.planSummaryVal}>{data.plan.fat}g</span>
                <span style={st.planSummaryLbl}>FAT</span>
              </div>
            </div>
          </div>
        )}

        <button style={st.saveBtnFull} onClick={save}>
          {saved ? '✓ PROFILE SAVED' : 'SAVE PROFILE'}
        </button>

        {onReonboard && (
          <button style={st.reonboardBtn} onClick={onReonboard}>
            ↻ RE-RUN INTAKE / REGENERATE PLAN
          </button>
        )}
      </div>
    </div>
  );
};

const st = {
  screen: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, borderBottom:'1px solid var(--border)', flexShrink:0 },
  title: { fontFamily:'var(--font-head)', fontSize:18, letterSpacing:'0.14em', color:'var(--text)', fontWeight:700 },
  saveBtn: { height:32, padding:'0 14px', background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-muted)', fontFamily:'var(--font-head)', fontSize:11, letterSpacing:'0.1em', cursor:'pointer', borderRadius:3, fontWeight:700, transition:'all 0.2s' },
  saveBtnDone: { background:'rgba(122,140,66,0.15)', borderColor:'var(--accent)', color:'var(--accent)' },
  sectionLabel: { fontSize:10, letterSpacing:'0.14em', color:'var(--text-muted)', fontWeight:700, margin:'18px 0 10px' },
  field: { marginBottom:12 },
  label: { display:'block', fontSize:9, letterSpacing:'0.12em', color:'var(--text-muted)', marginBottom:5, fontWeight:700 },
  input: { width:'100%', height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, padding:'0 12px', borderRadius:3, fontFamily:'var(--font-body)', boxSizing:'border-box', outline:'none' },
  select: { width:'100%', height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, padding:'0 12px', borderRadius:3, fontFamily:'var(--font-body)', outline:'none', cursor:'pointer' },
  textarea: { width:'100%', background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, padding:'10px 12px', borderRadius:3, fontFamily:'var(--font-body)', outline:'none', resize:'vertical', lineHeight:1.5, boxSizing:'border-box' },
  twoCol: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  genderRow: { display:'flex', gap:8 },
  genderBtn: { flex:1, height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:11, letterSpacing:'0.08em', cursor:'pointer', borderRadius:3, fontFamily:'var(--font-body)', fontWeight:700 },
  genderActive: { background:'rgba(122,140,66,0.12)', borderColor:'var(--accent)', color:'var(--accent)' },
  idCard: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:16, marginTop:20, marginBottom:12, display:'flex', alignItems:'center', gap:12, position:'relative', overflow:'hidden' },
  idCardAccent: { position:'absolute', left:0, top:0, bottom:0, width:3, background:'var(--accent)' },
  idRank: { fontSize:10, letterSpacing:'0.14em', color:'var(--accent)', fontWeight:700 },
  idName: { fontFamily:'var(--font-head)', fontSize:22, color:'var(--text)', fontWeight:800, letterSpacing:'0.06em', marginTop:2 },
  idMeta: { fontSize:10, color:'var(--text-muted)', marginTop:4, letterSpacing:'0.06em' },
  measureSummary: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:'12px 14px', marginBottom:12 },
  planSummary: { background:'rgba(122,140,66,0.06)', border:'1px solid rgba(122,140,66,0.25)', borderRadius:4, padding:'12px 14px', marginBottom:12 },
  planSummaryLabel: { fontSize:9, letterSpacing:'0.14em', color:'var(--accent)', fontWeight:700, marginBottom:8 },
  planMethodTag: { fontSize:8, color:'var(--text-muted)', marginLeft:8, fontWeight:600, letterSpacing:'0.1em' },
  planSummaryRow: { display:'flex', gap:8 },
  planSummaryStat: { flex:1, textAlign:'center' },
  planSummaryVal: { display:'block', fontFamily:'var(--font-head)', fontSize:18, color:'var(--text)', fontWeight:800, lineHeight:1 },
  planSummaryLbl: { fontSize:8, color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:3 },
  saveBtnFull: { width:'100%', height:52, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:700, marginTop:8 },
  reonboardBtn: { width:'100%', height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text-muted)', fontFamily:'var(--font-head)', fontSize:11, letterSpacing:'0.12em', cursor:'pointer', borderRadius:3, fontWeight:700, marginTop:8 },
};

export default Profile;
