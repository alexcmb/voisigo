import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Premium() {
    const isPremium = JSON.parse(localStorage.getItem('user') || '{}').isPremium === true;

    return (
        <Layout>
            <div className="min-h-screen py-12 px-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
                {/* Visual Blobs */}
                <div className="absolute top-10 left-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-bold tracking-wide uppercase mb-4 animate-bounce">
                            👑 Programme de Confiance Premium
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-950 dark:text-white tracking-tight mb-4">
                            Valorisez votre confiance avec <span className="gradient-text">Premium</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                            Bénéficiez d'une visibilité maximale, supprimez les publicités et renforcez la sécurité de notre communauté locale grâce à la vérification d'identité.
                        </p>
                    </div>

                    {/* Security & Verification Section First */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl mb-12 hover:shadow-2xl transition-all duration-300">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-20 h-20 md:w-28 md:h-28 bg-emerald-100 dark:bg-emerald-950/40 rounded-3xl flex items-center justify-center text-4xl md:text-5xl shrink-0 shadow-lg shadow-emerald-500/10 border border-emerald-200 dark:border-emerald-950/20">
                                🛡️
                            </div>
                            <div>
                                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    Priorité Sécurité & Transparence
                               </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-950 dark:text-white mb-3">
                                    La vérification d'identité pour tous 
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                                    La sécurité est le pilier de **VoisiGo**. C'est pourquoi nous mettons l'accent sur la validation d'identité (Carte d'identité, Passeport ou Permis de conduire). En vérifiant votre compte, vous obtenez le badge vert <span className="text-emerald-500 font-bold">✓</span> à côté de votre nom. Ce gage d'authenticité élimine les faux profils et instaure un climat de confiance réciproque entre voisins pour le covoiturage et l'entraide.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Core Features Grid */}
                    <h3 className="text-2xl font-bold text-center text-slate-950 dark:text-white mb-8">Les avantages exclusifs du plan Premium</h3>
                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        {/* Feature 1 */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="text-3xl mb-4">👑</div>
                            <h4 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Badge d'Honneur</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Affichez fièrement votre badge couronne sur votre profil et sur toutes vos publications de trajets et d'entraide.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="text-3xl mb-4">✨</div>
                            <h4 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Boost de Visibilité</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Vos annonces se démarquent instantanément dans le fil avec un liseré doré et un effet lumineux haut de gamme.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="text-3xl mb-4">🚫</div>
                            <h4 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Zéro Publicité</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Profitez d'une navigation 100% propre. Toutes les bannières publicitaires sont automatiquement et définitivement retirées de l'application.
                            </p>
                        </div>
                    </div>

                    {/* Comparative Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg mb-16">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-center">
                            <h4 className="text-xl font-bold text-slate-950 dark:text-white">Comparez les formules</h4>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            <div className="grid grid-cols-3 p-4 font-bold text-slate-400 uppercase tracking-wider text-xs">
                                <div>Avantage</div>
                                <div>Standard</div>
                                <div className="text-amber-500">Premium 👑</div>
                            </div>
                            <div className="grid grid-cols-3 p-4 text-slate-600 dark:text-slate-300">
                                <div className="font-medium">Création d'annonces</div>
                                <div>Illimitée</div>
                                <div className="font-semibold text-slate-900 dark:text-white">Illimitée</div>
                            </div>
                            <div className="grid grid-cols-3 p-4 text-slate-600 dark:text-slate-300">
                                <div className="font-medium">Accompagnement communauté</div>
                                <div>Standard</div>
                                <div className="font-semibold text-slate-900 dark:text-white">Prioritaire</div>
                            </div>
                            <div className="grid grid-cols-3 p-4 text-slate-600 dark:text-slate-300">
                                <div className="font-medium">Publicités (Ads)</div>
                                <div>Affichées (bouton masquer)</div>
                                <div className="font-semibold text-emerald-600 dark:text-emerald-400">Totalement Supprimées 🚫</div>
                            </div>
                            <div className="grid grid-cols-3 p-4 text-slate-600 dark:text-slate-300">
                                <div className="font-medium">Visibilité dans le fil (Explore)</div>
                                <div>Normale</div>
                                <div className="font-semibold text-amber-500">Boostée (Lueur d'Or) ✨</div>
                            </div>
                            <div className="grid grid-cols-3 p-4 text-slate-600 dark:text-slate-300">
                                <div className="font-medium">Badge Premium de confiance</div>
                                <div>Non</div>
                                <div className="font-semibold text-amber-500">Oui, Badge 👑</div>
                            </div>
                            <div className="grid grid-cols-3 p-4 text-slate-600 dark:text-slate-300">
                                <div className="font-medium">Vérification de sécurité</div>
                                <div>Optionnelle</div>
                                <div className="font-semibold text-emerald-600 dark:text-emerald-400">Conseillée (Badge ✓ Offert)</div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Simulator Redirect Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-slate-900 dark:to-slate-800 text-white rounded-3xl p-8 text-center shadow-xl border border-blue-500/20 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none"></div>
                        <h3 className="text-3xl font-extrabold mb-3">
                            {isPremium ? "Vous êtes membre Premium ! 🎉" : "Prêt à franchir le pas ?"}
                        </h3>
                        <p className="text-blue-100 dark:text-slate-300 max-w-lg mx-auto mb-6 text-sm md:text-base leading-relaxed">
                            {isPremium 
                                ? "Merci de soutenir VoisiGo et d'aider à faire grandir un réseau de confiance local et sécurisé." 
                                : "Activez le mode Premium et vérifiez votre identité directement depuis votre profil utilisateur en quelques secondes."
                            }
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/profile"
                                className="px-6 py-3 bg-white text-blue-700 hover:bg-slate-50 text-sm font-bold rounded-xl shadow-md transition transform hover:-translate-y-0.5"
                            >
                                {isPremium ? "Gérer mon compte & ID" : "Activer Premium & Vérifier mon identité"}
                            </Link>
                            <Link
                                to="/explore"
                                className="px-6 py-3 bg-blue-500/30 hover:bg-blue-500/50 text-white text-sm font-bold rounded-xl transition border border-white/10"
                            >
                                Retour au fil d'actu
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
