// Tipos e constantes compartilhados pela API inteira.

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

/** Um anúncio pode ser uma venda (tem preço) ou uma doação (preço nulo). */
export type Tipo = 'venda' | 'doacao';

export type Anuncio = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  tipo: Tipo;
  /** Em reais. Sempre null quando tipo === 'doacao'. */
  preco: number | null;
  imagemUrl: string;
  /** Identifica quem publicou, para a tela "meus anúncios". */
  usuarioId: string;
  criadoEm: string;
};
