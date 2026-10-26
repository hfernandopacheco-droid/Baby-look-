import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Check for updates every 30 seconds
      setInterval(() => {
        reg.update().catch(() => {});
      }, 30000);
    }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}


