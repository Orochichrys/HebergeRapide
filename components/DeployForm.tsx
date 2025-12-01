import React, { useState, useEffect } from 'react';
import { Upload, Rocket, FileCode } from 'lucide-react';
import { isSubdomainTaken } from '../services/storageService';

interface DeployFormProps {
  onDeploy: (name: string, subdomain: string, code: string, css?: string, js?: string) => Promise<void>;
  isDeploying: boolean;
}

const DeployForm: React.FC<DeployFormProps> = ({ onDeploy, isDeploying }) => {
  const [siteName, setSiteName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [code, setCode] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [subdomainError, setSubdomainError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Auto-generate subdomain from site name
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
    const files = e.target.files;
    if (!files) return;

    const fileNames: string[] = [];

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const content = event.target.result as string;
          const ext = file.name.split('.').pop()?.toLowerCase();

          if (ext === 'html' || ext === 'htm') {
            setCode(content);
            if (!siteName) {
              setSiteName(file.name.split('.')[0]);
            }
            fileNames.push(file.name);
          } else if (ext === 'css') {
            setCss(content);
            fileNames.push(file.name);
          } else if (ext === 'js') {
            setJs(content);
            fileNames.push(file.name);
          }
        }
      };
      reader.readAsText(file);
    });

    setUploadedFiles(fileNames);
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
      onDeploy(siteName, subdomain, code, css || undefined, js || undefined);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="text-brand-400" />
            Nouveau Déploiement
          </h2>
          <p className="text-muted-foreground mt-1">Hébergez votre site HTML, CSS et JavaScript en quelques secondes.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Nom du projet</label>
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
              <label className="block text-sm font-medium text-muted-foreground mb-2">Sous-domaine</label>
              <div className={`flex items-center bg-background border rounded-lg overflow-hidden transition-all ${subdomainError ? 'border-red-500' : 'border-border focus-within:ring-2 focus-within:ring-brand-500'}`}>
                <input
                  type="text"
                  required
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  placeholder="mon-site"
                  className="w-full bg-transparent px-4 py-2 text-foreground outline-none"
                />
                <span className="bg-border/50 text-muted-foreground px-3 py-2 text-sm border-l border-border">
                  .heberge-rapide.vercel.app
                </span>
              </div>
              {subdomainError && <p className="text-red-400 text-xs mt-1">{subdomainError}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              <Upload className="w-4 h-4 inline mr-2" />
              Fichiers du site
            </label>
            <div className="h-[300px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-brand-500 hover:bg-background/50 transition-all relative">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".html,.htm,.css,.js"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileCode className="w-12 h-12 mb-2 text-muted-foreground" />
              <p className="font-medium">Glissez vos fichiers HTML, CSS, JS ici</p>
              <p className="text-xs text-muted-foreground mt-2">ou cliquez pour parcourir</p>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-medium text-brand-400">Fichiers uploadés :</p>
                  {uploadedFiles.map((name, idx) => (
                    <p key={idx} className="text-xs text-foreground">✓ {name}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!siteName || !code || isDeploying || !!subdomainError}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
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
        </form>
      </div>
    </div>
  );
};

export default DeployForm;