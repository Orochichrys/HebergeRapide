import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("CRITICAL: Root element not found");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to mount React application:", error);
    rootElement.innerHTML = `<div style="color: white; padding: 20px;">Une erreur critique est survenue lors du chargement de l'application. Veuillez vérifier la console.</div>`;
  }
}