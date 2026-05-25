import { MapContainer as LMapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Trip, Service } from '../types';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

type Listing = (Trip & { kind: 'trip' }) | (Service & { kind: 'service' });

interface MapContainerProps {
    items: Listing[];
    center: [number, number];
    zoom: number;
    onSelect: (item: Listing) => void;
}

export default function MapContainer({ items, center, zoom, onSelect }: MapContainerProps) {

    return (
        <LMapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '500px', width: '100%', borderRadius: '12px', zIndex: 0 }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {items.map(item => {
                let position: [number, number] | null = null;
                if (item.kind === 'trip' && item.departureLat && item.departureLon) {
                    position = [item.departureLat, item.departureLon];
                } else if (item.kind === 'service' && item.lat && item.lon) {
                    position = [item.lat, item.lon];
                }

                if (!position) return null;

                const isRequest = item.kind === 'service' && item.type === 'request';
                const emoji = item.kind === 'trip' ? '🚗' : (isRequest ? '🙋' : '💪');

                return (
                    <Marker key={item.id} position={position}>
                        <Popup>
                            <div className="text-center">
                                <div className="text-2xl mb-1">{emoji}</div>
                                <h3 className="font-bold text-sm mb-1">{item.kind === 'trip' ? `Trajet vers ${item.destination}` : item.title}</h3>
                                <p className="text-xs text-gray-500 mb-2">{item.kind === 'trip' ? `Départ: ${item.departure}` : item.description.substring(0, 50) + '...'}</p>
                                <button
                                    onClick={() => onSelect(item)}
                                    className="text-xs text-blue-600 font-bold hover:underline"
                                >
                                    Voir plus
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </LMapContainer>
    );
}
