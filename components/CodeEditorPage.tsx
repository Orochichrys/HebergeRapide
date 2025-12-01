import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Sparkles, Send, FileCode, Loader2, Plus, Trash2 } from 'lucide-react';
import CodeEditor from './CodeEditor';
import { Deployment, ProjectFile } from '../types';
import { analyzeCodeWithGemini } from '../services/aiService';

interface CodeEditorPageProps {
    token: string | null;
}

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

    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [activeFileName, setActiveFileName] = useState<string>('');

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

                if (data.files && data.files.length > 0) {
                    setFiles(data.files);
                    // Set index.html as active if exists, otherwise first file
                    const indexFile = data.files.find((f: ProjectFile) => f.name === 'index.html' || f.name === 'index.htm');
                    setActiveFileName(indexFile ? indexFile.name : data.files[0].name);
                } else {
                    // Backward compatibility: Create files from legacy fields
                    const newFiles: ProjectFile[] = [];
                    if (data.code) newFiles.push({ name: 'index.html', content: data.code, type: 'html' });
                    if (data.css) newFiles.push({ name: 'style.css', content: data.css, type: 'css' });
                    if (data.js) newFiles.push({ name: 'script.js', content: data.js, type: 'js' });

                    setFiles(newFiles);
                    if (newFiles.length > 0) setActiveFileName(newFiles[0].name);
                }
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
                    files
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
            // Build context from all files
            let context = "Voici les fichiers du projet :\n\n";
            files.forEach(f => {
                context += `--- ${f.name} (${f.type}) ---\n${f.content}\n\n`;
            });
            context += `Question de l'utilisateur: ${userMessage}`;

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

    const getActiveFile = () => {
        return files.find(f => f.name === activeFileName);
    };

    const updateActiveFileContent = (newContent: string) => {
        setFiles(prev => prev.map(f =>
            f.name === activeFileName ? { ...f, content: newContent } : f
        ));
    };

    const addNewFile = () => {
        const name = prompt('Nom du fichier (ex: about.html, style.css) :');
        if (!name) return;

        if (files.some(f => f.name === name)) {
            alert('Ce fichier existe déjà.');
            return;
        }

        const ext = name.split('.').pop()?.toLowerCase();
        let type: 'html' | 'css' | 'js' = 'html';
        if (ext === 'css') type = 'css';
        else if (ext === 'js') type = 'js';

        const newFile: ProjectFile = { name, content: '', type };
        setFiles(prev => [...prev, newFile]);
        setActiveFileName(name);
    };

    const deleteFile = (e: React.MouseEvent, fileName: string) => {
        e.stopPropagation();
        if (confirm(`Supprimer ${fileName} ?`)) {
            setFiles(prev => prev.filter(f => f.name !== fileName));
            if (activeFileName === fileName) {
                setActiveFileName(files.find(f => f.name !== fileName)?.name || '');
            }
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

    const activeFile = getActiveFile();

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-border bg-card flex-shrink-0">
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
            <div className="flex-1 flex overflow-hidden">
                {/* File Explorer Sidebar */}
                <div className="w-64 bg-card border-r border-border flex flex-col">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Fichiers</h3>
                        <button onClick={addNewFile} className="text-brand-400 hover:text-brand-300">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {files.map(file => (
                            <div
                                key={file.name}
                                onClick={() => setActiveFileName(file.name)}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeFileName === file.name
                                    ? 'bg-brand-500/10 text-brand-400'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                    }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileCode className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate text-sm">{file.name}</span>
                                </div>
                                <button
                                    onClick={(e) => deleteFile(e, file.name)}
                                    className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {activeFile ? (
                        <div className="flex-1 overflow-hidden">
                            <CodeEditor
                                code={activeFile.content}
                                onChange={updateActiveFileContent}
                                placeholder={`Contenu de ${activeFile.name}`}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            Sélectionnez un fichier pour l'éditer
                        </div>
                    )}
                </div>

                {/* AI Chat Sidebar */}
                <div className="w-80 bg-card border-l border-border flex flex-col">
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
                                <p className="text-sm">Je connais tous vos fichiers ! Posez-moi une question.</p>
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
