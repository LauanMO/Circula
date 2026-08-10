// Ponto de entrada da API.
//
// Este arquivo só monta o servidor: liga o CORS, registra as rotas sob /api,
// define o que acontece quando algo dá errado e sobe a porta.

import Fastify from 'fastify';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { rotasAnuncios } from './rotas.ts';
import { semearSeVazio } from './seed.ts';

const app = Fastify({ logger: false });

// O frontend roda em outra porta (5173) durante o desenvolvimento, então o
// navegador bloquearia as chamadas sem esta liberação.
await app.register(cors, { origin: true });

await app.register(rotasAnuncios, { prefix: '/api' });

// Log enxuto de uma linha por requisição. Mais legível que o log padrão em
// JSON quando se está acompanhando o terminal.
app.addHook('onResponse', async (requisicao, resposta) => {
  console.log(
    `${requisicao.method} ${requisicao.url} → ${resposta.statusCode} (${resposta.elapsedTime.toFixed(0)}ms)`,
  );
});

// Qualquer exceção não tratada vira um 500 em JSON. Sem isto o cliente
// receberia HTML, que o frontend não sabe interpretar.
app.setErrorHandler((erro: FastifyError, _requisicao: FastifyRequest, resposta: FastifyReply) => {
  console.error(erro);

  // Erros que o próprio Fastify classificou (como um JSON malformado no corpo)
  // já trazem statusCode e uma mensagem segura de exibir. Qualquer outra coisa
  // é bug nosso: vira 500 com mensagem genérica, para não vazar detalhe interno.
  resposta.status(erro.statusCode ?? 500).send({
    erro: erro.statusCode ? erro.message : 'Erro interno no servidor',
  });
});

app.setNotFoundHandler((requisicao, resposta) => {
  resposta.status(404).send({ erro: `Rota não encontrada: ${requisicao.url}` });
});

// Em produção (Render) o banco nasce vazio a cada subida; com SEMENTE=1 ele é
// populado com exemplos, mas só se estiver vazio. Localmente a variável não é
// definida, então nada muda no desenvolvimento nem nos testes.
if (process.env.SEMENTE === '1') {
  semearSeVazio();
}

const porta = Number(process.env.PORT ?? 3333);

// host 0.0.0.0 (e não apenas localhost) para que o celular na mesma rede
// consiga acessar a API durante a demonstração do PWA.
await app.listen({ port: porta, host: '0.0.0.0' });

console.log(`API no ar em http://localhost:${porta}/api`);
