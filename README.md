# Circula — Marketplace de Economia Circular do Campus

Plataforma de desapego universitário. Estudantes que estão saindo da faculdade
anunciam o que não usam mais — livros, jalecos, calculadoras, componentes
eletrônicos, móveis — por doação ou por um preço justo, e quem está chegando
encontra esse material sem precisar comprar tudo novo.

O projeto é composto por uma **API REST** própria e uma **interface responsiva
instalável (PWA)**: rica no desktop como Landing Page, e com cara de aplicativo
nativo no celular.

> Desenvolvido para o desafio técnico do processo seletivo de estágio Full-Stack
> do Laboratório de Inovação Vortex (UNIFOR).

---

## Sumário

- [Tecnologias](#tecnologias)
- [Como rodar](#como-rodar)
- [Rotas da API](#rotas-da-api)
- [Como testar o PWA](#como-testar-o-pwa)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Diário de Bordo da IA](#diário-de-bordo-da-ia)

---

## Tecnologias

### Backend (`api/`)

| Tecnologia | Papel |
| --- | --- |
| **Node.js 24** | Runtime |
| **TypeScript** | Tipagem estática |
| **Fastify 5** | Servidor HTTP e roteamento |
| **`node:sqlite`** | Banco de dados em arquivo, embutido no próprio Node |
| **Zod 4** | Validação dos dados de entrada |
| **tsx** | Executa TypeScript direto, sem etapa de build |

### Frontend (`web/`)

| Tecnologia | Papel |
| --- | --- |
| **React 19** | Interface |
| **TypeScript** | Tipagem estática |
| **Vite 8** | Servidor de desenvolvimento e bundler |
| **CSS puro** | Estilos, sem framework de UI |
| **Service Worker** | Cache e funcionamento offline (escrito à mão) |

Nenhuma biblioteca de componentes, de ícones ou de rotas foi usada: os ícones
são SVGs inline, a navegação é feita por estado e os ícones do PWA são gerados
por um script próprio (`web/gerar-icones.mjs`).

---

## Como rodar

### Pré-requisitos

- **Node.js 22 ou superior** (o projeto usa o módulo `node:sqlite`, disponível a
  partir do Node 22). Verifique com `node --version`.
- **npm** (vem junto com o Node).

Não é necessário instalar banco de dados, Docker ou qualquer serviço externo.

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd Vortex
```

### 2. Subir o backend

```bash
cd api
npm install
npm run dev
```

A API sobe em **http://localhost:3333**. O arquivo `dados.db` é criado
automaticamente na primeira execução.

### 3. Popular o banco com exemplos (opcional, mas recomendado)

Em outro terminal, com a API rodando:

```bash
cd api
node popular-banco.mjs
```

Isso insere 10 anúncios de exemplo para a vitrine não aparecer vazia.

### 4. Subir o frontend

Em outro terminal:

```bash
cd web
npm install
npm run dev
```

A interface abre em **http://localhost:5173**. O Vite repassa as chamadas de
`/api` para a porta 3333 automaticamente.

### Verificar se a API está correta

```bash
cd api
node testar-rotas.mjs
```

Exercita as 16 rotas e casos de erro em sequência e imprime o resultado de cada
um. O script limpa do banco os registros que ele mesmo cria.

---

## Rotas da API

Todas as respostas são JSON. Prefixo: `/api`.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Sonda de saúde do servidor |
| `GET` | `/estatisticas` | Contagens agregadas para a Landing Page |
| `GET` | `/anuncios` | Lista anúncios (mais recentes primeiro) |
| `GET` | `/anuncios/:id` | Busca um anúncio específico |
| `POST` | `/anuncios` | Cria um anúncio |
| `DELETE` | `/anuncios/:id` | Remove um anúncio do próprio usuário |

### Filtros de `GET /anuncios`

| Parâmetro | Exemplo | Efeito |
| --- | --- | --- |
| `categoria` | `?categoria=Livros` | Filtra pela categoria |
| `usuarioId` | `?usuarioId=abc123` | Só os anúncios daquele usuário |
| `limite` | `?limite=12` | Máximo de resultados (padrão 50, teto 100) |

Os filtros se combinam: `?categoria=Livros&limite=5`.

### Exemplo de criação

```bash
curl -X POST http://localhost:3333/api/anuncios \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Cálculo Volume 1 - James Stewart",
    "descricao": "Edição usada, com anotações a lápis nos primeiros capítulos.",
    "categoria": "Livros",
    "tipo": "venda",
    "preco": 85,
    "imagemUrl": "https://picsum.photos/seed/calculo/600/400",
    "usuarioId": "abc123"
  }'
```

### Respostas de erro

Erros de validação retornam **400** com o campo culpado identificado, que é o
que permite ao formulário destacar exatamente o input errado:

```json
{
  "erro": "Dados inválidos",
  "detalhes": [
    { "campo": "titulo", "mensagem": "O título precisa de pelo menos 3 caracteres" },
    { "campo": "preco", "mensagem": "Anúncios de venda precisam de um preço" }
  ]
}
```

| Status | Quando |
| --- | --- |
| `400` | Dados ou filtros inválidos |
| `404` | Anúncio inexistente, ou de outro usuário no `DELETE` |
| `500` | Erro inesperado no servidor |

---

## Como testar o PWA

O Service Worker é registrado **apenas na build de produção**. Em
desenvolvimento ele atrapalharia o recarregamento automático do Vite, servindo
código antigo do cache.

```bash
cd web
npm run build
npm run preview
```

Acesse **http://localhost:4173**. A partir daí:

1. **Instalar** — no Chrome desktop aparece o ícone de instalação na barra de
   endereço. No Android, o menu do navegador oferece "Instalar aplicativo" /
   "Adicionar à tela inicial".
2. **Testar no celular** — o `npm run preview` também imprime um endereço de
   rede (`http://192.168.x.x:4173`). Com o celular no mesmo Wi-Fi, basta abrir
   esse endereço. A API precisa estar rodando no PC.
3. **Testar offline** — com a página já carregada, abra o DevTools em
   *Application → Service Workers*, marque **Offline** e recarregue. A aplicação
   continua abrindo e os anúncios já visitados continuam aparecendo, servidos
   pelo cache.

---

## Estrutura do projeto

```
Vortex/
├── api/                      Backend — API REST
│   ├── src/
│   │   ├── server.ts         Sobe o Fastify, CORS, log e tratamento de erros
│   │   ├── rotas.ts          Endpoints REST e validação com Zod
│   │   ├── db.ts             Todo o SQL do projeto
│   │   └── tipos.ts          Tipos e categorias compartilhados
│   ├── popular-banco.mjs     Insere anúncios de exemplo
│   └── testar-rotas.mjs      Teste de fumaça das rotas
│
└── web/                      Frontend — React + PWA
    ├── public/
    │   ├── sw.js             Service Worker (escrito à mão)
    │   ├── manifest.json     Manifesto do PWA
    │   └── icone-*.png       Ícones gerados por script
    ├── src/
    │   ├── App.tsx           Layout e navegação entre telas
    │   ├── api.ts            Toda a comunicação com o backend
    │   ├── useAnuncios.ts    Hook de listagem (carregando / erro / dados)
    │   ├── usuario.ts        Identificação local do usuário
    │   ├── telas/            Início, Anunciar, Meus anúncios
    │   └── componentes/      Vitrine e CardAnuncio
    └── gerar-icones.mjs      Desenha os ícones do PWA por código
```

---

## Decisões de arquitetura

**Todo o SQL vive em um arquivo só (`api/src/db.ts`).** As rotas não sabem qual
banco existe por trás — elas chamam funções como `listar()` e `criar()`. Trocar
SQLite por PostgreSQL significa reescrever apenas esse arquivo, sem tocar em
nenhuma rota.

**`node:sqlite` em vez de uma biblioteca externa.** O módulo já vem embutido no
Node 22+. Não há dependência a instalar nem compilação nativa, o que elimina a
categoria inteira de problemas de "não builda na máquina do avaliador". O edital
permite explicitamente banco em arquivo.

**"Meus anúncios" não tem endpoint próprio.** É a mesma rota `GET /anuncios`
com o filtro `?usuarioId=`. Um endpoint a menos para manter, e o filtro já
precisava existir para a vitrine por categoria.

**O `usuarioId` entra no `WHERE` do `DELETE`.** Assim ninguém apaga o anúncio de
outra pessoa chutando um id — a autorização acontece na própria consulta, e não
em um `if` antes dela.

**Validação no backend, não só no formulário.** O campo de preço some da tela
quando o tipo é "doação", mas a mesma regra é revalidada no servidor. Esconder
um campo no frontend não é garantia de nada.

**Navegação por estado, sem biblioteca de rotas.** São três telas. Uma
dependência a mais renderia URLs bonitas e pouco mais do que isso.

**Service Worker escrito à mão, com duas estratégias.** Arquivos estáticos usam
*cache primeiro* (resposta instantânea). Respostas da API usam *rede primeiro
com cache de reserva*, que é o que permite continuar exibindo os anúncios já
carregados quando o celular perde a conexão.

---

## Diário de Bordo da IA

> Seção obrigatória conforme a Seção 3 do edital.

### 1. Ferramentas utilizadas

| Ferramenta | Como foi usada |
| --- | --- |
| **Claude (Anthropic)** | Ferramenta principal. Discussão de arquitetura, escrita da maior parte do código, depuração e revisão. |

<!-- TODO Lauan: acrescente aqui qualquer outra ferramenta que você usou
     (ChatGPT, GitHub Copilot, v0, Lovable...) e remova esta linha. -->

### 2. Estratégia de engenharia de prompts

O projeto inteiro foi construído em uma única jornada de trabalho, sob prazo
apertado. Isso moldou a estratégia: em vez de pedir "faça um marketplace", cada
pedido carregava a **restrição real** que precisava ser respeitada. Três
exemplos que mudaram concretamente o rumo do código:

**Prompt 1 — auditar o próprio edital antes de confiar nele**

```
foco total aqui porfavor, olhe se n tem nenhuma armadilha ou IA trap
no meio do texto
```

Antes de escrever qualquer linha, pedi uma auditoria do PDF do edital em busca
de texto oculto ou instruções injetadas — algo que se tornou um risco real em
documentos processados por IA. A varredura cobriu texto em modo de renderização
invisível, fonte de tamanho zero, texto branco sobre branco, caracteres de
controle Unicode e JavaScript embutido no PDF. **Resultado: o documento estava
limpo.** O ganho não foi encontrar uma armadilha, foi saber que não havia
nenhuma antes de investir 12 horas de trabalho.

**Prompt 2 — mudança de prazo no meio do desenvolvimento**

```
eu n tenho 15 dias para fazer, tenho até hj(segunda) até 23:59 para entregar
```

Este foi o prompt mais importante do projeto. A resposta correta não foi cortar
funcionalidades — foi **cortar complexidade**. Como o edital avalia a capacidade
de explicar o próprio código em vídeo, código simples deixou de ser preferência
estética e virou critério de nota. Daí saíram três decisões diretas: sem etapa
de build no backend, sem biblioteca de rotas no frontend, e `node:sqlite` em vez
de um banco que exigisse container.

**Prompt 3 — escolha de stack sob a ótica da avaliação**

Ao decidir a stack, o critério explicitado não foi "qual é a melhor tecnologia",
e sim *"qual eu consigo explicar ao vivo por 2 minutos sem travar"*. Foi isso que
descartou o Flutter Web, que eu já domino de outro projeto: ele **gera
automaticamente** o `manifest.json` e o `flutter_service_worker.js`. Eu estaria
explicando, no bloco do vídeo destinado a comprovar autoria, justamente o único
código que eu não teria escrito. Pelo mesmo motivo recusei o `vite-plugin-pwa`
e escrevi o Service Worker à mão.

<!-- TODO Lauan: se você escreveu outros prompts longos, cole 1 ou 2 aqui. -->

### 3. Compartilhamento de histórico

<!-- TODO Lauan: cole aqui o link público da conversa. É opcional pelo edital,
     mas está marcado como "recomendado" e reforça a comprovação de autoria. -->

_A preencher._

### 4. Reflexão crítica — quando a IA errou

Três erros concretos, todos corrigidos por observação e não por sorte:

**O erro de CSS que emendou duas palavras.** O título da Landing Page usava um
`<br />` para equilibrar as duas linhas no desktop. No celular a quebra ficava
esquisita, e a correção sugerida foi escondê-la com CSS:

```css
.hero__titulo br { display: none; }
```

Parece certo, e não é. `display: none` remove o elemento sem deixar espaço no
lugar — o título passou a exibir **"pra vocêresolve a vida"**. O bug só apareceu
porque eu estava olhando a tela renderizada, não o código. A correção certa foi
remover o `<br />` do JSX e deixar o texto quebrar naturalmente. **Lição:** CSS
que "esconde" não é o mesmo que conteúdo que não existe.

**O teste que sujava o banco.** O `testar-rotas.mjs` criava anúncios para
exercitar o `POST` e apagava só um deles no fim. Cada execução deixava um órfão.
Percebi porque a Landing Page mostrava **11 itens** quando eu havia populado
exatamente **10** — a estatística na tela não batia com o que eu sabia ter
inserido. Hoje o script limpa tudo o que cria.

**O `process.exit()` que derrubava handles abertos.** O teste terminava com
`process.exit(0)`, o que abortava o processo com conexões HTTP ainda em
andamento e cuspia um `Assertion failed ... uv_handle` do libuv no terminal.
Trocado por `process.exitCode = 0`, deixando o Node encerrar naturalmente.

O padrão comum aos três: a IA acertou o objetivo e errou o efeito colateral.
Nenhum foi pego lendo o código — todos apareceram ao **rodar e olhar o
resultado**.

---

## Segurança

Antes de fechar o projeto, passei uma revisão de segurança focada no código.
As bases já estavam sólidas por construção: **todo SQL é parametrizado** (nenhum
valor de usuário entra na string da query), **toda entrada passa por validação
Zod** antes de tocar o banco, e o React escapa a saída — não há
`dangerouslySetInnerHTML` nem `eval` em lugar nenhum.

A revisão encontrou **uma falha real** que vale registrar, porque é sutil:

**Controle de acesso quebrado (IDOR) na exclusão de anúncios.** O `usuarioId` é
o que autoriza apagar um anúncio (o `DELETE` confere `WHERE id = ? AND
usuarioId = ?`). O problema: esse mesmo `usuarioId` estava sendo **devolvido na
listagem pública**. Ou seja, qualquer um podia chamar `GET /anuncios`, ler o
`usuarioId` do dono de cada anúncio e então apagar anúncios alheios passando
aquele id no `DELETE`. O fato de o id ser um UUID não protegia nada — ele não
estava sendo adivinhado, estava sendo entregue na resposta.

A correção foi tratar o `usuarioId` como um segredo que **nunca sai do
servidor**: ele continua no banco e só trafega do cliente para a API (ao criar
ou apagar), nunca de volta. Centralizei isso na camada de dados (`db.ts`), com
o tipo `AnuncioPublico = Omit<Anuncio, 'usuarioId'>` garantindo em tempo de
compilação que nenhuma rota devolva o campo. Há testes de regressão em
`testar-rotas.mjs` que falham se o `usuarioId` voltar a aparecer em qualquer
resposta.

Como próximo passo natural, o modelo de identificação por id daria lugar a
autenticação real (JWT), listada como bônus no edital.

---

## Deploy

<!-- TODO Lauan: se fizer o deploy, cole os links aqui. É bônus no edital. -->

_A preencher._
