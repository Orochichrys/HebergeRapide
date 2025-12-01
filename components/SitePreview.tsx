import React, { useEffect, useRef, useState } from 'react';
import { Deployment, ProjectFile } from '../types';

interface SitePreviewProps {
  deployment: Deployment;
}

const SitePreview: React.FC<SitePreviewProps> = ({ deployment }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentPath, setCurrentPath] = useState<string>('index.html');

  // Reset path when deployment changes
  useEffect(() => {
    setCurrentPath('index.html');
  }, [deployment.id]);

  // Handle navigation messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE') {
        // Normalize path: remove leading ./ or /
        const path = event.data.path.replace(/^\.?\//, '');
        setCurrentPath(path);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        let htmlContent = '';
        const files = deployment.files || [];

        // Find the file to render
        let fileToRender: ProjectFile | undefined;

        // Try to find exact match
        fileToRender = files.find(f => f.name === currentPath);

        // If not found and it's the root, try index.html or index.htm
        if (!fileToRender && (currentPath === '' || currentPath === 'index.html')) {
          fileToRender = files.find(f => f.name === 'index.html' || f.name === 'index.htm')
            || files.find(f => f.type === 'html');
        }

        if (fileToRender) {
          htmlContent = fileToRender.content;
        } else if (!deployment.files && (currentPath === 'index.html' || currentPath === '')) {
          // Fallback to legacy code field for root
          htmlContent = deployment.code;
        } else {
          // 404 Page
          htmlContent = `
            <html>
              <head><title>404 Not Found</title></head>
              <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>404</h1>
                <p>Page non trouvée : ${currentPath}</p>
                <a href="#" onclick="window.parent.postMessage({type: 'NAVIGATE', path: 'index.html'}, '*')">Retour à l'accueil</a>
              </body>
            </html>
          `;
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
          const cleanHref = href.replace(/^\.?\//, '');
          if (blobUrls[cleanHref]) {
            return match.replace(href, blobUrls[cleanHref]);
          }
          return match;
        });

        // Replace JS scripts: <script src="script.js">
        htmlContent = htmlContent.replace(/<script[^>]+src=["']([^"']+)["'][^>]*>/g, (match, src) => {
          const cleanSrc = src.replace(/^\.?\//, '');
          if (blobUrls[cleanSrc]) {
            return match.replace(src, blobUrls[cleanSrc]);
          }
          return match;
        });

        // Inject Navigation Script
        const navScript = `
          <script>
            document.addEventListener('click', (e) => {
              const link = e.target.closest('a');
              if (link) {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
                  e.preventDefault();
                  window.parent.postMessage({ type: 'NAVIGATE', path: href }, '*');
                }
              }
            });
          </script>
        `;

        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', `${navScript}</body>`);
        } else {
          htmlContent += navScript;
        }

        // Legacy injection fallback (only if using legacy fields)
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
  }, [deployment, currentPath]);

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