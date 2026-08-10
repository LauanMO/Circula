// Rotas REST do marketplace.
//
// Toda entrada que vem do cliente passa antes pelo zod. A regra aqui é
// simples: nada chega no banco sem ter sido validado.

import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as banco from './db.ts';
import { CATEGORIAS } from './tipos.ts';

// O usuarioId identifica quem publica e quem pode apagar. A mesma regra
// (string não-vazia, sem espaços nas pontas) vale nas três rotas que o
// recebem, então ela é definida uma vez e reaproveitada.
const usuarioId = z.string().trim().min(1, 'Usuário não identificado');

// Transforma um erro do Zod na resposta 400 padrão da API: uma mensagem geral
// mais a lista de campos que falharam, cada um com a sua mensagem. É esse
// formato de `detalhes` que o formulário do frontend usa para destacar o
// input exato que deu errado.
function erroDeValidacao(resposta: FastifyReply, mensagem: string, erro: z.ZodError) {
  return resposta.status(400).send({
    erro: mensagem,
    detalhes: erro.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
  });
}

// Formato aceito para criar um anúncio. As mensagens estão em português
// porque elas são exibidas direto no formulário do frontend.
const novoAnuncio = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(3, 'O título precisa de pelo menos 3 caracteres')
      .max(80, 'O título pode ter no máximo 80 caracteres'),
    descricao: z
      .string()
      .trim()
      .min(10, 'Descreva o item em pelo menos 10 caracteres')
      .max(500, 'A descrição pode ter no máximo 500 caracteres'),
    categoria: z.enum(CATEGORIAS),
    tipo: z.enum(['venda', 'doacao']),
    preco: z.number().positive('O preço precisa ser maior que zero').nullable().optional(),
    imagemUrl: z
      .string()
      .trim()
      .regex(/^https?:\/\/.+/, 'Informe uma URL de imagem começando com http'),
    usuarioId,
  })
  // Uma venda sem preço não faz sentido. Esta checagem cruza dois campos, por
  // isso ela mora em um refine e não na definição de um campo isolado.
  .refine((dados) => dados.tipo !== 'venda' || typeof dados.preco === 'number', {
    message: 'Anúncios de venda precisam de um preço',
    path: ['preco'],
  });

const filtros = z.object({
  categoria: z.enum(CATEGORIAS).optional(),
  usuarioId: usuarioId.optional(),
  limite: z.coerce.number().int().positive().max(100).optional(),
});

export async function rotasAnuncios(app: FastifyInstance) {
  // Sonda de saúde. Útil no deploy e para conferir rapidamente se a API subiu.
  app.get('/health', async () => ({ status: 'ok' }));

  // Números da vitrine da Landing Page.
  app.get('/estatisticas', async () => banco.estatisticas());

  // Lista os anúncios. Aceita ?categoria=Livros, ?usuarioId=... e ?limite=...
  // A tela "meus anúncios" é só esta mesma rota com o usuarioId preenchido.
  app.get('/anuncios', async (requisicao, resposta) => {
    const resultado = filtros.safeParse(requisicao.query);

    if (!resultado.success) {
      return erroDeValidacao(resposta, 'Filtros inválidos', resultado.error);
    }

    return banco.listar(resultado.data);
  });

  app.get('/anuncios/:id', async (requisicao, resposta) => {
    const { id } = requisicao.params as { id: string };
    const anuncio = banco.buscarPorId(id);

    if (!anuncio) {
      return resposta.status(404).send({ erro: 'Anúncio não encontrado' });
    }

    return anuncio;
  });

  app.post('/anuncios', async (requisicao, resposta) => {
    const resultado = novoAnuncio.safeParse(requisicao.body);

    if (!resultado.success) {
      return erroDeValidacao(resposta, 'Dados inválidos', resultado.error);
    }

    const dados = resultado.data;

    const anuncio = banco.criar({
      titulo: dados.titulo,
      descricao: dados.descricao,
      categoria: dados.categoria,
      tipo: dados.tipo,
      // Doação nunca guarda preço, mesmo que o cliente tenha mandado um.
      preco: dados.tipo === 'doacao' ? null : (dados.preco ?? null),
      imagemUrl: dados.imagemUrl,
      usuarioId: dados.usuarioId,
    });

    return resposta.status(201).send(anuncio);
  });

  // O usuarioId vai no corpo e é conferido no DELETE do banco, para que
  // ninguém apague o anúncio de outra pessoa.
  app.delete('/anuncios/:id', async (requisicao, resposta) => {
    const { id } = requisicao.params as { id: string };
    const corpo = z.object({ usuarioId }).safeParse(requisicao.body);

    if (!corpo.success) {
      return resposta.status(400).send({ erro: 'Informe o usuarioId' });
    }

    const apagou = banco.remover(id, corpo.data.usuarioId);

    if (!apagou) {
      return resposta
        .status(404)
        .send({ erro: 'Anúncio não encontrado ou não pertence a este usuário' });
    }

    return resposta.status(204).send();
  });
}
