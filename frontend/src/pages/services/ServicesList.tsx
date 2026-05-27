import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../lib/api';
import { CATEGORY_EMOJIS } from '../../types';
import type { Service } from '../../types';
import { useToast, useConfirm } from '../../context/UIContext';

export default function ServicesList() {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const toast = useToast();
    const confirm = useConfirm();

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/services`)
            .then(res => res.json())
            .then(response => {
                const data = response.data;
                setServices(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (serviceId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const ok = await confirm('Supprimer cette annonce définitivement ?', {
            title: 'Supprimer l\'annonce',
            confirmLabel: 'Supprimer',
            danger: true,
        });
        if (!ok) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setServices(prev => prev.filter(s => s.id !== serviceId));
                toast.success('Annonce supprimée');
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
                        <h2 className="text-3xl font-bold text-gray-800">Entraide entre voisins</h2>
                        <Link to="/services/create" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-purple-700 transition shadow-md">
                            + Publier une annonce
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-xl text-gray-500">Chargement...</div>
                    ) : services.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl shadow text-center">
                            <p className="text-xl text-gray-600 mb-4">Aucune annonce pour le moment.</p>
                            <Link to="/services/create" className="text-purple-600 font-bold hover:underline text-lg">Lancez le mouvement !</Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {services.map(service => (
                                <Link
                                    key={service.id}
                                    to={`/services/${service.id}`}
                                    className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${service.type === 'request' ? 'border-orange-400' : 'border-green-500'} hover:shadow-lg transition-shadow block group`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${service.type === 'request' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                            {service.type === 'request' ? '🙋 Demande' : '🤲 Proposition'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl" title={service.category}>{CATEGORY_EMOJIS[service.category]}</span>
                                            {currentUser?.id && service.authorId === currentUser.id && (
                                                <button
                                                    onClick={(e) => handleDelete(service.id, e)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                    title="Supprimer mon annonce"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">{service.title}</h3>
                                    {service.location && (
                                        <div className="flex items-center text-gray-500 mb-2">
                                            <span className="mr-1">📍</span>
                                            <span className="text-sm">{service.location}</span>
                                        </div>
                                    )}
                                    <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>

                                    <div className="flex justify-between items-end border-t pt-4 mt-2">
                                        <div className="text-gray-500 text-sm">
                                            <span className="font-bold text-lg text-purple-700 block mb-1">
                                                {service.price && service.price > 0 ? `${service.price} €` : 'Gratuit ✨'}
                                            </span>
                                            Par <span className="font-semibold">{service.authorName}</span> • {new Date(service.date).toLocaleDateString()}
                                        </div>
                                        <span className="text-purple-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                                            Voir l'annonce →
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
