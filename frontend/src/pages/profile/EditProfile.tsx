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
    const [loading, setLoading] = useState(true);
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
            </div>
        </Layout>
    );
}
