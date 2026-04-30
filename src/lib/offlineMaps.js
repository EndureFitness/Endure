// Offline map tile prefetch.
//
// Web Mercator tile math: lat/lng → tile x/y at a given integer zoom.
// We download every tile that intersects a square bounding box around a
// center point, across a range of zoom levels, and stuff them into the
// `map-tiles` Cache Storage bucket. The service worker's CacheFirst rule
// then serves them transparently on next view, even with no network.
//
// CARTO Dark Matter is free for non-commercial use with attribution. If
// Endure ever does heavy traffic, we'd want to switch to MapTiler or self-host.

const TILE_HOST = 'https://a.basemaps.cartocdn.com/dark_all'; // pinned subdomain — see MapView.jsx

const STORAGE_KEY = 'endure_offline_v1';

export function loadOfflineAreas() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

export function saveOfflineAreas(areas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(areas));
}

// Web Mercator tile coordinates for a (lat, lng) at integer zoom z.
function latLngToTile(lat, lng, z) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x, y };
}

// 1° latitude ≈ 69 mi everywhere. Longitude depends on cos(latitude).
export function boundsAround(lat, lng, miles) {
  const dLat = miles / 69;
  const dLng = miles / (69 * Math.cos((lat * Math.PI) / 180));
  return { north: lat + dLat, south: lat - dLat, east: lng + dLng, west: lng - dLng };
}

// Generate all tile URLs in a bbox across a zoom range. Z18 = ~150 m/tile,
// good for run/walk; Z14 = ~9 km/tile, good for the overview pan.
export function tileUrlsInBounds(b, minZ = 13, maxZ = 17) {
  const urls = [];
  for (let z = minZ; z <= maxZ; z++) {
    const nw = latLngToTile(b.north, b.west, z);
    const se = latLngToTile(b.south, b.east, z);
    const x0 = Math.min(nw.x, se.x);
    const x1 = Math.max(nw.x, se.x);
    const y0 = Math.min(nw.y, se.y);
    const y1 = Math.max(nw.y, se.y);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        urls.push(`${TILE_HOST}/${z}/${x}/${y}.png`);
      }
    }
  }
  return urls;
}

// Concurrent fetch + cache.put. Browsers limit ~6 connections per host, so
// we run 6 workers in parallel. Skips tiles that are already cached.
export async function downloadArea({ lat, lng, miles, minZ = 13, maxZ = 17 }, onProgress) {
  const bounds = boundsAround(lat, lng, miles);
  const urls = tileUrlsInBounds(bounds, minZ, maxZ);
  const cache = await caches.open('map-tiles');

  let done = 0;
  let bytes = 0;
  let failed = 0;
  const queue = [...urls];

  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      if (!url) break;
      try {
        const hit = await cache.match(url);
        if (hit) {
          const buf = await hit.clone().arrayBuffer();
          bytes += buf.byteLength;
        } else {
          const res = await fetch(url, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.clone().blob();
            await cache.put(url, res);
            bytes += blob.size;
          } else {
            failed++;
          }
        }
      } catch {
        failed++;
      }
      done++;
      onProgress?.(done, urls.length, bytes);
    }
  };

  await Promise.all(Array.from({ length: 6 }, worker));
  return { tiles: urls.length, succeeded: urls.length - failed, bytes };
}

export async function deleteArea(area) {
  const bounds = boundsAround(area.lat, area.lng, area.miles);
  const urls = tileUrlsInBounds(bounds, area.minZ ?? 13, area.maxZ ?? 17);
  const cache = await caches.open('map-tiles');
  await Promise.all(urls.map((u) => cache.delete(u).catch(() => {})));
}

export async function totalCachedBytes() {
  if (!('storage' in navigator) || !navigator.storage.estimate) return null;
  const est = await navigator.storage.estimate();
  return est.usage || 0;
}

export function fmtBytes(n) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}
