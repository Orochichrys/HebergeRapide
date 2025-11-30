import React, { useMemo } from 'react';
import { Deployment } from '../types';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SitePreviewProps {
  deployment: Deployment;
}

const SitePreview: React.FC<SitePreviewProps> = ({ deployment }) => {
  
  // Create a Blob URL for the HTML content to simulate hosting
  const blobUrl = useMemo(() => {
    const blob = new Blob([deployment.code], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [deployment.code]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-dark-bg">
      <div className="h-14 bg-dark-card border-b border-dark-border flex items-center px-4 justify-between">
         <div className="flex items-center gap-4">
             <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
             </Link>
             <div className="flex flex-col">
                 <h2 className="text-sm font-semibold text-white">{deployment.name}</h2>
                 <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    En ligne
                 </span>
             </div>
         </div>
         <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-dark-border text-xs text-gray-400 font-mono">
             <ExternalLink className="w-3 h-3" />
             {deployment.url}
         </div>
      </div>
      <div className="flex-1 bg-white relative">
        <iframe 
            src={blobUrl} 
            className="w-full h-full border-none"
            title="Site Preview"
            sandbox="allow-scripts allow-modals allow-same-origin"
        />
      </div>
    </div>
  );
};

export default SitePreview;