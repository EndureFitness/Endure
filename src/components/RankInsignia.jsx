// US Army rank insignia rendered as inline SVG. Themed to the app's accent
// (`var(--accent)`); officer ranks keep their gold/silver to match real life.
export default function RankInsignia({ rank, size = 32 }) {
  const s = size;
  const col = 'var(--accent)';
  const dim = 'var(--text-muted)';

  const insignia = {
    PVT: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <circle cx="16" cy="16" r="4" fill={dim} opacity="0.4"/>
      </svg>
    ),
    PV2: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <polygon points="16,8 20,16 16,14 12,16" fill={col}/>
      </svg>
    ),
    PFC: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <polygon points="16,7 20,15 16,13 12,15" fill={col}/>
        <polygon points="16,14 20,22 16,20 12,22" fill={col} opacity="0.5"/>
      </svg>
    ),
    SPC: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M16 8 L19 14 L26 14 L20.5 18 L22.5 24 L16 20.5 L9.5 24 L11.5 18 L6 14 L13 14 Z" fill={col} opacity="0.85"/>
      </svg>
    ),
    CPL: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M6 14 Q16 8 26 14" stroke={col} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M6 19 Q16 13 26 19" stroke={col} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    SGT: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M6 12 Q16 6 26 12" stroke={col} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M6 17 Q16 11 26 17" stroke={col} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M6 22 Q16 16 26 22" stroke={col} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    SSG: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M6 11 Q16 5 26 11" stroke={col} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M6 16 Q16 10 26 16" stroke={col} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M6 21 Q16 15 26 21" stroke={col} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <rect x="12" y="23" width="8" height="4" rx="1" fill={col} opacity="0.7"/>
      </svg>
    ),
    SFC: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M6 10 Q16 4 26 10" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 14.5 Q16 8.5 26 14.5" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 19 Q16 13 26 19" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <rect x="11" y="21" width="10" height="5" rx="1" fill={col} opacity="0.7"/>
        <circle cx="16" cy="8.5" r="1.5" fill={col}/>
      </svg>
    ),
    MSG: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M6 9 Q16 3 26 9" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 13 Q16 7 26 13" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 17 Q16 11 26 17" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <rect x="11" y="19" width="10" height="4" rx="1" fill={col} opacity="0.7"/>
        <path d="M16 24 L13 27 L16 26 L19 27 Z" fill={col}/>
      </svg>
    ),
    '1SG': (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M6 9 Q16 3 26 9" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 13 Q16 7 26 13" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 17 Q16 11 26 17" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <rect x="11" y="19" width="10" height="4" rx="1" fill={col} opacity="0.7"/>
        <path d="M16 24 L12 28 L16 27 L20 28 Z" fill={col}/>
        <circle cx="16" cy="8" r="1.5" fill="white" opacity="0.6"/>
      </svg>
    ),
    SGM: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M6 9 Q16 3 26 9" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 13 Q16 7 26 13" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 17 Q16 11 26 17" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <rect x="11" y="19" width="10" height="4" rx="1" fill={col} opacity="0.7"/>
        <path d="M16 18 L17.5 21 L21 21 L18.5 23 L19.5 26 L16 24.5 L12.5 26 L13.5 23 L11 21 L14.5 21 Z" fill="white" opacity="0.5"/>
      </svg>
    ),
    CSM: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="rgba(122,140,66,0.4)" strokeWidth="1.5"/>
        <path d="M6 9 Q16 3 26 9" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 13 Q16 7 26 13" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 17 Q16 11 26 17" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <rect x="11" y="19" width="10" height="4" rx="1" fill={col} opacity="0.7"/>
        <path d="M12 25 L16 23 L20 25" stroke={col} strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="8" r="2" fill={col}/>
      </svg>
    ),
    SMA: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="rgba(122,140,66,0.6)" strokeWidth="2"/>
        <path d="M6 9 Q16 3 26 9" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 13 Q16 7 26 13" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M6 17 Q16 11 26 17" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <rect x="11" y="19" width="10" height="4" rx="1" fill={col}/>
        <path d="M16 23 L17 25 L19 25 L17.5 26.3 L18 28 L16 27 L14 28 L14.5 26.3 L13 25 L15 25 Z" fill="gold" opacity="0.8"/>
      </svg>
    ),
    WO1: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <rect x="8" y="14" width="16" height="5" rx="1" fill={dim} opacity="0.6"/>
        <rect x="11" y="12" width="4" height="9" rx="1" fill={dim} opacity="0.4"/>
      </svg>
    ),
    CW2: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <rect x="8" y="14" width="16" height="5" rx="1" fill={col} opacity="0.7"/>
        <rect x="11" y="12" width="4" height="9" rx="1" fill={col} opacity="0.5"/>
        <rect x="17" y="12" width="4" height="9" rx="1" fill={col} opacity="0.5"/>
      </svg>
    ),
    CW3: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <rect x="7" y="15" width="18" height="4" rx="1" fill={col} opacity="0.7"/>
        <rect x="9" y="12" width="4" height="10" rx="1" fill={col} opacity="0.6"/>
        <rect x="14" y="12" width="4" height="10" rx="1" fill={col} opacity="0.6"/>
        <rect x="19" y="12" width="4" height="10" rx="1" fill={col} opacity="0.6"/>
      </svg>
    ),
    CW4: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="rgba(122,140,66,0.3)" strokeWidth="1.5"/>
        <rect x="7" y="15" width="18" height="4" rx="1" fill={col}/>
        <rect x="8" y="11" width="3.5" height="11" rx="1" fill={col} opacity="0.7"/>
        <rect x="12.5" y="11" width="3.5" height="11" rx="1" fill={col} opacity="0.7"/>
        <rect x="17" y="11" width="3.5" height="11" rx="1" fill={col} opacity="0.7"/>
        <rect x="21" y="11" width="3" height="11" rx="1" fill={col} opacity="0.7"/>
      </svg>
    ),
    CW5: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="rgba(122,140,66,0.08)" stroke="rgba(122,140,66,0.5)" strokeWidth="2"/>
        <rect x="7" y="15" width="18" height="4" rx="1" fill={col}/>
        <rect x="8" y="11" width="3" height="11" rx="1" fill={col}/>
        <rect x="12" y="11" width="3" height="11" rx="1" fill={col}/>
        <rect x="16" y="11" width="3" height="11" rx="1" fill={col}/>
        <rect x="20" y="11" width="3" height="11" rx="1" fill={col}/>
        <circle cx="16" cy="8" r="2" fill="gold" opacity="0.7"/>
      </svg>
    ),
    '2LT': (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <rect x="9" y="13" width="14" height="7" rx="1" fill="#c8a84b" opacity="0.6"/>
      </svg>
    ),
    '1LT': (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <rect x="9" y="13" width="14" height="7" rx="1" fill="#c8c8c8" opacity="0.7"/>
      </svg>
    ),
    CPT: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <rect x="8" y="13" width="6" height="7" rx="1" fill="#c8a84b" opacity="0.7"/>
        <rect x="18" y="13" width="6" height="7" rx="1" fill="#c8a84b" opacity="0.7"/>
      </svg>
    ),
    MAJ: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M16 9 L19 15 L26 15 L20.5 19 L22.5 25 L16 21.5 L9.5 25 L11.5 19 L6 15 L13 15 Z" fill="#c8a84b" opacity="0.75"/>
      </svg>
    ),
    LTC: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M16 9 L19 15 L26 15 L20.5 19 L22.5 25 L16 21.5 L9.5 25 L11.5 19 L6 15 L13 15 Z" fill="#c8c8c8" opacity="0.75"/>
      </svg>
    ),
    COL: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
        <path d="M11 11 L16 8 L21 11 L21 21 L16 24 L11 21 Z" fill="#c8a84b" opacity="0.85"/>
        <circle cx="16" cy="16" r="2.5" fill="var(--surface-2)"/>
      </svg>
    ),
    BG: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="rgba(200,168,75,0.08)" stroke="rgba(200,168,75,0.4)" strokeWidth="1.5"/>
        <path d="M16 10 L17.5 14.5 L22 14.5 L18.5 17 L20 21.5 L16 19 L12 21.5 L13.5 17 L10 14.5 L14.5 14.5 Z" fill="#c8a84b"/>
      </svg>
    ),
    MG: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="rgba(200,168,75,0.08)" stroke="rgba(200,168,75,0.5)" strokeWidth="1.5"/>
        <path d="M11 14.5 L12 11.5 L13 14.5 L16 14.5 L13.5 16 L14.5 19 L12 17.5 L9.5 19 L10.5 16 L8 14.5 Z" fill="#c8a84b" transform="translate(-2,1)"/>
        <path d="M11 14.5 L12 11.5 L13 14.5 L16 14.5 L13.5 16 L14.5 19 L12 17.5 L9.5 19 L10.5 16 L8 14.5 Z" fill="#c8a84b" transform="translate(8,1)"/>
      </svg>
    ),
    LTG: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="rgba(200,168,75,0.1)" stroke="rgba(200,168,75,0.6)" strokeWidth="2"/>
        <circle cx="9" cy="16" r="2.5" fill="#c8a84b"/>
        <circle cx="16" cy="16" r="2.5" fill="#c8a84b"/>
        <circle cx="23" cy="16" r="2.5" fill="#c8a84b"/>
      </svg>
    ),
    GEN: (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="rgba(200,168,75,0.12)" stroke="rgba(200,168,75,0.8)" strokeWidth="2"/>
        <circle cx="7" cy="16" r="2.5" fill="#c8a84b"/>
        <circle cx="12.5" cy="16" r="2.5" fill="#c8a84b"/>
        <circle cx="18" cy="16" r="2.5" fill="#c8a84b"/>
        <circle cx="23.5" cy="16" r="2.5" fill="#c8a84b"/>
      </svg>
    ),
  };

  return insignia[rank] || (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="4" width="24" height="24" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1"/>
      <text x="16" y="20" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-head)">{rank}</text>
    </svg>
  );
}
