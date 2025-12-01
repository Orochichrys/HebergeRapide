import React from 'react';
import { Deployment } from '../types';
import { Globe, Clock, Trash2, Activity, ExternalLink, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  deployments: Deployment[];
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ deployments, onDelete }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Gérez vos sites et surveillez les performances.</p>
        </div>
        <Link
          to="/deploy"
          className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-brand-500/20"
        >
          Nouveau site +
        </Link>
      </div>

      {deployments.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-dark-border rounded-xl bg-dark-card/30">
          <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">Aucun déploiement actif</h3>
          <p className="text-muted-foreground mb-6">Vous n'avez pas encore hébergé de site. Lancez-vous maintenant !</p>
          <Link to="/deploy" className="text-brand-400 hover:text-brand-300 font-medium">
            Commencer mon premier déploiement &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deployments.map((deploy) => (
            <div key={deploy.id} className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-brand-500/50 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-brand-500/10 rounded-lg">
                  <Globe className="w-6 h-6 text-brand-400" />
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${deploy.status === 'live' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                  {deploy.status === 'live' ? 'EN LIGNE' : 'EN COURS'}
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1 truncate">{deploy.name}</h3>
              <a href={deploy.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-brand-400 flex items-center gap-1 mb-4 truncate">
                {deploy.url} <ExternalLink className="w-3 h-3" />
              </a>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Visiteurs
                  </span>
                  <span className="text-foreground font-mono">{deploy.visitors}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Déployé
                  </span>
                  <span className="text-foreground font-mono text-xs">
                    {new Date(deploy.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-dark-border">
                <Link
                  to={`/s/${deploy.subdomain}`}
                  className="flex-1 bg-background hover:bg-border text-foreground py-2 rounded text-sm text-center transition-colors"
                >
                  Voir le site
                </Link>
                <Link
                  to={`/edit/${deploy.id}`}
                  className="p-2 text-muted-foreground hover:text-brand-400 hover:bg-brand-400/10 rounded transition-colors"
                  title="Éditer"
                >
                  <Edit2 className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => onDelete(deploy.id)}
                  className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;