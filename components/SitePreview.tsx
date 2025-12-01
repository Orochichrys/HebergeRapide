import React, { useEffect, useRef } from 'react';
import { Deployment } from '../types';

interface SitePreviewProps {
  deployment: Deployment;
}

const SitePreview: React.FC<SitePreviewProps> = ({ deployment }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        // Build complete HTML with CSS and JS injected
        let html = deployment.code;

        // Inject CSS if provided
        if (deployment.css) {
          const styleTag = `<style>${deployment.css}</style>`;
          // Insert before </head> if exists, otherwise at the beginning
          if (html.includes('</head>')) {
            html = html.replace('</head>', `${styleTag}</head>`);
          } else if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>${styleTag}`);
          } else {
            html = `<head>${styleTag}</head>${html}`;
          }
        }

        // Inject JS if provided
        if (deployment.js) {
          const scriptTag = `<script>${deployment.js}</script>`;
          // Insert before </body> if exists, otherwise at the end
          if (html.includes('</body>')) {
            html = html.replace('</body>', `${scriptTag}</body>`);
          } else {
            html += scriptTag;
          }
        }

        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [deployment]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-screen border-none"
      title="Site Preview"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
};

export default SitePreview;