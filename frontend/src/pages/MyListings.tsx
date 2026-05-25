import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiFetch, API_BASE_URL } from '../lib/api';
import type { Trip, Service } from '../types';
import { useToast, useConfirm } from '../context/UIContext';
import StarRating from '../components/StarRating';

export default function MyListings() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const confirm = useConfirm();
    const token = localStorage.getItem('token');

    useEffect(() => {
        Promise.all([
            apiFetch<{ data: Trip[] }>('/api/trips?my=true&limit=100'),
            apiFetch<{ data: Service[] }>('/api/services?my=true&limit=100')
        ]).then(([tripsRes, servicesRes]) => {
            setTrips(tripsRes.data);
            setServices(servicesRes.data);
            setLoading(false);
        }).catch(() => {
            toast.error('Impossible de charger vos annonces');
            setLoading(false);
        });
    }, []);

    const handleDeleteTrip = async (id: string) => {
        const ok = await confirm('Supprimer ce trajet définitivement ? Les réservations seront annulées.', {
            title: 'Supprimer le trajet',
            confirmLabel: 'Supprimer',
            danger: true,
        });
        if (!ok) return;
        try {
            await apiFetch(`/api/trips/${id}`, { method: 'DELETE' });
            setTrips(prev => prev.filter(t => t.id !== id));
            toast.success('Trajet supprimé');
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleCompleteTrip = async (id: string) => {
        const ok = await confirm(
            'Confirmer que ce trajet est terminé ? Les passagers pourront ensuite vous noter.',
            { title: 'Valider la course', confirmLabel: 'Oui, terminer' }
        );
        if (!ok) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/trips/${id}/complete`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setTrips(prev => prev.map(t => t.id === id ? { ...t, completed: 1 } : t));
                toast.success('Trajet validé ! Les passagers peuvent maintenant vous noter.');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        }
    };

    const handleDeleteService = async (id: string) => {
        const ok = await confirm('Supprimer cette annonce définitivement ?', {
            title: 'Supprimer l\'annonce',
            confirmLabel: 'Supprimer',
            danger: true,
        });
        if (!ok) return;
        try {
            await apiFetch(`/api/services/${id}`, { method: 'DELETE' });
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success('Annonce supprimée');
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    return (
        <Layout>
            <div className="p-4 pb-12">
                <div className="max-w-5xl mx-auto">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Mes Annonces</h1>
                            <p className="text-gray-500 mt-1">Gérez vos trajets et services publiés</p>
                        </div>
                        <Link to="/dashboard" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                            ← Tableau de bord
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-500 font-medium">Chargement de vos annonces...</p>
                        </div>
                    ) : (
                        <div className="space-y-10">

                            {/* ── Trips Section ── */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        🚗 Mes Trajets
                                        <span className="bg-blue-100 text-blue-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
                                            {trips.length}
                                        </span>
                                    </h2>
                                    <Link
                                        to="/trips/create"
                                        className="text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                                    >
                                        + Nouveau trajet
                                    </Link>
                                </div>

                                {trips.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                                        <p className="text-4xl mb-3">🚗</p>
                                        <p className="text-gray-500 mb-3">Vous n'avez encore publié aucun trajet.</p>
                                        <Link to="/trips/create" className="text-blue-600 font-bold hover:underline">
                                            Proposer un trajet →
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {trips.map(trip => {
                                            const available = trip.availableSeats ?? trip.seats;
                                            const hasPending = (trip.pendingBookingsCount ?? 0) > 0;
                                            const driverRating = trip.driverRating;

                                            return (
                                                <div
                                                    key={trip.id}
                                                    className={`bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden transition hover:shadow-md ${
                                                        trip.completed ? 'border-emerald-400' : 'border-blue-500'
                                                    }`}
                                                >
                                                    {/* Pending badge */}
                                                    {hasPending && (
                                                        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between">
                                                            <span className="text-amber-800 text-xs font-bold">
                                                                ⏳ {trip.pendingBookingsCount} demande{(trip.pendingBookingsCount ?? 0) > 1 ? 's' : ''} en attente
                                                            </span>
                                                            <Link to={`/trips/${trip.id}`} className="text-xs text-amber-700 font-bold hover:underline">
                                                                Gérer →
                                                            </Link>
                                                        </div>
                                                    )}

                                                    <div className="p-5">
                                                        {/* Status badge */}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                                trip.completed
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {trip.completed ? '🏁 Terminé' : '🟢 Actif'}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(trip.date).toLocaleDateString('fr-FR', {
                                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>

                                                        {/* Route */}
                                                        <p className="font-bold text-gray-800 mb-1">
                                                            {trip.departure} <span className="text-blue-500">→</span> {trip.destination}
                                                        </p>

                                                        {/* Stats row */}
                                                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                                                            <span className={`font-semibold ${available > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                {available}/{trip.seats} places
                                                            </span>
                                                            <span>•</span>
                                                            <span className="font-semibold text-blue-600">
                                                                {trip.price === 0 ? 'Gratuit' : `${trip.price} €`}
                                                            </span>
                                                            {driverRating && driverRating.count > 0 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1">
                                                                        <StarRating rating={driverRating.avg} size="sm" />
                                                                        <span className="text-gray-400 text-xs">({driverRating.count})</span>
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                to={`/trips/${trip.id}`}
                                                                className="flex-1 text-center py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                                                            >
                                                                Voir le détail →
                                                            </Link>
                                                            {!trip.completed && (
                                                                <button
                                                                    onClick={() => handleCompleteTrip(trip.id)}
                                                                    className="py-2 px-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
                                                                    title="Valider la course"
                                                                >
                                                                    ✅
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteTrip(trip.id)}
                                                                className="py-2 px-3 bg-red-50 text-red-400 rounded-xl text-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                                                                title="Supprimer"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            {/* ── Services Section ── */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        🤝 Mes Services
                                        <span className="bg-purple-100 text-purple-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
                                            {services.length}
                                        </span>
                                    </h2>
                                    <Link
                                        to="/services/create"
                                        className="text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-colors"
                                    >
                                        + Nouveau service
                                    </Link>
                                </div>

                                {services.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                                        <p className="text-4xl mb-3">🤝</p>
                                        <p className="text-gray-500 mb-3">Vous n'avez encore publié aucun service.</p>
                                        <Link to="/services/create" className="text-purple-600 font-bold hover:underline">
                                            Proposer ou demander de l'aide →
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {services.map(service => (
                                            <div key={service.id} className="bg-white rounded-2xl shadow-sm border-l-4 border-purple-400 p-5 hover:shadow-md transition">
                                                <div className="flex items-start justify-between mb-3">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                        service.type === 'request'
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {service.type === 'request' ? '🙋 Demande' : '🙌 Offre'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteService(service.id)}
                                                        className="p-1.5 bg-red-50 text-red-400 rounded-lg text-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>

                                                <h3 className="font-bold text-gray-800 mb-1 leading-snug">{service.title}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{service.description}</p>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-purple-700">
                                                        {service.price && service.price > 0 ? `${service.price} €` : 'Gratuit ✨'}
                                                    </span>
                                                    {service.location && (
                                                        <span className="text-xs text-gray-400 truncate max-w-[120px]">
                                                            📍 {service.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
