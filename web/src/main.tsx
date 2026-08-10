import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { registrarServiceWorker } from './registrarSW.ts';
import './estilos.css';

const raiz = document.getElementById('root');

if (!raiz) {
  throw new Error('Elemento #root não encontrado no index.html');
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registrarServiceWorker();
