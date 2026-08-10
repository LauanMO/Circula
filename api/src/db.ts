// Camada de acesso a dados.
//
// Todo o SQL do projeto está neste arquivo, de propósito: as rotas não sabem
// qual banco existe por trás, elas apenas chamam estas funções. Se um dia o
// SQLite virar Postgres, só este arquivo precisa ser reescrito.
//
// Usamos o módulo `node:sqlite`, que já vem embutido no Node 22+. Não há
// dependência externa nem compilação nativa envolvida.

import { DatabaseSync } from 'node:sqlite';
import type { Anuncio, Categoria } from './tipos.ts';

const ARQUIVO_BANCO = process.env.BANCO ?? 'dados.db';

const db = new DatabaseSync(ARQUIVO_BANCO);

// Criada uma única vez, na subida do servidor. `IF NOT EXISTS` deixa a
// operação repetível: rodar o servidor de novo não apaga nada.
db.exec(`
  CREATE TABLE IF NOT EXISTS anuncios (
    id        TEXT PRIMARY KEY,
    titulo    TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tipo      TEXT NOT NULL,
    preco     REAL,
    imagemUrl TEXT NOT NULL,
    usuarioId TEXT NOT NULL,
    criadoEm  TEXT NOT NULL
  )
`);

// O SQLite devolve objetos sem prototype. Convertemos para um objeto comum e
// tipado antes de entregar para o resto da aplicação.
function paraAnuncio(linha: Record<string, unknown>): Anuncio {
  return {
    id: linha.id as string,
    titulo: linha.titulo as string,
    descricao: linha.descricao as string,
    categoria: linha.categoria as Categoria,
    tipo: linha.tipo as Anuncio['tipo'],
    preco: linha.preco === null ? null : Number(linha.preco),
    imagemUrl: linha.imagemUrl as string,
    usuarioId: linha.usuarioId as string,
    criadoEm: linha.criadoEm as string,
  };
}

export type FiltroListagem = {
  categoria?: string;
  usuarioId?: string;
  limite?: number;
};

/**
 * Lista anúncios do mais recente para o mais antigo.
 *
 * Os filtros são opcionais e se acumulam. As condições são montadas em um
 * array e só depois unidas com AND — assim os valores nunca entram na string
 * do SQL, eles viajam como parâmetros (`?`). É isso que impede SQL injection.
 */
export function listar({ categoria, usuarioId, limite = 50 }: FiltroListagem = {}): Anuncio[] {
  const condicoes: string[] = [];
  const valores: (string | number)[] = [];

  if (categoria) {
    condicoes.push('categoria = ?');
    valores.push(categoria);
  }

  if (usuarioId) {
    condicoes.push('usuarioId = ?');
    valores.push(usuarioId);
  }

  const onde = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

  const linhas = db
    .prepare(`SELECT * FROM anuncios ${onde} ORDER BY criadoEm DESC LIMIT ?`)
    .all(...valores, limite) as Record<string, unknown>[];

  return linhas.map(paraAnuncio);
}

export function buscarPorId(id: string): Anuncio | null {
  const linha = db.prepare('SELECT * FROM anuncios WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;

  return linha ? paraAnuncio(linha) : null;
}

export function criar(dados: Omit<Anuncio, 'id' | 'criadoEm'>): Anuncio {
  const anuncio: Anuncio = {
    ...dados,
    id: crypto.randomUUID(),
    criadoEm: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO anuncios (id, titulo, descricao, categoria, tipo, preco, imagemUrl, usuarioId, criadoEm)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    anuncio.id,
    anuncio.titulo,
    anuncio.descricao,
    anuncio.categoria,
    anuncio.tipo,
    anuncio.preco,
    anuncio.imagemUrl,
    anuncio.usuarioId,
    anuncio.criadoEm,
  );

  return anuncio;
}

/**
 * Remove um anúncio, mas só se ele pertencer ao usuário informado.
 *
 * O `usuarioId` entra no WHERE justamente para que ninguém consiga apagar o
 * anúncio de outra pessoa chutando um id. Devolve false quando nada foi
 * apagado — seja porque o id não existe, seja porque é de outro dono.
 */
export function remover(id: string, usuarioId: string): boolean {
  const resultado = db
    .prepare('DELETE FROM anuncios WHERE id = ? AND usuarioId = ?')
    .run(id, usuarioId);

  return Number(resultado.changes) > 0;
}

export type Estatisticas = {
  totalAnuncios: number;
  totalDoacoes: number;
  totalVendas: number;
  categoriasAtivas: number;
};

/** Números agregados para a vitrine da Landing Page. */
export function estatisticas(): Estatisticas {
  const linha = db
    .prepare(
      `SELECT
         COUNT(*)                                        AS totalAnuncios,
         SUM(CASE WHEN tipo = 'doacao' THEN 1 ELSE 0 END) AS totalDoacoes,
         SUM(CASE WHEN tipo = 'venda'  THEN 1 ELSE 0 END) AS totalVendas,
         COUNT(DISTINCT categoria)                        AS categoriasAtivas
       FROM anuncios`,
    )
    .get() as Record<string, unknown>;

  return {
    totalAnuncios: Number(linha.totalAnuncios ?? 0),
    totalDoacoes: Number(linha.totalDoacoes ?? 0),
    totalVendas: Number(linha.totalVendas ?? 0),
    categoriasAtivas: Number(linha.categoriasAtivas ?? 0),
  };
}
