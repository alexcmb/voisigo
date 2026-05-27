import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import AdBanner from '../components/AdBanner';
import { API_BASE_URL } from '../lib/api';

interface DashboardStats {
    tripsCount: number;
    servicesCount: number;
    bookingsCount: number;
    avgRating: number;
    reviewsCount: number;
}

export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE_URL}/api/users/dashboard-stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [token]);

    return (
        <Layout>
            <div className="p-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header Profile - Simplified since Header has some info now */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="text-left">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">Bonjour, <span className="text-blue-600">{user.name}</span> ! 👋</h1>
                                <div className="flex gap-4">
                                    <Link to="/my-listings" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm transition-colors">
                                        📝 Voir mes annonces
                                    </Link>
                                    <Link to="/profile" className="text-sm text-gray-500 hover:text-blue-600 hover:underline flex items-center">
                                        ⚙️ Modifier mon profil
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Dashboard Grid */}
                    {!loading && stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <span className="text-3xl mb-2">🚗</span>
                                <span className="text-2xl font-black text-blue-600">{stats.tripsCount}</span>
                                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Trajets proposés</span>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <span className="text-3xl mb-2">🤝</span>
                                <span className="text-2xl font-black text-purple-600">{stats.servicesCount}</span>
                                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Services rendus</span>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <span className="text-3xl mb-2">🎫</span>
                                <span className="text-2xl font-black text-orange-600">{stats.bookingsCount}</span>
                                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Réservations</span>
                            </div>

                            <Link to="/profile" className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                <span className="text-3xl mb-2">⭐</span>
                                <span className="text-2xl font-black text-yellow-500">
                                    {stats.reviewsCount > 0 ? stats.avgRating.toFixed(1) : '—'}
                                </span>
                                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">
                                    {stats.reviewsCount > 0 ? `${stats.reviewsCount} avis reçu${stats.reviewsCount !== 1 ? 's' : ''}` : 'Aucun avis'}
                                </span>
                            </Link>
                        </div>
                    )}

                    {/* Explore Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-lg transform hover:scale-[1.01] transition-transform">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">📰 Le Fil du Quartier</h2>
                                <p className="text-blue-100 text-lg">Découvrez tous les trajets et offres d'entraide récents en un seul endroit.</p>
                            </div>
                            <Link to="/explore" className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold text-lg shadow-md hover:bg-blue-50 transition-colors whitespace-nowrap">
                                Explorer le fil
                            </Link>
                        </div>
                    </div>

                    {/* Entraide Section */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-purple-100 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">🤝 Entraide entre voisins</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Link to="/services" className="group flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all border-2 border-transparent hover:border-purple-200">
                                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">👀</span>
                                <span className="text-lg font-bold text-purple-800 mb-1">Voir les annonces</span>
                            </Link>

                            <Link to="/services/create" className="group flex flex-col items-center justify-center p-6 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all border-2 border-transparent hover:border-orange-200">
                                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📢</span>
                                <span className="text-lg font-bold text-orange-800 mb-1">Demander ou proposer de l'aide</span>
                            </Link>
                        </div>
                    </div>

                    {/* Ad Banner Middle */}
                    <AdBanner className="mb-8" imageSrc="/ad-moovework.jpg" />

                    {/* Covoiturage Section */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">🚗 Covoiturage</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Link to="/trips" className="group flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border-2 border-transparent hover:border-blue-200">
                                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔍</span>
                                <span className="text-lg font-bold text-blue-800 mb-1">Rechercher un trajet</span>
                            </Link>

                            <Link to="/trips/create" className="group flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 rounded-xl transition-all border-2 border-transparent hover:border-green-200">
                                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">➕</span>
                                <span className="text-lg font-bold text-green-800 mb-1">Proposer un trajet</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
