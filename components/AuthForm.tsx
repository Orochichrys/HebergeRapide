import React, { useState } from 'react';
import { User } from '../types';

interface AuthFormProps {
    onLogin: (token: string, user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/api/v1/login' : '/api/v1/register';
            const body = isLogin ? { email, password } : { name, email, password };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            if (isLogin) {
                onLogin(data.token, data.user);
            } else {
                // Auto login after register or ask to login
                setIsLogin(true);
                setError('Compte créé avec succès ! Veuillez vous connecter.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center text-brand-400">
                    {isLogin ? 'Connexion' : 'Inscription'}
                </h2>

                {error && (
                    <div className={`p-3 rounded mb-4 text-sm ${error.includes('succès') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Nom</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-brand-500"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-brand-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-brand-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                    {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="ml-2 text-brand-400 hover:underline"
                    >
                        {isLogin ? "S'inscrire" : "Se connecter"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
