# 🎸 Nacional Rock Brasil

Plataforma web — **rede social nichada + streaming + marketplace** — criada para democratizar a visibilidade de bandas de **rock independente** no Brasil. Diferente do *mainstream* (YouTube, Spotify), o projeto não é movido por algoritmos globais: ele opera com lógica de **hiperlocalidade**, permitindo que o fã descubra a cena do seu próprio estado ou município (ex.: Salvador, BA) de forma fácil e intuitiva. A experiência mistura *streaming* (embeds de música/vídeo), interação comunitária (essência de redes como o Orkut) e comércio direto (marketplace), conectando fã e artista e fomentando a subcultura local.

---

## Sumário

1. [Funcionalidades](#-funcionalidades)
2. [Stack e linguagens](#-stack-e-linguagens)
3. [Arquitetura](#-arquitetura)
4. [API](#-api)
5. [Modelo de dados](#-modelo-de-dados)
6. [Como rodar no localhost](#-como-rodar-no-localhost)
7. [Scripts e testes](#-scripts-e-testes)
8. [Deploy](#-deploy)

---

## ✨ Funcionalidades

- **Perfil de fã e de banda** — nome, bio, gênero, subgênero, UF, chave Pix (doações), aceite de termos, avatar e banner.
- **Player inteligente** — reprodução embutida do **Spotify, YouTube, SoundCloud e Bandcamp** com player global (play/pause, próximo/anterior, volume, progresso e busca).
- **Hiperlocalidade** — detecção do estado do visitante por geolocalização (`ipapi.co`) e destaques regionais ("Em alta no seu estado").
- **Home dinâmica** — carrossel hero, trendings regionais, novos lançamentos, músicas e vídeos recentes.
- **Artistas e eventos** — página de banda com conteúdo, shows e eventos filtrados por estado.
- **Engajamento comunitário** — seguir bandas, mural com postagens e curtidas, comentários na página da banda.
- **Classificados** — anúncios por categoria e estado.
- **Marketplace** — loja de produtos das bandas, com espaços de produto (slots) e pedidos de compra com comprovante.
- **Chat de negociação em tempo real** — entre fã e banda, vinculado ao produto (Supabase Realtime).
- **Painel do administrador** — criar bandas/usuários, destacar bandas na home, configurar banner e chave Pix do site, aprovar/rejeitar pagamentos e moderar conteúdo.
- **Papéis e moderação** — `admin`, `moderator` e `user`; suspensão de contas.
- **Interface responsiva** — sidebar no desktop e barra de navegação inferior no mobile.

---

## 🧩 Stack e linguagens

| Camada | Tecnologia |
| --- | --- |
| **Linguagem** | **TypeScript 5** (JavaScript com tipagem estática) |
| **Front-end** | **React 18** + Vite 5, React Router 6, TanStack Query |
| **UI** | Tailwind CSS 3, shadcn/ui (Radix UI), lucide-react, sonner, next-themes |
| **Backend / API** | **Supabase** — PostgreSQL (PostgREST) + Auth + Edge Functions (Deno) + Realtime + Storage |
| **Embeds** | Spotify, YouTube, SoundCloud e Bandcamp (iframes/widgets oficiais) |
| **Geolocalização** | ipapi.co |
| **Formulários** | React Hook Form + Zod |
| **Testes** | Vitest + Testing Library (jsdom) |
| **Deploy** | Vercel (SPA rewrites) |

---

## 🏗️ Arquitetura

O projeto é uma **SPA (Single Page Application)** de React/TypeScript que consome diretamente a **API do Supabase** (`@supabase/supabase-js` com tipos gerados do banco). Não existe servidor próprio: a camada de API é formada pelo Supabase (banco, autenticação, RLS e Realtime) e por **Edge Functions** (Deno) executadas no servidor.

```
┌─────────────────────────────────────────────────────────────┐
│ FRONT-END — SPA React (src/)                                 │
│ páginas → componentes → contextos → hooks → lib/integrations │
└──────────────────────────┬──────────────────────────────────┘
                           │ @supabase/supabase-js + REST
┌──────────────────────────▼──────────────────────────────────┐
│ SUPABASE — Backend as a Service                              │
│ • PostgreSQL + PostgREST (API REST/SQL) com RLS              │
│ • Auth (e-mail/senha) com persistência de sessão              │
│ • Realtime (chat de negociação)                               │
│ • Storage: site-assets (público) / payment-proofs (privado)   │
│ • Edge Functions (Deno): admin-setup e resolve-bandcamp       │
└──────────────────────────────────────────────────────────────┘
```

### Contextos globais (`src/contexts`)

- **AuthContext** — gerencia a sessão do Supabase Auth (login, logout, estado `loading`).
- **GeoContext** — detecta a UF do usuário via `https://ipapi.co/json/` e guarda em `sessionStorage`.
- **PlayerContext** — player global da faixa atual; expõe play/pause, progresso, volume e busca, integrando os widgets de música/vídeo.

### Integrações e utilitários

- `src/integrations/supabase/client.ts` — cliente tipado do Supabase.
- `src/lib/embedUtils.ts` — converte URLs comuns (YouTube, Spotify, SoundCloud, Bandcamp) em URLs de embed válidas.

### Estrutura de pastas

```
├── public/                    # arquivos estáticos (favicon, robots.txt)
├── src/
│   ├── components/            # componentes de UI e de negócio
│   │   └── ui/                # shadcn/ui (Radix UI)
│   ├── contexts/              # Auth, Geo e Player
│   ├── data/                  # dados mockados (layout/fallback de exemplo)
│   ├── hooks/                 # useChatRoom, useIsAdmin, use-mobile, use-toast
│   ├── integrations/supabase/ # cliente e tipos gerados do banco
│   ├── lib/                   # utils e embedUtils
│   ├── pages/                 # rotas da SPA (Index, Artistas, Eventos, Loja...)
│   └── test/                  # testes (Vitest)
├── supabase/
│   ├── migrations/            # SQL completo do banco (idempotente)
│   └── functions/             # Edge Functions (admin-setup, resolve-bandcamp)
├── .env.example               # variáveis de ambiente obrigatórias
├── vercel.json                # SPA rewrites para hospedagem
├── vite.config.ts             # alias "@/" → src; porta 8080 em dev
└── tailwind.config.ts
```

## 🔌 API

### Supabase (principal)

O front-end conversa com o Supabase via REST (**PostgREST**) usando a chave **anon/publishable**. A segurança é garantida por **Row Level Security (RLS)** — cada tabela tem políticas que limitam leitura/escrita conforme autenticação e papel do usuário.

Principais recursos consumidos:

- **Auth** — `supabase.auth` (`signUp`, `signInWithPassword`, `signOut`, `onAuthStateChange`), com sessão persistida em `localStorage`.
- **Banco** — `supabase.from('tabela')` com filtros, ordenação, paginação, joins e **Realtime** para o chat de negociação.
- **Storage** — upload de imagens (avatares, banners, capas de eventos) e comprovantes de pagamento.

### Edge Functions (Deno)

| Função | Objetivo |
| --- | --- |
| `admin-setup` | Cria contas de bandas ou administradores a pedido de um **admin logado**, usando a *service role* no servidor. A chave privilegiada nunca vai para o navegador. |
| `resolve-bandcamp` | Recebe um link do Bandcamp e devolve a URL oficial do player embutido (extrai o ID via `og:video` / `data-tralbum-id`). |

Endpoint em produção: `https://<PROJECT_REF>.functions.supabase.co/<nome-da-funcao>`

### APIs externas

- **ipapi.co** — geolocalização do visitante para a hiperlocalidade (detecção da UF).
- **Embeds** — Spotify (`open.spotify.com/embed`), YouTube (`/embed/VIDEO_ID`), SoundCloud (`w.soundcloud.com/player`) e Bandcamp (`bandcamp.com/EmbeddedPlayer`).

---

## 🗄️ Modelo de dados

| Tabela | Finalidade |
| --- | --- |
| `profiles` | Perfis de fã e banda (nome, bio, gênero, UF, Pix, slots de produto, suspensão, termos) |
| `user_roles` | Papéis `admin`, `moderator`, `user` — só o servidor altera |
| `content` | Links de música/vídeo (Spotify, YouTube, Bandcamp, SoundCloud) |
| `events` | Shows e eventos (data, local, cidade, imagem) |
| `posts` / `post_likes` | Mural da banda e curtidas |
| `comments` | Comentários na página da banda |
| `follows` | Seguidores de bandas |
| `classifieds` | Classificados |
| `products` | Produtos do marketplace |
| `payment_requests` | Pedidos de compra de espaços de produto (com comprovante) |
| `chat_rooms` / `messages` | Chat de negociação (tempo real) |
| `home_featured` | Bandas em destaque na home |
| `site_settings` | Banner da home (`home_banner_url`) e chave Pix do site (`pix_key`) |

**Storage:** bucket público `site-assets` (banner, avatares, eventos) e bucket privado `payment-proofs` (só o dono e administradores leem).

> A migração completa (idempotente) está em `supabase/migrations/20260101000000_nacional_rock_brasil.sql`.

---

## 🚀 Como rodar no localhost

### Pré-requisitos

- **Node.js 18+** (projeto testado com Node 20/24).
- Conta gratuita em [supabase.com](https://supabase.com).

### 1. Instalar dependências

```bash
git clone <URL_DO_REPOSITORIO>
cd nacional-rock-brasil
npm install
```

### 2. Configurar o banco (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra **SQL Editor → New query**, cole o conteúdo de `supabase/migrations/20260101000000_nacional_rock_brasil.sql` e clique em **Run**. O script cria tabelas, segurança (RLS), buckets de arquivos, gatilhos e tempo real. Pode ser executado mais de uma vez sem problema.
3. Em **Project Settings → API**, copie a *Project URL* e a chave *anon/publishable*.

### 3. Configurar as variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL="https://SEU-PROJECT-REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-anon-ou-publishable"
```

> ⚠️ **Nunca** commite o `.env` — ele já está no `.gitignore`.

### 4. Criar o primeiro administrador

1. Rode o site, cadastre sua conta normalmente em `/auth`.
2. No SQL Editor do Supabase, rode: `select public.promote_to_admin('seu@email.com');`
3. Recarregue o site: o link **Admin** aparece no menu.

> O site **não** permite que ninguém se cadastre como administrador. O papel de admin só é concedido pelo comando acima (no painel do Supabase) ou por outro admin.

### 5. Deploy das Edge Functions (necessárias para "Cadastrar banda" e links do Bandcamp)

```bash
npm i -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy admin-setup
supabase functions deploy resolve-bandcamp
```

### 6. Ajustes de autenticação

Em **Authentication → Providers → Email**, escolha se quer exigir confirmação de e-mail. Com a confirmação desligada, o cadastro entra direto no site. Em **Authentication → URL Configuration**, informe o endereço público do site (ex.: `http://localhost:8080`).

### 7. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Abra **http://localhost:8080** (a porta vem definida no `vite.config.ts`).

---

## 📜 Scripts e testes

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em `http://localhost:8080` |
| `npm run build` | Gera a versão de produção em `dist/` (com validação do TypeScript) |
| `npm run build:dev` | Build em modo desenvolvimento |
| `npm run preview` | Pré-visualiza o build de produção |
| `npm run lint` | Executa o ESLint |
| `npm test` / `npm run test:watch` | Executa a suíte de testes do Vitest |

```bash
npm run build   # valida o build
npm test        # roda os testes
```

---

## 🌍 Deploy

Hospedagem recomendada: **Vercel** (projeto SPA). O arquivo `vercel.json` já faz o *rewrite* de todas as rotas para o `index.html`, garantindo o funcionamento das rotas do React Router em produção. Basta importar o repositório e configurar as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## 📄 Licença

Este repositório ainda não define uma licença específica. Todos os direitos reservados ao projeto **Nacional Rock Brasil**.
