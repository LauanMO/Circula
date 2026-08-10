// Registro do Service Worker.
//
// Só registramos na build de produção. Em desenvolvimento o Vite recarrega os
// módulos a cada alteração, e um Service Worker cacheando por cima disso
// deixaria a tela mostrando código velho sem motivo aparente.
//
// Para testar o PWA de verdade: `npm run build` seguido de `npm run preview`.

export function registrarServiceWorker() {
  if (!import.meta.env.PROD) return;

  // Navegadores antigos (e alguns modos anônimos) não expõem a API.
  if (!('serviceWorker' in navigator)) return;

  // Esperamos o load para que o download do Service Worker não dispute
  // banda com os recursos necessários para a primeira pintura da tela.
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registro) => console.log('Service Worker registrado:', registro.scope))
      .catch((erro) => console.error('Falha ao registrar o Service Worker:', erro));
  });
}
