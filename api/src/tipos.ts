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

/**
 * O anúncio como ele sai do servidor: tudo, menos o `usuarioId`.
 *
 * O `usuarioId` é o que autoriza a exclusão de um anúncio, então ele NUNCA
 * pode aparecer numa resposta pública — se aparecesse, qualquer um leria o
 * id do dono na listagem e apagaria anúncios alheios. Ele fica só no banco e
 * viaja apenas do cliente para o servidor (no cabeçalho de quem cria/apaga),
 * nunca de volta.
 */
export type AnuncioPublico = Omit<Anuncio, 'usuarioId'>;
