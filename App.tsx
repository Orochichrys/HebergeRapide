import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DeployForm from './components/DeployForm';
import ApiDocs from './components/ApiDocs';
import SitePreview from './components/SitePreview';
import AuthForm from './components/AuthForm';
import UserProfile from './components/UserProfile';
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
  const path = window.location.hash;
  const isViewingSite = path.startsWith('#/s/');

  useEffect(() => {
    if (token) {
      fetchDeployments();
    }

    // Initialize Grok AI with Environment Variable
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (openRouterKey) {
      import('./services/aiService').then(({ initAI }) => {
        initAI(openRouterKey);
      });
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

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  const handleDeploy = async (name: string, subdomain: string, code: string) => {
    if (!token) return;
    setIsDeploying(true);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
      return;
    }

    // Optimistic update
    setDeployments(prev => prev.filter(d => d.id !== id));

    try {
      const response = await fetch(`/api/v1/sites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Revert optimistic update on error
        await fetchDeployments();
        if (response.status === 404) {
          alert('Site introuvable');
        } else if (response.status === 403) {
          alert('Vous n\'êtes pas autorisé à supprimer ce site');
        } else {
          alert('Erreur lors de la suppression du site');
        }
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      // Revert optimistic update on error
      await fetchDeployments();
      alert('Erreur lors de la suppression du site');
    }
  };

  // Visualisation de site : aucun background
  if (isViewingSite) {
    return (
      <Routes>
        <Route path="/s/:subdomain" element={<SiteRouteWrapper />} />
      </Routes>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Routes>
          <Route path="*" element={<AuthForm onLogin={handleLogin} />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-500/30 transition-colors duration-300">
      <Navbar user={user} onLogout={handleLogout} />
      <main>
        <Routes>
          <Route path="/" element={
            <Dashboard deployments={deployments} onDelete={handleDelete} />
          } />

          <Route path="/deploy" element={
            <DeployForm onDeploy={handleDeploy} isDeploying={isDeploying} />
          } />

          <Route path="/profile" element={
            user ? <UserProfile user={user} token={token} onUpdateUser={handleUpdateUser} /> : null
          } />

          <Route path="/api-docs" element={
            <ApiDocs />
          } />
        </Routes>
      </main>
    </div>
  );
};

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
          const response = await fetch(`/api/get-site?subdomain=${subdomainFromUrl}`);
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

  if (loading) return <div className="h-screen flex items-center justify-center">Chargement...</div>;

  if (!deployment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="mb-4">Site introuvable</p>
        <button onClick={() => navigate('/')} className="text-blue-500 hover:underline">
          Retour
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