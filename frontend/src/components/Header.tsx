import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';
import type { AppNotification } from '../types';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setMobileOpen(false);
        navigate('/');
    };

    const closeMobile = () => setMobileOpen(false);

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

    // Close notification dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const handleNotifClick = async (notif: AppNotification) => {
        if (!notif.read) {
            await fetch(`${API_BASE_URL}/api/notifications/${notif.id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: 1 } : n));
        }
        setShowNotifs(false);
        if (notif.type === 'new_message' && notif.relatedId) {
            navigate(`/messages/${notif.relatedId}`);
        } else if (
            ['new_booking_request', 'booking_cancelled', 'booking_approved', 'booking_rejected', 'trip_completed'].includes(notif.type) &&
            notif.relatedId
        ) {
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
        <>
            {/* ── Desktop/Mobile top bar ── */}
            <div className="w-full px-6 flex justify-between items-center py-4 mb-2 relative z-50">
                {/* Logo */}
                <Link
                    to={token ? '/dashboard' : '/'}
                    className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 hover:opacity-80 transition-opacity"
                >
                    Voisi<span className="text-primary-600">Go</span>
                </Link>

                {/* ── Desktop nav ── */}
                <div className="hidden md:flex gap-4 items-center">
                    <Link to="/explore" className="font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Explorer</Link>
                    <Link to="/premium" className="font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 transition-colors flex items-center gap-1">👑 Premium</Link>

                    {token ? (
                        <>
                            <Link to="/messages" className="font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Messages">💬</Link>

                            {/* Notification bell */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowNotifs(!showNotifs)}
                                    className="font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative cursor-pointer"
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
                                    <div className="absolute right-0 top-8 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
                                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                                            <span className="font-bold text-gray-800 dark:text-slate-100">Notifications</span>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                                    Tout marquer lu
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-gray-400 dark:text-slate-500 text-sm">Aucune notification</div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <button
                                                        key={notif.id}
                                                        onClick={() => handleNotifClick(notif)}
                                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700/50 flex gap-3 items-start cursor-pointer ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                                                    >
                                                        <span className="text-lg mt-0.5">{notifIcon(notif.type)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{notif.title}</div>
                                                            <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{notif.message}</div>
                                                            <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{timeAgo(notif.createdAt)}</div>
                                                        </div>
                                                        {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link to="/dashboard" className="font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Tableau de bord</Link>
                            <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-1" />
                            
                            {/* Theme Toggle (Desktop) */}
                            <button
                                onClick={toggleTheme}
                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-sm border border-gray-200/50 dark:border-slate-700/50 cursor-pointer"
                                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                            >
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </button>

                            <div className="flex items-center gap-3">
                                <Link to="/profile" className="relative group">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Me" className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-xs">👤</div>
                                    )}

                                    {/* Overlay status badges */}
                                    <div className="absolute -bottom-1 -right-1 flex gap-0.5 pointer-events-none">
                                        {user.isPremium && (
                                            <span className="w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm border border-white dark:border-slate-900" title="Premium">👑</span>
                                        )}
                                        {user.isVerified && (
                                            <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm border border-white dark:border-slate-900" title="Profil vérifié">✓</span>
                                        )}
                                    </div>
                                </Link>
                                <button onClick={handleLogout} className="text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded cursor-pointer">
                                    ✕
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-1" />
                            
                            {/* Theme Toggle (Desktop - Non connecté) */}
                            <button
                                onClick={toggleTheme}
                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-sm border border-gray-200/50 dark:border-slate-700/50 cursor-pointer mr-1"
                                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                            >
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </button>

                            <Link to="/login" className="font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Connexion</Link>
                            <Link to="/register" className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors">
                                S'inscrire
                            </Link>
                        </>
                    )}
                </div>

                {/* ── Mobile: notif badge + theme toggle + hamburger ── */}
                <div className="flex md:hidden items-center gap-3">
                    {/* Theme Toggle (Mobile) */}
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-sm border border-gray-200/50 dark:border-slate-700/50 cursor-pointer"
                        title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {token && unreadCount > 0 && (
                        <Link to="/dashboard" className="relative">
                            <span className="text-lg">🔔</span>
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        </Link>
                    )}

                    <button
                        onClick={() => setMobileOpen(o => !o)}
                        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                        className="flex flex-col justify-center items-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors gap-1.5 cursor-pointer"
                    >
                        <span className={`block w-5 h-0.5 bg-gray-700 dark:bg-slate-300 rounded transition-all duration-300 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-gray-700 dark:bg-slate-300 rounded transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-gray-700 dark:bg-slate-300 rounded transition-all duration-300 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ── Mobile menu overlay ── */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex flex-col" style={{ top: 64 }}>
                    {/* Menu panel */}
                    <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-xl px-6 py-5 flex flex-col gap-2.5 animate-slideDown">
                        {/* Native-like Quick Access Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-2">
                            <Link 
                                to="/explore" 
                                onClick={closeMobile} 
                                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-blue-50 dark:bg-slate-800/80 hover:bg-blue-100 dark:hover:bg-slate-700/50 border border-blue-100/50 dark:border-slate-700/30 transition-all text-center group"
                            >
                                <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">🔍</span>
                                <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wide">Explorer</span>
                            </Link>
                            
                            <Link 
                                to="/premium" 
                                onClick={closeMobile} 
                                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30 border border-amber-100/50 dark:border-amber-950/10 transition-all text-center group"
                            >
                                <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">👑</span>
                                <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">Premium</span>
                            </Link>

                            <Link 
                                to={token ? "/dashboard" : "/login"} 
                                onClick={closeMobile} 
                                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/30 border border-purple-100/50 dark:border-purple-950/10 transition-all text-center group"
                            >
                                <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">🏠</span>
                                <span className="text-[11px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-wide">Tableau de bord</span>
                            </Link>
                        </div>

                        {token ? (
                            <>
                                <div className="border-t border-gray-100 dark:border-slate-800 my-1" />
                                <Link to="/trips" onClick={closeMobile}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-slate-300 font-medium hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                                    🚗 <span>Covoiturage</span>
                                </Link>
                                <Link to="/services" onClick={closeMobile}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-slate-300 font-medium hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                                    🤝 <span>Services</span>
                                </Link>
                                <Link to="/messages" onClick={closeMobile}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-slate-300 font-medium hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                                    💬 <span>Messages</span>
                                </Link>
                                <Link to="/profile" onClick={closeMobile}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-slate-300 font-medium hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                                    👤 <span>Mon profil</span>
                                </Link>
                                <div className="border-t border-gray-100 dark:border-slate-800 my-1" />
                                <button onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full text-left cursor-pointer">
                                    🚪 <span>Déconnexion</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="border-t border-gray-100 dark:border-slate-800 my-1" />
                                <Link to="/login" onClick={closeMobile}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-slate-300 font-medium hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                                    🔑 <span>Connexion</span>
                                </Link>
                                <Link to="/register" onClick={closeMobile}
                                    className="flex items-center justify-center gap-2 mx-4 py-3 rounded-xl bg-blue-600 dark:bg-blue-700 text-white font-bold hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors">
                                    ✨ S'inscrire
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Backdrop */}
                    <div
                        className="flex-1 bg-black/20 backdrop-blur-sm"
                        onClick={closeMobile}
                    />
                </div>
            )}
        </>
    );
}
