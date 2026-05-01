# Endure

Privacy-first fitness tracker built for soldiers. Track rucks, runs, walks, AFT scores, nutrition, weight, hydration, and sleep — without accounts, ads, or data collection.

**Live:** https://endurefitness.github.io/Endure/

> Track. Improve. Endure.

---

## What it does

- **Cardio tracking** with real GPS, live route on a dark themed map, distance / pace / elevation captured per session. Wake Lock keeps the screen alive while you train.
- **Offline map tiles** — pre-download a 1–10 mi radius around any location so the map renders with zero signal at remote training sites or on airplane mode.
- **Step counter fallback** when GPS is unreliable (indoor track, dense canopy, signal loss). Activity-tuned peak detection, debounced to reject double-counts.
- **AFT scoring** for all five events (3RM Deadlift, Hand-Release Push-Ups, Sprint-Drag-Carry, Plank, 2-Mile Run) against FM 7-22 representative brackets. Live point preview as you enter raw scores. Standing Power Throw was retired in the 2025 ACFT → AFT update; legacy entries with SPT still render correctly in history.
- **Mission-brief intake** that generates a personalized plan in 9 steps: BMR (Mifflin-St Jeor), TDEE, calorie target, and macros for your selected goal (Cut / Maintain / Bulk).
- **AR 600-9 body comp reference** — Height-to-Abdomen Ratio is the primary indicator with the 0.55 Army standard marked. RFM body-fat estimate as a secondary informational number. Calorie math does not depend on either.
- **Nutrition log** with macro targets that match your plan, custom foods, daily date navigation, meal grouping.
- **Weight, hydration, sleep** tracking with 30-day trends and daily progress rings.
- **Activity Log** — full workout history grouped by month, filter by type, JSON export and import for backup.
- **Soldier Profile** with 28 US Army rank insignia rendered as inline SVG (PVT → GEN, including the Warrant Officer track).
- **Install as a PWA** — Add to Home Screen on iOS or Android, runs full-screen, works offline once cached.

## Privacy

All user data is stored in the browser's `localStorage` on the user's own device under the key `endure_data_v1`. Nothing is sent to any server. There are no accounts, analytics, ads, or third-party trackers.

The only outbound network calls are:

- Map tile requests to OpenStreetMap / CARTO (cached locally for 30 days by the service worker)
- Initial app shell load from GitHub Pages (cached as a PWA app shell)

To verify: install the PWA, enable airplane mode, relaunch — everything works.

## Tech stack

- **Vite 5** + **React 18**, no build-time secrets, no backend
- **Leaflet 1.9** + **react-leaflet 4.2** for maps with **CARTO Dark Matter** OSM tiles
- **vite-plugin-pwa** + **Workbox** for service worker, offline shell, tile caching
- Body comp: **AR 600-9** (post-2023, single-site Height-to-Abdomen Ratio)
- BMR: **Mifflin-St Jeor**; TDEE: BMR × activity multiplier
- ~125 KB gzipped first paint; ~800 KB precached for offline

## Local development

Requires Node 20+.

```bash
npm install
npm run dev          # → http://localhost:5173/Endure/
```

## Production build

```bash
npm run build        # outputs to dist/
npm run preview      # serves dist/ at http://localhost:4173/Endure/
```

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs `npm ci && npm run build` and publishes `dist/` to GitHub Pages. After the initial setup (Repo → Settings → Pages → Source = "GitHub Actions"), every push deploys automatically in ~90 seconds.

## Known limitations

- **GPS does not run in the background.** Browsers suspend JavaScript when the screen locks or you switch apps. This is an iOS / Android platform restriction, not a bug. Workarounds in the app: Wake Lock keeps the screen on during a session; manual entry as a fallback. The only true fix is a native app wrapper (e.g. Capacitor), which is on the roadmap.
- **iOS Safari is required** for "Add to Home Screen" on iPhone. Chrome on iOS cannot install PWAs (Apple platform limitation).
- **Body fat estimates are approximate.** RFM tends to overestimate for athletic builds; the HRS metric is the more reliable indicator and matches the Army's official tape standard.

## License

See [LICENSE](LICENSE).
