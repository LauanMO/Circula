import type { Anuncio } from '../tipos.ts';
import CardAnuncio from './CardAnuncio.tsx';

type Props = {
  anuncios: Anuncio[];
  carregando: boolean;
  erro: string | null;
  /** Texto mostrado quando a busca não retorna nada. */
  vazio: string;
  aoExcluir?: (id: string) => void;
  excluindoId?: string | null;
};

/**
 * Grade de anúncios com os três estados que toda lista carregada de uma API
 * precisa tratar: carregando, erro e vazio. Sem isso a tela fica em branco e
 * o usuário não sabe se o app travou ou se realmente não há nada.
 */
export default function Vitrine({
  anuncios,
  carregando,
  erro,
  vazio,
  aoExcluir,
  excluindoId,
}: Props) {
  if (carregando) {
    return (
      <div className="grade" aria-busy="true" aria-label="Carregando anúncios">
        {/* Esqueletos com a mesma altura dos cards, para o conteúdo não
            "pular" quando os dados chegarem. */}
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="esqueleto" />
        ))}
      </div>
    );
  }

  if (erro) {
    return (
      <p className="aviso aviso--erro" role="alert">
        {erro}
      </p>
    );
  }

  if (anuncios.length === 0) {
    return <p className="aviso">{vazio}</p>;
  }

  return (
    <div className="grade">
      {anuncios.map((anuncio) => (
        <CardAnuncio
          key={anuncio.id}
          anuncio={anuncio}
          aoExcluir={aoExcluir}
          excluindo={excluindoId === anuncio.id}
        />
      ))}
    </div>
  );
}
