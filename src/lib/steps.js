import { useEffect, useRef, useState } from 'react';

// Average stride lengths (meters per step). Generic defaults — soldiers can
// fine-tune via a calibration walk later if we need that level of accuracy.
const DEFAULT_STRIDE_M = { Walk: 0.75, Ruck: 0.70, Run: 1.10, Cardio: 0.80 };

// iOS 13+ requires an explicit user-gesture-triggered permission grant before
// devicemotion events will fire. Call this from a click handler — it returns
// 'granted' | 'denied' | 'unsupported' | 'not-required'.
export async function requestMotionPermission() {
  if (typeof DeviceMotionEvent === 'undefined') return 'unsupported';
  if (typeof DeviceMotionEvent.requestPermission !== 'function') return 'not-required';
  try {
    const result = await DeviceMotionEvent.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Step counter via DeviceMotion peak detection.
 *
 * Algorithm: monitor accelerationIncludingGravity magnitude. When it crosses
 * a per-activity threshold from below to above (a "step impact"), increment.
 * Debounce by ~250 ms to reject double-counts within a single foot strike.
 *
 * Caveats: accelerometer events are also suspended when iOS backgrounds the
 * page, so this is a fallback for *foreground GPS dropouts* (indoor running,
 * dense canopy, urban canyons), not a way to track in your pocket while
 * locked. Native is the only path for the latter.
 */
export function useStepCounter({ active, activityType = 'Walk' }) {
  const [steps, setSteps] = useState(0);
  const [permission, setPermission] = useState('unknown');

  const aboveThresholdRef = useRef(false);
  const lastStepTimeRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    if (typeof DeviceMotionEvent === 'undefined') {
      setPermission('unsupported');
      return;
    }

    // Activity-tuned threshold — running impacts are bigger than walking.
    const THRESHOLD = activityType === 'Run' ? 14.5 : 12.5; // m/s²
    const HYSTERESIS = 1.5;
    const MIN_INTERVAL_MS = activityType === 'Run' ? 200 : 280;

    const onMotion = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      const now = e.timeStamp || Date.now();

      if (mag > THRESHOLD && !aboveThresholdRef.current) {
        if (now - lastStepTimeRef.current > MIN_INTERVAL_MS) {
          setSteps((s) => s + 1);
          lastStepTimeRef.current = now;
        }
        aboveThresholdRef.current = true;
      } else if (mag < THRESHOLD - HYSTERESIS) {
        aboveThresholdRef.current = false;
      }
    };

    // If we're on iOS and permission was never requested via the start
    // button (e.g. user hot-reloaded), the addEventListener silently fails.
    // We can't request permission here without a user gesture, so just
    // attach and hope it was granted earlier.
    window.addEventListener('devicemotion', onMotion);
    setPermission('granted');
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [active, activityType]);

  const stride = DEFAULT_STRIDE_M[activityType] ?? 0.75;
  const distanceM = steps * stride;

  return { steps, distanceM, permission };
}
