import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { SecureStorage } from 'services/secureStorage';
import { store } from 'store';
import { checkAuthentication } from 'store/authSlice';

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

const startApp = () => {
  store.dispatch(checkAuthentication());
  renderApp();
};

SecureStorage.init()
  .then(() => { startApp(); })
  .catch((err) => { console.error('[index] SecureStorage.init failed:', err); startApp(); });

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
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      registrations.forEach(registration => { registration.unregister(); });
    })
    .catch(err => { console.error('ServiceWorker unregister failed:', err); });

  if ('caches' in window) {
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .catch(err => { console.error('Cache cleanup failed:', err); });
  }
}