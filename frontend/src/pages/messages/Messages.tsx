import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../lib/api';
import type { ConversationWithPreview } from '../../types';

export default function Messages() {
    const [conversations, setConversations] = useState<ConversationWithPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const token = localStorage.getItem('token');

    const fetchConversations = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/messages/conversations`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                setConversations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleDelete = async () => {
        if (!confirm(`Supprimer ${selectedIds.size} conversation(s) ?`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/messages/conversations/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ conversationIds: Array.from(selectedIds) }),
            });

            if (res.ok) {
                setIsEditing(false);
                setSelectedIds(new Set());
                fetchConversations();
            } else {
                alert('Erreur lors de la suppression');
            }
        } catch (err) {
            console.error(err);
            alert('Erreur réseau');
        }
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins}min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return d.toLocaleDateString('fr-FR');
    };

    return (
        <Layout>
            <div className="p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">💬 Messages</h1>
                        {conversations.length > 0 && (
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-gray-500 hover:text-gray-700 font-medium px-3 py-1"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={selectedIds.size === 0}
                                            className={`px-4 py-1 rounded-lg font-bold transition ${selectedIds.size > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            Supprimer ({selectedIds.size})
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition"
                                    >
                                        Modifier
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-lg text-gray-400">Chargement...</div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">💬</div>
                            <h2 className="text-xl font-bold text-gray-700 mb-2">Pas encore de messages</h2>
                            <p className="text-gray-500 mb-6">Contactez un voisin depuis le fil d'actualité pour démarrer une conversation !</p>
                            <Link to="/explore" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
                                Explorer le fil
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {conversations.map(conv => (
                                <div key={conv.id} className="relative group">
                                    {isEditing && (
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(conv.id)}
                                                onChange={() => toggleSelection(conv.id)}
                                                className="w-5 h-5 accent-red-500 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                    <Link
                                        to={isEditing ? '#' : `/messages/${conv.id}`}
                                        onClick={(e) => {
                                            if (isEditing) {
                                                e.preventDefault();
                                                toggleSelection(conv.id);
                                            }
                                        }}
                                        className={`block bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all ${isEditing ? 'pl-12 cursor-pointer' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                {conv.otherUserAvatar ? (
                                                    <img src={conv.otherUserAvatar} alt="" className="w-12 h-12 rounded-full border-2 border-gray-100 group-hover:border-blue-200 transition" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl group-hover:bg-blue-200 transition">
                                                        👤
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="font-bold text-gray-800 truncate">{conv.otherUserName}</h3>
                                                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt || conv.createdAt)}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {conv.lastMessage || 'Nouvelle conversation'}
                                                </p>
                                                {conv.relatedType && (
                                                    <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                        {conv.relatedType === 'trip' ? '🚗 Covoiturage' : '🤝 Entraide'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Arrow */}
                                            {!isEditing && <div className="text-gray-300 group-hover:text-blue-400 transition">›</div>}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
