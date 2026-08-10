import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // `host: true` expõe o servidor na rede local. É o que permite abrir o
    // PWA no celular durante a demonstração, e não só no localhost do PC.
    host: true,
    // O frontend chama sempre /api/... e o Vite repassa para o backend na
    // porta 3333. Assim o código não precisa saber o endereço da API em
    // desenvolvimento, e não esbarramos em CORS.
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
  // O `preview` serve a build de produção. É nele que o Service Worker fica
  // ativo, então é onde o PWA é testado de verdade — e por isso ele também
  // precisa do proxy para a API.
  preview: {
    host: true,
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
});
