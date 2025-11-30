import React from 'react';
import { Deployment } from '../types';

interface SitePreviewProps {
  deployment: Deployment;
}

const SitePreview: React.FC<SitePreviewProps> = ({ deployment }) => {
  return (
    <iframe
      srcDoc={deployment.code}
      className="w-full h-screen border-none"
      title="Site Preview"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
};

export default SitePreview;