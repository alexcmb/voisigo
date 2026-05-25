import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Home() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 font-sans">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <div className="text-2xl font-bold tracking-tight text-slate-800">
                    Voisi<span className="text-primary-600">Go</span>
                </div>
                <div className="flex gap-4 items-center">
                    <Link to="/explore" className="text-slate-600 font-bold hover:text-primary-600 transition-colors">Explorer</Link>
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
            </nav>

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

            <Footer />
        </div>
    );
}
