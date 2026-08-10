// Hook que busca anúncios na API.
//
// Existe porque três telas diferentes precisam da mesma coisa: pedir a lista,
// mostrar "carregando", mostrar o erro se der ruim e permitir recarregar.
// Em vez de repetir esse useEffect em cada tela, ele mora aqui.

import { useCallback, useEffect, useState } from 'react';
import { listarAnuncios } from './api.ts';
import type { FiltrosAnuncio } from './api.ts';
import type { Anuncio } from './tipos.ts';

export function useAnuncios({ categoria, usuarioId, limite }: FiltrosAnuncio = {}) {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Contador que serve só para forçar uma nova busca quando alguém chama
  // recarregar() — por exemplo, depois de apagar um anúncio.
  const [gatilho, setGatilho] = useState(0);

  const recarregar = useCallback(() => setGatilho((n) => n + 1), []);

  useEffect(() => {
    // Se o filtro mudar antes da resposta chegar, esta flag impede que a
    // resposta antiga sobrescreva a nova na tela.
    let cancelado = false;

    setCarregando(true);
    setErro(null);

    listarAnuncios({ categoria, usuarioId, limite })
      .then((dados) => {
        if (!cancelado) setAnuncios(dados);
      })
      .catch((e: unknown) => {
        if (!cancelado) setErro(e instanceof Error ? e.message : 'Erro ao carregar anúncios');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
    // As dependências são valores primitivos de propósito. Se passássemos o
    // objeto de filtros inteiro, ele seria novo a cada render e o efeito
    // rodaria em loop infinito.
  }, [categoria, usuarioId, limite, gatilho]);

  return { anuncios, carregando, erro, recarregar };
}
