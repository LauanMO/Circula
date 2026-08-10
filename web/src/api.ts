// Toda comunicação com o backend passa por aqui.
//
// Nenhum componente chama fetch diretamente: eles chamam estas funções. Isso
// mantém o tratamento de erro em um lugar só e deixa os componentes cuidando
// apenas da tela.

import type { Anuncio, Categoria, DetalheErro, Estatisticas } from './tipos.ts';

// Em desenvolvimento fica vazio e o Vite faz o proxy de /api para a porta
// 3333. Em produção, VITE_API_URL aponta para a API publicada.
const BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Erro vindo da API já com os detalhes de validação separados, para o
 * formulário conseguir destacar o campo exato que falhou.
 */
export class ErroDaApi extends Error {
  status: number;
  detalhes: DetalheErro[];

  constructor(mensagem: string, status: number, detalhes: DetalheErro[] = []) {
    super(mensagem);
    this.name = 'ErroDaApi';
    this.status = status;
    this.detalhes = detalhes;
  }
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response;

  try {
    resposta = await fetch(`${BASE}/api${caminho}`, {
      ...opcoes,
      headers: { 'Content-Type': 'application/json', ...opcoes.headers },
    });
  } catch {
    // fetch só rejeita quando a requisição nem chegou a sair: servidor fora
    // do ar, sem internet, DNS falhando.
    throw new ErroDaApi('Não foi possível falar com o servidor. Verifique sua conexão.', 0);
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new ErroDaApi(
      corpo.erro ?? `Erro ${resposta.status}`,
      resposta.status,
      corpo.detalhes ?? [],
    );
  }

  // 204 significa "deu certo, sem conteúdo" — tentar ler JSON aqui quebraria.
  if (resposta.status === 204) {
    return undefined as T;
  }

  return resposta.json() as Promise<T>;
}

export function listarAnuncios(filtros: {
  categoria?: Categoria;
  usuarioId?: string;
  limite?: number;
} = {}): Promise<Anuncio[]> {
  const parametros = new URLSearchParams();

  if (filtros.categoria) parametros.set('categoria', filtros.categoria);
  if (filtros.usuarioId) parametros.set('usuarioId', filtros.usuarioId);
  if (filtros.limite) parametros.set('limite', String(filtros.limite));

  const query = parametros.toString();

  return requisitar<Anuncio[]>(`/anuncios${query ? `?${query}` : ''}`);
}

export function criarAnuncio(dados: Omit<Anuncio, 'id' | 'criadoEm'>): Promise<Anuncio> {
  return requisitar<Anuncio>('/anuncios', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export function removerAnuncio(id: string, usuarioId: string): Promise<void> {
  return requisitar<void>(`/anuncios/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ usuarioId }),
  });
}

export function buscarEstatisticas(): Promise<Estatisticas> {
  return requisitar<Estatisticas>('/estatisticas');
}
