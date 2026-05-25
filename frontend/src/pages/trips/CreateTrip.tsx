import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import AddressInput from '../../components/AddressInput';
import { API_BASE_URL } from '../../lib/api';

export default function CreateTrip() {
    const [departure, setDeparture] = useState('');
    const [departureLat, setDepartureLat] = useState<number | undefined>();
    const [departureLon, setDepartureLon] = useState<number | undefined>();
    const [destination, setDestination] = useState('');
    const [destinationLat, setDestinationLat] = useState<number | undefined>();
    const [destinationLon, setDestinationLon] = useState<number | undefined>();
    const [date, setDate] = useState('');
    const [seats, setSeats] = useState(3);
    const [price, setPrice] = useState(5);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/trips`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    departure,
                    destination,
                    departureLat,
                    departureLon,
                    destinationLat,
                    destinationLon,
                    date,
                    seats: Number(seats),
                    price: Number(price)
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error creating trip');
            }

            navigate('/dashboard');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Une erreur est survenue');
            }
        }
    };

    return (
        <Layout>
            <div className="p-4">
                <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg border-t-4 border-blue-500">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Proposer un Trajet</h2>

                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <label className="block text-lg font-semibold text-gray-800 mb-2">Départ</label>
                            <AddressInput
                                value={departure}
                                onChange={(addr, lat, lon) => {
                                    setDeparture(addr);
                                    if (lat !== undefined) setDepartureLat(lat);
                                    if (lon !== undefined) setDepartureLon(lon);
                                }}
                                placeholder="Ex: 12 Rue des Lilas, Lyon"
                                required
                            />
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <label className="block text-lg font-semibold text-gray-800 mb-2">Arrivée</label>
                            <AddressInput
                                value={destination}
                                onChange={(addr, lat, lon) => {
                                    setDestination(addr);
                                    if (lat !== undefined) setDestinationLat(lat);
                                    if (lon !== undefined) setDestinationLon(lon);
                                }}
                                placeholder="Ex: Supermarché du coin"
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <label className="block text-lg font-semibold text-gray-800 mb-2">Date et Heure</label>
                                <input
                                    type="datetime-local"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full text-lg p-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <label className="block text-lg font-semibold text-gray-800 mb-2">Places disponibles</label>
                                <select
                                    value={seats}
                                    onChange={(e) => setSeats(Number(e.target.value))}
                                    className="w-full text-lg p-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(num => (
                                        <option key={num} value={num}>{num} place{num > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <label className="block text-lg font-semibold text-gray-800 mb-2">Participation (Prix)</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-32 text-lg p-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                                />
                                <span className="ml-3 text-xl font-bold text-gray-600">€</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Mettre 0 pour un trajet gratuit (entraide).</p>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="flex-1 py-4 px-6 text-lg font-bold text-gray-600 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors border-b-4 border-gray-300 active:border-b-0 hover:translate-y-1"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-4 px-6 text-lg font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-lg border-b-4 border-green-800 active:border-b-0 hover:translate-y-1"
                            >
                                Valider le Trajet
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

