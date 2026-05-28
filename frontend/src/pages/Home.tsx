import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Home() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const closeMobile = () => setMobileOpen(false);

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 font-sans">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-30 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <div className="text-2xl font-bold tracking-tight text-slate-800">
                    Voisi<span className="text-primary-600">Go</span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex gap-4 items-center">
                    <Link to="/explore" className="text-slate-600 font-bold hover:text-primary-600 transition-colors">Explorer</Link>
                    <Link to="/premium" className="text-amber-600 font-bold hover:text-amber-700 transition-colors flex items-center gap-1">👑 Premium</Link>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    {localStorage.getItem('token') ? (
                        <Link to="/dashboard" className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold shadow hover:bg-blue-700 transition-colors">
                            Mon Tableau de Bord
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="text-slate-600 font-medium hover:text-primary-600 transition-colors">Connexion</Link>
                            <Link to="/register" className="bg-primary-600 text-white px-5 py-2 rounded-full font-bold shadow hover:bg-primary-700 transition-colors">Inscription</Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden items-center">
                    <button
                        onClick={() => setMobileOpen(o => !o)}
                        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                        className="flex flex-col justify-center items-center w-10 h-10 rounded-xl hover:bg-slate-100/80 transition-colors gap-1.5 cursor-pointer relative z-50 border border-slate-200/50 bg-white/50 backdrop-blur-sm shadow-sm"
                    >
                        <span className={`block w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
                    </button>
                </div>
            </nav>

            {/* Mobile menu overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-25 flex flex-col" style={{ top: 76 }}>
                    {/* Menu panel */}
                    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-xl px-6 py-5 flex flex-col gap-3.5 animate-slideDown">
                        {/* Native-like Quick Access Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-1">
                            <Link 
                                to="/explore" 
                                onClick={closeMobile} 
                                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-100/50 transition-all text-center group"
                            >
                                <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">🔍</span>
                                <span className="text-[11px] font-black text-blue-700 uppercase tracking-wide">Explorer</span>
                            </Link>
                            
                            <Link 
                                to="/premium" 
                                onClick={closeMobile} 
                                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-100/50 transition-all text-center group"
                            >
                                <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">👑</span>
                                <span className="text-[11px] font-black text-amber-700 uppercase tracking-wide">Premium</span>
                            </Link>

                            <Link 
                                to={localStorage.getItem('token') ? "/dashboard" : "/login"} 
                                onClick={closeMobile} 
                                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100/80 border border-purple-100/50 transition-all text-center group"
                            >
                                <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">🏠</span>
                                <span className="text-[11px] font-black text-purple-700 uppercase tracking-wide">Tableau de bord</span>
                            </Link>
                        </div>

                        {localStorage.getItem('token') ? (
                            <>
                                <div className="border-t border-slate-100 my-1" />
                                <Link 
                                    to="/dashboard" 
                                    onClick={closeMobile} 
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                                >
                                    💻 Mon Tableau de bord
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="border-t border-slate-100 my-1" />
                                <div className="flex flex-col gap-2">
                                    <Link 
                                        to="/login" 
                                        onClick={closeMobile} 
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        🔑 Connexion
                                    </Link>
                                    <Link 
                                        to="/register" 
                                        onClick={closeMobile} 
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors shadow-md shadow-primary-500/20"
                                    >
                                        ✨ S'inscrire
                                    </Link>
                                </div>
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

            {/* Hero Section */}
            <div className="relative z-10 flex flex-col items-center justify-center pt-10 pb-20 px-4">
                <div className="glass-panel p-10 md:p-14 rounded-3xl shadow-glass text-center max-w-3xl w-full border border-white/50">

                    <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-semibold tracking-wide uppercase">
                        🚀 En Bêta Privée
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight text-slate-900">
                        L'entraide <span className="gradient-text">entre voisins</span><br /> et mobilité locale
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed font-light">
                        Petits services, jardinage, courses... et covoiturage.<br />
                        Simplifiez votre quotidien, ensemble.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
                        <Link
                            to="/register"
                            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-primary-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <span>Je participe</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </Link>

                        <Link
                            to="/explore"
                            className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 text-lg font-bold rounded-xl shadow-md border border-slate-200 transition-all transform hover:-translate-y-1 flex items-center justify-center"
                        >
                            Voir les annonces
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="relative z-10 py-20 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-800 mb-16">Pourquoi rejoindre <span className="text-primary-600">VoisiGo</span> ?</h2>

                    <div className="grid md:grid-cols-3 gap-10">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl mb-6">🤝</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Entraide Locale</h3>
                            <p className="text-slate-600 leading-relaxed">Connectez-vous avec vos voisins pour des trajets courts vers les commerces ou services.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl mb-6">🌱</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Écologique</h3>
                            <p className="text-slate-600 leading-relaxed">Réduisez votre empreinte carbone en partageant vos trajets du quotidien.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-3xl mb-6">🛡️</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">100% Sécurisé</h3>
                            <p className="text-slate-600 leading-relaxed">Profils vérifiés et avis communautaires pour voyager en toute sérénité.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security, Trust & Premium Section */}
            <div className="relative z-10 py-20 bg-slate-900 text-white overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-block px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                                🛡️ Charte de Confiance & Sécurité
                            </span>
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                                Un réseau local basé sur <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">la sécurité absolue</span>
                            </h2>
                            <p className="text-slate-300 text-lg leading-relaxed mb-8">
                                Pour que l'entraide et le covoiturage se fassent l'esprit tranquille, VoisiGo propose des mécanismes de vérification avancés. En validant leur pièce d'identité officielle, les voisins obtiennent un badge de confiance vert <span className="text-emerald-400 font-bold">✓</span>, garantissant l'absence de fraude ou de faux comptes.
                            </p>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3">
                                    <span className="text-emerald-400 text-xl font-bold">✓</span>
                                    <div>
                                        <h4 className="font-bold text-white">Vérification d'Identité Sécurisée</h4>
                                        <p className="text-slate-400 text-sm">Validation de CNI, Passeport ou Permis pour certifier chaque membre.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-emerald-400 text-xl font-bold">✓</span>
                                    <div>
                                        <h4 className="font-bold text-white">Modération active & Avis vérifiés</h4>
                                        <p className="text-slate-400 text-sm">Système de notation et de commentaires sincères après chaque échange.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-emerald-400 text-xl font-bold">✓</span>
                                    <div>
                                        <h4 className="font-bold text-white">Protection Anti-Spam</h4>
                                        <p className="text-slate-400 text-sm">Système de sécurité dynamique bloquant le spam et protégeant vos données.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Premium Card Display */}
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 relative shadow-2xl">
                            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-black uppercase px-4 py-1.5 rounded-bl-2xl rounded-tr-3xl shadow-md tracking-wider">
                                Recommandé 👑
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                                Plan Premium VoisiGo 
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                Soutenez notre projet communautaire tout en profitant d'avantages exclusifs de visibilité et de confort.
                            </p>
                            
                            <ul className="space-y-3.5 mb-8 text-sm text-slate-200">
                                <li className="flex items-center gap-2">
                                    <span className="text-amber-400">👑</span>
                                    <span>Badge Premium exclusif sur votre avatar</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-amber-400">✨</span>
                                    <span>Lueur d'or de visibilité sur vos annonces</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-amber-400">🚫</span>
                                    <span>Zéro publicité dans toute l'application</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-400">🛡️</span>
                                    <span>Vérification d'identité gratuite incluse</span>
                                </li>
                            </ul>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/premium"
                                    className="flex-1 text-center py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-xl transition transform hover:-translate-y-0.5 shadow-lg shadow-amber-500/10"
                                >
                                    Découvrir le Plan Premium
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex-1 text-center py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm rounded-xl transition border border-white/10"
                                >
                                    S'inscrire gratuitement
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
