import { useEffect, useState } from 'react';
import { loadData, saveData as persist, SEED } from './lib/storage.js';
import { isProfileComplete, planToGoals } from './lib/bodyComp.js';
import NavBar from './components/Nav.jsx';
import Dashboard from './components/Dashboard.jsx';
import Cardio from './components/Cardio.jsx';
import ACFT from './components/ACFT.jsx';
import Nutrition from './components/Nutrition.jsx';
import Log from './components/Log.jsx';
import Profile from './components/Profile.jsx';
import More from './components/More.jsx';
import Onboarding from './components/Onboarding.jsx';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState(loadData);
  const [reonboarding, setReonboarding] = useState(false);

  // Persist on every change. localStorage writes are synchronous & cheap.
  useEffect(() => { persist(data); }, [data]);

  const saveData = (next) => setData(next);

  const completeOnboarding = ({ profile, plan }) => {
    const next = {
      ...data,
      profile: { ...data.profile, ...profile },
      plan,
      nutritionGoals: planToGoals(plan),
      waterGoal: plan.waterOz,
    };
    // Seed an initial weight entry so the Dashboard trend has something to draw.
    const weightLbs = parseFloat(profile.weight);
    if (weightLbs && (!data.weights || data.weights.length === 0)) {
      next.weights = [{ id: Date.now(), date: new Date().toISOString(), weight: weightLbs }];
    }
    setData(next);
    setReonboarding(false);
    setTab('dashboard');
  };

  const showOnboarding = !isProfileComplete(data.profile) || reonboarding;
  if (showOnboarding) {
    return <Onboarding existingProfile={data.profile} onComplete={completeOnboarding} />;
  }

  let screen;
  switch (tab) {
    case 'cardio':    screen = <Cardio    data={data} saveData={saveData} setScreen={setTab} />; break;
    case 'acft':      screen = <ACFT      data={data} saveData={saveData} />; break;
    case 'nutrition': screen = <Nutrition data={data} saveData={saveData} />; break;
    case 'log':       screen = <Log       data={data} saveData={saveData} />; break;
    case 'profile':   screen = <Profile   data={data} saveData={saveData} onReonboard={() => setReonboarding(true)} />; break;
    case 'more':      screen = <More      data={data} saveData={saveData} setTab={setTab} onResetComplete={() => { setData(SEED); setTab('dashboard'); }} />; break;
    default:          screen = <Dashboard data={data} setScreen={setTab} />; break;
  }

  return (
    <div id="phone-shell">
      <div id="app-root">{screen}</div>
      <NavBar active={tab === 'profile' ? 'more' : tab} setActive={setTab} />
    </div>
  );
}
