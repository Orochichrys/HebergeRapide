import React, { useMemo } from 'react';
import { Deployment } from '../types';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import React, { useMemo } from 'react';
import { Deployment } from '../types';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SitePreviewProps {
  deployment: Deployment;
}

const SitePreview: React.FC<SitePreviewProps> = ({ deployment }) => {

  // Create a Blob URL for the HTML content
  const blobUrl = useMemo(() => {
    const blob = new Blob([deployment.code], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [deployment.code]);

  return (
    <iframe
      src={blobUrl}
      className="w-full h-screen border-none"
      title="Site Preview"
      sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
    />
  );
};

export default SitePreview;