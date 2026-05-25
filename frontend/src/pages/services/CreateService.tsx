import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import AddressInput from '../../components/AddressInput';
import { API_BASE_URL } from '../../lib/api';
import type { ServiceCategory, ServiceType } from '../../types';

export default function CreateService() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ServiceCategory>('autre');
    const [type, setType] = useState<ServiceType>('request');
    const [location, setLocation] = useState('');
    const [lat, setLat] = useState<number | undefined>();
    const [lon, setLon] = useState<number | undefined>();
    const [price, setPrice] = useState<number>(0);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const response = await fetch(`${API_BASE_URL}/api/services`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                category,
                type,
                location,
                lat,
                lon,
                price
            }),
        });

        if (response.ok) {
            navigate('/services');
        } else {
            alert('Erreur lors de la création');
        }
    };

    return (
        <Layout>
            <div className="p-4">
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border-t-4 border-purple-500">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">🙌 Nouvelle Annonce d'Entraide</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex gap-4 p-2 bg-gray-100 rounded-lg">
                            <button
                                type="button"
                                className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'request' ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}
                                onClick={() => setType('request')}
                            >
                                Je demande de l'aide
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'offer' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}
                                onClick={() => setType('offer')}
                            >
                                Je propose mon aide
                            </button>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Catégorie</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                                className="w-full p-3 border rounded-lg text-lg bg-white"
                            >
                                <option value="courses">🛒 Courses</option>
                                <option value="bricolage">🔨 Bricolage</option>
                                <option value="jardinage">🌻 Jardinage</option>
                                <option value="visite">☕ Visite & Compagnie</option>
                                <option value="autre">✨ Autre</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Titre de l'annonce</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={type === 'request' ? "Ex: Besoin d'aide pour porter des cartons" : "Ex: Je peux tondre votre pelouse"}
                                className="w-full p-3 border rounded-lg text-lg"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Lieu (Ville ou Quartier)</label>
                            <AddressInput
                                value={location}
                                onChange={(addr, l, lo) => {
                                    setLocation(addr);
                                    if (l) setLat(l);
                                    if (lo) setLon(lo);
                                }}
                                placeholder="Ex: Place Bellecour, Lyon"
                                required={false}
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Participation demandé (€)</label>
                            <input
                                type="number"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                                className="w-full p-3 border rounded-lg text-lg"
                                placeholder="0 pour gratuit"
                            />
                            <p className="text-sm text-gray-500 mt-1">Mettre 0 pour une entraide gratuite.</p>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Description détaillée</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full p-3 border rounded-lg text-lg"
                                placeholder="Décrivez votre besoin ou votre proposition..."
                                required
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 py-3 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300">Annuler</button>
                            <button type="submit" className="flex-1 py-3 bg-purple-600 rounded-lg font-bold text-white hover:bg-purple-700 shadow-lg">Publier</button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
