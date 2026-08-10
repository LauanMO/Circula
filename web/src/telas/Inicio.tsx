import { useEffect, useState } from 'react';
import { buscarEstatisticas } from '../api.ts';
import { useAnuncios } from '../useAnuncios.ts';
import { CATEGORIAS } from '../tipos.ts';
import type { Categoria, Estatisticas, Tela } from '../tipos.ts';
import Vitrine from '../componentes/Vitrine.tsx';

type Props = {
  aoNavegar: (tela: Tela) => void;
};

export default function Inicio({ aoNavegar }: Props) {
  // `undefined` significa "todas as categorias" — é o estado inicial do filtro.
  const [categoria, setCategoria] = useState<Categoria | undefined>(undefined);
  const [numeros, setNumeros] = useState<Estatisticas | null>(null);

  const { anuncios, carregando, erro } = useAnuncios({ categoria, limite: 12 });

  useEffect(() => {
    // Se as estatísticas falharem, a página continua útil: a vitrine é o que
    // importa. Por isso o erro aqui é silencioso.
    buscarEstatisticas()
      .then(setNumeros)
      .catch(() => setNumeros(null));
  }, []);

  function irParaVitrine() {
    document.getElementById('vitrine')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <section className="hero">
        <div className="hero__conteudo">
          <span className="hero__etiqueta">Economia circular no campus</span>

          <h1 className="hero__titulo">
            O que não serve mais pra você resolve a vida de outro estudante.
          </h1>

          <p className="hero__texto">
            Livros de cálculo encostados na estante, o jaleco do semestre passado, a calculadora
            que você não usa mais. O Circula conecta quem está saindo com quem está chegando —
            por doação ou por um preço justo, dentro da própria universidade.
          </p>

          <div className="hero__acoes">
            <button type="button" className="botao botao--primario" onClick={() => aoNavegar('anunciar')}>
              Quero anunciar um item
            </button>
            <button type="button" className="botao botao--secundario" onClick={irParaVitrine}>
              Ver o que já tem
            </button>
          </div>
        </div>
      </section>

      <section className="numeros" aria-label="Números da plataforma">
        <Numero valor={numeros?.totalAnuncios} rotulo="Itens anunciados" />
        <Numero valor={numeros?.totalDoacoes} rotulo="Disponíveis para doação" />
        <Numero valor={numeros?.totalVendas} rotulo="À venda" />
        <Numero valor={numeros?.categoriasAtivas} rotulo="Categorias ativas" />
      </section>

      <section className="secao" id="vitrine">
        <header className="secao__cabecalho">
          <h2>Últimos anúncios</h2>
          <p>Filtre por categoria para achar o que precisa.</p>
        </header>

        <div className="filtros" role="group" aria-label="Filtrar por categoria">
          <button
            type="button"
            className={`chip ${categoria === undefined ? 'ativo' : ''}`}
            onClick={() => setCategoria(undefined)}
          >
            Todas
          </button>

          {CATEGORIAS.map((nome) => (
            <button
              key={nome}
              type="button"
              className={`chip ${categoria === nome ? 'ativo' : ''}`}
              onClick={() => setCategoria(nome)}
            >
              {nome}
            </button>
          ))}
        </div>

        <Vitrine
          anuncios={anuncios}
          carregando={carregando}
          erro={erro}
          vazio={
            categoria
              ? `Ainda não há nada anunciado em ${categoria}. Que tal ser o primeiro?`
              : 'Nenhum anúncio publicado ainda. Comece você!'
          }
        />
      </section>

      <footer className="rodape">
        <p>
          Circula — projeto desenvolvido para o desafio técnico do Laboratório de Inovação Vortex
          (UNIFOR).
        </p>
      </footer>
    </>
  );
}

/** Um número da faixa de estatísticas. Mostra "—" enquanto não carregou. */
function Numero({ valor, rotulo }: { valor: number | undefined; rotulo: string }) {
  return (
    <div className="numero">
      <strong>{valor ?? '—'}</strong>
      <span>{rotulo}</span>
    </div>
  );
}
