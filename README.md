# Circula — Marketplace de Economia Circular do Campus

[![CI](https://github.com/LauanMO/Circula/actions/workflows/ci.yml/badge.svg)](https://github.com/LauanMO/Circula/actions/workflows/ci.yml)

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
- [Segurança](#segurança)
- [Deploy](#deploy)

**A aplicação no ar:** https://vortexlm.vercel.app

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

Exercita as rotas e os casos de erro em sequência — 19 verificações no total,
incluindo três que garantem que o `usuarioId` nunca aparece numa resposta
(ver [Segurança](#segurança)). O script limpa do banco os registros que ele
mesmo cria.

---

## Rotas da API

Todas as respostas são JSON. Prefixo: `/api`.

A raiz do servidor (`GET /`) fica fora do prefixo e devolve um índice dos
endpoints — abrir a URL da API no navegador mostra o que existe, em vez de um
404.

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
│   │   ├── seed.ts           Anúncios de exemplo para a primeira subida
│   │   └── tipos.ts          Tipos e categorias compartilhados
│   ├── .node-version         Fixa o Node 24 no deploy
│   ├── popular-banco.mjs     Insere anúncios de exemplo (uso local)
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
    │   ├── formato.ts        Formatação de preço e data
    │   ├── estilos.css       Folha de estilo única, com as media queries
    │   ├── telas/            Início, Anunciar, Meus anúncios
    │   └── componentes/      Vitrine e CardAnuncio
    ├── vercel.json           Repassa /api para a API publicada
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

**Service Worker escrito à mão, com três estratégias.** Os arquivos em
`/assets/` usam *cache primeiro*: o Vite põe um hash no nome, então quando o
conteúdo muda o nome muda junto e o que está em cache nunca fica errado. O
`index.html` usa *rede primeiro*, porque ele **não** tem hash e é quem aponta
qual bundle carregar — servi-lo do cache prenderia o usuário numa versão antiga
do app para sempre. E as respostas da API usam *rede primeiro com cache de
reserva*, que é o que permite continuar exibindo os anúncios já carregados
quando o celular perde a conexão.

---

## Diário de Bordo da IA

> Seção obrigatória conforme a Seção 3 do edital.

### 1. Ferramentas utilizadas

| Ferramenta | Como foi usada |
| --- | --- |
| **Claude (Anthropic)** | Única ferramenta de IA usada no projeto, via Claude Code no terminal. Discussão de arquitetura, escrita da maior parte do código, depuração, revisão de segurança e revisão de qualidade. |

Optei por concentrar o trabalho em uma ferramenta só. Alternar entre várias
significaria reexplicar o contexto do projeto a cada troca — e, num prazo de um
dia, esse retrabalho custaria mais do que qualquer ganho. Como o Claude Code
roda no terminal e enxerga os arquivos do repositório, ele mantinha o contexto
entre uma tarefa e outra, o que permitiu pedidos curtos e diretos como os da
seção seguinte.

### 2. Estratégia de engenharia de prompts

O projeto inteiro foi construído em uma única jornada de trabalho, sob prazo
apertado. Isso moldou uma estratégia deliberada: **não pedir código, pedir
decisão sob restrição.**

Um prompt como "faça um marketplace" devolve código genérico que eu teria de
auditar linha a linha. Em vez disso, cada pedido meu carregava a restrição real
do projeto — o prazo, o critério de avaliação, o risco que eu queria eliminar —
e deixava a solução técnica ser derivada dela. Os prompts abaixo são curtos de
propósito: o trabalho de engenharia está em **qual restrição eu escolhi
impor**, não no tamanho do texto.

Os quatro exemplos a seguir são reais e cada um mudou concretamente o rumo do
projeto — dois deles evitaram problemas que eu não teria encontrado sozinho.

**Prompt 1 — auditar o próprio edital antes de confiar nele**

```
foco total aqui porfavor, olhe se não tem nenhuma armadilha ou IA trap
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
eu não tenho 15 dias para fazer, tenho até hj(segunda) até 23:59 para entregar
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

**Prompt 4 — auditar o código que a própria IA escreveu**

```
rode os agents e skills para a melhora e segurança do code
```

Este é o prompt de que mais me orgulho, porque parte de uma desconfiança
saudável: **se a IA escreveu boa parte do código, ela também precisa ser usada
para atacá-lo.** Pedi uma revisão de segurança e uma revisão de qualidade em
paralelo, tratando o próprio trabalho como código de terceiro.

A revisão de segurança encontrou uma falha real — e minha, de modelagem: o
`usuarioId`, que autoriza apagar um anúncio, estava sendo devolvido na listagem
pública. Qualquer pessoa poderia ler o id do dono em `GET /anuncios` e apagar
anúncios alheios. O fato de ser um UUID não protegia nada: ele não estava sendo
adivinhado, estava sendo entregue na resposta.

A correção está descrita na seção [Segurança](#segurança). O ponto aqui é o
método: o valor não veio de "a IA escreveu o código", veio de **eu ter mandado a
IA procurar o que estava errado no código, e ter entendido o achado bem o
bastante para escolher a correção** (uma projeção única em `db.ts`, em vez de um
remendo em cada rota) e travá-la com testes de regressão.

### 3. Compartilhamento de histórico

O trabalho foi feito pelo **Claude Code**, que roda no terminal e atua sobre os
arquivos do repositório em vez de numa janela de chat no navegador. Por isso não
existe um link público de conversa para compartilhar: o histórico fica na
máquina, e o que ele produziu está registrado no próprio repositório.

O rastro verificável dessa colaboração é o **histórico de commits**, que mostra a
ordem real em que o projeto foi construído — a API antes do frontend, o PWA
depois, e as correções de segurança e de cache no fim, já com o resto
funcionando.

<!-- Se quiser anexar um link de conversa (ChatGPT/Claude web), cole aqui. -->

Os quatro prompts da seção anterior estão reproduzidos exatamente como foram
escritos, com os erros de digitação preservados.

### 4. Reflexão crítica — quando a IA errou

Quatro erros concretos, todos corrigidos por observação e não por sorte:

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

**O cache que prendia o app numa versão antiga.** Este foi o mais sério, e só
apareceu no teste final. O Service Worker guardava o `index.html` com estratégia
*cache primeiro*, igual aos outros arquivos estáticos. O problema é que os
arquivos de `/assets/` têm um hash no nome — quando mudam de conteúdo, mudam de
nome — mas o `index.html` não. Como é ele que aponta qual bundle carregar,
servi-lo do cache significava que **nenhuma versão nova do app jamais chegaria a
quem já tinha visitado o site**.

Comprovei comparando as duas pontas: o servidor entregava `index-C6hgmfPZ.js`, e
o navegador insistia em carregar `index-BpmNXD6w.js`, de uma build anterior. A
correção foi passar o HTML para *rede primeiro* e manter *cache primeiro* apenas
no que é imutável. **Lição:** cachear tudo do mesmo jeito é o caminho mais curto
para publicar uma correção que ninguém recebe.

O padrão comum aos quatro: a IA acertou o objetivo e errou o efeito colateral.
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

A aplicação é publicada em duas partes, conforme a natureza de cada uma —
exatamente a divisão sugerida pelo edital:

- **Frontend → Vercel.** É um build estático do Vite, encaixe natural. O
  arquivo `web/vercel.json` faz o Vercel repassar (`rewrite`) as chamadas de
  `/api` para a API no Render. Assim o navegador enxerga tudo no mesmo domínio:
  não há CORS, e o Service Worker continua cacheando as respostas da API para o
  modo offline (o SW só intercepta requisições do mesmo domínio).
- **API → Render.** É um servidor de longa duração com banco em arquivo, que
  não se encaixa no modelo serverless do Vercel (sistema de arquivos efêmero). O
  Render roda `npm start` num processo persistente. A versão do Node é fixada em
  `api/.node-version` (24), porque o módulo `node:sqlite` exige Node ≥ 22.5.

Variáveis de ambiente na API (Render):

| Variável | Valor | Para quê |
| --- | --- | --- |
| `SEMENTE` | `1` | Popula o banco com anúncios de exemplo na primeira subida (só se estiver vazio), para a vitrine não aparecer vazia. |
| `PORT` | _(automático)_ | O Render injeta; o servidor a lê de `process.env.PORT`. |

### Links da aplicação em produção

| | Endereço |
| --- | --- |
| **Aplicação (PWA)** | https://vortexlm.vercel.app |
| **API** | https://vortex-z6wf.onrender.com |

A raiz da API responde com um índice dos endpoints disponíveis. Para conferir
que ela está no ar: [`/api/health`](https://vortex-z6wf.onrender.com/api/health).

> **Nota sobre o primeiro acesso.** A API está no plano gratuito do Render, que
> suspende o serviço após alguns minutos sem tráfego. A primeira requisição
> depois de um período ocioso pode levar cerca de 40 segundos enquanto o
> serviço volta; as seguintes respondem normalmente.
