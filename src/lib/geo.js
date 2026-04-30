import { useEffect, useRef, useState } from 'react';

// Earth's mean radius in meters.
const R = 6_371_000;

const toRad = (deg) => (deg * Math.PI) / 180;

// Great-circle distance between two `{lat, lng}` points in meters.
export function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const M_PER_MI = 1609.344;
export const metersToMiles = (m) => m / M_PER_MI;
export const metersToKm = (m) => m / 1000;

// Speed gates (m/s) above which a sample is treated as GPS jitter.
const MAX_SPEED = { Run: 12, Walk: 4, Ruck: 6, Cardio: 12 };

/**
 * GPS tracking hook.
 *
 *   const { status, points, distanceM, elevGainM, ... } = useGeolocationTracker({
 *     active: running, activityType: 'Ruck',
 *   });
 *
 * - `points` is the cleaned route (accuracy ≤ 25m, speed within sane bounds).
 * - `distanceM` is the running Haversine total.
 * - `status` ∈ 'idle' | 'requesting' | 'tracking' | 'denied' | 'unavailable' | 'error'.
 *
 * Caller controls start/stop via the `active` prop. The watch is set up the first
 * time `active` flips true and torn down when it flips false.
 */
export function useGeolocationTracker({ active, activityType = 'Cardio' }) {
  const [status, setStatus] = useState('idle');
  const [points, setPoints] = useState([]);
  const [distanceM, setDistanceM] = useState(0);
  const [elevGainM, setElevGainM] = useState(0);
  const [lastPoint, setLastPoint] = useState(null);
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const lastPointRef = useRef(null);
  const lastAcceptedTimeRef = useRef(null);
  const lastAltRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }

    setStatus('requesting');
    setPoints([]);
    setDistanceM(0);
    setElevGainM(0);
    setLastPoint(null);
    lastPointRef.current = null;
    lastAcceptedTimeRef.current = null;
    lastAltRef.current = null;

    const onPos = (pos) => {
      const { latitude: lat, longitude: lng, accuracy, altitude, altitudeAccuracy, speed } = pos.coords;
      const t = pos.timestamp;

      // Reject low-accuracy samples (>25 m).
      if (accuracy > 25) return;

      const point = { lat, lng, accuracy, altitude, t };
      const prev = lastPointRef.current;

      if (prev) {
        const segM = haversine(prev, point);
        const dt = (t - prev.t) / 1000;
        if (dt > 0) {
          const implied = segM / dt;
          const cap = MAX_SPEED[activityType] ?? MAX_SPEED.Cardio;
          if (implied > cap * 1.5) return; // jitter spike — drop it
        }
        setDistanceM((d) => d + segM);
      }

      // Elevation gain: only count when altitudeAccuracy is reliable.
      if (altitude != null && altitudeAccuracy != null && altitudeAccuracy <= 15) {
        if (lastAltRef.current != null) {
          const dAlt = altitude - lastAltRef.current;
          if (dAlt > 0) setElevGainM((g) => g + dAlt);
        }
        lastAltRef.current = altitude;
      }

      lastPointRef.current = point;
      lastAcceptedTimeRef.current = t;
      setLastPoint(point);
      setPoints((arr) => [...arr, point]);
      if (status !== 'tracking') setStatus('tracking');
    };

    const onErr = (err) => {
      if (err.code === err.PERMISSION_DENIED) setStatus('denied');
      else setStatus('error');
      setError(err.message || 'Geolocation error');
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10_000,
    });

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // We intentionally don't depend on `status` — it's an output, not an input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, activityType]);

  return { status, points, distanceM, elevGainM, lastPoint, error };
}

/**
 * Wake Lock — keeps the screen on during a session.
 * Re-acquires the lock when the tab becomes visible again (the browser drops it
 * automatically on visibility change). Feature-detected; falls back silently.
 */
export function useWakeLock(active) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    if (!('wakeLock' in navigator)) return;

    let cancelled = false;
    const acquire = async () => {
      try {
        sentinelRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // User denied or unsupported — non-fatal.
      }
    };
    acquire();

    const onVisible = () => {
      if (!cancelled && document.visibilityState === 'visible' && !sentinelRef.current) acquire();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, [active]);
}

// Pace in min/mile or min/km, computed over the last `windowSec` seconds.
// Returns 'MM:SS' or '--:--' if not enough data.
export function paceFromPoints(points, windowSec = 60, units = 'mi') {
  if (points.length < 2) return '--:--';
  const lastT = points[points.length - 1].t;
  const cutoff = lastT - windowSec * 1000;
  const window = points.filter((p) => p.t >= cutoff);
  if (window.length < 2) return '--:--';
  const dt = (window[window.length - 1].t - window[0].t) / 1000;
  if (dt < 30) return '--:--'; // need at least 30 s of data

  let m = 0;
  for (let i = 1; i < window.length; i++) m += haversine(window[i - 1], window[i]);
  if (m < 5) return '--:--';

  const distInUnit = units === 'mi' ? metersToMiles(m) : metersToKm(m);
  const minPerUnit = (dt / 60) / distInUnit;
  if (!isFinite(minPerUnit) || minPerUnit > 60) return '--:--';
  const min = Math.floor(minPerUnit);
  const sec = Math.round((minPerUnit - min) * 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}
