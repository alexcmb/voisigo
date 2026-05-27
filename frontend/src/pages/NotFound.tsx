import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function NotFound() {
    return (
        <Layout showHeader={true} showFooter={true}>
            <div className="flex items-center justify-center min-h-[70vh] p-6 text-center">
                <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-glass animate-in border border-gray-200/50">
                    <span className="text-8xl block mb-6 animate-bounce">🧭</span>
                    <h1 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">Voisin perdu ?</h1>
                    <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                        Désolé, la page que vous recherchez n'existe pas ou a été déplacée. Vos voisins sont toujours là, mais cette adresse s'est égarée !
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        🏠 Retour à la maison
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
