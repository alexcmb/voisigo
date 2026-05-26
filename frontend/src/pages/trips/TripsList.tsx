import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../lib/api';
import type { Trip, Booking } from '../../types';
import StarRating from '../../components/StarRating';
import TripMapModal from '../../components/TripMapModal';
import { useToast, useConfirm } from '../../context/UIContext';

export default function TripsList() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [myBookingsMap, setMyBookingsMap] = useState<Record<string, Booking>>({});
    const [loading, setLoading] = useState(true);
    const [mapTrip, setMapTrip] = useState<(Trip & { availableSeats?: number; driverRating?: { avg: number; count: number } | null }) | null>(null);
    const toast = useToast();
    const confirm = useConfirm();

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    // ── Single fetch for trips (now enriched with availableSeats, driverRating, pendingCount) ──
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/trips`)
            .then(res => res.json())
            .then(response => {
                setTrips(response.data || []);
                setLoading(false);
            })
            .catch(() => {
                toast.error('Impossible de charger les trajets');
                setLoading(false);
            });

        // Separate fetch only for current user's bookings (requires auth)
        if (token) {
            fetch(`${API_BASE_URL}/api/bookings/my`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
                .then(r => r.json())
                .then((bookings: Booking[]) => {
                    const map: Record<string, Booking> = {};
                    bookings.forEach(b => { map[b.tripId] = b; });
                    setMyBookingsMap(map);
                })
                .catch(() => { });
        }
    }, []);

    const handleComplete = async (tripId: string) => {
        const ok = await confirm(
            'Confirmer que ce trajet est terminé ? Les passagers pourront ensuite vous noter.',
            { title: 'Valider la course', confirmLabel: 'Oui, terminer' }
        );
        if (!ok) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}/complete`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setTrips(prev => prev.map(t => t.id === tripId ? { ...t, completed: 1 } : t));
                toast.success('Trajet validé ! Les passagers peuvent maintenant vous noter.');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        }
    };

    const handleDelete = async (tripId: string) => {
        const ok = await confirm('Supprimer ce trajet définitivement ?', {
            title: 'Supprimer le trajet',
            confirmLabel: 'Supprimer',
            danger: true,
        });
        if (!ok) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setTrips(prev => prev.filter(t => t.id !== tripId));
                toast.success('Trajet supprimé');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur lors de la suppression');
            }
        } catch {
            toast.error('Erreur réseau');
        }
    };

    return (
        <Layout>
            <div className="p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-3xl font-bold text-gray-800">Trajets disponibles</h2>
                        <Link
                            to="/trips/create"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-md"
                        >
                            + Proposer un trajet
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-500 font-medium">Chargement des trajets...</p>
                        </div>
                    ) : trips.length === 0 ? (
                        <div className="bg-white p-10 rounded-xl shadow text-center">
                            <p className="text-4xl mb-3">🚗</p>
                            <p className="text-xl text-gray-600 mb-4">Aucun trajet pour le moment.</p>
                            <Link to="/trips/create" className="text-blue-600 font-bold hover:underline text-lg">
                                Soyez le premier à en proposer un !
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {trips.map(trip => {
                                const isOwner = currentUser?.id && trip.driverId === currentUser.id;
                                const myBooking = myBookingsMap[trip.id];
                                const available = trip.availableSeats ?? trip.seats;
                                const driverRating = trip.driverRating;
                                const hasPending = (trip.pendingBookingsCount ?? 0) > 0;

                                return (
                                    <div
                                        key={trip.id}
                                        className="bg-white rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow overflow-hidden"
                                    >
                                        {/* Pending badge for driver */}
                                        {isOwner && hasPending && (
                                            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
                                                <span className="text-amber-800 text-sm font-semibold">
                                                    ⏳ {trip.pendingBookingsCount} demande{(trip.pendingBookingsCount ?? 0) > 1 ? 's' : ''} en attente
                                                </span>
                                                <Link
                                                    to={`/trips/${trip.id}`}
                                                    className="text-xs text-amber-700 font-bold hover:underline"
                                                >
                                                    Gérer →
                                                </Link>
                                            </div>
                                        )}

                                        <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                                            {/* Left: trip info */}
                                            <div className="flex-1">
                                                <div className="text-base font-bold text-gray-700 mb-1">
                                                    📅 {new Date(trip.date).toLocaleString('fr-FR', {
                                                        weekday: 'long', day: 'numeric', month: 'long',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                                <div className="text-gray-700 text-lg mb-2">
                                                    <span className="font-semibold text-blue-700">De :</span> {trip.departure} <br />
                                                    <span className="font-semibold text-emerald-700">Vers :</span> {trip.destination}
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap text-sm text-gray-500">
                                                    <Link
                                                        to={`/users/${trip.driverId}`}
                                                        className="bg-gray-100 px-2 py-1 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                    >
                                                        🚗 {trip.driverName}
                                                    </Link>
                                                    {driverRating && driverRating.count > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <StarRating rating={driverRating.avg} size="sm" />
                                                            <span className="text-gray-400">({driverRating.count})</span>
                                                        </span>
                                                    )}
                                                    {trip.completed ? (
                                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-semibold">🏁 Terminé</span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Map button — opens modal */}
                                            {trip.departureLat && trip.departureLon && trip.destinationLat && trip.destinationLon && (
                                                <div className="px-5 pb-3">
                                                    <button
                                                        onClick={() => setMapTrip({
                                                            ...trip,
                                                            availableSeats: available,
                                                            driverRating: driverRating && driverRating.count > 0 ? driverRating : null,
                                                        })}
                                                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        🗺️ Voir l'itinéraire
                                                    </button>
                                                </div>
                                            )}

                                            {/* Right: price + seats + actions */}
                                            <div className="flex flex-col items-end justify-between gap-2 min-w-[130px]">
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        {trip.price === 0 ? 'Gratuit' : `${trip.price} €`}
                                                    </div>
                                                    <div className={`text-sm font-medium ${available > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {available} place{available !== 1 ? 's' : ''} libre{available !== 1 ? 's' : ''}
                                                    </div>
                                                </div>

                                                {/* Passenger status / actions */}
                                                {!isOwner && (
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        {myBooking ? (
                                                            <>
                                                                {myBooking.status === 'confirmed' && (
                                                                    <span className="text-emerald-600 font-semibold text-sm">✅ Réservé</span>
                                                                )}
                                                                {myBooking.status === 'pending' && (
                                                                    <span className="text-orange-500 font-semibold text-sm">⏳ En attente</span>
                                                                )}
                                                                {myBooking.status === 'rejected' && (
                                                                    <span className="text-red-500 font-semibold text-sm">❌ Refusé</span>
                                                                )}
                                                                <Link
                                                                    to={`/trips/${trip.id}`}
                                                                    className="text-xs text-blue-600 hover:underline font-semibold"
                                                                >
                                                                    Voir le trajet →
                                                                </Link>
                                                            </>
                                                        ) : !trip.completed && available > 0 ? (
                                                            <Link
                                                                to={`/trips/${trip.id}`}
                                                                className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-sm"
                                                            >
                                                                Réserver →
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                to={`/trips/${trip.id}`}
                                                                className="text-xs text-gray-500 hover:text-blue-600 hover:underline"
                                                            >
                                                                Voir le trajet
                                                            </Link>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Driver actions */}
                                                {isOwner && (
                                                    <div className="flex items-center gap-2">
                                                        {!trip.completed && (
                                                            <button
                                                                onClick={() => handleComplete(trip.id)}
                                                                className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-emerald-200 transition-colors"
                                                            >
                                                                ✅ Terminer
                                                            </button>
                                                        )}
                                                        <Link
                                                            to={`/trips/${trip.id}`}
                                                            className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-blue-100 transition-colors"
                                                        >
                                                            Gérer →
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(trip.id)}
                                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>

        {/* Map modal */}
        {mapTrip && (
            <TripMapModal
                trip={mapTrip}
                onClose={() => setMapTrip(null)}
            />
        )}
    );
}
