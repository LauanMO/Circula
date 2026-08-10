import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { criarAnuncio, ErroDaApi } from '../api.ts';
import { CATEGORIAS } from '../tipos.ts';
import type { Categoria, Tipo } from '../tipos.ts';

type Props = {
  usuarioId: string;
  aoPublicar: () => void;
};

export default function Anunciar({ usuarioId, aoPublicar }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('Livros');
  const [tipo, setTipo] = useState<Tipo>('doacao');
  const [preco, setPreco] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // A API devolve os erros já com o nome do campo. Guardamos nesse formato
  // para conseguir imprimir a mensagem embaixo do input correspondente.
  const [erros, setErros] = useState<Record<string, string>>({});

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    setEnviando(true);
    setErroGeral(null);
    setErros({});

    try {
      await criarAnuncio({
        titulo,
        descricao,
        categoria,
        tipo,
        // Aceita tanto "80" quanto "80,50", que é como se digita em português.
        preco: tipo === 'venda' ? Number(preco.replace(',', '.')) : null,
        imagemUrl,
        usuarioId,
      });

      aoPublicar();
    } catch (e) {
      if (e instanceof ErroDaApi && e.detalhes.length > 0) {
        setErros(Object.fromEntries(e.detalhes.map((d) => [d.campo, d.mensagem])));
        setErroGeral('Confira os campos destacados abaixo.');
      } else {
        setErroGeral(e instanceof Error ? e.message : 'Não foi possível publicar o anúncio.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="secao secao--estreita">
      <header className="secao__cabecalho">
        <h2>Anunciar um item</h2>
        <p>Preencha os dados abaixo. Leva menos de um minuto.</p>
      </header>

      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo rotulo="Título" erro={erros.titulo}>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Cálculo Volume 1 - James Stewart"
            maxLength={80}
          />
        </Campo>

        <Campo rotulo="Descrição" erro={erros.descricao}>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Conte o estado de conservação, se tem anotações, marcas de uso..."
            rows={4}
            maxLength={500}
          />
        </Campo>

        <Campo rotulo="Categoria" erro={erros.categoria}>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
            {CATEGORIAS.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </Campo>

        <fieldset className="opcoes">
          <legend>Como você quer repassar?</legend>

          <label className={`opcao ${tipo === 'doacao' ? 'ativo' : ''}`}>
            <input
              type="radio"
              name="tipo"
              checked={tipo === 'doacao'}
              onChange={() => setTipo('doacao')}
            />
            <span>Doar</span>
          </label>

          <label className={`opcao ${tipo === 'venda' ? 'ativo' : ''}`}>
            <input
              type="radio"
              name="tipo"
              checked={tipo === 'venda'}
              onChange={() => setTipo('venda')}
            />
            <span>Vender</span>
          </label>
        </fieldset>

        {/* O campo de preço só existe quando faz sentido. A mesma regra é
            revalidada no backend — o frontend esconder não é garantia. */}
        {tipo === 'venda' && (
          <Campo rotulo="Preço (R$)" erro={erros.preco}>
            <input
              type="text"
              inputMode="decimal"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="80,00"
            />
          </Campo>
        )}

        <Campo rotulo="URL da imagem" erro={erros.imagemUrl}>
          <input
            type="url"
            value={imagemUrl}
            onChange={(e) => setImagemUrl(e.target.value)}
            placeholder="https://..."
          />
          <button
            type="button"
            className="linkBotao"
            onClick={() =>
              setImagemUrl(`https://picsum.photos/seed/${crypto.randomUUID().slice(0, 8)}/600/400`)
            }
          >
            Não tenho uma foto — usar imagem de exemplo
          </button>
        </Campo>

        {erroGeral && (
          <p className="aviso aviso--erro" role="alert">
            {erroGeral}
          </p>
        )}

        <button type="submit" className="botao botao--primario botao--largo" disabled={enviando}>
          {enviando ? 'Publicando...' : 'Publicar anúncio'}
        </button>
      </form>
    </section>
  );
}

/** Rótulo + input + mensagem de erro, para não repetir essa estrutura seis vezes. */
function Campo({
  rotulo,
  erro,
  children,
}: {
  rotulo: string;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <label className={`campo ${erro ? 'campo--comErro' : ''}`}>
      <span className="campo__rotulo">{rotulo}</span>
      {children}
      {erro && <span className="campo__erro">{erro}</span>}
    </label>
  );
}
