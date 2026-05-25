import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Auto-fit map to show the full route ─────────────────
function MapBoundsFitter({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length >= 2) {
            const bounds = L.latLngBounds(positions) as LatLngBoundsExpression;
            map.fitBounds(bounds, { padding: [30, 30], animate: true });
        }
    }, [positions.length, map]);
    return null;
}

// ── Custom pin icons ─────────────────────────────────────
const startIcon = L.divIcon({
    className: '',
    html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

const endIcon = L.divIcon({
    className: '',
    html: `<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

// ── Component props ──────────────────────────────────────
interface TripRouteMapProps {
    departureLat: number;
    departureLon: number;
    destinationLat: number;
    destinationLon: number;
    departure: string;
    destination: string;
    height?: string;
}

type Status = 'loading' | 'ok' | 'fallback';

// ── Main component ───────────────────────────────────────
export default function TripRouteMap({
    departureLat, departureLon,
    destinationLat, destinationLon,
    departure, destination,
    height = '280px',
}: TripRouteMapProps) {
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
    const [status, setStatus] = useState<Status>('loading');

    const startPos: [number, number] = [departureLat, departureLon];
    const endPos: [number, number] = [destinationLat, destinationLon];

    useEffect(() => {
        setStatus('loading');
        setRouteCoords([]);
        setRouteInfo(null);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const url = `https://router.project-osrm.org/route/v1/driving/`
            + `${departureLon},${departureLat};${destinationLon},${destinationLat}`
            + `?overview=full&geometries=geojson`;

        fetch(url, { signal: controller.signal })
            .then(r => r.json())
            .then(data => {
                if (data.code === 'Ok' && data.routes?.[0]) {
                    const route = data.routes[0];
                    // GeoJSON = [lon, lat] → Leaflet needs [lat, lon]
                    const coords: [number, number][] = route.geometry.coordinates
                        .map(([lon, lat]: [number, number]) => [lat, lon]);
                    setRouteCoords(coords);
                    setRouteInfo({
                        distance: Math.round(route.distance / 1000),
                        duration: Math.round(route.duration / 60),
                    });
                    setStatus('ok');
                } else {
                    setStatus('fallback');
                }
            })
            .catch(() => setStatus('fallback'))
            .finally(() => clearTimeout(timeout));

        return () => { controller.abort(); clearTimeout(timeout); };
    }, [departureLat, departureLon, destinationLat, destinationLon]);

    const center: [number, number] = [
        (departureLat + destinationLat) / 2,
        (departureLon + destinationLon) / 2,
    ];

    const fitPositions = routeCoords.length > 0 ? routeCoords : [startPos, endPos];

    const formatDuration = (min: number) => {
        if (min < 60) return `${min} min`;
        const h = Math.floor(min / 60);
        const m = min % 60;
        return m > 0 ? `${h}h${m}` : `${h}h`;
    };

    return (
        <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            {/* Info bar — shown once route is fetched */}
            {routeInfo && (
                <div className="flex items-center gap-4 px-4 py-2 bg-blue-50 border-b border-blue-100">
                    <span className="text-sm font-semibold text-blue-700">
                        📏 {routeInfo.distance} km
                    </span>
                    <span className="text-sm font-semibold text-blue-700">
                        ⏱️ ~{formatDuration(routeInfo.duration)}
                    </span>
                    <span className="ml-auto text-xs text-blue-400 italic">via OpenStreetMap</span>
                </div>
            )}

            {/* Map */}
            <div style={{ height, width: '100%', position: 'relative' }}>
                {/* Loading overlay */}
                {status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-[1000] gap-3">
                        <div className="w-5 h-5 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-slate-500 font-medium">Calcul de l'itinéraire…</span>
                    </div>
                )}

                <MapContainer
                    center={center}
                    zoom={10}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    attributionControl={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Real road route */}
                    {routeCoords.length > 0 && (
                        <>
                            {/* White halo for readability */}
                            <Polyline positions={routeCoords} color="#ffffff" weight={8} opacity={0.6} />
                            <Polyline positions={routeCoords} color="#3b82f6" weight={5} opacity={0.9} />
                        </>
                    )}

                    {/* Fallback: dashed straight line */}
                    {status === 'fallback' && (
                        <Polyline
                            positions={[startPos, endPos]}
                            color="#6366f1"
                            weight={3}
                            opacity={0.7}
                            dashArray="10, 7"
                        />
                    )}

                    {/* Departure pin — green */}
                    <Marker position={startPos} icon={startIcon}>
                        <Popup>
                            <span className="font-bold text-emerald-700">📍 Départ</span><br />
                            {departure}
                        </Popup>
                    </Marker>

                    {/* Destination pin — red */}
                    <Marker position={endPos} icon={endIcon}>
                        <Popup>
                            <span className="font-bold text-red-600">🏁 Arrivée</span><br />
                            {destination}
                        </Popup>
                    </Marker>

                    <MapBoundsFitter positions={fitPositions} />
                </MapContainer>

                {/* Legend overlay */}
                <div className="absolute bottom-2 left-2 z-[999] flex items-center gap-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs shadow-sm">
                    <span className="flex items-center gap-1">
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                        {departure.split(',')[0]}
                    </span>
                    <span className="text-gray-300">→</span>
                    <span className="flex items-center gap-1">
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                        {destination.split(',')[0]}
                    </span>
                </div>
            </div>
        </div>
    );
}
