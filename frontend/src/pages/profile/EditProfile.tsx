import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../lib/api';
import { useToast } from '../../context/UIContext';

const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
];

export default function EditProfile() {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [isPremium, setIsPremium] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetch(`${API_BASE_URL}/api/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setName(data.name);
                setBio(data.bio || '');
                if (data.avatarUrl) setSelectedAvatar(data.avatarUrl);
                setIsPremium(data.isPremium || false);
                setIsVerified(data.isVerified || false);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, bio, avatarUrl: selectedAvatar }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success('Profil mis à jour avec succès !');
                navigate(`/users/${data.user.id}`);
            } else {
                toast.error('Erreur lors de la mise à jour du profil');
            }
        } catch {
            toast.error('Erreur réseau');
        }
    };

    const handleUpgradePremium = async () => {
        const token = localStorage.getItem('token');
        setUpgrading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/profile/upgrade`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                setIsPremium(true);
                toast.success('👑 Félicitations ! Vous êtes désormais Membre Premium.');
            } else {
                toast.error(data.message || "Erreur lors de l'activation du Premium");
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setUpgrading(false);
        }
    };

    const handleVerifyIdentity = async () => {
        const token = localStorage.getItem('token');
        setVerifying(true);
        // Simulate document check
        setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/users/profile/verify`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setIsVerified(true);
                    toast.success('✅ Votre identité a été vérifiée avec succès !');
                } else {
                    toast.error(data.message || "Erreur lors de la vérification");
                }
            } catch {
                toast.error('Erreur réseau');
            } finally {
                setVerifying(false);
            }
        }, 1200);
    };

    if (loading) return <Layout><div className="text-center p-10">Chargement...</div></Layout>;

    return (
        <Layout>
            <div className="p-4">
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-600">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Mon Profil</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">Choisissez votre Avatar</label>
                            <div className="flex gap-4 overflow-x-auto p-2 pb-4">
                                {AVATARS.map((avatar, index) => (
                                    <img
                                        key={index}
                                        src={avatar}
                                        alt="Avatar"
                                        className={`w-16 h-16 rounded-full cursor-pointer border-4 transition-all ${selectedAvatar === avatar ? 'border-blue-500 scale-110' : 'border-transparent hover:border-gray-300'}`}
                                        onClick={() => setSelectedAvatar(avatar)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Nom complet</label>
                            <input
                                type="text"
                                className="w-full text-lg p-3 border rounded-lg focus:ring-4 focus:ring-blue-200"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Ma bio (quelques mots sur vous)</label>
                            <textarea
                                className="w-full text-lg p-3 border rounded-lg focus:ring-4 focus:ring-blue-200"
                                rows={3}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="J'aime le jardinage et papoter autour d'un café !"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 py-3 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300">Annuler</button>
                            <button type="submit" className="flex-1 py-3 bg-blue-600 rounded-lg font-bold text-white hover:bg-blue-700 shadow-lg">Enregistrer</button>
                        </div>
                    </form>
                </div>

                {/* Premium Plan Card */}
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border-t-4 border-amber-500 mt-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-bl-xl">👑 Optionnel</div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-800 flex items-center gap-2">👑 Plan Premium VoisiGO</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Passez à la vitesse supérieure et devenez membre Premium. Supprimez automatiquement toutes les publicités et arborez un badge couronne exclusif sur vos annonces et votre profil !
                    </p>

                    {isPremium ? (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 text-center">
                            <p className="text-amber-800 dark:text-amber-400 font-bold flex items-center justify-center gap-2 text-lg">
                                🎉 Vous êtes Membre Premium !
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Merci de votre soutien ! Toutes les publicités ont été désactivées.</p>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleUpgradePremium}
                            disabled={upgrading}
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-extrabold rounded-xl transition-all shadow-md transform hover:scale-[1.01] cursor-pointer"
                        >
                            {upgrading ? 'Activation en cours...' : '👑 Activer mon compte Premium (Gratuit / Démo)'}
                        </button>
                    )}
                </div>

                {/* Identity Verification Card */}
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border-t-4 border-emerald-500 mt-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-bl-xl">🔒 Sécurité</div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-800 flex items-center gap-2">✅ Vérification d'Identité</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Rassurez les passagers et vos voisins de quartier en certifiant votre identité. Un badge de confiance vert (Vérifié) sera affiché sur votre profil public.
                    </p>

                    {isVerified ? (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4 text-center">
                            <p className="text-emerald-800 dark:text-emerald-400 font-bold flex items-center justify-center gap-2 text-lg">
                                ✅ Identité Vérifiée
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Votre compte bénéficie de la confiance maximale de la communauté.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Simulateur de soumission de pièce d'identité</p>
                                <select className="w-full p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm text-gray-700 dark:text-slate-300">
                                    <option>🪪 Carte Nationale d'Identité</option>
                                    <option>🛂 Passeport</option>
                                    <option>🪪 Permis de Conduire</option>
                                </select>
                                <div className="mt-3 p-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg text-center text-xs text-gray-400">
                                    📂 glisser_deposer_identite.pdf (Simulé)
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleVerifyIdentity}
                                disabled={verifying}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-extrabold rounded-xl transition-all shadow-md transform hover:scale-[1.01] cursor-pointer"
                            >
                                {verifying ? 'Analyse des documents...' : '✅ Soumettre ma vérification (Simulée)'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
