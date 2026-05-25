import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import StarRating from '../../components/StarRating';
import ReviewModal from '../../components/ReviewModal';
import { API_BASE_URL } from '../../lib/api';
import type { Review } from '../../types';
import { useToast } from '../../context/UIContext';

interface PublicUser {
    id: string;
    name: string;
    bio: string;
    avatarUrl: string;
    createdAt: string;
}

export default function PublicProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [user, setUser] = useState<PublicUser | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showReview, setShowReview] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwnProfile = currentUser?.id === id;
    const token = localStorage.getItem('token');

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${id}/public`);
            if (!res.ok) { navigate('/'); return; }
            const data = await res.json();
            setUser(data.user);
            setReviews(data.reviews);
            setAverageRating(data.averageRating);
            setTotalReviews(data.totalReviews);
        } catch {
            toast.error('Impossible de charger ce profil');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, [id]);

    const memberSince = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Aujourd\'hui';
        if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`;
        return `Il y a ${Math.floor(days / 30)} mois`;
    };

    const ratingLabel = (avg: number) => {
        if (avg >= 4.8) return { label: 'Excellent', color: 'text-emerald-600' };
        if (avg >= 4) return { label: 'Très bien', color: 'text-blue-600' };
        if (avg >= 3) return { label: 'Bien', color: 'text-yellow-600' };
        if (avg > 0) return { label: 'Passable', color: 'text-orange-600' };
        return { label: 'Nouveau', color: 'text-gray-500' };
    };

    // Star distribution
    const starCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
    }));

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Chargement du profil...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!user) return null;

    const { label: rLabel, color: rColor } = ratingLabel(averageRating);

    return (
        <Layout>
            <div className="p-4 pb-16">
                <div className="max-w-3xl mx-auto">

                    {/* Back */}
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6 font-medium"
                    >
                        ← Retour
                    </button>

                    {/* Profile hero card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                        {/* Gradient banner */}
                        <div className="h-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

                        <div className="px-6 pb-6">
                            {/* Avatar */}
                            <div className="flex items-end justify-between -mt-12 mb-4">
                                <div className="relative">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.name}
                                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 mb-2">
                                    {isOwnProfile && (
                                        <Link
                                            to="/profile"
                                            className="text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors"
                                        >
                                            ✏️ Modifier
                                        </Link>
                                    )}
                                    {!isOwnProfile && token && (
                                        <button
                                            onClick={() => setShowReview(true)}
                                            className="text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors"
                                        >
                                            ⭐ Laisser un avis
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Name & bio */}
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
                            <p className="text-sm text-gray-400 mb-3">Membre depuis {memberSince(user.createdAt)}</p>
                            {user.bio ? (
                                <p className="text-gray-600 leading-relaxed">{user.bio}</p>
                            ) : (
                                <p className="text-gray-400 italic text-sm">Pas encore de biographie.</p>
                            )}
                        </div>
                    </div>

                    {/* Rating summary card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">⭐ Réputation</h2>

                        {totalReviews === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-4xl mb-3">🌟</p>
                                <p className="text-gray-500">Aucun avis pour le moment.</p>
                                {!isOwnProfile && token && (
                                    <button
                                        onClick={() => setShowReview(true)}
                                        className="mt-3 text-sm text-blue-600 font-semibold hover:underline"
                                    >
                                        Soyez le premier à laisser un avis
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                {/* Big score */}
                                <div className="text-center flex-shrink-0">
                                    <div className="text-6xl font-bold text-gray-900 leading-none mb-1">
                                        {averageRating.toFixed(1)}
                                    </div>
                                    <StarRating rating={averageRating} size="md" />
                                    <p className={`text-sm font-bold mt-1 ${rColor}`}>{rLabel}</p>
                                    <p className="text-xs text-gray-400 mt-1">{totalReviews} avis</p>
                                </div>

                                {/* Bar chart */}
                                <div className="flex-1 w-full space-y-1.5">
                                    {starCounts.map(({ star, count }) => {
                                        const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                                                <span className="text-xs">⭐</span>
                                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-2 rounded-full bg-amber-400 transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-400 w-8">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reviews list */}
                    {reviews.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-bold text-gray-800">Avis reçus</h2>
                            {reviews.map(review => (
                                <div key={review.id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-50">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {review.reviewerName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{review.reviewerName}</p>
                                                <p className="text-xs text-gray-400">{timeAgo(review.createdAt)}</p>
                                            </div>
                                        </div>
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>
                                    {review.comment && (
                                        <p className="text-sm text-gray-600 leading-relaxed pl-12">{review.comment}</p>
                                    )}
                                    {review.relatedType === 'trip' && (
                                        <div className="pl-12 mt-2">
                                            <Link
                                                to={`/trips/${review.relatedId}`}
                                                className="text-xs text-blue-500 hover:underline"
                                            >
                                                🚗 Voir le trajet →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showReview && user && (
                <ReviewModal
                    targetUserId={user.id}
                    targetUserName={user.name}
                    onClose={() => setShowReview(false)}
                    onSubmitted={() => {
                        toast.success('Merci pour votre avis !');
                        fetchProfile();
                    }}
                />
            )}
        </Layout>
    );
}
