import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface UserProfileProps {
    user: User;
    token: string;
    onUpdateUser: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, token, onUpdateUser }) => {
    const [name, setName] = useState(user.name);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password && password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/v1/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    password: password || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la mise à jour');
            }

            onUpdateUser(data.user);
            setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-dark-card rounded-xl border border-dark-border shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-dark-border pb-4">
                <div className="p-2 bg-brand-500/10 rounded-lg">
                    <UserIcon className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Mon Profil</h2>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-600 mt-1">L'email ne peut pas être modifié.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nom</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                            required
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-dark-border">
                    <h3 className="text-sm font-medium text-gray-300 mb-4">Changer le mot de passe</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Nouveau mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                                    placeholder="Laisser vide pour ne pas changer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Confirmer le mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                                    placeholder="Confirmer le nouveau mot de passe"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Enregistrer
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;
