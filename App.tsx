import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
<Route path="/s/:subdomain" element={<SiteRouteWrapper />} />
      </Routes >
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