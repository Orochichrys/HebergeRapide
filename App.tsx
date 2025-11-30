import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DeployForm from './components/DeployForm';
import ApiDocs from './components/ApiDocs';
import SitePreview from './components/SitePreview';
import AuthForm from './components/AuthForm';
import { deleteDeployment } from './services/storageService';
import { Deployment, User } from './types';
import { DEMO_DELAY } from './constants';

const AppContent: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchDeployments();
    }
  }, [token]);

  const fetchDeployments = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/v1/sites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDeployments(data.sites);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching from API:', error);
    }
  };

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  const handleDeploy = async (name: string, subdomain: string, code: string) => {
    if (!token) return;
    setIsDeploying(true);

    // Simulate network delay for "building"
    await new Promise(resolve => setTimeout(resolve, DEMO_DELAY));

    try {
      const response = await fetch('/api/v1/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, html: code })
      });

      if (response.ok) {
        const data = await response.json();
        const newDeployment: Deployment = {
          id: data.id,
          subdomain: data.subdomain,
          name,
          code,
          createdAt: Date.now(),
          status: data.status,
          url: data.url,
          visitors: 0
        };
        setDeployments(prev => [newDeployment, ...prev]);
        setIsDeploying(false);
        navigate('/');
      } else {
        console.error('Deployment failed');
        setIsDeploying(false);
      }
    } catch (error) {
      console.error('Error deploying to API:', error);
      setIsDeploying(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
      // Note: Delete API endpoint not implemented yet, so we just remove from UI for now
      // Ideally we should add DELETE /api/v1/sites/:id
      deleteDeployment(id); // Still delete from local storage just in case
      setDeployments(prev => prev.filter(d => d.id !== id));
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-dark-bg text-gray-100 font-sans">
        <Routes>
          <Route path="/s/:subdomain" element={<SiteRouteWrapper />} />
          <Route path="*" element={<AuthForm onLogin={handleLogin} />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 font-sans selection:bg-brand-500/30">
      <Navbar />
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <span className="text-gray-400">Bonjour, {user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Déconnexion
        </button>
      </div>
      <main>
        <Routes>
          <Route path="/" element={
            <Dashboard deployments={deployments} onDelete={handleDelete} />
          } />

          <Route path="/deploy" element={
            <DeployForm onDeploy={handleDeploy} isDeploying={isDeploying} />
          } />

          <Route path="/api-docs" element={
            <ApiDocs />
          } />

          {/* Public Route for viewing sites */}
          <Route
            path="/s/:subdomain"
            element={<SiteRouteWrapper />}
          />
        </Routes>
      </main>
    </div>
  );
};

// Wrapper to find the deployment from storage before rendering SitePreview
const SiteRouteWrapper = () => {
  const navigate = useNavigate();
  const path = window.location.hash;
  const subdomainFromUrl = path.split('/s/')[1]?.split('?')[0];

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subdomainFromUrl) {
      const fetchDeployment = async () => {
        try {
          const response = await fetch(`/api/v1/site/${subdomainFromUrl}`);
          if (response.ok) {
            const found = await response.json();
            setDeployment(found);
          } else {
            setDeployment(null);
          }
        } catch (e) {
          console.error('Error fetching deployment from API:', e);
          setDeployment(null);
        } finally {
          setLoading(false);
        }
      };

      fetchDeployment();
    } else {
      setLoading(false);
    }
  }, [subdomainFromUrl]);

  if (loading) return <div className="h-screen bg-dark-bg flex items-center justify-center text-white">Chargement...</div>;

  if (!deployment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-4 text-white">404</h1>
        <p className="text-gray-400 mb-4">Site introuvable ou supprimé.</p>
        <button onClick={() => navigate('/')} className="text-brand-400 hover:underline">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return <SitePreview deployment={deployment} />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;