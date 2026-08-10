// Service Worker do Circula.
//
// Ele é um script que o navegador mantém rodando fora da página, entre a
// aplicação e a rede. Toda requisição do app passa por ele antes de sair — e
// é isso que permite responder mesmo sem internet.
//
// São dois caches e três estratégias, porque o que guardamos tem naturezas
// diferentes:
//
//   Arquivos de /assets/ → cache primeiro. O Vite coloca um hash no nome
//                 (index-A1B2C3.js): se o conteúdo muda, o nome muda. Então o
//                 que está em cache nunca fica errado — é seguro servir na hora.
//
//   HTML (navegação) → rede primeiro. O index.html NÃO tem hash no nome, e é
//                 ele que aponta para qual bundle carregar. Se ele fosse cache
//                 primeiro, o usuário ficaria preso numa versão antiga do app
//                 para sempre, mesmo depois de publicarmos uma nova. Buscamos
//                 sempre o mais recente e usamos o cache só quando não há rede.
//
//   Respostas de /api → rede primeiro. Os dados mudam a toda hora; o cache
//                 serve de reserva para o app continuar exibindo os anúncios já
//                 vistos quando o celular está offline.

const VERSAO = 'v2';
const CACHE_APP = `circula-app-${VERSAO}`;
const CACHE_DADOS = `circula-dados-${VERSAO}`;

// O mínimo para a aplicação abrir sem rede.
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icone-192.png', '/icone-512.png'];

// ---------------------------------------------------------------- install

// Dispara na primeira vez que o Service Worker é registrado e sempre que o
// arquivo muda. É onde pré-carregamos o app shell.
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_APP)
      .then((cache) => cache.addAll(APP_SHELL))
      // Sem o skipWaiting o Service Worker novo ficaria esperando todas as
      // abas antigas fecharem para assumir.
      .then(() => self.skipWaiting()),
  );
});

// --------------------------------------------------------------- activate

// Dispara quando esta versão assume o controle. É a hora de jogar fora os
// caches das versões anteriores — senão eles se acumulariam para sempre.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => nome !== CACHE_APP && nome !== CACHE_DADOS)
            .map((nome) => caches.delete(nome)),
        ),
      )
      // Assume as abas que já estavam abertas, sem esperar um recarregamento.
      .then(() => self.clients.claim()),
  );
});

// ------------------------------------------------------------------ fetch

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;

  // Só GET entra em cache. Um POST de novo anúncio precisa chegar ao
  // servidor de verdade — respondê-lo do cache seria mentir para o usuário.
  if (requisicao.method !== 'GET') return;

  const url = new URL(requisicao.url);

  // Imagens hospedadas em outros domínios seguem o caminho normal, sem nossa
  // interferência.
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    // Dados: sempre o mais fresco, cache como reserva offline.
    evento.respondWith(redePrimeiro(requisicao, CACHE_DADOS));
  } else if (requisicao.mode === 'navigate') {
    // Abrir uma página. É o HTML que decide qual bundle carregar, então ele
    // precisa vir da rede sempre que possível — senão uma versão nova do app
    // nunca chegaria em quem já visitou o site.
    evento.respondWith(redePrimeiro(requisicao, CACHE_APP));
  } else {
    // JS, CSS e ícones: nome com hash, conteúdo imutável, pode servir do cache.
    evento.respondWith(cachePrimeiro(requisicao));
  }
});

/**
 * Rede primeiro, cache como rede de segurança.
 *
 * Usada nos dados e no HTML: com conexão o usuário sempre vê a versão mais
 * recente; sem conexão, continua vendo a última que ficou guardada.
 *
 * Recebe o cache a usar porque atende dois casos com destinos diferentes —
 * as respostas da API vão para o cache de dados, o HTML vai para o do app.
 */
async function redePrimeiro(requisicao, nomeDoCache) {
  const cache = await caches.open(nomeDoCache);

  try {
    const resposta = await fetch(requisicao);

    // A resposta só pode ser lida uma vez. Guardamos a cópia e entregamos a
    // original para a página.
    if (resposta.ok) {
      cache.put(requisicao, resposta.clone());
    }

    return resposta;
  } catch {
    const guardada = await cache.match(requisicao);

    if (guardada) return guardada;

    // Offline pedindo uma página que nunca visitamos: devolvemos o index.html.
    // O React assume dali e a navegação interna continua funcionando.
    if (requisicao.mode === 'navigate') {
      const inicio = await caches.match('/index.html');
      if (inicio) return inicio;
    }

    // Offline numa rota de API que nunca carregou: devolvemos JSON de erro, e
    // não um HTML do navegador, para o frontend saber interpretar.
    return new Response(
      JSON.stringify({ erro: 'Você está offline e estes dados ainda não foram carregados.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

/**
 * Cache primeiro, rede como complemento.
 *
 * Usada nos arquivos com hash no nome (JS, CSS) e nos ícones: se já temos,
 * respondemos na hora, sem tocar a rede. Se não, buscamos e guardamos para a
 * próxima. É seguro porque esses arquivos são imutáveis — quando o conteúdo
 * muda, o nome muda junto.
 */
async function cachePrimeiro(requisicao) {
  const guardada = await caches.match(requisicao);

  if (guardada) return guardada;

  try {
    const resposta = await fetch(requisicao);

    if (resposta.ok) {
      const cache = await caches.open(CACHE_APP);
      cache.put(requisicao, resposta.clone());
    }

    return resposta;
  } catch {
    // Offline e nunca baixamos este arquivo: não há o que devolver.
    return Response.error();
  }
}
