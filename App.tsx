import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DeployForm from './components/DeployForm';
import ApiDocs from './components/ApiDocs';
import SitePreview from './components/SitePreview';
import { getDeployments, saveDeployment, deleteDeployment } from './services/storageService';
import { Deployment } from './types';
import { DEMO_DELAY } from './constants';

const AppContent: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setDeployments(getDeployments());
  }, []);

  const handleDeploy = async (name: string, subdomain: string, code: string) => {
    setIsDeploying(true);
    
    // Simulate network delay for "building"
    await new Promise(resolve => setTimeout(resolve, DEMO_DELAY));

    const id = Math.random().toString(36).substr(2, 9);
    // Encode the deployment data in the URL so it can be shared publicly
    const encodedData = btoa(encodeURIComponent(JSON.stringify({ name, code })));
    const mockUrl = `${window.location.origin}/#/s/${subdomain}?d=${encodedData}`;

    const newDeployment: Deployment = {
      id,
      subdomain,
      name,
      code,
      createdAt: Date.now(),
      status: 'live',
      url: mockUrl,
      visitors: 0
    };

    saveDeployment(newDeployment);
    setDeployments(prev => [newDeployment, ...prev]);
    setIsDeploying(false);
    navigate('/');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
      deleteDeployment(id);
      setDeployments(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 font-sans selection:bg-brand-500/30">
      <Navbar />
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
        // First, try to get from localStorage (for the owner)
        const all = getDeployments();
        let found = all.find(d => d.subdomain === subdomainFromUrl);
        
        // If not found in localStorage, fetch from API
        if (!found) {
          try {
            const response = await fetch(`/api/v1/site/${subdomainFromUrl}`);
            if (response.ok) {
              found = await response.json();
            }
          } catch (e) {
            console.error('Error fetching deployment from API:', e);
          }
        }
        
        setDeployment(found || null);
        setLoading(false);
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