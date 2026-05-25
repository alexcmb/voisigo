import { useState } from 'react';
import StarRating from './StarRating';
import { API_BASE_URL } from '../lib/api';

interface ReviewModalProps {
    targetUserId: string;
    targetUserName: string;
    relatedType?: 'trip' | 'service';
    relatedId?: string;
    onClose: () => void;
    onSubmitted: () => void;
}

export default function ReviewModal({ targetUserId, targetUserName, relatedType, relatedId, onClose, onSubmitted }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Veuillez sélectionner une note');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ targetUserId, rating, comment, relatedType, relatedId }),
            });

            if (res.ok) {
                onSubmitted();
                onClose();
            } else {
                const data = await res.json();
                setError(data.message || 'Erreur');
            }
        } catch {
            setError('Erreur réseau');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Laisser un avis</h3>
                <p className="text-gray-500 mb-4">Comment s'est passée votre expérience avec <span className="font-semibold text-gray-700">{targetUserName}</span> ?</p>

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center mb-4">
                        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
                    </div>

                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Un commentaire ? (optionnel)"
                        rows={3}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-4"
                    />

                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || rating === 0}
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? '...' : 'Envoyer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
