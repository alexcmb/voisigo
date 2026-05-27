import { useState, useEffect } from 'react';
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

    const [vehicleType, setVehicleType] = useState('citadine');
    const [fuelType, setFuelType] = useState('essence');
    const [distance, setDistance] = useState<number | null>(null);
    const [fetchingDistance, setFetchingDistance] = useState(false);

    const handleVehicleChange = (val: string) => {
        setVehicleType(val);
        if (val === 'electrique') {
            setFuelType('electrique');
        } else if (fuelType === 'electrique') {
            setFuelType('essence');
        }
    };

    useEffect(() => {
        if (departureLat !== undefined && departureLon !== undefined && destinationLat !== undefined && destinationLon !== undefined) {
            setFetchingDistance(true);
            const url = `https://router.project-osrm.org/route/v1/driving/${departureLon},${departureLat};${destinationLon},${destinationLat}?overview=false`;
            
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data.code === 'Ok' && data.routes?.[0]) {
                        setDistance(Math.round(data.routes[0].distance / 1000));
                    } else {
                        setDistance(calculateStraightLine(departureLat, departureLon, destinationLat, destinationLon));
                    }
                })
                .catch(() => {
                    setDistance(calculateStraightLine(departureLat, departureLon, destinationLat, destinationLon));
                })
                .finally(() => setFetchingDistance(false));
        } else {
            setDistance(null);
        }
    }, [departureLat, departureLon, destinationLat, destinationLon]);

    const calculateStraightLine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    };

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
                    price: Number(price),
                    vehicleType,
                    fuelType
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

                        {/* Vehicle & Fuel Selector */}
                        <div className="bg-blue-50 dark:bg-slate-900 p-4 rounded-lg border border-blue-100 dark:border-slate-800">
                            <label className="block text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3">Véhicule et Motorisation</label>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Catégorie du véhicule</label>
                                    <select
                                        value={vehicleType}
                                        onChange={(e) => handleVehicleChange(e.target.value)}
                                        className="w-full text-base p-2.5 border border-gray-300 rounded-lg bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-gray-800 dark:text-slate-200"
                                    >
                                        <option value="citadine">🚗 Citadine (ex: Clio, 208)</option>
                                        <option value="berline">🚘 Berline (ex: Megane, Golf)</option>
                                        <option value="suv">🚙 SUV / Monospace / Break</option>
                                        <option value="electrique">⚡ Électrique</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Type de carburant</label>
                                    <select
                                        value={fuelType}
                                        onChange={(e) => setFuelType(e.target.value)}
                                        className="w-full text-base p-2.5 border border-gray-300 rounded-lg bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-gray-800 dark:text-slate-200"
                                        disabled={vehicleType === 'electrique'}
                                    >
                                        <option value="essence">⛽ Sans Plomb 95/98 (1.85 €/L)</option>
                                        <option value="gasoil">⛽ Diesel / Gazole (1.72 €/L)</option>
                                        <option value="electrique">⚡ Électricité (0.25 €/kWh)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Price Calculator Widget */}
                            {fetchingDistance ? (
                                <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-950 border border-blue-100 dark:border-slate-800 flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm text-gray-500 dark:text-slate-400">Calcul de la distance et du coût estimé...</span>
                                </div>
                            ) : distance !== null ? (
                                <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-950 border border-blue-100 dark:border-slate-800 shadow-inner flex flex-col gap-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 dark:text-slate-400">Distance de l'itinéraire :</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{distance} km</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 dark:text-slate-400">Consommation théorique :</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {vehicleType === 'citadine' && '5.2 L/100km'}
                                            {vehicleType === 'berline' && '6.5 L/100km'}
                                            {vehicleType === 'suv' && '8.0 L/100km'}
                                            {vehicleType === 'electrique' && '17.0 kWh/100km'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 dark:text-slate-400">Estimation coût carburant du trajet :</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {(() => {
                                                const cons = vehicleType === 'citadine' ? 5.2 : vehicleType === 'berline' ? 6.5 : vehicleType === 'suv' ? 8.0 : 17.0;
                                                const pricePerUnit = vehicleType === 'electrique' || fuelType === 'electrique' ? 0.25 : fuelType === 'essence' ? 1.85 : 1.72;
                                                const total = (distance * (cons / 100) * pricePerUnit);
                                                return `${total.toFixed(2)} €`;
                                            })()}
                                        </span>
                                    </div>
                                    <hr className="border-slate-100 dark:border-slate-800/80" />
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                        <div>
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide block">Prix suggéré équitable / passager</span>
                                            <span className="text-xs text-gray-400 dark:text-slate-500">(Coût divisé par {seats + 1} occupants)</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-black text-green-600 dark:text-green-400">
                                                {(() => {
                                                    const cons = vehicleType === 'citadine' ? 5.2 : vehicleType === 'berline' ? 6.5 : vehicleType === 'suv' ? 8.0 : 17.0;
                                                    const pricePerUnit = vehicleType === 'electrique' || fuelType === 'electrique' ? 0.25 : fuelType === 'essence' ? 1.85 : 1.72;
                                                    const total = (distance * (cons / 100) * pricePerUnit);
                                                    const suggested = total / (seats + 1);
                                                    return `${Math.max(1, Math.round(suggested))} €`;
                                                })()}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const cons = vehicleType === 'citadine' ? 5.2 : vehicleType === 'berline' ? 6.5 : vehicleType === 'suv' ? 8.0 : 17.0;
                                                    const pricePerUnit = vehicleType === 'electrique' || fuelType === 'electrique' ? 0.25 : fuelType === 'essence' ? 1.85 : 1.72;
                                                    const total = (distance * (cons / 100) * pricePerUnit);
                                                    const suggested = total / (seats + 1);
                                                    setPrice(Math.max(1, Math.round(suggested)));
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition cursor-pointer shadow-sm"
                                            >
                                                Appliquer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 text-xs text-gray-500 dark:text-slate-400 italic text-center">
                                    Renseignez les adresses de départ et d'arrivée pour calculer la distance et estimer le prix.
                                </div>
                            )}
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

