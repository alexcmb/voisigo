import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../lib/api';
import { CATEGORY_EMOJIS } from '../../types';
import type { Service } from '../../types';

export default function ServicesList() {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

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

    const handleDelete = async (serviceId: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cette annonce ?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setServices(prev => prev.filter(s => s.id !== serviceId));
            } else {
                const data = await res.json();
                alert(data.message || 'Erreur lors de la suppression');
            }
        } catch {
            alert('Erreur réseau');
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
                                <div key={service.id} className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${service.type === 'request' ? 'border-orange-400' : 'border-green-500'} hover:shadow-lg transition-shadow`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${service.type === 'request' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                            {service.type === 'request' ? 'Demande' : 'Proposition'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl" title={service.category}>{CATEGORY_EMOJIS[service.category]}</span>
                                            {currentUser?.id && service.authorId === currentUser.id && (
                                                <button
                                                    onClick={() => handleDelete(service.id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                    title="Supprimer mon annonce"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                                    {service.location && (
                                        <div className="flex items-center text-gray-500 mb-2">
                                            <span className="mr-1">📍</span>
                                            <span className="text-sm">{service.location}</span>
                                        </div>
                                    )}
                                    <p className="text-gray-600 text-lg mb-4">{service.description}</p>

                                    <div className="flex justify-between items-end border-t pt-4 mt-2">
                                        <div className="text-gray-500 text-sm">
                                            <span className="font-bold text-lg text-purple-700 block mb-1">
                                                {service.price && service.price > 0 ? `${service.price} €` : 'Gratuit ✨'}
                                            </span>
                                            Par <span className="font-semibold">{service.authorName}</span> • {new Date(service.date).toLocaleDateString()}
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                        body: JSON.stringify({ recipientId: service.authorId, relatedType: 'service', relatedId: service.id }),
                                                    });
                                                    if (res.ok) { const data = await res.json(); navigate(`/messages/${data.conversation.id}`); }
                                                    else { const data = await res.json(); alert(data.message || 'Erreur'); }
                                                } catch { alert('Erreur réseau'); }
                                            }}
                                            className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                                        >
                                            Contacter
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
