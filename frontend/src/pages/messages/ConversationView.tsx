import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../lib/api';
import type { Message } from '../../types';

interface OtherUser {
    id: string;
    name: string;
    avatarUrl?: string;
}

export default function ConversationView() {
    const { id } = useParams<{ id: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
    const [relatedItem, setRelatedItem] = useState<any | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = () => {
        fetch(`${API_BASE_URL}/api/messages/conversations/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                setMessages(data.messages || []);
                setOtherUser(data.otherUser);
                setRelatedItem(data.relatedItem);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchMessages();
        // Polling every 5 seconds for new messages
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/messages/conversations/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: newMessage.trim() }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data.message]);
                setNewMessage('');
            }
        } catch {
            alert('Erreur lors de l\'envoi');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    for (const msg of messages) {
        const msgDate = new Date(msg.createdAt).toDateString();
        if (msgDate !== currentDate) {
            currentDate = msgDate;
            groupedMessages.push({ date: msg.createdAt, messages: [msg] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(msg);
        }
    }

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-180px)] max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white rounded-t-xl">
                    <Link to="/messages" className="text-gray-400 hover:text-blue-600 text-xl transition-colors">
                        ←
                    </Link>
                    {otherUser?.avatarUrl ? (
                        <img src={otherUser.avatarUrl} alt="" className="w-10 h-10 rounded-full border-2 border-gray-100" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">👤</div>
                    )}
                    <div>
                        <h2 className="font-bold text-gray-800">{otherUser?.name || 'Chargement...'}</h2>
                        <p className="text-xs text-gray-400">Conversation privée</p>
                    </div>
                </div>

                {/* Related Item Context */}
                {relatedItem && (
                    <div className="bg-blue-50 border-b border-blue-100 p-3 flex items-center justify-between shadow-sm z-10">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">
                                {relatedItem.type === 'trip' || (relatedItem as any).driverId ? '🚗' :
                                    relatedItem.type === 'request' ? '🙋' : '💪'}
                            </span>
                            <div className="text-sm">
                                <p className="font-bold text-blue-900">
                                    {(relatedItem as any).driverId
                                        ? `Trajet: ${(relatedItem as any).departure} ➔ ${(relatedItem as any).destination}`
                                        : `Service: ${(relatedItem as any).title}`
                                    }
                                </p>
                                <p className="text-blue-700 text-xs">
                                    {new Date(relatedItem.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    {(relatedItem as any).price > 0 ? ` • ${(relatedItem as any).price} €` : ' • Gratuit'}
                                </p>
                            </div>
                        </div>
                        <Link to={(relatedItem as any).driverId ? `/trips` : `/services`} className="text-xs bg-white text-blue-600 px-3 py-1 rounded-full font-bold border border-blue-200 hover:bg-blue-50">
                            Voir
                        </Link>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Chargement des messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <div className="text-4xl mb-2">👋</div>
                            <p>Commencez la conversation !</p>
                        </div>
                    ) : (
                        groupedMessages.map((group, gi) => (
                            <div key={gi}>
                                <div className="flex justify-center my-4">
                                    <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full">
                                        {formatDate(group.date)}
                                    </span>
                                </div>
                                {group.messages.map((msg) => {
                                    const isMe = msg.senderId === currentUser.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMe
                                                    ? 'bg-blue-600 text-white rounded-br-md'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 rounded-b-xl">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Votre message..."
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {sending ? '...' : '➤'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
