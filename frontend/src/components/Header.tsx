import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';
import type { AppNotification } from '../types';

export default function Header() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    // Poll unread count
    useEffect(() => {
        if (!token) return;
        const fetchCount = () => {
            fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
                .then(res => res.json())
                .then(data => setUnreadCount(data.unreadCount || 0))
                .catch(() => { });
        };
        fetchCount();
        const interval = setInterval(fetchCount, 15000);
        return () => clearInterval(interval);
    }, [token]);

    // Fetch full notifications when dropdown opens
    useEffect(() => {
        if (!showNotifs || !token) return;
        fetch(`${API_BASE_URL}/api/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            })
            .catch(() => { });
    }, [showNotifs, token]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNotifClick = async (notif: AppNotification) => {
        // Mark as read
        if (notif.read === 0) {
            await fetch(`${API_BASE_URL}/api/notifications/${notif.id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: 1 } : n));
        }

        setShowNotifs(false);

        // Navigate to the relevant page based on notification type
        if (notif.type === 'new_message' && notif.relatedId) {
            navigate(`/messages/${notif.relatedId}`);
        } else if (
            (notif.type === 'new_booking_request' ||
             notif.type === 'booking_cancelled' ||
             notif.type === 'booking_approved' ||
             notif.type === 'booking_rejected' ||
             notif.type === 'trip_completed') &&
            notif.relatedId
        ) {
            // Navigate directly to the specific trip detail page
            navigate(`/trips/${notif.relatedId}`);
        } else if (notif.type === 'new_review' || notif.type === 'review') {
            navigate('/profile');
        }
    };

    const markAllRead = async () => {
        await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'à l\'instant';
        if (mins < 60) return `il y a ${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `il y a ${hours}h`;
        return `il y a ${Math.floor(hours / 24)}j`;
    };

    const notifIcon = (type: string) => {
        switch (type) {
            case 'new_message':         return '💬';
            case 'new_booking_request': return '🎫';
            case 'booking_approved':    return '✅';
            case 'booking_rejected':    return '❌';
            case 'booking_cancelled':   return '🚫';
            case 'trip_completed':      return '🏁';
            case 'new_review':          return '⭐';
            default:                    return '🔔';
        }
    };

    return (
        <div className="w-full px-8 flex justify-between items-center py-6 mb-2">
            <Link to={token ? "/dashboard" : "/"} className="text-2xl font-bold tracking-tight text-slate-800 hover:opacity-80 transition-opacity flex items-center gap-2">
                <span>Voisi<span className="text-primary-600">Go</span></span>
            </Link>
            <div className="flex gap-4 items-center">
                <Link to="/explore" className="font-medium text-gray-600 hover:text-blue-600 transition-colors">Explorer</Link>
                {token ? (
                    <>
                        <Link to="/messages" className="font-medium text-gray-600 hover:text-blue-600 transition-colors" title="Messages">
                            💬
                        </Link>

                        {/* Notification bell */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowNotifs(!showNotifs)}
                                className="font-medium text-gray-600 hover:text-blue-600 transition-colors relative"
                                title="Notifications"
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifs && (
                                <div className="absolute right-0 top-8 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                                        <span className="font-bold text-gray-800">Notifications</span>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                                                Tout marquer lu
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400 text-sm">Aucune notification</div>
                                        ) : (
                                            notifications.map(notif => (
                                                <button
                                                    key={notif.id}
                                                    onClick={() => handleNotifClick(notif)}
                                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 flex gap-3 items-start ${notif.read === 0 ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    <span className="text-lg mt-0.5">{notifIcon(notif.type)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-800 truncate">{notif.title}</div>
                                                        <div className="text-xs text-gray-500 truncate">{notif.message}</div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">{timeAgo(notif.createdAt)}</div>
                                                    </div>
                                                    {notif.read === 0 && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link to="/dashboard" className="font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            Tableau de bord
                        </Link>
                        <div className="h-6 w-px bg-gray-300 mx-1"></div>
                        <div className="flex items-center gap-3">
                            <Link to="/profile">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Me" className="w-8 h-8 rounded-full border border-gray-200" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs">👤</div>
                                )}
                            </Link>
                            <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors hover:bg-red-50 px-2 py-1 rounded">
                                ✕
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="h-6 w-px bg-gray-300 mx-1"></div>
                        <Link to="/login" className="font-medium text-gray-600 hover:text-blue-600 transition-colors">Connexion</Link>
                    </>
                )}
            </div>
        </div>
    );
}
