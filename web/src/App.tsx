import { useState } from 'react';
import type { FC } from 'react';
import type { Tela } from './tipos.ts';
import { obterUsuarioId } from './usuario.ts';
import { IconeCasa, IconeEtiqueta, IconeMais, IconeReciclar } from './icones.tsx';
import Inicio from './telas/Inicio.tsx';
import Anunciar from './telas/Anunciar.tsx';
import MeusAnuncios from './telas/MeusAnuncios.tsx';

type Aba = {
  id: Tela;
  rotulo: string;
  Icone: FC<{ className?: string }>;
};

// A mesma lista alimenta o menu do desktop (topo) e a barra do mobile
// (rodapé). Uma fonte só evita que os dois menus saiam de sincronia.
const ABAS: Aba[] = [
  { id: 'inicio', rotulo: 'Início', Icone: IconeCasa },
  { id: 'anunciar', rotulo: 'Anunciar', Icone: IconeMais },
  { id: 'meus', rotulo: 'Meus anúncios', Icone: IconeEtiqueta },
];

export default function App() {
  const [tela, setTela] = useState<Tela>('inicio');

  // A função é passada sem parênteses para o useState chamá-la uma única vez,
  // na montagem, em vez de a cada renderização.
  const [usuarioId] = useState(obterUsuarioId);

  function navegar(destino: Tela) {
    setTela(destino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app">
      <header className="cabecalho">
        <button type="button" className="marca" onClick={() => navegar('inicio')}>
          <IconeReciclar className="marca__icone" />
          Circula
        </button>

        <nav className="navDesktop" aria-label="Navegação principal">
          {ABAS.map(({ id, rotulo }) => (
            <button
              key={id}
              type="button"
              className={`navDesktop__item ${tela === id ? 'ativo' : ''}`}
              onClick={() => navegar(id)}
              aria-current={tela === id ? 'page' : undefined}
            >
              {rotulo}
            </button>
          ))}
        </nav>
      </header>

      <main className="conteudo">
        {tela === 'inicio' && <Inicio aoNavegar={navegar} />}
        {tela === 'anunciar' && (
          <Anunciar usuarioId={usuarioId} aoPublicar={() => navegar('meus')} />
        )}
        {tela === 'meus' && <MeusAnuncios usuarioId={usuarioId} aoNavegar={navegar} />}
      </main>

      {/* Só aparece no mobile, via media query. É o que dá ao PWA a aparência
          de aplicativo nativo em vez de site aberto no navegador. */}
      <nav className="navMobile" aria-label="Navegação">
        {ABAS.map(({ id, rotulo, Icone }) => (
          <button
            key={id}
            type="button"
            className={`navMobile__item ${tela === id ? 'ativo' : ''}`}
            onClick={() => navegar(id)}
            aria-current={tela === id ? 'page' : undefined}
          >
            <Icone />
            <span>{rotulo}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
