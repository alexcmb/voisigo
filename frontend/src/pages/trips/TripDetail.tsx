import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import TripRouteMap from '../../components/TripRouteMap';
import { API_BASE_URL } from '../../lib/api';
import type { Trip, Booking } from '../../types';
import StarRating from '../../components/StarRating';
import ReviewModal from '../../components/ReviewModal';
import { useToast } from '../../context/UIContext';
import { useConfirm } from '../../context/UIContext';


export default function TripDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const confirm = useConfirm();

    const [trip, setTrip] = useState<Trip | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [myBooking, setMyBooking] = useState<Booking | null>(null);
    const [seatsToBook, setSeatsToBook] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReview, setShowReview] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const isDriver = currentUser?.id && trip?.driverId === currentUser.id;

    const fetchTrip = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/trips/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            if (!res.ok) { navigate('/trips'); return; }
            const data = await res.json();
            setTrip(data.trip);
            setBookings(data.bookings || []);
        } catch {
            toast.error('Impossible de charger le trajet');
            navigate('/trips');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyBooking = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/my`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const all: Booking[] = await res.json();
                const mine = all.find(b => b.tripId === id) || null;
                setMyBooking(mine);
            }
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchTrip();
        fetchMyBooking();
    }, [id]);

    const handleBook = async () => {
        if (!token) { navigate('/login'); return; }
        const available = trip?.availableSeats ?? 0;
        if (available <= 0) { toast.error('Plus de places disponibles'); return; }
        if (seatsToBook < 1 || seatsToBook > available) { toast.error('Nombre de places invalide'); return; }

        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ tripId: id, seats: seatsToBook }),
            });
            const data = await res.json();
            if (res.ok) {
                setMyBooking(data.booking);
                toast.success('Demande envoyée ! En attente de validation du conducteur.');
                fetchTrip();
            } else {
                toast.error(data.message || 'Erreur lors de la réservation');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!myBooking) return;
        const ok = await confirm('Voulez-vous annuler votre réservation ?', {
            title: 'Annuler la réservation',
            confirmLabel: 'Oui, annuler',
            danger: true,
        });
        if (!ok) return;

        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/${myBooking.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setMyBooking(null);
                toast.success('Réservation annulée');
                fetchTrip();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async (bookingId: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/approve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success('Réservation acceptée ✅');
                fetchTrip();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (bookingId: string) => {
        const ok = await confirm('Refuser cette demande de réservation ?', {
            title: 'Refuser la demande',
            confirmLabel: 'Refuser',
            danger: true,
        });
        if (!ok) return;

        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/reject`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                toast.info('Réservation refusée');
                fetchTrip();
            } else {
                toast.error('Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async () => {
        const ok = await confirm(
            'Confirmer que ce trajet est terminé ? Les passagers pourront ensuite vous noter.',
            { title: 'Valider la course', confirmLabel: 'Oui, terminer' }
        );
        if (!ok) return;

        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/trips/${id}/complete`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success('Trajet validé ! Les passagers peuvent maintenant vous noter.');
                fetchTrip();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        const ok = await confirm('Supprimer ce trajet définitivement ? Les réservations seront annulées.', {
            title: 'Supprimer le trajet',
            confirmLabel: 'Supprimer',
            danger: true,
        });
        if (!ok) return;

        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/trips/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success('Trajet supprimé');
                navigate('/trips');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    const hasMap = trip?.departureLat && trip?.departureLon && trip?.destinationLat && trip?.destinationLon;
    const available = trip?.availableSeats ?? 0;
    const driverRating = trip?.driverRating;
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const canReview = trip?.completed && myBooking?.status === 'confirmed';

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Chargement du trajet...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!trip) return null;

    return (
        <Layout>
            <div className="p-4 pb-12">
                <div className="max-w-3xl mx-auto">

                    {/* Back link & Share buttons */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                        <Link to="/trips" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium">
                            ← Retour aux trajets
                        </Link>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide mr-1">Partager :</span>
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                    `Salut ! 🚗 Je te partage ce trajet de ${trip.departure} à ${trip.destination} prévu le ${new Date(trip.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. Regarde sur VoisiGO ! ${window.location.href}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all flex items-center justify-center text-xs font-bold shadow-sm border border-emerald-200/50 dark:border-emerald-800/30"
                                title="Partager sur WhatsApp"
                            >
                                💬 WhatsApp
                            </a>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('Lien du trajet copié !');
                                }}
                                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all flex items-center justify-center text-xs font-bold shadow-sm border border-blue-200/50 dark:border-blue-800/30 cursor-pointer"
                                title="Copier le lien"
                            >
                                🔗 Copier
                            </button>
                        </div>
                    </div>

                    {/* Trip header card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                        <div className={`h-2 ${trip.completed ? 'bg-emerald-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} />
                        <div className="p-6">
                            {trip.completed ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full mb-4">
                                    🏁 Trajet terminé
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full mb-4">
                                    🟢 Trajet actif
                                </span>
                            )}

                            {/* Route */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                                    <div className="w-0.5 h-8 bg-gray-200" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow" />
                                </div>
                                <div className="flex flex-col gap-2 flex-1">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Départ</p>
                                        <p className="text-lg font-bold text-gray-800">{trip.departure}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Arrivée</p>
                                        <p className="text-lg font-bold text-gray-800">{trip.destination}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-2 text-gray-600 mb-4">
                                <span>📅</span>
                                <span className="font-medium capitalize">{formatDate(trip.date)}</span>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-700">
                                        {trip.price === 0 ? 'Gratuit' : `${trip.price}€`}
                                    </p>
                                    <p className="text-xs text-blue-500 font-medium mt-0.5">par place</p>
                                </div>
                                <div className={`rounded-xl p-3 text-center ${available > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                    <p className={`text-2xl font-bold ${available > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                        {available}
                                    </p>
                                    <p className={`text-xs font-medium mt-0.5 ${available > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                        place{available !== 1 ? 's' : ''} libre{available !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-gray-700">{trip.seats}</p>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">places total</p>
                                </div>
                            </div>

                            {/* Description */}
                            {trip.description && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600 leading-relaxed">💬 {trip.description}</p>
                                </div>
                            )}

                            {/* Vehicle Details */}
                            {trip.vehicleType && (
                                <div className="mt-4 p-3.5 bg-blue-50 dark:bg-slate-900/50 border border-blue-100 dark:border-slate-800 rounded-xl flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300">
                                    <span className="text-xl">🚗</span>
                                    <div>
                                        <span className="font-bold text-slate-800 dark:text-white capitalize">Véhicule de voyage :</span> {trip.vehicleType === 'electrique' ? 'Électrique ⚡' : `${trip.vehicleType} (${trip.fuelType})`}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Driver card */}
                    <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 flex items-center justify-between gap-4">
                        <Link to={`/users/${trip.driverId}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                                🚗
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Conducteur</p>
                                <p className="font-bold text-gray-800 hover:text-blue-600 transition-colors">{trip.driverName}</p>
                                {driverRating && driverRating.count > 0 ? (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <StarRating rating={driverRating.avg} size="sm" />
                                        <span className="text-xs text-gray-500">
                                            {driverRating.avg.toFixed(1)} ({driverRating.count} avis)
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-0.5">Pas encore d'avis</p>
                                )}
                            </div>
                        </Link>
                        {!isDriver && (
                            <Link
                                to={`/messages?driverId=${trip.driverId}&tripId=${trip.id}`}
                                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                            >
                                💬 Contacter
                            </Link>
                        )}
                    </div>

                    {/* Map — real road route via OSRM */}
                    {hasMap && (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-800">🗺️ Itinéraire</h3>
                                {trip.departureLat && (
                                    <a
                                        href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${trip.departureLat},${trip.departureLon};${trip.destinationLat},${trip.destinationLon}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                                    >
                                        Ouvrir dans OSM →
                                    </a>
                                )}
                            </div>
                            <div className="p-3">
                                <TripRouteMap
                                    departureLat={trip.departureLat!}
                                    departureLon={trip.departureLon!}
                                    destinationLat={trip.destinationLat!}
                                    destinationLon={trip.destinationLon!}
                                    departure={trip.departure}
                                    destination={trip.destination}
                                    height="320px"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Passenger action area ── */}
                    {!isDriver && (
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4">Ma réservation</h3>

                            {myBooking ? (
                                <div className="space-y-3">
                                    {myBooking.status === 'confirmed' && (
                                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl font-semibold">
                                            ✅ Réservation confirmée — {myBooking.seats} place{myBooking.seats > 1 ? 's' : ''}
                                        </div>
                                    )}
                                    {myBooking.status === 'pending' && (
                                        <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-3 rounded-xl font-semibold">
                                            ⏳ En attente de validation — {myBooking.seats} place{myBooking.seats > 1 ? 's' : ''}
                                        </div>
                                    )}
                                    {myBooking.status === 'rejected' && (
                                        <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-xl font-semibold">
                                            ❌ Demande refusée par le conducteur
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        {!trip.completed && myBooking.status !== 'rejected' && (
                                            <button
                                                onClick={handleCancel}
                                                disabled={actionLoading}
                                                className="flex-1 py-2.5 border border-red-200 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
                                            >
                                                {myBooking.status === 'pending' ? 'Annuler la demande' : 'Annuler'}
                                            </button>
                                        )}
                                        {canReview && (
                                            <button
                                                onClick={() => setShowReview(true)}
                                                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors text-sm"
                                            >
                                                ⭐ Noter le conducteur
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : trip.completed ? (
                                <p className="text-gray-500 text-sm">Ce trajet est terminé.</p>
                            ) : available > 0 ? (
                                token ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-semibold text-gray-700">Nombre de places :</label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSeatsToBook(Math.max(1, seatsToBook - 1))}
                                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition-colors"
                                                >−</button>
                                                <span className="w-8 text-center font-bold text-lg">{seatsToBook}</span>
                                                <button
                                                    onClick={() => setSeatsToBook(Math.min(available, seatsToBook + 1))}
                                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition-colors"
                                                >+</button>
                                            </div>
                                            <span className="text-xs text-gray-400">({available} max)</span>
                                        </div>
                                        <button
                                            onClick={handleBook}
                                            disabled={actionLoading}
                                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg transition-colors shadow-md disabled:opacity-50"
                                        >
                                            {actionLoading ? 'Envoi...' : `Réserver ${seatsToBook} place${seatsToBook > 1 ? 's' : ''} ${trip.price > 0 ? `— ${trip.price * seatsToBook}€` : '(gratuit)'}`}
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="block w-full py-3 bg-blue-600 text-white text-center rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Se connecter pour réserver
                                    </Link>
                                )
                            ) : (
                                <div className="text-center py-4 text-red-500 font-semibold">
                                    😔 Ce trajet est complet
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Driver action area ── */}
                    {isDriver && (
                        <div className="space-y-4 mb-6">
                            {/* Quick actions */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="font-bold text-gray-800 mb-4">⚙️ Gestion du trajet</h3>
                                <div className="flex gap-3">
                                    {!trip.completed && (
                                        <button
                                            onClick={handleComplete}
                                            disabled={actionLoading}
                                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                                        >
                                            ✅ Valider la course
                                        </button>
                                    )}
                                    <button
                                        onClick={handleDelete}
                                        disabled={actionLoading}
                                        className="py-3 px-5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-semibold transition-colors disabled:opacity-50"
                                    >
                                        🗑️ Supprimer
                                    </button>
                                </div>
                            </div>

                            {/* Pending bookings */}
                            {pendingBookings.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                                    <h3 className="font-bold text-amber-900 mb-3">
                                        ⏳ Demandes en attente ({pendingBookings.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {pendingBookings.map(b => (
                                            <div key={b.id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{b.passengerName}</p>
                                                    <p className="text-xs text-gray-500">{b.seats} place{b.seats > 1 ? 's' : ''}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(b.id)}
                                                        disabled={actionLoading}
                                                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-sm hover:bg-emerald-200 transition-colors disabled:opacity-50"
                                                    >
                                                        ✓ Accepter
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(b.id)}
                                                        disabled={actionLoading}
                                                        className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
                                                    >
                                                        ✕ Refuser
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Confirmed passengers */}
                            {confirmedBookings.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-lg p-5">
                                    <h3 className="font-bold text-gray-800 mb-3">
                                        👥 Passagers confirmés ({confirmedBookings.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {confirmedBookings.map(b => (
                                            <div key={b.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                                <span className="font-semibold text-emerald-800">{b.passengerName}</span>
                                                <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full font-bold">
                                                    {b.seats} place{b.seats > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showReview && trip && (
                <ReviewModal
                    targetUserId={trip.driverId}
                    targetUserName={trip.driverName}
                    relatedType="trip"
                    relatedId={trip.id}
                    onClose={() => setShowReview(false)}
                    onSubmitted={() => {
                        toast.success('Merci pour votre avis !');
                        fetchTrip();
                    }}
                />
            )}
        </Layout>
    );
}
