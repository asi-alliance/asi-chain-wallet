import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { SecureStorage } from 'services/secureStorage';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

SecureStorage.init()
  .then(() => { renderApp(); })
  .catch((err) => { console.error('[index] SecureStorage.init failed:', err); renderApp(); });

// Register service worker for PWA functionality
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.info('ServiceWorker registration successful:', registration.scope);
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch(err => {
        console.error('ServiceWorker registration failed:', err);
      });
  });
}