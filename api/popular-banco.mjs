// Popula o banco com anúncios de exemplo.
//
// Serve para a Landing Page não aparecer vazia em uma instalação nova. Os
// itens são coisas que de fato circulam entre estudantes no fim do semestre.
//
// Uso: com a API rodando, execute `node popular-banco.mjs`

const BASE = process.env.BASE ?? 'http://localhost:3333/api';

// Alguns "usuários" diferentes, para a vitrine não parecer obra de uma pessoa só.
const [ana, bruno, carla] = ['exemplo-ana', 'exemplo-bruno', 'exemplo-carla'];

const EXEMPLOS = [
  {
    titulo: 'Cálculo Volume 1 — James Stewart',
    descricao:
      'Sétima edição, capa dura. Tem anotações a lápis nos capítulos de limites e derivadas, o resto está limpo.',
    categoria: 'Livros',
    tipo: 'venda',
    preco: 85,
    imagemUrl: 'https://picsum.photos/seed/calculo1/600/400',
    usuarioId: ana,
  },
  {
    titulo: 'Jaleco branco manga longa — tamanho M',
    descricao:
      'Usei durante um semestre nas aulas de laboratório. Lavado, sem manchas e sem furos. Doando porque troquei de curso.',
    categoria: 'Vestuário',
    tipo: 'doacao',
    preco: null,
    imagemUrl: 'https://picsum.photos/seed/jaleco/600/400',
    usuarioId: ana,
  },
  {
    titulo: 'Calculadora HP 12C Gold',
    descricao:
      'Original, funcionando perfeitamente, com capa protetora e manual. Ideal para matemática financeira.',
    categoria: 'Engenharia',
    tipo: 'venda',
    preco: 180,
    imagemUrl: 'https://picsum.photos/seed/hp12c/600/400',
    usuarioId: bruno,
  },
  {
    titulo: 'Kit Arduino Uno + protoboard e jumpers',
    descricao:
      'Comprei para a disciplina de microcontroladores e usei em dois projetos. Vai com LEDs, resistores e sensores variados.',
    categoria: 'Eletrônicos',
    tipo: 'venda',
    preco: 120,
    imagemUrl: 'https://picsum.photos/seed/arduino/600/400',
    usuarioId: bruno,
  },
  {
    titulo: 'Algoritmos: Teoria e Prática — Cormen',
    descricao:
      'O famoso CLRS, terceira edição em português. Capa com marcas de uso, miolo intacto e sem grifos.',
    categoria: 'Computação',
    tipo: 'venda',
    preco: 140,
    imagemUrl: 'https://picsum.photos/seed/cormen/600/400',
    usuarioId: carla,
  },
  {
    titulo: 'Cadeira de escritório com regulagem de altura',
    descricao:
      'Estofado preto, rodinhas funcionando, um dos braços tem um risco. Retirar no bloco próximo ao campus.',
    categoria: 'Móveis',
    tipo: 'venda',
    preco: 90,
    imagemUrl: 'https://picsum.photos/seed/cadeira/600/400',
    usuarioId: carla,
  },
  {
    titulo: 'Apostilas de Física I e II impressas',
    descricao:
      'Listas de exercícios resolvidas e provas antigas do curso. Doando para quem for pegar as disciplinas agora.',
    categoria: 'Livros',
    tipo: 'doacao',
    preco: null,
    imagemUrl: 'https://picsum.photos/seed/apostilas/600/400',
    usuarioId: ana,
  },
  {
    titulo: 'Esquadro, escalímetro e prancheta A3',
    descricao:
      'Material completo de desenho técnico. Usei só no primeiro semestre. Prancheta com um amassado na quina.',
    categoria: 'Engenharia',
    tipo: 'doacao',
    preco: null,
    imagemUrl: 'https://picsum.photos/seed/desenho/600/400',
    usuarioId: bruno,
  },
  {
    titulo: 'Monitor LG 21,5" Full HD',
    descricao:
      'HDMI e VGA, sem pixel queimado. Acompanha cabo de força e HDMI. Motivo da venda: montei setup com tela maior.',
    categoria: 'Eletrônicos',
    tipo: 'venda',
    preco: 320,
    imagemUrl: 'https://picsum.photos/seed/monitor/600/400',
    usuarioId: carla,
  },
  {
    titulo: 'Estante de livros 4 prateleiras',
    descricao:
      'MDF branco, desmontável, cabe no porta-malas. Doando porque estou saindo da república no fim do mês.',
    categoria: 'Móveis',
    tipo: 'doacao',
    preco: null,
    imagemUrl: 'https://picsum.photos/seed/estante/600/400',
    usuarioId: ana,
  },
];

let criados = 0;

for (const exemplo of EXEMPLOS) {
  const resposta = await fetch(`${BASE}/anuncios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exemplo),
  });

  if (resposta.ok) {
    criados++;
    console.log(`  ok    ${exemplo.titulo}`);
  } else {
    console.log(`  falha ${exemplo.titulo} → ${resposta.status} ${await resposta.text()}`);
  }
}

console.log(`\n${criados} de ${EXEMPLOS.length} anúncios criados.\n`);
