import { useState } from 'react';

const Nutrition = ({ data, saveData }) => {
  const [view, setView] = useState('main');
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const [form, setForm] = useState({ name:'', serving:'', calories:'', protein:'', carbs:'', fat:'' });

  const entries = (data.nutrition || []).filter(n => new Date(n.date).toDateString() === selectedDate);
  const totals = entries.reduce((acc, n) => ({
    calories: acc.calories + (n.calories || 0),
    protein: acc.protein + (n.protein || 0),
    carbs: acc.carbs + (n.carbs || 0),
    fat: acc.fat + (n.fat || 0),
  }), { calories:0, protein:0, carbs:0, fat:0 });

  const goals = data.nutritionGoals || { calories: 2500, protein: 180, carbs: 250, fat: 80 };

  const shiftDate = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d.toDateString());
  };

  const fmtDate = (ds) => {
    const d = new Date(ds);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  };

  const saveFood = () => {
    if (!form.name) return;
    const entry = {
      id: Date.now(),
      date: new Date(selectedDate).toISOString(),
      name: form.name,
      serving: form.serving,
      calories: parseInt(form.calories) || 0,
      protein: parseInt(form.protein) || 0,
      carbs: parseInt(form.carbs) || 0,
      fat: parseInt(form.fat) || 0,
    };
    saveData({ ...data, nutrition: [...(data.nutrition || []), entry] });
    setForm({ name:'', serving:'', calories:'', protein:'', carbs:'', fat:'' });
    setView('main');
  };

  const deleteEntry = (id) => {
    saveData({ ...data, nutrition: (data.nutrition || []).filter(n => n.id !== id) });
  };

  const MacroBar = ({ val, goal, color }) => {
    const pct = Math.min((val / goal) * 100, 100);
    return (
      <div style={{ background:'var(--surface-2)', borderRadius:2, height:4, overflow:'hidden', marginTop:4 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:2, transition:'width 0.3s' }}></div>
      </div>
    );
  };

  if (view === 'addFood') {
    const fields = [
      { key:'name', label:'Food Name', placeholder:'e.g. Grilled Chicken Breast' },
      { key:'serving', label:'Serving Size', placeholder:'e.g. 6 oz' },
      { key:'calories', label:'Calories', placeholder:'kcal', type:'number' },
      { key:'protein', label:'Protein', placeholder:'g', type:'number' },
      { key:'carbs', label:'Carbs', placeholder:'g', type:'number' },
      { key:'fat', label:'Fat', placeholder:'g', type:'number' },
    ];
    return (
      <div style={st.screen}>
        <div style={st.header}>
          <button style={st.backBtn} onClick={() => setView('main')}>←</button>
          <span style={st.headerTitle}>ADD FOOD</span>
          <button style={st.saveHeaderBtn} onClick={saveFood}>✓</button>
        </div>
        <div style={{ padding:'0 16px', overflowY:'auto', flex:1 }}>
          {fields.map(f => (
            <div key={f.key} style={st.fieldGroup}>
              <label style={st.fieldLabel}>{f.label}</label>
              <input
                style={st.input}
                type={f.type || 'text'}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <button style={st.saveFoodBtn} onClick={saveFood}>SAVE FOOD</button>
        </div>
      </div>
    );
  }

  const meals = { Breakfast:[], Lunch:[], Dinner:[], Snacks:[] };
  entries.forEach((e, i) => {
    const keys = Object.keys(meals);
    meals[keys[i % keys.length]].push(e);
  });

  return (
    <div style={st.screen}>
      <div style={st.header}>
        <button style={st.navBtn} onClick={() => shiftDate(-1)}>‹</button>
        <span style={st.headerTitle}>{fmtDate(selectedDate)}</span>
        <button style={st.navBtn} onClick={() => shiftDate(1)}>›</button>
      </div>

      <div style={st.macroPanel}>
        {[
          { key:'calories', label:'CALORIES', val: totals.calories, goal: goals.calories, color:'var(--accent)', unit:'' },
          { key:'protein', label:'PROTEIN', val: totals.protein, goal: goals.protein, color:'#4a8a6e', unit:'g' },
          { key:'carbs', label:'CARBS', val: totals.carbs, goal: goals.carbs, color:'#8a7a3e', unit:'g' },
          { key:'fat', label:'FAT', val: totals.fat, goal: goals.fat, color:'#8a4a3e', unit:'g' },
        ].map(m => (
          <div key={m.key} style={st.macroBox}>
            <div style={st.macroVal}>{m.val}<span style={st.macroUnit}>{m.unit}</span></div>
            <div style={st.macroGoal}>/{m.goal}{m.unit}</div>
            <MacroBar val={m.val} goal={m.goal} color={m.color} />
            <div style={st.macroLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 16px' }}>
        {Object.entries(meals).map(([meal, items]) => (
          <div key={meal} style={st.mealSection}>
            <div style={st.mealHeader}>
              <span style={st.mealName}>{meal}</span>
              <span style={st.mealCals}>{items.reduce((s, e) => s + e.calories, 0)} cal</span>
            </div>
            {items.length === 0 && <div style={st.mealEmpty}>Nothing logged</div>}
            {items.map(e => (
              <div key={e.id} style={st.foodRow}>
                <div style={st.foodInfoCol}>
                  <div style={st.foodName}>{e.name}</div>
                  <div style={st.foodMacros}>P {e.protein}g · C {e.carbs}g · F {e.fat}g</div>
                </div>
                <div style={st.foodRight}>
                  <span style={st.foodCals}>{e.calories}</span>
                  <button style={st.deleteBtn} onClick={() => deleteEntry(e.id)} aria-label="Delete entry">✕</button>
                </div>
              </div>
            ))}
          </div>
        ))}
        <button style={st.addFoodBtn} onClick={() => setView('addFood')}>+ ADD FOOD</button>
      </div>
    </div>
  );
};

const st = {
  screen: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, borderBottom:'1px solid var(--border)', flexShrink:0 },
  headerTitle: { fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', color:'var(--text)', fontWeight:700 },
  backBtn: { background:'none', border:'none', color:'var(--text)', fontSize:20, cursor:'pointer', width:32 },
  saveHeaderBtn: { background:'none', border:'none', color:'var(--accent)', fontSize:20, cursor:'pointer', width:32 },
  navBtn: { background:'none', border:'none', color:'var(--text)', fontSize:24, cursor:'pointer', width:32 },
  macroPanel: { display:'flex', gap:1, background:'var(--border)', borderBottom:'1px solid var(--border)', flexShrink:0 },
  macroBox: { flex:1, background:'var(--surface-1)', padding:'12px 8px', textAlign:'center' },
  macroVal: { fontFamily:'var(--font-head)', fontSize:20, color:'var(--text)', fontWeight:700, lineHeight:1 },
  macroUnit: { fontSize:11, color:'var(--text-muted)' },
  macroGoal: { fontSize:9, color:'var(--text-muted)', marginTop:1 },
  macroLabel: { fontSize:8, color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:4 },
  mealSection: { marginTop:14 },
  mealHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  mealName: { fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:'var(--text-muted)' },
  mealCals: { fontSize:10, color:'var(--text-muted)' },
  mealEmpty: { fontSize:11, color:'var(--text-muted)', padding:'6px 0', fontStyle:'italic' },
  foodRow: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border-subtle)' },
  foodInfoCol: { flex:1, minWidth:0 },
  foodName: { fontSize:13, color:'var(--text)', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  foodMacros: { fontSize:10, color:'var(--text-muted)', marginTop:2 },
  foodRight: { display:'flex', alignItems:'center', gap:8, flexShrink:0 },
  foodCals: { fontFamily:'var(--font-head)', fontSize:18, color:'var(--text)', fontWeight:700 },
  deleteBtn: { background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:12, cursor:'pointer', width:32, height:32, borderRadius:3, padding:0, display:'flex', alignItems:'center', justifyContent:'center' },
  addFoodBtn: { width:'100%', height:48, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--accent)', fontFamily:'var(--font-head)', fontSize:13, letterSpacing:'0.12em', cursor:'pointer', borderRadius:3, marginTop:16, fontWeight:700 },
  fieldGroup: { marginBottom:14 },
  fieldLabel: { display:'block', fontSize:10, letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:6, fontWeight:600 },
  input: { width:'100%', height:44, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, padding:'0 12px', borderRadius:3, fontFamily:'var(--font-body)', boxSizing:'border-box', outline:'none' },
  saveFoodBtn: { width:'100%', height:52, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, marginTop:8, marginBottom:20, fontWeight:700 },
};

export default Nutrition;
