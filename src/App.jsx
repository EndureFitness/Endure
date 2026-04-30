import { useEffect, useState } from 'react';
import { loadData, saveData as persist } from './lib/storage.js';
import NavBar from './components/Nav.jsx';
import Dashboard from './components/Dashboard.jsx';
import Cardio from './components/Cardio.jsx';
import ACFT from './components/ACFT.jsx';
import Nutrition from './components/Nutrition.jsx';
import Log from './components/Log.jsx';
import Profile from './components/Profile.jsx';
import More from './components/More.jsx';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState(loadData);

  // Persist on every change. localStorage writes are synchronous & cheap.
  useEffect(() => { persist(data); }, [data]);

  const saveData = (next) => setData(next);

  let screen;
  switch (tab) {
    case 'cardio':    screen = <Cardio    data={data} saveData={saveData} setScreen={setTab} />; break;
    case 'acft':      screen = <ACFT      data={data} saveData={saveData} />; break;
    case 'nutrition': screen = <Nutrition data={data} saveData={saveData} />; break;
    case 'log':       screen = <Log       data={data} saveData={saveData} />; break;
    case 'profile':   screen = <Profile   data={data} saveData={saveData} />; break;
    case 'more':      screen = <More      data={data} saveData={saveData} setTab={setTab} />; break;
    default:          screen = <Dashboard data={data} setScreen={setTab} />; break;
  }

  return (
    <div id="phone-shell">
      <div id="app-root">{screen}</div>
      <NavBar active={tab === 'profile' ? 'more' : tab} setActive={setTab} />
    </div>
  );
}
