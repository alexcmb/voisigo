import type { Trip as TripType, Service as ServiceType } from '../types';
import { CATEGORY_EMOJIS } from '../types';

type Listing = (TripType & { kind: 'trip' }) | (ServiceType & { kind: 'service' });

interface ListingDetailsModalProps {
    item: Listing;
    onClose: () => void;
    onContact: (recipientId: string, type: 'trip' | 'service', id: string) => void;
    onBook?: (tripId: string) => void;
    currentUserId?: string;
}

export default function ListingDetailsModal({ item, onClose, onContact, onBook, currentUserId }: ListingDetailsModalProps) {
    const isTrip = item.kind === 'trip';
    const isOwner = currentUserId && (isTrip ? (item as any).driverId === currentUserId : (item as any).authorId === currentUserId);

    // Helper for rendering
    const renderTrip = (trip: TripType & { kind: 'trip' }) => (
        <>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full text-2xl">🚗</div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Covoiturage</h2>
                        <p className="text-gray-500">Proposé par {trip.driverName}</p>
                    </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                    {trip.price === 0 ? 'Gratuit' : `${trip.price} €`}
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-3 text-lg font-semibold mb-2">
                    <span>{trip.departure}</span>
                    <span className="text-gray-400">➜</span>
                    <span>{trip.destination}</span>
                </div>
                <div className="text-gray-600">
                    📅 {new Date(trip.date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Fermer</button>
                {!isOwner && (
                    <>
                        <button
                            onClick={() => onContact(trip.driverId, 'trip', trip.id)}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold"
                        >
                            Contacter
                        </button>
                        {/* Booking logic simplified for modal */}
                        {onBook && (
                            <button
                                onClick={() => onBook(trip.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                            >
                                Réserver
                            </button>
                        )}
                    </>
                )}
            </div>
        </>
    );

    const renderService = (service: ServiceType & { kind: 'service' }) => {
        const isRequest = service.type === 'request';
        const icon = CATEGORY_EMOJIS[service.category] || '✨';

        return (
            <>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-full text-2xl ${isRequest ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{service.title}</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`font-bold uppercase ${isRequest ? 'text-orange-600' : 'text-green-600'}`}>
                                {isRequest ? "Demande" : "Offre"}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500">Par {service.authorName}</span>
                        </div>
                    </div>
                </div>

                <div className="prose prose-blue mb-6 text-gray-600">
                    <p>{service.description}</p>
                </div>

                {service.location && (
                    <div className="flex items-center gap-2 text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
                        <span>📍</span> {service.location}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Fermer</button>
                    {!isOwner && (
                        <button
                            onClick={() => onContact(service.authorId, 'service', service.id)}
                            className={`px-4 py-2 rounded-lg font-bold text-white ${isRequest ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                            Contacter
                        </button>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                    ✕
                </button>

                {isTrip ? renderTrip(item as any) : renderService(item as any)}
            </div>
        </div>
    );
}
