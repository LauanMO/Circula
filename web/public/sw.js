// Service Worker do Circula.
//
// Ele é um script que o navegador mantém rodando fora da página, entre a
// aplicação e a rede. Toda requisição do app passa por ele antes de sair — e
// é isso que permite responder mesmo sem internet.
//
// São dois caches, com estratégias diferentes, porque o que eles guardam tem
// naturezas diferentes:
//
//   CACHE_APP   → HTML, JS, CSS e ícones. Mudam só quando publicamos uma
//                 versão nova, então valem cache primeiro (resposta instantânea).
//
//   CACHE_DADOS → respostas de /api. Mudam a toda hora, então vale rede
//                 primeiro, caindo no cache apenas quando a rede falha. É o
//                 que faz o app continuar exibindo os anúncios já vistos
//                 quando o celular está offline.

const VERSAO = 'v1';
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
    evento.respondWith(redePrimeiro(requisicao));
  } else {
    evento.respondWith(cachePrimeiro(requisicao));
  }
});

/**
 * Rede primeiro, cache como rede de segurança.
 *
 * Usada nos dados: o usuário sempre vê a informação mais recente quando tem
 * conexão, e continua vendo a última versão conhecida quando não tem.
 */
async function redePrimeiro(requisicao) {
  const cache = await caches.open(CACHE_DADOS);

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

    // Nunca esteve online nesta rota: devolvemos um JSON de erro, e não um
    // HTML de erro do navegador, para o frontend saber interpretar.
    return new Response(
      JSON.stringify({ erro: 'Você está offline e estes dados ainda não foram carregados.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

/**
 * Cache primeiro, rede como complemento.
 *
 * Usada nos arquivos estáticos: se já temos, respondemos na hora. Se não,
 * buscamos e guardamos para a próxima.
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
    // Offline pedindo uma página: devolvemos o index.html do cache. O React
    // assume dali e a navegação interna continua funcionando.
    if (requisicao.mode === 'navigate') {
      const inicio = await caches.match('/index.html');
      if (inicio) return inicio;
    }

    return Response.error();
  }
}
