import { useState } from 'react';
import RankInsignia from './RankInsignia.jsx';
import { calcPlan, ALL_RANKS, ACTIVITY_LEVELS } from '../lib/bodyComp.js';

// Step list is gender-aware: females get an extra HIP step needed by AR 600-9.
const baseSteps = ['WELCOME','RANK','GENDER','AGE','HEIGHT','WEIGHT','WAIST','NECK'];
const stepsForGender = (gender) => [
  ...baseSteps,
  ...(gender === 'F' ? ['HIP'] : []),
  'ACTIVITY','GENERATING','PLAN',
];

export default function Onboarding({ onComplete, existingProfile = {} }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [plan, setPlan] = useState(null);

  const totalIn = existingProfile?.height ? parseInt(existingProfile.height) : null;
  const [profile, setProfile] = useState({
    rank: existingProfile?.rank || '',
    gender: existingProfile?.gender || '',
    age: existingProfile?.age ? String(existingProfile.age) : '',
    heightFt: totalIn ? String(Math.floor(totalIn / 12)) : '',
    heightIn: totalIn ? String(totalIn % 12) : '',
    weight: existingProfile?.weight ? String(existingProfile.weight) : '',
    waist: existingProfile?.waist ? String(existingProfile.waist) : '',
    neck: existingProfile?.neck ? String(existingProfile.neck) : '',
    hip: existingProfile?.hip ? String(existingProfile.hip) : '',
    activityLevel: existingProfile?.activityLevel || 'moderate',
    name: existingProfile?.name || '',
    unit: existingProfile?.unit || '',
    mos: existingProfile?.mos || '',
  });

  const STEPS = stepsForGender(profile.gender);

  const set = (key, val) => setProfile((p) => ({ ...p, [key]: val }));

  const advance = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      if (STEPS[step + 1] === 'GENERATING') {
        const heightInTotal = (parseInt(profile.heightFt || 0) * 12) + parseInt(profile.heightIn || 0);
        const p = calcPlan({
          weightLbs: parseFloat(profile.weight),
          heightIn: heightInTotal,
          age: parseInt(profile.age),
          gender: profile.gender,
          waistIn: profile.waist ? parseFloat(profile.waist) : null,
          neckIn:  profile.neck  ? parseFloat(profile.neck)  : null,
          hipIn:   profile.hip   ? parseFloat(profile.hip)   : null,
          activityLevel: profile.activityLevel,
        });
        setPlan(p);
        setStep((s) => s + 1);
        setAnimating(false);
        // Auto-advance to PLAN after the formula animation runs
        setTimeout(() => setStep((s) => s + 1), 2800);
      } else {
        setStep((s) => s + 1);
        setAnimating(false);
      }
    }, 180);
  };

  const back = () => { if (step > 1) setStep((s) => s - 1); };

  // "Skip tape test" button on WAIST step jumps past NECK (and HIP for women)
  // straight to ACTIVITY without firing the formula until then.
  const skipToActivity = () => {
    const activityIdx = STEPS.indexOf('ACTIVITY');
    if (activityIdx >= 0) {
      setAnimating(true);
      setTimeout(() => { setStep(activityIdx); setAnimating(false); }, 180);
    }
  };

  const finish = () => {
    const heightInTotal = (parseInt(profile.heightFt || 0) * 12) + parseInt(profile.heightIn || 0);
    onComplete({
      profile: {
        rank: profile.rank,
        gender: profile.gender,
        age: profile.age,
        height: heightInTotal.toString(),
        weight: profile.weight,
        waist: profile.waist,
        neck: profile.neck,
        hip: profile.hip,
        activityLevel: profile.activityLevel,
        name: profile.name,
        unit: profile.unit,
        mos: profile.mos,
        branch: existingProfile?.branch || '',
        notes: existingProfile?.notes || '',
      },
      plan,
    });
  };

  const currentStep = STEPS[step];

  return (
    <div style={st.root}>
      <div style={st.scanlines}></div>

      {step > 0 && step < STEPS.length - 1 && (
        <div style={st.progressBar}>
          <div style={{ ...st.progressFill, width: `${(step / (STEPS.length - 2)) * 100}%` }}></div>
        </div>
      )}

      {step > 1 && step < STEPS.length - 2 && (
        <button style={st.backBtn} onClick={back}>← BACK</button>
      )}

      <div style={{
        ...st.content,
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.18s, transform 0.18s',
      }}>
        {currentStep === 'WELCOME' && (
          <div style={st.step}>
            <div style={st.classifiedBanner}><span style={st.classifiedText}>// CLASSIFIED //</span></div>
            <div style={st.logo}>
              <svg width="64" height="72" viewBox="0 0 64 72" fill="none">
                <polygon points="32,2 62,18 62,54 32,70 2,54 2,18" fill="rgba(122,140,66,0.08)" stroke="rgba(122,140,66,0.5)" strokeWidth="1.5"/>
                <polygon points="32,10 54,22 54,50 32,62 10,50 10,22" fill="rgba(122,140,66,0.05)" stroke="rgba(122,140,66,0.25)" strokeWidth="1"/>
                <text x="32" y="45" textAnchor="middle" fill="var(--accent)" fontSize="22" fontFamily="var(--font-head)" fontWeight="800" letterSpacing="2">E</text>
              </svg>
            </div>
            <div style={st.welcomeTitle}>ENDURE</div>
            <div style={st.welcomeSub}>PERFORMANCE SYSTEMS v1.0</div>
            <div style={st.divider}></div>
            <div style={st.welcomeBody}>
              This system will conduct a brief intake assessment to generate your personalized performance and nutrition plan. All data is stored locally on your device.
            </div>
            <div style={st.classifiedNote}>NO CLOUD · NO ACCOUNTS · NO DATA COLLECTION</div>
            <button style={st.primaryBtn} onClick={advance}>INITIATE INTAKE →</button>
          </div>
        )}

        {currentStep === 'RANK' && (
          <div style={st.step}>
            <div style={st.stepTag}>STEP {step} / {STEPS.length - 3}</div>
            <div style={st.stepTitle}>SELECT RANK</div>
            <div style={st.stepSub}>Your rank determines performance standards and scoring brackets.</div>

            <div style={st.rankTrigger} onClick={() => setRankOpen((o) => !o)}>
              {profile.rank ? (
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <RankInsignia rank={profile.rank} size={36} />
                  <span style={st.rankSelected}>{profile.rank}</span>
                </div>
              ) : (
                <span style={{ color:'var(--text-muted)', fontSize:13 }}>— SELECT RANK —</span>
              )}
              <span style={{ color:'var(--text-muted)', fontSize:18 }}>{rankOpen ? '▲' : '▼'}</span>
            </div>

            {rankOpen && (
              <div style={st.rankDropdown}>
                {ALL_RANKS.map((group) => (
                  <div key={group.group}>
                    <div style={st.rankGroupLabel}>{group.group}</div>
                    {group.ranks.map((r) => (
                      <div key={r}
                        style={{ ...st.rankOption, ...(profile.rank === r ? st.rankOptionActive : {}) }}
                        onClick={() => { set('rank', r); setRankOpen(false); }}
                      >
                        <RankInsignia rank={r} size={28} />
                        <span style={st.rankOptionLabel}>{r}</span>
                        {profile.rank === r && <span style={st.rankCheck}>✓</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <button style={{ ...st.primaryBtn, opacity: profile.rank ? 1 : 0.4 }}
              onClick={() => profile.rank && advance()}>CONTINUE →</button>
          </div>
        )}

        {currentStep === 'GENDER' && (
          <div style={st.step}>
            <div style={st.stepTag}>STEP {step} / {STEPS.length - 3}</div>
            <div style={st.stepTitle}>BIOLOGICAL SEX</div>
            <div style={st.stepSub}>Used for accurate BMR and body composition calculations.</div>
            <div style={st.genderRow}>
              {[
                { val:'M', label:'MALE', icon:(
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="10" cy="14" r="6"/><line x1="14.5" y1="9.5" x2="21" y2="3"/><polyline points="17 3 21 3 21 7"/>
                  </svg>
                )},
                { val:'F', label:'FEMALE', icon:(
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="6"/><line x1="12" y1="14" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/>
                  </svg>
                )},
              ].map((g) => (
                <button key={g.val}
                  style={{ ...st.genderCard, ...(profile.gender === g.val ? st.genderCardActive : {}) }}
                  onClick={() => { set('gender', g.val); setTimeout(advance, 250); }}
                >
                  <span style={{ color: profile.gender === g.val ? 'var(--accent)' : 'var(--text-muted)' }}>{g.icon}</span>
                  <span style={st.genderLabel}>{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'AGE' && (
          <div style={st.step}>
            <div style={st.stepTag}>STEP {step} / {STEPS.length - 3}</div>
            <div style={st.stepTitle}>AGE</div>
            <div style={st.stepSub}>Used to calculate basal metabolic rate and ACFT age brackets.</div>
            <div style={st.bigInputWrap}>
              <input style={st.bigInput} type="number" inputMode="numeric" placeholder="25" min="17" max="65"
                value={profile.age} onChange={(e) => set('age', e.target.value)} />
              <span style={st.bigInputUnit}>YRS</span>
            </div>
            <button style={{ ...st.primaryBtn, opacity: profile.age ? 1 : 0.4 }}
              onClick={() => profile.age && advance()}>CONTINUE →</button>
          </div>
        )}

        {currentStep === 'HEIGHT' && (
          <div style={st.step}>
            <div style={st.stepTag}>STEP {step} / {STEPS.length - 3}</div>
            <div style={st.stepTitle}>HEIGHT</div>
            <div style={st.stepSub}>Used for BMR calculations and body composition estimates.</div>
            <div style={st.heightRow}>
              <div style={st.heightField}>
                <input style={st.bigInput} type="number" inputMode="numeric" placeholder="5" min="3" max="7"
                  value={profile.heightFt} onChange={(e) => set('heightFt', e.target.value)} />
                <span style={st.bigInputUnit}>FT</span>
              </div>
              <div style={st.heightField}>
                <input style={st.bigInput} type="number" inputMode="numeric" placeholder="5" min="0" max="11"
                  value={profile.heightIn} onChange={(e) => set('heightIn', e.target.value)} />
                <span style={st.bigInputUnit}>IN</span>
              </div>
            </div>
            <button style={{ ...st.primaryBtn, opacity: (profile.heightFt && profile.heightIn !== '') ? 1 : 0.4 }}
              onClick={() => (profile.heightFt && profile.heightIn !== '') && advance()}>CONTINUE →</button>
          </div>
        )}

        {currentStep === 'WEIGHT' && (
          <div style={st.step}>
            <div style={st.stepTag}>STEP {step} / {STEPS.length - 3}</div>
            <div style={st.stepTitle}>CURRENT WEIGHT</div>
            <div style={st.stepSub}>Your current body weight in pounds.</div>
            <div style={st.bigInputWrap}>
              <input style={st.bigInput} type="number" inputMode="decimal" placeholder="165" min="80" max="400"
                value={profile.weight} onChange={(e) => set('weight', e.target.value)} />
              <span style={st.bigInputUnit}>LBS</span>
            </div>
            <button style={{ ...st.primaryBtn, opacity: profile.weight ? 1 : 0.4 }}
              onClick={() => profile.weight && advance()}>CONTINUE →</button>
          </div>
        )}

        {currentStep === 'WAIST' && (
          <div style={st.step}>
            <div style={st.stepTag}>STEP {step} / {STEPS.length - 3}</div>
            <div style={st.stepTitle}>WAIST</div>
            <div style={st.stepSub}>Measured at the navel, exhaled. Required for the AR 600-9 body fat calculation. Tap Skip if you don't have a tape — the estimate will be less accurate.</div>
            <div style={st.bigInputWrap}>
              <input style={st.bigInput} type="number" inputMode="decimal" placeholder="30" min="20" max="70" step="0.5"
                value={profile.waist} onChange={(e) => set('waist', e.target.value)} />
              <span style={st.bigInputUnit}>IN</span>
            </div>
            <button style={st.primaryBtn} onClick={advance}>CONTINUE →</button>
            <button style={st.skipBtn} onClick={() => { set('waist', ''); set('neck', ''); set('hip', ''); skipToActivity(); }}>SKIP TAPE TEST</button>
          </div>
        )}

        {currentStep === 'NECK' && (
          <div style={st.step}>
            <div style={st.stepTag}>STEP {step} / {STEPS.length - 3}</div>
            <div style={st.stepTitle}>NECK</div>
            <div style={st.stepSub}>Measured just below the larynx (Adam's apple), tape level around the neck. Pairs with waist for the Army's official body fat formula.</div>
            <div style={st.bigInputWrap}>
              <input style={st.bigInput} type="number" inputMode="decimal" placeholder="15" min="10" max="25" step="0.25"
                value={profile.neck} onChange={(e) => set('neck', e.target.value)} />
              <span style={st.bigInputUnit}>IN</span>
            </div>
            <button style={{ ...st.primaryBtn, opacity: profile.neck ? 1 : 0.4 }}
              onClick={() => profile.neck && advance()}>CONTINUE →</button>
            <button style={st.skipBtn} onClick={() => { set('neck', ''); advance(); }}>SKIP</button>
          </div>
        )}

        {currentStep === 'HIP' && (
          <div style={st.step}>
            <div style={st.stepTag}>STEP {step} / {STEPS.length - 3}</div>
            <div style={st.stepTitle}>HIP</div>
            <div style={st.stepSub}>Measured at the widest point of the hips, tape level. Female AR 600-9 formula needs this in addition to waist + neck.</div>
            <div style={st.bigInputWrap}>
              <input style={st.bigInput} type="number" inputMode="decimal" placeholder="38" min="25" max="70" step="0.5"
                value={profile.hip} onChange={(e) => set('hip', e.target.value)} />
              <span style={st.bigInputUnit}>IN</span>
            </div>
            <button style={{ ...st.primaryBtn, opacity: profile.hip ? 1 : 0.4 }}
              onClick={() => profile.hip && advance()}>CONTINUE →</button>
            <button style={st.skipBtn} onClick={() => { set('hip', ''); advance(); }}>SKIP</button>
          </div>
        )}

        {currentStep === 'ACTIVITY' && (
          <div style={st.step}>
            <div style={st.stepTag}>STEP {step} / {STEPS.length - 3}</div>
            <div style={st.stepTitle}>ACTIVITY LEVEL</div>
            <div style={st.stepSub}>Select your current typical weekly activity level.</div>
            <div style={st.activityList}>
              {ACTIVITY_LEVELS.map((a) => (
                <button key={a.id}
                  style={{ ...st.activityBtn, ...(profile.activityLevel === a.id ? st.activityBtnActive : {}) }}
                  onClick={() => { set('activityLevel', a.id); setTimeout(advance, 250); }}
                >
                  <div style={st.activityLabel}>{a.label}</div>
                  <div style={st.activitySub}>{a.sub}</div>
                  {profile.activityLevel === a.id && <span style={st.activityCheck}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'GENERATING' && (
          <div style={st.step}>
            <div style={st.generatingWrap}>
              <div style={st.generatingTitle}>ANALYZING PROFILE</div>
              <div style={st.generatingBars}>
                {['MIFFLIN-ST JEOR','HARRIS-BENEDICT','KATCH-MCARDLE','BODY COMPOSITION','GENERATING PLAN'].map((label, i) => (
                  <div key={i} style={st.genBarRow}>
                    <span style={st.genBarLabel}>{label}</span>
                    <div style={st.genBarTrack}>
                      <div style={{ ...st.genBarFill, animationDelay: `${i * 0.4}s` }}></div>
                    </div>
                    <span style={st.genBarDone}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'PLAN' && plan && (
          <div style={st.planStep}>
            <div style={st.classifiedBanner}><span style={st.classifiedText}>// MISSION BRIEF //</span></div>
            <div style={st.planHeader}>
              <div style={st.planRank}>{profile.rank}</div>
              <div style={st.planTitle}>PERFORMANCE BRIEF</div>
            </div>

            <div style={st.planCard}>
              <div style={st.planCardLabel}>
                BODY COMPOSITION ASSESSMENT
                <span style={st.bfMethodTag}>
                  {plan.bfMethod === 'army' ? '· AR 600-9' : '· EST FROM BMI'}
                </span>
              </div>
              {!plan.bfAccurate && (
                <div style={st.bfWarning}>
                  Estimate only — for an accurate read, re-run intake with waist + neck measurements.
                </div>
              )}
              <div style={st.bfRow}>
                <div style={st.bfCenter}>
                  <div style={st.bfVal}>{plan.bf}%</div>
                  <div style={st.bfLbl}>CURRENT EST. BF</div>
                </div>
                <div style={st.bfArrow}>→</div>
                <div style={st.bfCenter}>
                  <div style={{ ...st.bfVal, color:'var(--accent)' }}>{plan.targetBF}%</div>
                  <div style={st.bfLbl}>TARGET BF</div>
                </div>
              </div>
              <div style={st.bfBar}>
                <div style={{ ...st.bfBarFill, width:`${Math.min(plan.bf/50*100,100)}%`, background: plan.bf <= 13 ? 'var(--accent)' : plan.bf <= 20 ? '#8a9a4a' : plan.bf <= 25 ? '#8a7a3e' : '#8a3a3e' }}></div>
                <div style={{ ...st.bfTargetLine, left:`${13/50*100}%` }}></div>
              </div>
              <div style={st.bfStats}>
                <div style={st.bfStat}>
                  <span style={st.bfStatVal}>{plan.fatToLoseLbs > 0 ? plan.fatToLoseLbs : '0'} lbs</span>
                  <span style={st.bfStatLbl}>FAT TO LOSE</span>
                </div>
                <div style={st.bfStat}>
                  <span style={st.bfStatVal}>{plan.targetWeightLbs} lbs</span>
                  <span style={st.bfStatLbl}>TARGET WEIGHT</span>
                </div>
                <div style={st.bfStat}>
                  <span style={st.bfStatVal}>{plan.alreadyLean ? 'AT TARGET' : plan.weeksToGoal > 0 ? `~${plan.weeksToGoal}wk` : 'ON TARGET'}</span>
                  <span style={st.bfStatLbl}>ETA</span>
                </div>
              </div>
            </div>

            <div style={st.planCard}>
              <div style={st.planCardLabel}>DAILY NUTRITION · {plan.alreadyLean ? 'MAINTAIN' : 'FAT LOSS'}</div>
              <div style={st.nutritionGrid}>
                <div style={st.nutriBox}>
                  <div style={st.nutriVal}>{plan.goalCals}</div>
                  <div style={st.nutriUnit}>KCAL</div>
                  <div style={st.nutriLbl}>{plan.alreadyLean ? 'MAINTENANCE' : 'CUT'}</div>
                </div>
                <div style={st.nutriBox}>
                  <div style={st.nutriVal}>{plan.protein}g</div>
                  <div style={st.nutriUnit}>PROTEIN</div>
                  <div style={st.nutriLbl}>{plan.protein * 4} KCAL</div>
                </div>
                <div style={st.nutriBox}>
                  <div style={st.nutriVal}>{plan.carbs}g</div>
                  <div style={st.nutriUnit}>CARBS</div>
                  <div style={st.nutriLbl}>{plan.carbs * 4} KCAL</div>
                </div>
                <div style={st.nutriBox}>
                  <div style={st.nutriVal}>{plan.fat}g</div>
                  <div style={st.nutriUnit}>FAT</div>
                  <div style={st.nutriLbl}>{plan.fat * 9} KCAL</div>
                </div>
              </div>
              {!plan.alreadyLean && (
                <div style={st.calorieOptions}>
                  <div style={st.calOpt}>
                    <span style={st.calOptVal}>{plan.maintenanceCals.toLocaleString()}</span>
                    <span style={st.calOptLbl}>MAINTAIN</span>
                  </div>
                  <div style={{ ...st.calOpt, background:'rgba(122,140,66,0.12)', borderColor:'var(--accent)' }}>
                    <span style={{ ...st.calOptVal, color:'var(--accent)' }}>{plan.fatLossCals.toLocaleString()}</span>
                    <span style={st.calOptLbl}>CUT (-500)</span>
                  </div>
                  <div style={st.calOpt}>
                    <span style={st.calOptVal}>{plan.aggressiveCals.toLocaleString()}</span>
                    <span style={st.calOptLbl}>AGGRESSIVE (-750)</span>
                  </div>
                </div>
              )}
              <div style={st.maintenanceNote}>
                BMR {plan.bmr.toLocaleString()} kcal · TDEE {plan.tdee.toLocaleString()} kcal · LBM {plan.leanMassLbs} lbs
              </div>
            </div>

            <div style={st.planCard}>
              <div style={st.planCardLabel}>WEEKLY TRAINING TARGET</div>
              <div style={st.trainingRow}>
                <div style={st.trainingItem}>
                  <span style={st.trainingVal}>{plan.weeklyMiles}</span>
                  <span style={st.trainingUnit}>MI/WK</span>
                </div>
                <div style={st.trainingItem}>
                  <span style={st.trainingVal}>{plan.waterOz}</span>
                  <span style={st.trainingUnit}>OZ H₂O</span>
                </div>
                <div style={st.trainingItem}>
                  <span style={st.trainingVal}>7–9</span>
                  <span style={st.trainingUnit}>HRS SLEEP</span>
                </div>
              </div>
            </div>

            <button style={st.primaryBtn} onClick={finish}>ACCEPT MISSION →</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes endureFillBar { 0% { width: 0%; } 100% { width: 100%; } }
      `}</style>
    </div>
  );
}

const st = {
  root: { position:'absolute', inset:0, background:'var(--bg)', display:'flex', flexDirection:'column', zIndex:100, overflow:'hidden' },
  scanlines: { position:'absolute', inset:0, pointerEvents:'none', zIndex:1, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)' },
  progressBar: { position:'absolute', top:0, left:0, right:0, height:2, background:'var(--surface-2)', zIndex:10 },
  progressFill: { height:'100%', background:'var(--accent)', transition:'width 0.4s ease' },
  backBtn: { position:'absolute', top:16, left:16, zIndex:10, background:'none', border:'none', color:'var(--text-muted)', fontSize:10, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:700 },
  content: { flex:1, display:'flex', flexDirection:'column', overflowY:'auto', position:'relative', zIndex:2 },
  step: { flex:1, display:'flex', flexDirection:'column', padding:'48px 24px 24px', justifyContent:'center' },
  planStep: { flex:1, padding:'16px 16px 24px', overflowY:'auto' },

  classifiedBanner: { textAlign:'center', marginBottom:20 },
  classifiedText: { fontSize:9, letterSpacing:'0.2em', color:'var(--accent)', fontWeight:700, opacity:0.7 },
  logo: { display:'flex', justifyContent:'center', marginBottom:16 },
  welcomeTitle: { fontFamily:'var(--font-head)', fontSize:42, letterSpacing:'0.2em', color:'var(--text)', fontWeight:800, textAlign:'center' },
  welcomeSub: { fontSize:10, letterSpacing:'0.14em', color:'var(--text-muted)', textAlign:'center', marginTop:4, marginBottom:20 },
  divider: { height:1, background:'var(--border)', margin:'0 0 20px' },
  welcomeBody: { fontSize:13, color:'var(--text-dim)', lineHeight:1.7, textAlign:'center', marginBottom:16 },
  classifiedNote: { fontSize:9, letterSpacing:'0.12em', color:'var(--text-muted)', textAlign:'center', marginBottom:28, opacity:0.6 },

  stepTag: { fontSize:9, letterSpacing:'0.14em', color:'var(--accent)', marginBottom:10, fontWeight:700 },
  stepTitle: { fontFamily:'var(--font-head)', fontSize:30, letterSpacing:'0.1em', color:'var(--text)', fontWeight:800, marginBottom:6 },
  stepSub: { fontSize:12, color:'var(--text-muted)', lineHeight:1.5, marginBottom:28 },

  rankTrigger: { display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:'12px 14px', cursor:'pointer', marginBottom:12, minHeight:56 },
  rankSelected: { fontFamily:'var(--font-head)', fontSize:20, color:'var(--text)', fontWeight:700, letterSpacing:'0.08em' },
  rankDropdown: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, maxHeight:280, overflowY:'auto', marginBottom:16 },
  rankGroupLabel: { padding:'8px 12px 4px', fontSize:9, letterSpacing:'0.14em', color:'var(--text-muted)', fontWeight:700, background:'var(--surface-2)', borderBottom:'1px solid var(--border)' },
  rankOption: { display:'flex', alignItems:'center', gap:10, padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid var(--border-subtle)', transition:'background 0.1s' },
  rankOptionActive: { background:'rgba(122,140,66,0.1)' },
  rankOptionLabel: { fontSize:13, fontWeight:700, letterSpacing:'0.06em', color:'var(--text)', flex:1 },
  rankCheck: { color:'var(--accent)', fontSize:14 },

  genderRow: { display:'flex', gap:14, marginBottom:24 },
  genderCard: { flex:1, height:120, background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.15s' },
  genderCardActive: { background:'rgba(122,140,66,0.1)', borderColor:'var(--accent)' },
  genderLabel: { fontSize:13, fontWeight:700, letterSpacing:'0.1em', color:'var(--text)' },

  bigInputWrap: { display:'flex', alignItems:'baseline', gap:10, marginBottom:28 },
  bigInput: { flex:1, height:72, background:'var(--surface-1)', border:'1px solid var(--border)', color:'var(--text)', fontSize:40, padding:'0 16px', borderRadius:4, fontFamily:'var(--font-head)', fontWeight:800, outline:'none', boxSizing:'border-box', textAlign:'center' },
  bigInputUnit: { fontSize:14, color:'var(--text-muted)', letterSpacing:'0.1em', fontWeight:700, width:36 },
  heightRow: { display:'flex', gap:12, marginBottom:28 },
  heightField: { flex:1, display:'flex', alignItems:'baseline', gap:8 },

  activityList: { display:'flex', flexDirection:'column', gap:8, marginBottom:8 },
  activityBtn: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:'12px 14px', cursor:'pointer', textAlign:'left', position:'relative', transition:'all 0.15s' },
  activityBtnActive: { background:'rgba(122,140,66,0.1)', borderColor:'var(--accent)' },
  activityLabel: { fontSize:13, fontWeight:700, letterSpacing:'0.08em', color:'var(--text)', marginBottom:2 },
  activitySub: { fontSize:10, color:'var(--text-muted)' },
  activityCheck: { position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'var(--accent)', fontSize:16 },

  primaryBtn: { width:'100%', height:52, background:'var(--accent)', border:'none', color:'var(--bg)', fontFamily:'var(--font-head)', fontSize:14, letterSpacing:'0.14em', cursor:'pointer', borderRadius:3, fontWeight:800, marginTop:8, transition:'opacity 0.2s' },
  skipBtn: { width:'100%', height:40, background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', fontFamily:'var(--font-head)', fontSize:11, letterSpacing:'0.1em', cursor:'pointer', borderRadius:3, fontWeight:700, marginTop:8 },

  generatingWrap: { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 8px' },
  generatingTitle: { fontFamily:'var(--font-head)', fontSize:18, letterSpacing:'0.16em', color:'var(--accent)', marginBottom:32, textAlign:'center' },
  generatingBars: { display:'flex', flexDirection:'column', gap:16 },
  genBarRow: { display:'flex', alignItems:'center', gap:10 },
  genBarLabel: { fontSize:9, letterSpacing:'0.1em', color:'var(--text-muted)', width:130, flexShrink:0 },
  genBarTrack: { flex:1, height:3, background:'var(--surface-2)', borderRadius:2, overflow:'hidden' },
  genBarFill: { height:'100%', background:'var(--accent)', borderRadius:2, width:0, animation:'endureFillBar 0.5s ease forwards' },
  genBarDone: { fontSize:10, color:'var(--accent)', width:14 },

  planHeader: { textAlign:'center', paddingTop:8, marginBottom:14 },
  planRank: { fontFamily:'var(--font-head)', fontSize:13, color:'var(--accent)', letterSpacing:'0.14em', fontWeight:700 },
  planTitle: { fontFamily:'var(--font-head)', fontSize:22, color:'var(--text)', fontWeight:800, letterSpacing:'0.1em' },
  planCard: { background:'var(--surface-1)', border:'1px solid var(--border)', borderRadius:4, padding:'12px 14px', marginBottom:10 },
  planCardLabel: { fontSize:9, letterSpacing:'0.14em', color:'var(--text-muted)', fontWeight:700, marginBottom:10 },
  bfMethodTag: { fontSize:8, color:'var(--accent)', marginLeft:8, fontWeight:600, letterSpacing:'0.1em' },
  bfWarning: { background:'rgba(180,140,40,0.12)', border:'1px solid rgba(180,140,40,0.3)', color:'#d4ad6a', fontSize:10, padding:'6px 10px', borderRadius:3, marginBottom:10, lineHeight:1.4 },
  calorieOptions: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginTop:10, marginBottom:8 },
  calOpt: { background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:3, padding:'6px 4px', textAlign:'center' },
  calOptVal: { display:'block', fontFamily:'var(--font-head)', fontSize:14, color:'var(--text-dim)', fontWeight:700, lineHeight:1 },
  calOptLbl: { fontSize:7, color:'var(--text-muted)', letterSpacing:'0.08em', marginTop:3, display:'block' },

  bfRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginBottom:12 },
  bfCenter: { textAlign:'center' },
  bfVal: { fontFamily:'var(--font-head)', fontSize:32, color:'var(--text)', fontWeight:800, lineHeight:1 },
  bfLbl: { fontSize:8, color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:3 },
  bfArrow: { fontSize:18, color:'var(--text-muted)' },
  bfBar: { height:6, background:'var(--surface-2)', borderRadius:3, marginBottom:10, position:'relative', overflow:'visible' },
  bfBarFill: { height:'100%', borderRadius:3, transition:'width 0.5s ease' },
  bfTargetLine: { position:'absolute', top:-2, bottom:-2, width:2, background:'var(--accent)', borderRadius:1 },
  bfStats: { display:'flex', gap:0 },
  bfStat: { flex:1, textAlign:'center' },
  bfStatVal: { display:'block', fontFamily:'var(--font-head)', fontSize:16, color:'var(--text)', fontWeight:700 },
  bfStatLbl: { fontSize:8, color:'var(--text-muted)', letterSpacing:'0.08em' },

  nutritionGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, marginBottom:8 },
  nutriBox: { background:'var(--surface-2)', borderRadius:3, padding:'8px 4px', textAlign:'center' },
  nutriVal: { fontFamily:'var(--font-head)', fontSize:18, color:'var(--text)', fontWeight:700, lineHeight:1 },
  nutriUnit: { fontSize:8, color:'var(--accent)', letterSpacing:'0.08em', marginTop:2 },
  nutriLbl: { fontSize:7, color:'var(--text-muted)', letterSpacing:'0.06em', marginTop:2 },
  maintenanceNote: { fontSize:9, color:'var(--text-muted)', textAlign:'center', letterSpacing:'0.04em' },

  trainingRow: { display:'flex', gap:0 },
  trainingItem: { flex:1, textAlign:'center' },
  trainingVal: { fontFamily:'var(--font-head)', fontSize:26, color:'var(--text)', fontWeight:800, display:'block', lineHeight:1 },
  trainingUnit: { fontSize:8, color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:3, display:'block' },
};
