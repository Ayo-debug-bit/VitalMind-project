import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Handle global errors and unhandled rejections to prevent them from bubbling up to the cross-origin parent as "Script error."
if (typeof window !== 'undefined') {
  window.addEventListener('error', function(event) {
    console.warn("Global capture caught error:", event.error || event.message);
    event.stopImmediatePropagation();
    event.preventDefault();
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    console.warn("Global capture caught unhandled rejection:", event.reason);
    event.stopImmediatePropagation();
    event.preventDefault();
  }, true);

  window.onerror = function(message, source, lineno, colno, error) {
    console.warn("Global caught error:", { message, source, lineno, colno, error });
    // returning true prevents default browser fire/bubbling of error to parent frame
    return true;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Register service worker for Progressive Web App capabilities
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('ServiceWorker registered successfully with scope: ', reg.scope))
        .catch(err => console.warn('ServiceWorker registration failed: ', err));
    } catch (e) {
      console.warn('ServiceWorker registration is not supported or was blocked by the browser in this environment:', e);
    }
  });
}
