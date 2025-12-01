import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Sparkles, Send, FileCode, Palette, Braces, Loader2 } from 'lucide-react';
import CodeEditor from './CodeEditor';
import { Deployment } from '../types';
import { analyzeCodeWithGemini } from '../services/aiService';

interface CodeEditorPageProps {
    token: string | null;
}

type EditorTab = 'html' | 'css' | 'js';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const CodeEditorPage: React.FC<CodeEditorPageProps> = ({ token }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [deployment, setDeployment] = useState<Deployment | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [code, setCode] = useState('');
    const [css, setCss] = useState('');
    const [js, setJs] = useState('');
    const [activeTab, setActiveTab] = useState<EditorTab>('html');

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [userMessage, setUserMessage] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);

    useEffect(() => {
        fetchDeployment();
    }, [id]);

    const fetchDeployment = async () => {
        if (!token || !id) return;

        try {
            const response = await fetch(`/api/v1/sites/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDeployment(data);
                setCode(data.code || '');
                setCss(data.css || '');
                setJs(data.js || '');
            } else {
                console.error('Failed to fetch deployment');
                navigate('/');
            }
        } catch (error) {
            console.error('Error fetching deployment:', error);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!token || !id) return;
        setSaving(true);

        try {
            const response = await fetch(`/api/v1/sites/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code,
                    css,
                    js
                })
            });

            if (response.ok) {
                alert('✅ Modifications sauvegardées !');
            } else {
                alert('❌ Erreur lors de la sauvegarde');
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('❌ Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleSendMessage = async () => {
        if (!userMessage.trim()) return;

        const newUserMessage: ChatMessage = {
            role: 'user',
            content: userMessage
        };

        setChatMessages(prev => [...prev, newUserMessage]);
        setUserMessage('');
        setIsAiThinking(true);

        try {
            // Construire le contexte pour l'IA
            const context = `
HTML:
${code}

CSS:
${css}

JS:
${js}

Question de l'utilisateur: ${userMessage}
`;

            const analysis = await analyzeCodeWithGemini(context);

            const aiResponse: ChatMessage = {
                role: 'assistant',
                content: analysis.suggestions.join('\n\n') || 'Je peux vous aider à améliorer votre code !'
            };

            setChatMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Désolé, je n\'ai pas pu traiter votre demande.'
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAiThinking(false);
        }
    };

    const getCurrentEditorContent = () => {
        switch (activeTab) {
            case 'html': return code;
            case 'css': return css;
            case 'js': return js;
        }
    };

    const setCurrentEditorContent = (value: string) => {
        switch (activeTab) {
            case 'html': setCode(value); break;
            case 'css': setCss(value); break;
            case 'js': setJs(value); break;
        }
    };

    const getPlaceholder = () => {
        switch (activeTab) {
            case 'html': return '<!-- Votre code HTML ici -->';
            case 'css': return '/* Votre CSS ici */';
            case 'js': return '// Votre JavaScript ici';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    if (!deployment) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Déploiement introuvable</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{deployment.name}</h1>
                            <p className="text-sm text-muted-foreground">{deployment.subdomain}.heberge-rapide.vercel.app</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sauvegarde...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Sauvegarder
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-80px)]">
                {/* Code Editor - 2/3 */}
                <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
                    <div className="border-b border-border p-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('html')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'html' ? 'bg-brand-500 text-white' : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                                    }`}
                            >
                                <FileCode className="w-4 h-4" /> HTML
                            </button>
                            <button
                                onClick={() => setActiveTab('css')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'css' ? 'bg-brand-500 text-white' : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                                    }`}
                            >
                                <Palette className="w-4 h-4" /> CSS
                            </button>
                            <button
                                onClick={() => setActiveTab('js')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'js' ? 'bg-brand-500 text-white' : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                                    }`}
                            >
                                <Braces className="w-4 h-4" /> JavaScript
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <CodeEditor
                            code={getCurrentEditorContent()}
                            onChange={setCurrentEditorContent}
                            placeholder={getPlaceholder()}
                        />
                    </div>
                </div>

                {/* AI Chat - 1/3 */}
                <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
                    <div className="border-b border-border p-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            Assistant IA
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatMessages.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">Posez-moi des questions sur votre code !</p>
                            </div>
                        )}

                        {chatMessages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded-lg ${msg.role === 'user'
                                        ? 'bg-brand-500/10 border border-brand-500/30 ml-8'
                                        : 'bg-purple-500/10 border border-purple-500/30 mr-8'
                                    }`}
                            >
                                <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        ))}

                        {isAiThinking && (
                            <div className="bg-purple-500/10 border border-purple-500/30 mr-8 p-3 rounded-lg">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={userMessage}
                                onChange={(e) => setUserMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Demandez de l'aide..."
                                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!userMessage.trim() || isAiThinking}
                                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white p-2 rounded-lg transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeEditorPage;
