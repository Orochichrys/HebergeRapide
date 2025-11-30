import React, { useState, useEffect } from 'react';
import { Upload, Code, Rocket, Sparkles, CheckCircle, AlertTriangle, FileCode, Globe } from 'lucide-react';
import { analyzeCodeWithGemini } from '../services/aiService';
import { isSubdomainTaken } from '../services/storageService';
import { CodeAnalysis } from '../types';
import CodeEditor from './CodeEditor';

interface DeployFormProps {
  onDeploy: (name: string, subdomain: string, code: string) => Promise<void>;
  isDeploying: boolean;
}

const DeployForm: React.FC<DeployFormProps> = ({ onDeploy, isDeploying }) => {
  const [siteName, setSiteName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'upload' | 'editor'>('editor');
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [subdomainError, setSubdomainError] = useState('');

  // Auto-generate subdomain from site name if subdomain is empty or matches previous auto-gen
  useEffect(() => {
    if (siteName) {
      const slug = siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      if (!subdomain || subdomain === slug.slice(0, slug.length - 1)) {
        setSubdomain(slug);
      }
    }
  }, [siteName]);

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(value);
    setSubdomainError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCode(event.target.result as string);
          setSiteName(file.name.split('.')[0]);
          setMode('editor'); // Switch to editor after upload to show preview
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    if (!code) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeCodeWithGemini(code);
      setAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyOptimization = () => {
    if (analysis?.optimizedCode) {
      setCode(analysis.optimizedCode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubdomainError('');

    if (subdomain.length < 3) {
      setSubdomainError('Le sous-domaine doit contenir au moins 3 caractères.');
      return;
    }

    if (isSubdomainTaken(subdomain)) {
      setSubdomainError('Ce sous-domaine est déjà pris. Veuillez en choisir un autre.');
      return;
    }

    if (siteName && subdomain && code) {
      onDeploy(siteName, subdomain, code);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="text-brand-400" />
            Nouveau Déploiement
          </h2>
          <p className="text-gray-400 mt-1">Hébergez votre HTML statique en quelques secondes.</p>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom du projet</label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Mon Super Site"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sous-domaine</label>
                <div className={`flex items-center bg-background border rounded-lg overflow-hidden transition-all ${subdomainError ? 'border-red-500' : 'border-border focus-within:ring-2 focus-within:ring-brand-500'}`}>
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={handleSubdomainChange}
                    placeholder="mon-site"
                    className="w-full bg-transparent px-4 py-2 text-foreground outline-none"
                  />
                  <span className="bg-border/50 text-gray-400 px-3 py-2 text-sm border-l border-border">
                    .heberge-rapide.vercel.app
                  </span>
                </div>
                {subdomainError && <p className="text-red-400 text-xs mt-1">{subdomainError}</p>}
              </div>
            </div>

            <div>
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setMode('editor')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'editor' ? 'bg-brand-500 text-white' : 'bg-background text-gray-400 hover:text-foreground'
                    }`}
                >
                  <Code className="w-4 h-4" /> Éditeur Intelligent
                </button>
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'upload' ? 'bg-brand-500 text-white' : 'bg-background text-gray-400 hover:text-foreground'
                    }`}
                >
                  <Upload className="w-4 h-4" /> Upload Fichier
                </button>
              </div>

              {mode === 'editor' ? (
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  placeholder="<!-- Collez votre code HTML ici -->
<html>
  <body>
    <h1>Bonjour le monde!</h1>
  </body>
</html>"
                />
              ) : (
                <div className="h-[300px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-brand-500 hover:bg-background/50 transition-all relative">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".html,.htm"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileCode className="w-12 h-12 mb-2 text-gray-500" />
                  <p>Glissez votre index.html ici</p>
                  <p className="text-xs text-gray-500 mt-2">ou cliquez pour parcourir</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!code || isAnalyzing}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Analyser & Optimiser
              </button>
              <button
                type="submit"
                disabled={!siteName || !code || isDeploying || !!subdomainError}
                className="flex-[2] bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                {isDeploying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Déploiement...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Mettre en ligne
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Column: AI Feedback */}
          <div className="bg-background rounded-lg p-6 border border-border flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Rapport IA
            </h3>

            {!analysis && !isAnalyzing && (
              <div className="text-center text-gray-500 flex-1 flex flex-col items-center justify-center">
                <div className="bg-card w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code className="w-8 h-8 opacity-50" />
                </div>
                <p>L'IA analysera la structure, le SEO et l'accessibilité de votre code avant déploiement.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-4 animate-pulse flex-1">
                <div className="h-4 bg-card rounded w-3/4"></div>
                <div className="h-4 bg-card rounded w-1/2"></div>
                <div className="h-32 bg-card rounded w-full"></div>
              </div>
            )}

            {analysis && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Score de qualité</span>
                  <span className={`text-2xl font-bold ${analysis.score > 80 ? 'text-green-400' : analysis.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {analysis.score}/100
                  </span>
                </div>
                <div className="w-full bg-card h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${analysis.score > 80 ? 'bg-green-500' : analysis.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${analysis.score}%` }}
                  />
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Suggestions</h4>
                  <ul className="space-y-3">
                    {analysis.suggestions.map((sug, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-gray-300 bg-card/50 p-2 rounded">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                        {sug}
                      </li>
                    ))}
                  </ul>
                </div>

                {analysis.optimizedCode && (
                  <div className="pt-4 border-t border-border mt-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-400 flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> Code optimisé disponible
                      </span>
                    </div>
                    <button
                      onClick={applyOptimization}
                      className="w-full py-2 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
                    >
                      Remplacer par la version optimisée
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeployForm;