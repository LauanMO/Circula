import { useState } from 'react';
import type { Anuncio } from '../tipos.ts';
import { formatarPreco, formatarQuando } from '../formato.ts';
import { IconeLixeira } from '../icones.tsx';

type Props = {
  anuncio: Anuncio;
  /** Quando presente, o card mostra o botão de excluir. */
  aoExcluir?: (id: string) => void;
  excluindo?: boolean;
};

export default function CardAnuncio({ anuncio, aoExcluir, excluindo = false }: Props) {
  // A URL da imagem é digitada pelo usuário, então precisa haver um plano B
  // para quando o link estiver quebrado ou o host fora do ar.
  const [imagemQuebrou, setImagemQuebrou] = useState(false);

  const doacao = anuncio.tipo === 'doacao';

  return (
    <article className={`card ${excluindo ? 'card--saindo' : ''}`}>
      <div className="card__imagem">
        {imagemQuebrou ? (
          <div className="card__semImagem" aria-hidden>
            {anuncio.categoria.charAt(0)}
          </div>
        ) : (
          <img
            src={anuncio.imagemUrl}
            alt={anuncio.titulo}
            loading="lazy"
            onError={() => setImagemQuebrou(true)}
          />
        )}

        <span className={`selo ${doacao ? 'selo--doacao' : 'selo--venda'}`}>
          {formatarPreco(anuncio.preco)}
        </span>
      </div>

      <div className="card__corpo">
        <span className="card__categoria">{anuncio.categoria}</span>
        <h3 className="card__titulo">{anuncio.titulo}</h3>
        <p className="card__descricao">{anuncio.descricao}</p>

        <footer className="card__rodape">
          <time dateTime={anuncio.criadoEm}>{formatarQuando(anuncio.criadoEm)}</time>

          {aoExcluir && (
            <button
              type="button"
              className="botaoIcone"
              onClick={() => aoExcluir(anuncio.id)}
              disabled={excluindo}
              aria-label={`Excluir o anúncio ${anuncio.titulo}`}
            >
              <IconeLixeira />
            </button>
          )}
        </footer>
      </div>
    </article>
  );
}
