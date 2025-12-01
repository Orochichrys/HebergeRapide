import React, { useEffect, useRef } from 'react';
import { Deployment, ProjectFile } from '../types';

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
        let htmlContent = '';
        const files = deployment.files || [];

        // Determine entry point
        const indexFile = files.find(f => f.name === 'index.html' || f.name === 'index.htm')
          || files.find(f => f.type === 'html');

        if (indexFile) {
          htmlContent = indexFile.content;
        } else {
          // Fallback to legacy code field
          htmlContent = deployment.code;
        }

        // Create Blob URLs for assets
        const blobUrls: Record<string, string> = {};
        files.forEach(file => {
          if (file.type !== 'html') {
            const blob = new Blob([file.content], { type: file.type === 'css' ? 'text/css' : 'application/javascript' });
            blobUrls[file.name] = URL.createObjectURL(blob);
          }
        });

        // Replace relative links with Blob URLs
        // Replace CSS links: <link href="style.css">
        htmlContent = htmlContent.replace(/<link[^>]+href=["']([^"']+)["'][^>]*>/g, (match, href) => {
          if (blobUrls[href]) {
            return match.replace(href, blobUrls[href]);
          }
          return match;
        });

        // Replace JS scripts: <script src="script.js">
        htmlContent = htmlContent.replace(/<script[^>]+src=["']([^"']+)["'][^>]*>/g, (match, src) => {
          if (blobUrls[src]) {
            return match.replace(src, blobUrls[src]);
          }
          return match;
        });

        // Legacy injection fallback (if no files array or specific legacy fields exist)
        if (!deployment.files && deployment.css) {
          const styleTag = `<style>${deployment.css}</style>`;
          if (htmlContent.includes('</head>')) {
            htmlContent = htmlContent.replace('</head>', `${styleTag}</head>`);
          } else {
            htmlContent = `<head>${styleTag}</head>${htmlContent}`;
          }
        }
        if (!deployment.files && deployment.js) {
          const scriptTag = `<script>${deployment.js}</script>`;
          if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace('</body>', `${scriptTag}</body>`);
          } else {
            htmlContent += scriptTag;
          }
        }

        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Cleanup Blob URLs
        return () => {
          Object.values(blobUrls).forEach(url => URL.revokeObjectURL(url));
        };
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