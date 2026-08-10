// Espelho dos tipos da API. Como o backend e o frontend são projetos npm
// separados, estes tipos são declarados dos dois lados. O contrato entre eles
// é o JSON trafegado — se um lado mudar, o outro precisa acompanhar.

export const CATEGORIAS = [
  'Livros',
  'Engenharia',
  'Computação',
  'Eletrônicos',
  'Móveis',
  'Vestuário',
  'Outros',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export type Tipo = 'venda' | 'doacao';

export type Anuncio = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  tipo: Tipo;
  preco: number | null;
  imagemUrl: string;
  usuarioId: string;
  criadoEm: string;
};

export type Estatisticas = {
  totalAnuncios: number;
  totalDoacoes: number;
  totalVendas: number;
  categoriasAtivas: number;
};

/** Um erro de validação devolvido pela API, já apontando o campo culpado. */
export type DetalheErro = {
  campo: string;
  mensagem: string;
};

/**
 * As três telas do app. A navegação é feita por estado no App, sem biblioteca
 * de rotas: são poucas telas e assim não há uma dependência a mais para
 * carregar nem uma camada a mais para entender.
 */
export type Tela = 'inicio' | 'anunciar' | 'meus';
