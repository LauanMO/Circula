import { useState } from 'react';
import { removerAnuncio } from '../api.ts';
import { useAnuncios } from '../useAnuncios.ts';
import type { Tela } from '../tipos.ts';
import Vitrine from '../componentes/Vitrine.tsx';

type Props = {
  usuarioId: string;
  aoNavegar: (tela: Tela) => void;
};

export default function MeusAnuncios({ usuarioId, aoNavegar }: Props) {
  // Mesma listagem da vitrine, só que filtrada pelo usuário. É por isso que
  // a rota GET /anuncios aceita ?usuarioId= em vez de existir um endpoint
  // separado só para isso.
  const { anuncios, carregando, erro, recarregar } = useAnuncios({ usuarioId });

  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  async function excluir(id: string) {
    if (!window.confirm('Tem certeza que quer excluir este anúncio?')) return;

    setExcluindoId(id);
    setErroExclusao(null);

    try {
      await removerAnuncio(id, usuarioId);
      recarregar();
    } catch (e) {
      setErroExclusao(e instanceof Error ? e.message : 'Não foi possível excluir.');
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <section className="secao">
      <header className="secao__cabecalho">
        <h2>Meus anúncios</h2>
        <p>
          {carregando
            ? 'Carregando...'
            : `Você tem ${anuncios.length} ${
                anuncios.length === 1 ? 'anúncio publicado' : 'anúncios publicados'
              }.`}
        </p>
      </header>

      {erroExclusao && (
        <p className="aviso aviso--erro" role="alert">
          {erroExclusao}
        </p>
      )}

      <Vitrine
        anuncios={anuncios}
        carregando={carregando}
        erro={erro}
        vazio="Você ainda não publicou nada."
        aoExcluir={excluir}
        excluindoId={excluindoId}
      />

      {!carregando && anuncios.length === 0 && (
        <button
          type="button"
          className="botao botao--primario"
          onClick={() => aoNavegar('anunciar')}
        >
          Publicar meu primeiro anúncio
        </button>
      )}
    </section>
  );
}
