import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';

// Latest-position auto-pan, throttled to once every 5s.
// Per-point panning is jittery and feels nervous on slow GPS fixes.
function AutoPan({ lastPoint }) {
  const map = useMap();
  useEffect(() => {
    if (!lastPoint) return;
    const id = setInterval(() => {
      map.panTo([lastPoint.lat, lastPoint.lng], { animate: true, duration: 0.5 });
    }, 5000);
    // Also pan immediately on first fix.
    map.panTo([lastPoint.lat, lastPoint.lng], { animate: true, duration: 0.5 });
    return () => clearInterval(id);
  }, [map, lastPoint]);
  return null;
}

export default function MapView({ points, lastPoint, height = 240 }) {
  // Don't render the map until we have at least one fix — otherwise we'd
  // need a default center that's just confusing (null island, anyone?).
  if (!lastPoint) {
    return (
      <div style={{
        height, background: '#1a1c10', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.1em',
      }}>
        ACQUIRING GPS…
      </div>
    );
  }

  const center = [lastPoint.lat, lastPoint.lng];
  const path = points.map(p => [p.lat, p.lng]);

  return (
    <div style={{ height, position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={16}
        zoomControl={false}
        attributionControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* CARTO Dark Matter — true dark basemap, OSM data, free + no API key.   */}
        {/* Pinned to subdomain "a" so cache keys match between live + offline    */}
        {/* prefetch (Leaflet's default randomised subdomains break cache hits).  */}
        <TileLayer
          url="https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={20}
        />
        {path.length > 1 && (
          <Polyline positions={path} pathOptions={{ color: '#7a8c42', weight: 4, lineCap: 'round', lineJoin: 'round' }} />
        )}
        <CircleMarker
          center={center}
          radius={6}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#7a8c42', fillOpacity: 1 }}
        />
        <AutoPan lastPoint={lastPoint} />
      </MapContainer>
    </div>
  );
}
