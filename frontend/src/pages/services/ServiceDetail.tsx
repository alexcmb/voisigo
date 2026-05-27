import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '../../components/Layout';
import StarRating from '../../components/StarRating';
import { API_BASE_URL } from '../../lib/api';
import { CATEGORY_EMOJIS } from '../../types';
import type { Service, Review } from '../../types';
import { useToast, useConfirm } from '../../context/UIContext';

// Fix Leaflet default marker icon
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Author {
    id: string;
    name: string;
    bio?: string;
    avatarUrl?: string;
}

export default function ServiceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const confirm = useConfirm();

    const [service, setService] = useState<Service | null>(null);
    const [author, setAuthor] = useState<Author | null>(null);
    const [authorRating, setAuthorRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [contacting, setContacting] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const isOwner = currentUser?.id && service?.authorId === currentUser.id;

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/services/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => {
                setService(data.service);
                setAuthor(data.author);
                setAuthorRating(data.authorRating || { avg: 0, count: 0 });
                setReviews(data.reviews || []);
            })
            .catch(() => {
                toast.error('Annonce introuvable');
                navigate('/services');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleContact = async () => {
        if (!token) { navigate('/login'); return; }
        if (!service || isOwner) return;
        setContacting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ recipientId: service.authorId, relatedType: 'service', relatedId: service.id }),
            });
            const data = await res.json();
            if (res.ok) {
                navigate(`/messages/${data.conversation.id}`);
            } else {
                toast.error(data.message || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setContacting(false);
        }
    };

    const handleDelete = async () => {
        const ok = await confirm('Supprimer cette annonce définitivement ?', {
            title: 'Supprimer l\'annonce',
            confirmLabel: 'Supprimer',
            danger: true,
        });
        if (!ok) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/services/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success('Annonce supprimée');
                navigate('/services');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-32">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 font-medium">Chargement de l'annonce...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!service) return null;

    const isRequest = service.type === 'request';
    const typeColor = isRequest
        ? { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-400', badge: 'bg-orange-100 text-orange-800' }
        : { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-800' };

    const categoryLabel: Record<string, string> = {
        courses: 'Courses',
        bricolage: 'Bricolage',
        jardinage: 'Jardinage',
        visite: 'Visite / Compagnie',
        autre: 'Autre',
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const timeAgo = (d: string) => {
        const diff = Date.now() - new Date(d).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'aujourd\'hui';
        if (days === 1) return 'hier';
        if (days < 7) return `il y a ${days} jours`;
        if (days < 30) return `il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`;
        return `il y a ${Math.floor(days / 30)} mois`;
    };

    return (
        <Layout>
            <div className="p-4 max-w-3xl mx-auto">

                {/* Back link */}
                <Link to="/services" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
                    ← Retour aux annonces
                </Link>

                {/* ── Hero card ── */}
                <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 ${typeColor.border} mb-6`}>
                    {/* Gradient header */}
                    <div className={`${typeColor.bg} bg-opacity-10 px-6 pt-6 pb-4`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${typeColor.badge}`}>
                                    {isRequest ? '🙋 Demande' : '🤲 Proposition'}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-white/80 ${typeColor.text}`}>
                                    {CATEGORY_EMOJIS[service.category]} {categoryLabel[service.category]}
                                </span>
                            </div>
                            <span className="text-sm text-gray-400">{timeAgo(service.createdAt)}</span>
                        </div>

                        <h1 className="text-2xl font-extrabold text-gray-900 mt-4 mb-1">{service.title}</h1>

                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                            {service.location && (
                                <span className="flex items-center gap-1">📍 {service.location}</span>
                            )}
                            <span className="flex items-center gap-1">📅 {formatDate(service.date)}</span>
                            <span className={`font-bold text-base ${typeColor.text}`}>
                                {service.price && service.price > 0 ? `💶 ${service.price} €` : '🎁 Gratuit'}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="px-6 py-5">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">{service.description}</p>
                    </div>

                    {/* Map if coords available */}
                    {service.lat && service.lon && (
                        <div className="px-6 pb-5">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Localisation</h2>
                            <div className="rounded-xl overflow-hidden border border-gray-100" style={{ height: 220 }}>
                                <MapContainer
                                    center={[service.lat, service.lon]}
                                    zoom={14}
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={[service.lat, service.lon]}>
                                        <Popup>{service.location || service.title}</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    )}

                    {/* Footer actions */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                        {isOwner ? (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                            >
                                🗑️ Supprimer mon annonce
                            </button>
                        ) : (
                            <button
                                onClick={handleContact}
                                disabled={contacting}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm text-white ${typeColor.bg} hover:opacity-90 disabled:opacity-60`}
                            >
                                {contacting ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connexion...</>
                                ) : (
                                    <>💬 Contacter {author?.name || 'l\'auteur'}</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Author card ── */}
                {author && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Publié par</h2>
                        <div className="flex items-center gap-4">
                            <Link to={`/users/${author.id}`}>
                                {author.avatarUrl ? (
                                    <img
                                        src={author.avatarUrl}
                                        alt={author.name}
                                        className="w-14 h-14 rounded-full border-2 border-gray-100 object-cover hover:opacity-90 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold hover:opacity-90 transition-opacity">
                                        {author.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>
                            <div className="flex-1">
                                <Link
                                    to={`/users/${author.id}`}
                                    className="text-lg font-bold text-gray-900 hover:text-purple-600 transition-colors"
                                >
                                    {author.name}
                                </Link>
                                {authorRating.count > 0 && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <StarRating rating={authorRating.avg} size="sm" />
                                        <span className="text-sm text-gray-500">
                                            {authorRating.avg.toFixed(1)} ({authorRating.count} avis)
                                        </span>
                                    </div>
                                )}
                                {author.bio && (
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{author.bio}</p>
                                )}
                            </div>
                            <Link
                                to={`/users/${author.id}`}
                                className="hidden sm:flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-semibold border border-purple-200 hover:bg-purple-50 px-3 py-2 rounded-xl transition-colors"
                            >
                                Voir le profil →
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── Recent reviews ── */}
                {reviews.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            Derniers avis sur {author?.name}
                        </h2>
                        <div className="flex flex-col gap-4">
                            {reviews.map(review => (
                                <div key={review.id} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                                        {review.reviewerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-sm text-gray-800">{review.reviewerName}</span>
                                            <StarRating rating={review.rating} size="sm" />
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.comment}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">{timeAgo(review.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                            {authorRating.count > reviews.length && (
                                <Link
                                    to={`/users/${author?.id}`}
                                    className="text-sm text-purple-600 hover:underline text-center pt-1"
                                >
                                    Voir tous les avis →
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
