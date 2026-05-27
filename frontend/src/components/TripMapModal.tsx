import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import TripRouteMap from './TripRouteMap';
import type { Trip } from '../types';

interface TripMapModalProps {
    trip: Trip & {
        availableSeats?: number;
        driverRating?: { avg: number; count: number } | null;
    };
    onClose: () => void;
}

export default function TripMapModal({ trip, onClose }: TripMapModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const hasCoords = trip.departureLat && trip.departureLon && trip.destinationLat && trip.destinationLon;
    const available = trip.availableSeats ?? 0;

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
            hour: '2-digit', minute: '2-digit',
        });

    return (
        /* Overlay */
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            {/* Modal card */}
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
                style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white font-bold text-lg"
                        aria-label="Fermer"
                    >
                        ×
                    </button>

                    {/* Route */}
                    <div className="flex items-center gap-3 pr-8">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-emerald-300 border-2 border-white shadow-sm" />
                            <div className="w-0.5 h-6 bg-white/40" />
                            <div className="w-3 h-3 rounded-full bg-red-300 border-2 border-white shadow-sm" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div>
                                <p className="text-xs text-blue-200 uppercase tracking-wide font-semibold">Départ</p>
                                <p className="font-bold text-base leading-tight">{trip.departure}</p>
                            </div>
                            <div>
                                <p className="text-xs text-blue-200 uppercase tracking-wide font-semibold">Arrivée</p>
                                <p className="font-bold text-base leading-tight">{trip.destination}</p>
                            </div>
                        </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-3 mt-3 text-sm">
                        <span className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
                            📅 <span className="capitalize">{formatDate(trip.date)}</span>
                        </span>
                        <span className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
                            🚗 {trip.driverName}
                        </span>
                        <span className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full font-bold">
                            {trip.price === 0 ? '🎁 Gratuit' : `💶 ${trip.price} €`}
                        </span>
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold ${available > 0 ? 'bg-emerald-400/30' : 'bg-red-400/30'}`}>
                            💺 {available} place{available !== 1 ? 's' : ''} libre{available !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 overflow-hidden" style={{ minHeight: 320 }}>
                    {hasCoords ? (
                        <TripRouteMap
                            departureLat={trip.departureLat!}
                            departureLon={trip.departureLon!}
                            destinationLat={trip.destinationLat!}
                            destinationLon={trip.destinationLon!}
                            departure={trip.departure}
                            destination={trip.destination}
                            height="320px"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400 text-sm">
                            Coordonnées GPS non disponibles pour ce trajet
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Fermer
                    </button>
                    <Link
                        to={`/trips/${trip.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                        Voir le trajet complet →
                    </Link>
                </div>
            </div>
        </div>
    );
}
