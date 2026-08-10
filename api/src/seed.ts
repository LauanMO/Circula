// Semear o banco com anúncios de exemplo.
//
// Serve para o deploy: no Render (plano gratuito) o banco em arquivo nasce
// vazio a cada subida, então a Landing Page apareceria sem nenhum anúncio.
// Esta função popula o banco UMA vez, e só se ele estiver vazio — assim nunca
// duplica dados nem atropela anúncios reais que já existam.
//
// Fica atrás da variável de ambiente SEMENTE: em produção define-se SEMENTE=1;
// no desenvolvimento e nos testes ela não é definida, então o comportamento
// local continua idêntico (lá o banco é populado à mão com popular-banco.mjs).

import * as banco from './db.ts';
import type { Anuncio } from './tipos.ts';

type Exemplo = Omit<Anuncio, 'id' | 'criadoEm'>;

const [ana, bruno, carla] = ['exemplo-ana', 'exemplo-bruno', 'exemplo-carla'];

const EXEMPLOS: Exemplo[] = [
  {
    titulo: 'Cálculo Volume 1 — James Stewart',
    descricao:
      'Sétima edição, capa dura. Anotações a lápis nos capítulos de limites e derivadas, o resto limpo.',
    categoria: 'Livros',
    tipo: 'venda',
    preco: 85,
    imagemUrl: 'https://picsum.photos/seed/calculo1/600/400',
    usuarioId: ana,
  },
  {
    titulo: 'Jaleco branco manga longa — tamanho M',
    descricao:
      'Usado um semestre nas aulas de laboratório. Lavado, sem manchas. Doando porque troquei de curso.',
    categoria: 'Vestuário',
    tipo: 'doacao',
    preco: null,
    imagemUrl: 'https://picsum.photos/seed/jaleco/600/400',
    usuarioId: ana,
  },
  {
    titulo: 'Calculadora HP 12C Gold',
    descricao: 'Original, funcionando perfeitamente, com capa e manual. Ótima para financeira.',
    categoria: 'Engenharia',
    tipo: 'venda',
    preco: 180,
    imagemUrl: 'https://picsum.photos/seed/hp12c/600/400',
    usuarioId: bruno,
  },
  {
    titulo: 'Kit Arduino Uno + protoboard e jumpers',
    descricao: 'Comprado para microcontroladores, usado em dois projetos. Vai com LEDs e sensores.',
    categoria: 'Eletrônicos',
    tipo: 'venda',
    preco: 120,
    imagemUrl: 'https://picsum.photos/seed/arduino/600/400',
    usuarioId: bruno,
  },
  {
    titulo: 'Algoritmos: Teoria e Prática — Cormen',
    descricao: 'O CLRS, terceira edição em português. Capa com marcas de uso, miolo intacto.',
    categoria: 'Computação',
    tipo: 'venda',
    preco: 140,
    imagemUrl: 'https://picsum.photos/seed/cormen/600/400',
    usuarioId: carla,
  },
  {
    titulo: 'Cadeira de escritório com regulagem de altura',
    descricao: 'Estofado preto, rodinhas ok, um dos braços com um risco. Retirar perto do campus.',
    categoria: 'Móveis',
    tipo: 'venda',
    preco: 90,
    imagemUrl: 'https://picsum.photos/seed/cadeira/600/400',
    usuarioId: carla,
  },
  {
    titulo: 'Apostilas de Física I e II impressas',
    descricao: 'Listas resolvidas e provas antigas. Doando para quem vai pegar as disciplinas agora.',
    categoria: 'Livros',
    tipo: 'doacao',
    preco: null,
    imagemUrl: 'https://picsum.photos/seed/apostilas/600/400',
    usuarioId: ana,
  },
  {
    titulo: 'Esquadro, escalímetro e prancheta A3',
    descricao: 'Material de desenho técnico completo. Prancheta com um amassado na quina.',
    categoria: 'Engenharia',
    tipo: 'doacao',
    preco: null,
    imagemUrl: 'https://picsum.photos/seed/desenho/600/400',
    usuarioId: bruno,
  },
  {
    titulo: 'Monitor LG 21,5" Full HD',
    descricao: 'HDMI e VGA, sem pixel queimado. Acompanha os cabos. Vendo porque troquei por tela maior.',
    categoria: 'Eletrônicos',
    tipo: 'venda',
    preco: 320,
    imagemUrl: 'https://picsum.photos/seed/monitor/600/400',
    usuarioId: carla,
  },
  {
    titulo: 'Estante de livros 4 prateleiras',
    descricao: 'MDF branco, desmontável, cabe no porta-malas. Doando porque estou saindo da república.',
    categoria: 'Móveis',
    tipo: 'doacao',
    preco: null,
    imagemUrl: 'https://picsum.photos/seed/estante/600/400',
    usuarioId: ana,
  },
];

/** Popula o banco com os exemplos, mas só quando ele ainda está vazio. */
export function semearSeVazio(): void {
  // Reusa a própria listagem: se já há qualquer anúncio, não faz nada.
  if (banco.listar({ limite: 1 }).length > 0) {
    console.log('Semente: banco já tem anúncios, nada a fazer.');
    return;
  }

  for (const exemplo of EXEMPLOS) {
    banco.criar(exemplo);
  }

  console.log(`Semente: ${EXEMPLOS.length} anúncios de exemplo inseridos.`);
}
