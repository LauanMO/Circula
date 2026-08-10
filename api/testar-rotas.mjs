// Teste de fumaça das rotas da API.
//
// Não é um framework de testes: é um script que chama cada endpoint em
// sequência e confere o status devolvido. Serve para verificar rapidamente,
// depois de mexer no backend, se tudo continua de pé.
//
// Uso: com a API rodando, execute `node testar-rotas.mjs`

const BASE = process.env.BASE ?? 'http://localhost:3333/api';

let passou = 0;
let falhou = 0;

async function checar(nome, esperado, requisicao) {
  const resposta = await requisicao();
  const ok = resposta.status === esperado;

  if (ok) {
    passou++;
    console.log(`  ok   ${nome} → ${resposta.status}`);
  } else {
    falhou++;
    const corpo = await resposta.text();
    console.log(`  FALHA ${nome} → esperava ${esperado}, veio ${resposta.status}`);
    console.log(`        ${corpo.slice(0, 200)}`);
  }

  return resposta;
}

// Além do status, às vezes precisamos afirmar algo sobre o corpo da resposta.
function afirmar(nome, condicao) {
  if (condicao) {
    passou++;
    console.log(`  ok   ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHA ${nome}`);
  }
}

const json = (metodo, corpo) => ({
  method: metodo,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo),
});

const USUARIO = `teste-${Date.now()}`;

console.log(`\nTestando ${BASE}\n`);

await checar('GET  /health', 200, () => fetch(`${BASE}/health`));
await checar('GET  /estatisticas', 200, () => fetch(`${BASE}/estatisticas`));
await checar('GET  /anuncios', 200, () => fetch(`${BASE}/anuncios`));
await checar('GET  /anuncios?categoria=Livros', 200, () =>
  fetch(`${BASE}/anuncios?categoria=Livros`),
);

await checar('GET  /anuncios?categoria=Inexistente (categoria inválida)', 400, () =>
  fetch(`${BASE}/anuncios?categoria=Inexistente`),
);

const criado = await checar('POST /anuncios (venda válida)', 201, () =>
  fetch(
    `${BASE}/anuncios`,
    json('POST', {
      titulo: 'Cálculo Volume 1 - James Stewart',
      descricao: 'Edição usada, grifada a lápis, capa dura em bom estado.',
      categoria: 'Livros',
      tipo: 'venda',
      preco: 80,
      imagemUrl: 'https://picsum.photos/seed/calculo/600/400',
      usuarioId: USUARIO,
    }),
  ),
);

const anuncio = await criado.json();

// Segurança: o usuarioId é o que autoriza a exclusão de um anúncio. Ele nunca
// pode voltar numa resposta — se voltasse, qualquer um leria o id do dono na
// listagem e apagaria anúncios alheios. Estas afirmações travam esse vazamento.
afirmar('POST /anuncios não devolve usuarioId', !('usuarioId' in anuncio));

const listaPublica = await (await fetch(`${BASE}/anuncios`)).json();
afirmar(
  'GET /anuncios não expõe usuarioId em nenhum item',
  Array.isArray(listaPublica) && listaPublica.every((a) => !('usuarioId' in a)),
);

const porId = await (await fetch(`${BASE}/anuncios/${anuncio.id}`)).json();
afirmar('GET /anuncios/:id não expõe usuarioId', !('usuarioId' in porId));

const doacao = await checar('POST /anuncios (doação sem preço)', 201, () =>
  fetch(
    `${BASE}/anuncios`,
    json('POST', {
      titulo: 'Jaleco branco tamanho M',
      descricao: 'Usei por um semestre só, está limpo e sem manchas.',
      categoria: 'Vestuário',
      tipo: 'doacao',
      imagemUrl: 'https://picsum.photos/seed/jaleco/600/400',
      usuarioId: USUARIO,
    }),
  ),
);

await checar('POST /anuncios (título curto demais)', 400, () =>
  fetch(
    `${BASE}/anuncios`,
    json('POST', {
      titulo: 'ab',
      descricao: 'Descrição suficientemente longa para passar.',
      categoria: 'Livros',
      tipo: 'doacao',
      imagemUrl: 'https://picsum.photos/seed/x/600/400',
      usuarioId: USUARIO,
    }),
  ),
);

await checar('POST /anuncios (venda sem preço)', 400, () =>
  fetch(
    `${BASE}/anuncios`,
    json('POST', {
      titulo: 'Calculadora HP 12C',
      descricao: 'Funcionando perfeitamente, com capa protetora.',
      categoria: 'Engenharia',
      tipo: 'venda',
      imagemUrl: 'https://picsum.photos/seed/hp/600/400',
      usuarioId: USUARIO,
    }),
  ),
);

await checar('POST /anuncios (URL de imagem inválida)', 400, () =>
  fetch(
    `${BASE}/anuncios`,
    json('POST', {
      titulo: 'Mesa de estudos',
      descricao: 'Mesa simples de madeira, 1 metro de largura.',
      categoria: 'Móveis',
      tipo: 'doacao',
      imagemUrl: 'nao-e-uma-url',
      usuarioId: USUARIO,
    }),
  ),
);

await checar('GET  /anuncios/:id', 200, () => fetch(`${BASE}/anuncios/${anuncio.id}`));
await checar('GET  /anuncios/:id (inexistente)', 404, () =>
  fetch(`${BASE}/anuncios/id-que-nao-existe`),
);

await checar('GET  /anuncios?usuarioId= (meus anúncios)', 200, () =>
  fetch(`${BASE}/anuncios?usuarioId=${USUARIO}`),
);

await checar('DELETE /anuncios/:id (dono errado)', 404, () =>
  fetch(`${BASE}/anuncios/${anuncio.id}`, json('DELETE', { usuarioId: 'outra-pessoa' })),
);

await checar('DELETE /anuncios/:id (dono correto)', 204, () =>
  fetch(`${BASE}/anuncios/${anuncio.id}`, json('DELETE', { usuarioId: USUARIO })),
);

await checar('GET  /rota-que-nao-existe', 404, () => fetch(`${BASE}/rota-que-nao-existe`));

// O teste roda contra o mesmo banco da aplicação, então ele limpa o que
// criou. Sem isto cada execução deixaria um anúncio órfão na vitrine.
const { id: idDoacao } = await doacao.json();
await fetch(`${BASE}/anuncios/${idDoacao}`, json('DELETE', { usuarioId: USUARIO }));

console.log(`\n${passou} passaram, ${falhou} falharam\n`);

// Definimos o código de saída em vez de chamar process.exit(): assim o Node
// encerra sozinho depois que as conexões abertas terminam. Cortar o processo
// no meio derruba handles ainda em uso e vaza erro do libuv no terminal.
process.exitCode = falhou > 0 ? 1 : 0;
