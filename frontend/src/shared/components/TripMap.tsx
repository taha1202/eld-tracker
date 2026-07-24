import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Box from '@mui/material/Box';
import { colors } from '../../theme/palette';

export type MapWaypoint = {
  label: string;
  lat: number;
  lon: number;
  type?: 'current' | 'pickup' | 'dropoff' | 'fuel' | 'rest_break' | 'sleeper_berth' | 'restart';
};

type Props = {
  routeGeometry?: { type?: string; coordinates?: [number, number][] } | [number, number][] | null;
  waypoints?: MapWaypoint[];
  height?: number | string;
};

const STOP_COLOR: Record<string, string> = {
  current: colors.navy,
  pickup: colors.blue,
  dropoff: colors.navy,
  fuel: colors.amber700,
  rest_break: colors.textTertiary,
  sleeper_berth: colors.indigo,
  restart: colors.red,
};

// Helper component to auto-fit bounds when route or waypoints change
function BoundsFitter({ latLngs, waypoints }: { latLngs: [number, number][], waypoints: MapWaypoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    const bounds = L.latLngBounds([]);
    latLngs.forEach(pt => bounds.extend(pt));
    waypoints.forEach(wp => bounds.extend([wp.lat, wp.lon]));

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, latLngs, waypoints]);

  return null;
}

export default function TripMap({ routeGeometry, waypoints = [], height = '100%' }: Props) {
  let rawCoords: [number, number][] = [];
  if (Array.isArray(routeGeometry)) {
    rawCoords = routeGeometry;
  } else if (routeGeometry?.coordinates && Array.isArray(routeGeometry.coordinates)) {
    rawCoords = routeGeometry.coordinates;
  }
  
  // GeoJSON is [lon, lat], Leaflet polyline takes [lat, lon]
  const latLngs: [number, number][] = rawCoords.map((pt) => [pt[1], pt[0]]);

const US_BOUNDS = L.latLngBounds([24.396308, -125.000000], [49.384358, -66.934570]);

  return (
    <Box sx={{ width: '100%', height, position: 'relative', borderRadius: 'inherit', overflow: 'hidden' }}>
      <MapContainer 
        center={[39.8283, -98.5795]} 
        zoom={4} 
        minZoom={4}
        maxBounds={US_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        
        {waypoints.map((wp, i) => {
          if (typeof wp.lat !== 'number' || typeof wp.lon !== 'number' || isNaN(wp.lat) || isNaN(wp.lon)) return null;
          const color = STOP_COLOR[wp.type ?? 'current'] ?? colors.textTertiary;
          return (
            <CircleMarker
              key={`${wp.type}-${i}`}
              center={[wp.lat, wp.lon]}
              radius={6}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1.5 }}
            >
              <Tooltip direction="top">{wp.label}</Tooltip>
            </CircleMarker>
          );
        })}

        {latLngs.length > 0 && (
          <Polyline 
            positions={latLngs} 
            pathOptions={{ color: colors.blue, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }} 
          />
        )}

        <BoundsFitter latLngs={latLngs} waypoints={waypoints} />
      </MapContainer>
    </Box>
  );
}
