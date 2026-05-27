import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import AddressInput from '../components/AddressInput';
import { calculateDistance } from '../utils/geo';
import MapContainer from '../components/MapContainer';
import ListingDetailsModal from '../components/ListingDetailsModal';
import AdBanner from '../components/AdBanner';
import { API_BASE_URL } from '../lib/api';
import { useToast, useConfirm } from '../context/UIContext';

import { CATEGORY_EMOJIS } from '../types';
import type { Trip, Service, ServiceCategory, Booking } from '../types';

type Listing = (Trip & { kind: 'trip' }) | (Service & { kind: 'service' });
type TypeFilter = 'all' | 'trip' | 'request' | 'offer';
type PriceFilter = 'all' | 'free' | 'under5' | 'under10';

export default function Explore() {
    const navigate = useNavigate();
    const toast = useToast();
    const confirm = useConfirm();

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [seatsMap, setSeatsMap] = useState<Record<string, number>>({});
    const [myBookingsMap, setMyBookingsMap] = useState<Record<string, Booking>>({});
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedItem, setSelectedItem] = useState<Listing | null>(null);

    // Pagination
    const [tripsPage, setTripsPage] = useState(1);
    const [servicesPage, setServicesPage] = useState(1);
    const [tripsMeta, setTripsMeta] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
    const [servicesMeta, setServicesMeta] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
    const [hasMoreData, setHasMoreData] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState<{ label: string; lat?: number; lon?: number }>({ label: '' });
    const [radiusFilter, setRadiusFilter] = useState(10);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
    const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    const fetchListings = async (pageTrips: number, pageServices: number, reset = false) => {
        setLoading(true);
        try {
            const [tripsRes, servicesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/trips?page=${pageTrips}&limit=10`).then(r => r.json()),
                fetch(`${API_BASE_URL}/api/services?page=${pageServices}&limit=10`).then(r => r.json()),
            ]);

            const newTrips = tripsRes.data.map((t: Trip) => ({ ...t, kind: 'trip' as const }));
            const newServices = servicesRes.data.map((s: Service) => ({ ...s, kind: 'service' as const }));

            setTripsMeta(tripsRes.meta);
            setServicesMeta(servicesRes.meta);

            const newData = [...newTrips, ...newServices].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            if (reset) {
                setListings(newData);
            } else {
                setListings(prev => {
                    const combined = [...prev, ...newData];
                    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                    return unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                });
            }

            setHasMoreData(pageTrips < tripsRes.meta.totalPages || pageServices < servicesRes.meta.totalPages);
            setLoading(false);

            newTrips.forEach((trip: Trip & { kind: 'trip' }) => {
                fetch(`${API_BASE_URL}/api/bookings/seats/${trip.id}`)
                    .then(r => r.json())
                    .then(s => setSeatsMap(prev => ({ ...prev, [trip.id]: s.availableSeats })))
                    .catch(() => { });
            });
        } catch {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings(1, 1, true);
        if (token) {
            fetch(`${API_BASE_URL}/api/bookings/my`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(r => r.json())
                .then((bookings: Booking[]) => {
                    const map: Record<string, Booking> = {};
                    bookings.forEach(b => { map[b.tripId] = b; });
                    setMyBookingsMap(map);
                }).catch(() => { });
        }
    }, [currentUser?.id]);

    useEffect(() => {
        if (!locationFilter.lat && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                setLocationFilter({ label: 'Ma position actuelle', lat: pos.coords.latitude, lon: pos.coords.longitude });
            });
        }
    }, []);

    const handleLoadMore = () => {
        const nextTrips = tripsPage < tripsMeta.totalPages ? tripsPage + 1 : tripsPage;
        const nextServices = servicesPage < servicesMeta.totalPages ? servicesPage + 1 : servicesPage;
        setTripsPage(nextTrips);
        setServicesPage(nextServices);
        fetchListings(nextTrips, nextServices, false);
    };

    const handleDelete = async (item: Listing) => {
        const ok = await confirm('Supprimer cette annonce définitivement ?', {
            title: 'Supprimer',
            confirmLabel: 'Supprimer',
            danger: true,
        });
        if (!ok) return;
        const endpoint = item.kind === 'trip'
            ? `${API_BASE_URL}/api/trips/${item.id}`
            : `${API_BASE_URL}/api/services/${item.id}`;
        try {
            const res = await fetch(endpoint, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                setListings(prev => prev.filter(l => l.id !== item.id));
                toast.success('Annonce supprimée');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur lors de la suppression');
            }
        } catch {
            toast.error('Erreur réseau');
        }
    };

    const handleContact = async (recipientId: string, relatedType: 'trip' | 'service', relatedId: string) => {
        if (!token) { navigate('/login'); return; }
        try {
            const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ recipientId, relatedType, relatedId }),
            });
            if (res.ok) {
                const data = await res.json();
                navigate(`/messages/${data.conversation.id}`);
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        }
    };

    // Book → redirect to trip detail for full booking experience
    const handleBook = (tripId: string) => {
        if (!token) { navigate('/login'); return; }
        navigate(`/trips/${tripId}`);
    };

    const isOwner = (item: Listing) => {
        if (!currentUser?.id) return false;
        return item.kind === 'trip' ? item.driverId === currentUser.id : item.authorId === currentUser.id;
    };

    const filteredListings = listings.filter(item => {
        if (locationFilter.lat && locationFilter.lon) {
            const itemLat = item.kind === 'trip' ? item.departureLat : item.lat;
            const itemLon = item.kind === 'trip' ? item.departureLon : item.lon;
            if (itemLat && itemLon) {
                if (calculateDistance(locationFilter.lat, locationFilter.lon, itemLat, itemLon) > radiusFilter) return false;
            } else return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const text = item.kind === 'trip'
                ? `${item.departure} ${item.destination} ${item.driverName}`
                : `${item.title} ${item.description} ${item.authorName}`;
            if (!text.toLowerCase().includes(q)) return false;
        }
        if (typeFilter !== 'all') {
            if (typeFilter === 'trip' && item.kind !== 'trip') return false;
            if (typeFilter === 'request' && (item.kind !== 'service' || item.type !== 'request')) return false;
            if (typeFilter === 'offer' && (item.kind !== 'service' || item.type !== 'offer')) return false;
        }
        if (categoryFilter !== 'all') {
            if (item.kind === 'trip') return false;
            if (item.category !== categoryFilter) return false;
        }
        if (priceFilter !== 'all') {
            if (item.kind !== 'trip') return false;
            if (priceFilter === 'free' && item.price !== 0) return false;
            if (priceFilter === 'under5' && item.price > 5) return false;
            if (priceFilter === 'under10' && item.price > 10) return false;
        }
        return true;
    });

    const formatDate = (d: string) =>
        new Date(d).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

    return (
        <Layout>
            <div className="p-4">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl font-extrabold text-center mb-2 text-slate-900">Le Fil du Quartier</h1>
                    <p className="text-center text-slate-500 mb-8 text-lg">Tout ce qui se passe près de chez vous : Covoiturage et Entraide.</p>

                    <div className="flex justify-center gap-4 mb-6">
                        <Link to="/services/create" className="bg-purple-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-purple-700 shadow-md transform hover:-translate-y-1 transition">
                            🤝 Demander ou proposer de l'aide
                        </Link>
                        <Link to="/trips/create" className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-700 shadow-md transform hover:-translate-y-1 transition">
                            🚗 Proposer un trajet
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Rechercher un trajet, un service, un voisin..."
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white shadow-sm"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">✕</button>
                            )}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 shadow-sm">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4 items-center border-b pb-4 mb-2">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Localisation</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 z-10">📍</span>
                                        <div className="pl-6">
                                            <AddressInput
                                                value={locationFilter.label}
                                                onChange={(addr, lat, lon) => setLocationFilter({ label: addr, lat, lon })}
                                                placeholder="Rechercher autour de..."
                                                required={false}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {locationFilter.lat && (
                                    <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-lg min-w-[200px]">
                                        <span className="text-sm font-semibold text-blue-700 whitespace-nowrap">Rayon: {radiusFilter} km</span>
                                        <input type="range" min="1" max="50" value={radiusFilter} onChange={e => setRadiusFilter(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeFilter)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
                                        <option value="all">Tous</option>
                                        <option value="request">🙋 Demande d'aide</option>
                                        <option value="offer">💪 Offre d'aide</option>
                                        <option value="trip">🚗 Covoiturage</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Catégorie</label>
                                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as ServiceCategory | 'all')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
                                        <option value="all">Toutes</option>
                                        <option value="courses">🛒 Courses</option>
                                        <option value="bricolage">🔨 Bricolage</option>
                                        <option value="jardinage">🌻 Jardinage</option>
                                        <option value="visite">☕ Visite</option>
                                        <option value="autre">✨ Autre</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prix</label>
                                    <select value={priceFilter} onChange={e => setPriceFilter(e.target.value as PriceFilter)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
                                        <option value="all">Tous les prix</option>
                                        <option value="free">Gratuit</option>
                                        <option value="under5">≤ 5 €</option>
                                        <option value="under10">≤ 10 €</option>
                                    </select>
                                </div>
                                {(typeFilter !== 'all' || categoryFilter !== 'all' || priceFilter !== 'all') && (
                                    <button onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); setPriceFilter('all'); }} className="text-sm text-red-500 hover:text-red-700 font-medium mt-4 sm:mt-0">
                                        ✕ Réinitialiser
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results + view toggle */}
                    <div className="flex justify-between items-center mb-4">
                        {!loading && (searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' || priceFilter !== 'all') && (
                            <div className="text-sm text-gray-500">
                                {filteredListings.length} résultat{filteredListings.length !== 1 ? 's' : ''} trouvé{filteredListings.length !== 1 ? 's' : ''}
                            </div>
                        )}
                        <div className="flex bg-gray-100 p-1 rounded-lg ml-auto">
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-bold transition ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-gray-500'}`}>Liste</button>
                            <button onClick={() => setViewMode('map')} className={`px-3 py-1 rounded-md text-sm font-bold transition ${viewMode === 'map' ? 'bg-white shadow text-slate-800' : 'text-gray-500'}`}>Carte 🗺️</button>
                        </div>
                    </div>

                    <AdBanner className="mb-8" imageSrc="/ad-moovework.jpg" />

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 text-lg">Chargement du fil d'actualité...</p>
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            {listings.length === 0 ? 'Rien pour le moment. Soyez le premier à participer !' : 'Aucun résultat ne correspond à vos critères.'}
                        </div>
                    ) : viewMode === 'map' ? (
                        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                            <MapContainer
                                items={filteredListings}
                                center={locationFilter.lat && locationFilter.lon ? [locationFilter.lat, locationFilter.lon] : [45.7640, 4.8357]}
                                zoom={locationFilter.lat ? 13 : 11}
                                onSelect={setSelectedItem}
                            />
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {filteredListings.map(item => {
                                if (item.kind === 'trip') {
                                    const myBooking = myBookingsMap[item.id];
                                    const available = seatsMap[item.id] ?? item.seats;
                                    const isPremium = item.driverIsPremium === true;
                                    const owner = isOwner(item);
                                    return (
                                        <div key={item.id} className={`rounded-xl border-l-4 border-blue-500 hover:shadow-lg transition-all relative overflow-hidden group ${
                                            isPremium 
                                                ? 'bg-gradient-to-br from-white to-amber-50/60 dark:from-slate-800 dark:to-amber-950/30 ring-1 ring-amber-400/30 dark:ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:shadow-[0_0_22px_rgba(245,158,11,0.25)]' 
                                                : 'bg-white shadow-md'
                                        }`}>
                                            {/* Clickable zone → trip detail */}
                                            <Link to={`/trips/${item.id}`} className="block p-5 pb-3 pl-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 p-2 rounded-full text-xl leading-none">🚗</div>
                                                        <div>
                                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Covoiturage</span>
                                                            <div className="text-sm text-gray-500 flex items-center gap-1 flex-wrap">
                                                                Proposé par <span className="font-medium text-gray-800">{item.driverName}</span>
                                                                {item.driverIsPremium && (
                                                                    <span className="text-xs leading-none" title="Premium 👑">👑</span>
                                                                )}
                                                                {item.driverIsVerified && (
                                                                    <span className="text-emerald-500 text-xs font-bold" title="Profil vérifié ✅">✓</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xl font-bold text-blue-600">{item.price === 0 ? 'Gratuit' : `${item.price} €`}</span>
                                                </div>
                                                <div className="ml-12">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="font-semibold text-slate-900">{item.departure}</span>
                                                        <span className="text-gray-400">➜</span>
                                                        <span className="font-semibold text-slate-900">{item.destination}</span>
                                                    </div>
                                                    <div className="text-gray-500 text-sm mb-1">📅 {formatDate(item.date)}</div>
                                                    <div className="text-sm text-blue-500 group-hover:translate-x-1 transition-transform inline-block">Voir le trajet →</div>
                                                </div>
                                            </Link>

                                            {/* Action footer */}
                                            <div className="px-5 pb-4 pt-2 border-t border-slate-100 ml-6 flex items-center justify-between gap-2 flex-wrap">
                                                {owner ? (
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors text-sm flex items-center gap-1"
                                                    >
                                                        🗑️ Supprimer
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => handleContact(item.driverId, 'trip', item.id)}
                                                            className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                                        >
                                                            💬 Contacter
                                                        </button>
                                                        {myBooking ? (
                                                            <span className={`text-sm font-semibold ${myBooking.status === 'confirmed' ? 'text-green-600' : myBooking.status === 'pending' ? 'text-orange-500' : 'text-red-500'}`}>
                                                                {myBooking.status === 'confirmed' && '✅ Réservé'}
                                                                {myBooking.status === 'pending' && `⏳ En attente (${myBooking.seats} pl.)`}
                                                                {myBooking.status === 'rejected' && '❌ Refusé'}
                                                            </span>
                                                        ) : available > 0 ? (
                                                            <button
                                                                onClick={() => handleBook(item.id)}
                                                                className="text-sm font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                            >
                                                                Réserver ({available} pl.)
                                                            </button>
                                                        ) : (
                                                            <span className="text-sm font-semibold text-red-500">Complet</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    const isRequest = item.type === 'request';
                                    const colorClass = isRequest ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50';
                                    const icon = CATEGORY_EMOJIS[item.category] || '✨';
                                    const owner = isOwner(item);

                                    const isPremium = item.authorIsPremium === true;
                                    return (
                                        <div key={item.id} className={`rounded-xl border-l-4 ${isRequest ? 'border-orange-400' : 'border-green-500'} hover:shadow-lg transition-all relative overflow-hidden group ${
                                            isPremium 
                                                ? 'bg-gradient-to-br from-white to-amber-50/60 dark:from-slate-800 dark:to-amber-950/30 ring-1 ring-amber-400/30 dark:ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:shadow-[0_0_22px_rgba(245,158,11,0.25)]' 
                                                : 'bg-white shadow-md'
                                        }`}>
                                            {/* Clickable zone → service detail */}
                                            <Link to={`/services/${item.id}`} className="block p-5 pb-3 pl-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full text-xl leading-none ${isRequest ? 'bg-orange-100' : 'bg-green-100'}`}>{icon}</div>
                                                        <div>
                                                            <span className={`text-xs font-bold uppercase tracking-wide ${isRequest ? 'text-orange-600' : 'text-green-600'}`}>
                                                                {isRequest ? "Demande d'aide" : "Offre d'aide"}
                                                            </span>
                                                            <div className="text-sm text-gray-500 flex items-center gap-1 flex-wrap">
                                                                Par <span className="font-medium text-gray-800">{item.authorName}</span>
                                                                {item.authorIsPremium && (
                                                                    <span className="text-xs leading-none" title="Premium 👑">👑</span>
                                                                )}
                                                                {item.authorIsVerified && (
                                                                    <span className="text-emerald-500 text-xs font-bold" title="Profil vérifié ✅">✓</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`font-bold text-base ${isRequest ? 'text-orange-600' : 'text-green-600'}`}>
                                                        {item.price && item.price > 0 ? `${item.price} €` : 'Gratuit ✨'}
                                                    </span>
                                                </div>
                                                <div className="ml-12">
                                                    <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-purple-700 transition-colors">{item.title}</h3>
                                                    {item.location && <div className="flex items-center text-gray-500 mb-1 text-sm"><span className="mr-1">📍</span>{item.location}</div>}
                                                    <p className="text-gray-600 text-sm line-clamp-2 mb-1">{item.description}</p>
                                                    <div className="text-sm text-purple-500 group-hover:translate-x-1 transition-transform inline-block">Voir l'annonce →</div>
                                                </div>
                                            </Link>

                                            {/* Action footer */}
                                            <div className="px-5 pb-4 pt-2 border-t border-slate-100 ml-6 flex items-center gap-2">
                                                {owner ? (
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors text-sm flex items-center gap-1"
                                                    >
                                                        🗑️ Supprimer
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleContact(item.authorId, 'service', item.id)}
                                                        className={`text-sm font-bold px-4 py-1.5 rounded-lg hover:opacity-80 transition-colors ${colorClass}`}
                                                    >
                                                        💬 Contacter
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    )}

                    {/* Load more */}
                    {!loading && hasMoreData && viewMode === 'list' && filteredListings.length > 0 && (
                        <div className="flex justify-center mt-8 pb-4">
                            <button
                                onClick={handleLoadMore}
                                className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full font-semibold shadow-sm hover:bg-gray-50 transition"
                            >
                                Charger plus de résultats
                            </button>
                        </div>
                    )}

                    <div className="mt-8 text-center pb-8 border-t border-gray-200 pt-8">
                        <Link to="/dashboard" className="text-gray-500 hover:text-slate-800 font-medium">← Retour au tableau de bord</Link>
                    </div>
                </div>
            </div>

            {/* Modal for map selection */}
            {selectedItem && (
                <ListingDetailsModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onContact={handleContact}
                    onBook={selectedItem.kind === 'trip' ? handleBook : undefined}
                    currentUserId={currentUser?.id}
                />
            )}
        </Layout>
    );
}
