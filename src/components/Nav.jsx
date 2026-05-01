// Bottom tab bar.
const NavBar = ({ active, setActive }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )},
    { id: 'cardio', label: 'Cardio', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    )},
    { id: 'acft', label: 'ACFT', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    )},
    { id: 'nutrition', label: 'Nutrition', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    )},
    { id: 'more', label: 'More', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
      </svg>
    )},
  ];

  return (
    <nav style={s.nav} aria-label="Main navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActive(tab.id)}
          aria-label={tab.label}
          aria-current={active === tab.id ? 'page' : undefined}
          style={{ ...s.tab, color: active === tab.id ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tab.icon}</span>
          <span style={s.label}>{tab.label}</span>
          {active === tab.id && <span aria-hidden="true" style={s.indicator}></span>}
        </button>
      ))}
    </nav>
  );
};

const s = {
  nav: { display: 'flex', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', height: 64, flexShrink: 0 },
  tab: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', position: 'relative', transition: 'color 0.15s', padding: 0 },
  label: { fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 600 },
  indicator: { position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: 'var(--accent)', borderRadius: '0 0 2px 2px' },
};

export default NavBar;
