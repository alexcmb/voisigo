import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="relative z-10 bg-slate-900 text-slate-300 py-12">
            <div className="max-w-7xl mx-auto px-6 text-center md:text-left">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="text-2xl font-bold text-white mb-4">VoisiGo</div>
                        <p className="max-w-xs mx-auto md:mx-0 text-slate-400">La plateforme de mobilité solidaire qui rapproche les voisins.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Liens Utiles</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-primary-400">Accueil</Link></li>
                            <li><Link to="/explore" className="hover:text-primary-400">Explorer le fil</Link></li>
                            <li><Link to="/login" className="hover:text-primary-400">Connexion</Link></li>
                            <li><Link to="/register" className="hover:text-primary-400">Inscription</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Contact</h4>
                        <ul className="space-y-2 text-sm">
                            <li>support@voisigo.fr</li>
                            <li>Aide & FAQ</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 text-sm text-slate-500">
                    © 2026 VoisiGo. Tous droits réservés.
                </div>
            </div>
        </footer>
    );
}
