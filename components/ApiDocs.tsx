import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Key } from 'lucide-react';
import { getApiKeys, generateApiKey } from '../services/storageService';
import { ApiKey } from '../types';

const ApiDocs: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const jsonPayload = '{"name": "mon-site", "html": "<h1>Hello</h1>"}';

  useEffect(() => {
    setKeys(getApiKeys());
  }, []);

  const handleGenerateKey = () => {
    const newKey = generateApiKey(`Clé API #${keys.length + 1}`);
    setKeys([...keys, newKey]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">API Développeur</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Intégrez HébergeRapide directement dans vos pipelines CI/CD. Déployez programmatiquement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* API Key Management */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 lg:col-span-1 h-fit">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-yellow-400" /> Vos Clés API
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Ces clés sont stockées localement dans votre navigateur pour cette démo.
          </p>

          <div className="space-y-4 mb-6">
            {keys.map((k) => (
              <div key={k.key} className="bg-dark-bg p-3 rounded border border-dark-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">{k.name}</span>
                  <span className="text-[10px] text-gray-600">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-brand-400 font-mono truncate flex-1 block">
                    {k.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(k.key)}
                    className="text-gray-500 hover:text-white"
                  >
                    {copied === k.key ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
            {keys.length === 0 && (
              <div className="text-sm text-gray-500 italic text-center py-4">Aucune clé générée.</div>
            )}
          </div>

          <button
            onClick={handleGenerateKey}
            className="w-full bg-white text-black font-medium py-2 rounded hover:bg-gray-100 transition-colors"
          >
            Générer une nouvelle clé
          </button>
        </div>

        {/* Documentation Content */}
        <div className="lg:col-span-2 space-y-8">

          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <div className="bg-dark-bg px-4 py-2 border-b border-dark-border flex items-center gap-2">
              <Terminal className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 font-mono">POST /v1/deploy</span>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">Déploie un nouveau site à partir d'un fichier HTML brut.</p>

              <div className="bg-[#0d1117] p-4 rounded-lg font-mono text-sm text-gray-300 overflow-x-auto relative group">
                <button
                  onClick={() => copyToClipboard(`curl -X POST https://api.hebergerapide.com/v1/deploy \\
  -H "Authorization: Bearer ${keys[0]?.key || 'YOUR_API_KEY'}" \\
  -d '{"name": "mon-site", "html": "<h1>Hello</h1>"}'`)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                >
                  <Copy className="w-4 h-4 text-white" />
                </button>
                <pre><span className="text-purple-400">curl</span> -X POST https://api.hebergerapide.com/v1/deploy \
                  -H <span className="text-green-400">&quot;Authorization: Bearer {keys[0]?.key || 'YOUR_API_KEY'}&quot;</span> \
                  -d <span className="text-yellow-400">&apos;{jsonPayload}&apos;</span></pre>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white mb-2">Réponse (200 OK)</h4>
                <div className="bg-[#0d1117] p-4 rounded-lg font-mono text-sm text-blue-300">
                  {`{
  "id": "dep_123456789",
  "status": "live",
  "url": "https://hebergerapide.com/s/mon-site-xyz"
}`}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <div className="bg-dark-bg px-4 py-2 border-b border-dark-border flex items-center gap-2">
              <Terminal className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 font-mono">GET /v1/sites</span>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">Récupère la liste de tous vos déploiements actifs.</p>

              <div className="bg-[#0d1117] p-4 rounded-lg font-mono text-sm text-gray-300">
                <pre><span className="text-purple-400">curl</span> https://api.hebergerapide.com/v1/sites \
                  -H <span className="text-green-400">"Authorization: Bearer {keys[0]?.key || 'YOUR_API_KEY'}"</span></pre>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ApiDocs;