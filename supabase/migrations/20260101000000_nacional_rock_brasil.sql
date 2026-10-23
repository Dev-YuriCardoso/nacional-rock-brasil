-- ============================================================================
-- NACIONAL ROCK BRASIL — Banco de dados completo (Supabase / PostgreSQL)
-- ============================================================================
-- COMO USAR
--   1. Crie um projeto novo em https://supabase.com (conta sua).
--   2. Abra  SQL Editor > New query, cole TUDO deste arquivo e clique em Run.
--      (ou, com a CLI:  supabase link --project-ref SEU_ID  &&  supabase db push)
--   3. Crie sua conta pelo site e rode, em outra query:
--        select public.promote_to_admin('seu@email.com');
--      Pronto: essa conta passa a ser administradora.
--
-- O script é idempotente: pode ser executado de novo sem duplicar nada.
-- Ele também REMOVE políticas antigas inseguras (ex.: auto-cadastro de admin).
--
-- ÁREAS COBERTAS
--   Cliente (fã)  : perfil, seguir bandas, curtir, comentar, classificados, chat
--   Banda         : perfil, conteúdos (Spotify/YouTube/Bandcamp/SoundCloud),
--                   eventos, publicações, loja (produtos) e compra de espaços
--   Administração : bandas/usuários, destaques da home, banner, chave Pix do site,
--                   aprovação de pagamentos, monitoramento de chats
-- ============================================================================


-- ============================================================================
-- 1) TIPOS (ENUMS)
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'user_type') then
    create type public.user_type as enum ('fã', 'banda');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'content_type') then
    create type public.content_type as enum
      ('spotify_link', 'youtube_link', 'bandcamp_link', 'soundcloud_link');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'product_status') then
    create type public.product_status as enum ('active', 'sold', 'inactive');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'payment_request_status') then
    create type public.payment_request_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

-- Garante os valores novos caso o tipo já existisse numa versão antiga
alter type public.content_type add value if not exists 'bandcamp_link';
alter type public.content_type add value if not exists 'soundcloud_link';


-- ============================================================================
-- 2) TABELAS
-- ============================================================================

-- 2.1 Perfis: clientes (fã) e bandas. Um registro por usuário do Supabase Auth.
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text not null,
  bio               text default '',
  avatar_url        text default '',
  banner_url        text default '',
  user_type         public.user_type not null default 'fã',
  genre             text default '',
  subgenre          text default '',
  estado            text default '',            -- UF (ex.: BA, SP)
  pix_link          text default '',            -- Pix da banda (doações)
  pix_qrcode_url    text default '',
  is_suspended      boolean not null default false,
  product_slots     integer not null default 0, -- espaços de produto comprados
  accepted_terms    boolean not null default false,
  terms_accepted_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint profiles_username_len     check (char_length(username) between 1 and 100),
  constraint profiles_bio_len          check (bio is null or char_length(bio) <= 1000),
  constraint profiles_genre_len        check (genre is null or char_length(genre) <= 100),
  constraint profiles_subgenre_len     check (subgenre is null or char_length(subgenre) <= 100),
  constraint profiles_slots_nonneg     check (product_slots >= 0)
);

-- 2.2 Papéis (admin / moderator / user). Só o servidor altera; ninguém se promove.
create table if not exists public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    public.app_role not null,
  unique (user_id, role)
);

-- 2.3 Conteúdos da banda (links de música/vídeo)
create table if not exists public.content (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references public.profiles(id) on delete cascade,
  type         public.content_type not null,
  url          text not null,
  title        text not null,
  is_exclusive boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint content_title_len check (char_length(title) <= 100),
  constraint content_url_len   check (char_length(url) <= 500)
);

-- 2.4 Eventos / shows
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  date       timestamptz not null,
  location   text not null,
  city       text not null default '',
  image_url  text,
  created_at timestamptz not null default now(),
  constraint events_title_len    check (char_length(title) <= 100),
  constraint events_location_len check (char_length(location) <= 200),
  constraint events_city_len     check (char_length(city) <= 100)
);
alter table public.events add column if not exists image_url text;

-- 2.5 Publicações no mural da banda
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null default '',
  image_url  text,
  created_at timestamptz not null default now(),
  constraint posts_text_len check (char_length(text) <= 1000)
);

-- 2.6 Curtidas nas publicações
create table if not exists public.post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- 2.7 Comentários na página da banda (username é preenchido por trigger)
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.profiles(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  username   text not null,
  text       text not null,
  created_at timestamptz not null default now(),
  constraint comments_text_len     check (char_length(text) between 1 and 500),
  constraint comments_username_len check (char_length(username) <= 100)
);

-- 2.8 Seguidores (fã/usuário segue banda)
create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

-- 2.9 Classificados (anúncios dos usuários)
create table if not exists public.classifieds (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null default '',
  estado      text not null default '',
  title       text not null default '',
  description text not null default '',
  contact     text not null default '',
  created_at  timestamptz not null default now(),
  constraint classifieds_title_len       check (char_length(title) <= 100),
  constraint classifieds_description_len check (char_length(description) <= 1000),
  constraint classifieds_contact_len     check (char_length(contact) <= 200)
);

-- 2.10 Destaques da página inicial (controlados pelo admin)
create table if not exists public.home_featured (
  id            uuid primary key default gen_random_uuid(),
  band_id       uuid not null references public.profiles(id) on delete cascade,
  section_name  text not null default 'destaque',
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

-- 2.11 Configurações do site (chave/valor): home_banner_url, pix_key
create table if not exists public.site_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- 2.12 Loja (marketplace)
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text not null default '',
  price       numeric(10,2) not null check (price >= 0),
  image_url   text,
  category    text not null default '',
  status      public.product_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint products_title_len       check (char_length(title) <= 100),
  constraint products_description_len check (char_length(description) <= 1000)
);

-- 2.13 Pedidos de pagamento (compra de pacote de espaços de produto)
create table if not exists public.payment_requests (
  id              uuid primary key default gen_random_uuid(),
  band_id         uuid not null references public.profiles(id) on delete cascade,
  proof_url       text not null,   -- caminho do comprovante no bucket privado "payment-proofs"
  status          public.payment_request_status not null default 'pending',
  slots_requested integer not null default 20 check (slots_requested > 0),
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles(id) on delete set null
);

-- 2.14 Chat de negociação (salas e mensagens)
create table if not exists public.chat_rooms (
  id            uuid primary key default gen_random_uuid(),
  participant_a uuid not null references auth.users(id) on delete cascade,
  participant_b uuid not null references auth.users(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (participant_a, participant_b, product_id),
  constraint chat_rooms_not_self check (participant_a <> participant_b)
);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  text       text not null default '',
  created_at timestamptz not null default now(),
  constraint messages_text_len check (char_length(text) <= 2000)
);


-- ============================================================================
-- 3) ÍNDICES (desempenho das listagens e buscas do site)
-- ============================================================================
create extension if not exists pg_trgm;

create index if not exists idx_profiles_type_estado   on public.profiles (user_type, estado);
create index if not exists idx_profiles_created       on public.profiles (created_at desc);
create index if not exists idx_profiles_username_trgm on public.profiles using gin (username gin_trgm_ops);
create index if not exists idx_content_artist         on public.content (artist_id, created_at desc);
create index if not exists idx_content_created        on public.content (created_at desc);
create index if not exists idx_events_artist          on public.events (artist_id);
create index if not exists idx_events_date            on public.events (date);
create index if not exists idx_posts_artist           on public.posts (artist_id, created_at desc);
create index if not exists idx_post_likes_user        on public.post_likes (user_id);
create index if not exists idx_comments_artist        on public.comments (artist_id, created_at desc);
create index if not exists idx_comments_user          on public.comments (user_id);
create index if not exists idx_follows_following      on public.follows (following_id);
create index if not exists idx_classifieds_created    on public.classifieds (created_at desc);
create index if not exists idx_classifieds_user       on public.classifieds (user_id);
create index if not exists idx_home_featured_order    on public.home_featured (display_order);
create index if not exists idx_products_owner         on public.products (owner_id);
create index if not exists idx_products_status        on public.products (status, created_at desc);
create index if not exists idx_payment_requests_band  on public.payment_requests (band_id);
create index if not exists idx_payment_requests_stat  on public.payment_requests (status);
create index if not exists idx_chat_rooms_a           on public.chat_rooms (participant_a);
create index if not exists idx_chat_rooms_b           on public.chat_rooms (participant_b);
create index if not exists idx_messages_room          on public.messages (room_id, created_at);


-- ============================================================================
-- 4) FUNÇÕES AUXILIARES (SECURITY DEFINER = leem tabelas sem cair em recursão de RLS)
-- ============================================================================

-- O usuário tem determinado papel?
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- É uma banda ativa (não suspensa)?
create or replace function public.is_active_band(_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = _user_id and user_type = 'banda' and is_suspended = false
  );
$$;

-- Usuário existe e não está suspenso?
create or replace function public.is_active_user(_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = _user_id and is_suspended = false
  );
$$;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;
grant execute on function public.is_active_band(uuid)            to anon, authenticated;
grant execute on function public.is_active_user(uuid)            to anon, authenticated;


-- ============================================================================
-- 5) TRIGGERS
-- ============================================================================

-- 5.1 updated_at automático
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_profiles_updated_at      on public.profiles;
drop trigger if exists update_products_updated_at      on public.products;
drop trigger if exists update_site_settings_updated_at on public.site_settings;
create trigger update_profiles_updated_at      before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger update_products_updated_at      before update on public.products
  for each row execute function public.update_updated_at_column();
create trigger update_site_settings_updated_at before update on public.site_settings
  for each row execute function public.update_updated_at_column();

-- 5.2 Novo cadastro => cria perfil + papel "user".
--     IMPORTANTE: o cadastro NUNCA concede admin. O papel admin só é dado por
--     public.promote_to_admin() (rodando no SQL Editor) ou pela edge function admin-setup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_username text;
  v_type     public.user_type;
  v_accepted boolean;
begin
  v_username := left(
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1)),
    100
  );
  if v_username is null or v_username = '' then
    v_username := 'usuario';
  end if;

  begin
    v_type := coalesce((new.raw_user_meta_data->>'user_type')::public.user_type, 'fã');
  exception when others then
    v_type := 'fã';
  end;

  begin
    v_accepted := coalesce((new.raw_user_meta_data->>'accepted_terms')::boolean, false);
  exception when others then
    v_accepted := false;
  end;

  insert into public.profiles (id, username, user_type, genre, accepted_terms, terms_accepted_at)
  values (
    new.id,
    v_username,
    v_type,
    left(coalesce(new.raw_user_meta_data->>'genre', ''), 100),
    v_accepted,
    case when v_accepted then now() else null end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5.3 Comentário: o nome vem sempre do perfil (ninguém comenta com nome falso)
create or replace function public.set_comment_username()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  select username into new.username from public.profiles where id = new.user_id;
  if new.username is null then
    new.username := 'Anônimo';
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_set_comment_username on public.comments;
create trigger trigger_set_comment_username
  before insert on public.comments
  for each row execute function public.set_comment_username();

-- 5.4 Protege colunas sensíveis do perfil: o próprio usuário NÃO pode se
--     suspender/reativar, trocar de tipo nem dar espaços de produto a si mesmo.
--     Admin e SQL Editor (auth.uid() nulo) podem tudo.
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_suspended := false;
    new.product_slots := 0;
  else
    new.is_suspended := old.is_suspended;
    new.product_slots := old.product_slots;
    new.user_type := old.user_type;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_sensitive_columns();

-- 5.5 Limite de produtos = espaços comprados (admin ignora o limite)
create or replace function public.enforce_product_slot_limit()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_slots integer;
  v_count integer;
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  select product_slots into v_slots from public.profiles where id = new.owner_id;
  select count(*) into v_count from public.products where owner_id = new.owner_id;

  if coalesce(v_slots, 0) <= v_count then
    raise exception 'Limite de produtos atingido. Compre mais espaços para cadastrar novos produtos.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_product_slot_limit on public.products;
create trigger trg_enforce_product_slot_limit
  before insert on public.products
  for each row execute function public.enforce_product_slot_limit();


-- ============================================================================
-- 6) FUNÇÕES CHAMADAS PELO SITE (RPC)
-- ============================================================================

-- 6.1 Admin aprova pagamento => libera os espaços de produto
create or replace function public.approve_payment_request(_request_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_band  uuid;
  v_slots integer;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Apenas administradores podem aprovar pagamentos.';
  end if;

  select band_id, slots_requested into v_band, v_slots
  from public.payment_requests
  where id = _request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'Solicitação não encontrada ou já processada.';
  end if;

  update public.payment_requests
     set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
   where id = _request_id;

  update public.profiles
     set product_slots = product_slots + v_slots
   where id = v_band;
end;
$$;

-- 6.2 Admin exclui/bane usuário DE VERDADE (conta de login + perfil + tudo ligado a ela)
create or replace function public.admin_delete_user(_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Apenas administradores podem excluir usuários.';
  end if;
  if _user_id = auth.uid() then
    raise exception 'Você não pode excluir a própria conta de administrador.';
  end if;

  delete from auth.users where id = _user_id;  -- cascateia perfil, posts, produtos, etc.
end;
$$;

revoke all on function public.approve_payment_request(uuid) from public, anon;
revoke all on function public.admin_delete_user(uuid)       from public, anon;
grant execute on function public.approve_payment_request(uuid) to authenticated;
grant execute on function public.admin_delete_user(uuid)       to authenticated;

-- 6.3 Criar o PRIMEIRO admin (só roda no SQL Editor / servidor; o site não consegue chamar)
--     Uso:  select public.promote_to_admin('seu@email.com');
create or replace function public.promote_to_admin(_email text)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(_email);
  if v_id is null then
    raise exception 'Nenhum usuário com o e-mail %. Cadastre-se no site (ou em Authentication > Users) primeiro.', _email;
  end if;

  insert into public.user_roles (user_id, role)
  values (v_id, 'admin')
  on conflict (user_id, role) do nothing;

  return format('%s agora é administrador.', _email);
end;
$$;

revoke all on function public.promote_to_admin(text) from public, anon, authenticated;


-- ============================================================================
-- 7) SEGURANÇA (RLS) — remove políticas antigas e recria todas
-- ============================================================================
do $$
declare
  r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.profiles         enable row level security;
alter table public.user_roles       enable row level security;
alter table public.content          enable row level security;
alter table public.events           enable row level security;
alter table public.posts            enable row level security;
alter table public.post_likes       enable row level security;
alter table public.comments         enable row level security;
alter table public.follows          enable row level security;
alter table public.classifieds      enable row level security;
alter table public.home_featured    enable row level security;
alter table public.site_settings    enable row level security;
alter table public.products         enable row level security;
alter table public.payment_requests enable row level security;
alter table public.chat_rooms       enable row level security;
alter table public.messages         enable row level security;

-- ---- profiles ---------------------------------------------------------------
create policy "profiles: leitura publica" on public.profiles
  for select to anon, authenticated using (true);
create policy "profiles: inserir o proprio" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: editar o proprio ou admin" on public.profiles
  for update to authenticated
  using      (id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'))
  with check (id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
create policy "profiles: admin exclui" on public.profiles
  for delete to authenticated using (public.has_role((select auth.uid()), 'admin'));

-- ---- user_roles (leitura do próprio papel; alterações só por admin) ---------
create policy "user_roles: ver o proprio ou admin" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
create policy "user_roles: admin concede" on public.user_roles
  for insert to authenticated with check (public.has_role((select auth.uid()), 'admin'));
create policy "user_roles: admin remove" on public.user_roles
  for delete to authenticated using (public.has_role((select auth.uid()), 'admin'));

-- ---- content ----------------------------------------------------------------
create policy "content: leitura publica" on public.content
  for select to anon, authenticated using (true);
create policy "content: banda ativa ou admin cria" on public.content
  for insert to authenticated
  with check ((artist_id = (select auth.uid()) and public.is_active_band((select auth.uid())))
              or public.has_role((select auth.uid()), 'admin'));
create policy "content: dono ou admin edita" on public.content
  for update to authenticated
  using      (artist_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'))
  with check (artist_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
create policy "content: dono ou admin exclui" on public.content
  for delete to authenticated
  using (artist_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));

-- ---- events -----------------------------------------------------------------
create policy "events: leitura publica" on public.events
  for select to anon, authenticated using (true);
create policy "events: banda ativa ou admin cria" on public.events
  for insert to authenticated
  with check ((artist_id = (select auth.uid()) and public.is_active_band((select auth.uid())))
              or public.has_role((select auth.uid()), 'admin'));
create policy "events: dono ou admin edita" on public.events
  for update to authenticated
  using      (artist_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'))
  with check (artist_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
create policy "events: dono ou admin exclui" on public.events
  for delete to authenticated
  using (artist_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));

-- ---- posts ------------------------------------------------------------------
create policy "posts: leitura publica" on public.posts
  for select to anon, authenticated using (true);
create policy "posts: banda ativa cria" on public.posts
  for insert to authenticated
  with check (artist_id = (select auth.uid()) and public.is_active_band((select auth.uid())));
create policy "posts: dono ou admin exclui" on public.posts
  for delete to authenticated
  using (artist_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));

-- ---- post_likes -------------------------------------------------------------
create policy "post_likes: leitura publica" on public.post_likes
  for select to anon, authenticated using (true);
create policy "post_likes: curtir" on public.post_likes
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_user((select auth.uid())));
create policy "post_likes: descurtir" on public.post_likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---- comments ---------------------------------------------------------------
create policy "comments: leitura publica" on public.comments
  for select to anon, authenticated using (true);
create policy "comments: comentar" on public.comments
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_user((select auth.uid())));
create policy "comments: dono ou admin exclui" on public.comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));

-- ---- follows ----------------------------------------------------------------
create policy "follows: leitura publica" on public.follows
  for select to anon, authenticated using (true);
create policy "follows: seguir" on public.follows
  for insert to authenticated
  with check (follower_id = (select auth.uid()) and public.is_active_user((select auth.uid())));
create policy "follows: deixar de seguir" on public.follows
  for delete to authenticated using (follower_id = (select auth.uid()));

-- ---- classifieds ------------------------------------------------------------
create policy "classifieds: leitura publica" on public.classifieds
  for select to anon, authenticated using (true);
create policy "classifieds: criar" on public.classifieds
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_user((select auth.uid())));
create policy "classifieds: dono edita" on public.classifieds
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "classifieds: dono ou admin exclui" on public.classifieds
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));

-- ---- home_featured ----------------------------------------------------------
create policy "home_featured: leitura publica" on public.home_featured
  for select to anon, authenticated using (true);
create policy "home_featured: admin gerencia" on public.home_featured
  for all to authenticated
  using      (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

-- ---- site_settings ----------------------------------------------------------
create policy "site_settings: leitura publica" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site_settings: admin gerencia" on public.site_settings
  for all to authenticated
  using      (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

-- ---- products ---------------------------------------------------------------
create policy "products: leitura publica" on public.products
  for select to anon, authenticated using (true);
create policy "products: banda ativa ou admin cria" on public.products
  for insert to authenticated
  with check ((owner_id = (select auth.uid()) and public.is_active_band((select auth.uid())))
              or public.has_role((select auth.uid()), 'admin'));
create policy "products: dono ou admin edita" on public.products
  for update to authenticated
  using      (owner_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'))
  with check (owner_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
create policy "products: dono ou admin exclui" on public.products
  for delete to authenticated
  using (owner_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));

-- ---- payment_requests -------------------------------------------------------
create policy "payment_requests: banda ve as suas, admin ve todas" on public.payment_requests
  for select to authenticated
  using (band_id = (select auth.uid()) or public.has_role((select auth.uid()), 'admin'));
-- A banda só cria pedido PENDENTE do pacote padrão (20 espaços); não aprova a si mesma.
create policy "payment_requests: banda cria pedido pendente" on public.payment_requests
  for insert to authenticated
  with check (
    (band_id = (select auth.uid())
       and status = 'pending'
       and slots_requested = 20
       and reviewed_at is null
       and reviewed_by is null)
    or public.has_role((select auth.uid()), 'admin')
  );
create policy "payment_requests: admin atualiza" on public.payment_requests
  for update to authenticated
  using      (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

-- ---- chat_rooms / messages --------------------------------------------------
create policy "chat_rooms: participantes ou admin veem" on public.chat_rooms
  for select to authenticated
  using (participant_a = (select auth.uid())
         or participant_b = (select auth.uid())
         or public.has_role((select auth.uid()), 'admin'));
create policy "chat_rooms: iniciar conversa" on public.chat_rooms
  for insert to authenticated
  with check (participant_a = (select auth.uid())
              and participant_b <> (select auth.uid())
              and public.is_active_user((select auth.uid())));
create policy "chat_rooms: admin exclui" on public.chat_rooms
  for delete to authenticated using (public.has_role((select auth.uid()), 'admin'));

create policy "messages: participantes ou admin leem" on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.chat_rooms c
    where c.id = messages.room_id
      and (c.participant_a = (select auth.uid())
           or c.participant_b = (select auth.uid())
           or public.has_role((select auth.uid()), 'admin'))
  ));
create policy "messages: participante envia" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_active_user((select auth.uid()))
    and exists (
      select 1 from public.chat_rooms c
      where c.id = messages.room_id
        and (c.participant_a = (select auth.uid()) or c.participant_b = (select auth.uid()))
    )
  );
create policy "messages: admin exclui" on public.messages
  for delete to authenticated using (public.has_role((select auth.uid()), 'admin'));


-- ============================================================================
-- 8) STORAGE (arquivos)
--    site-assets      : PÚBLICO  — banner da home, avatares, imagens de eventos
--    payment-proofs   : PRIVADO  — comprovantes de pagamento (só dono e admin veem)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-assets', 'site-assets', true, 5242880,
   array['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('payment-proofs', 'payment-proofs', false, 5242880,
   array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Remove políticas antigas (nomes herdados das versões anteriores)
drop policy if exists "Public read site-assets"           on storage.objects;
drop policy if exists "Admin upload site-assets"          on storage.objects;
drop policy if exists "Admin update site-assets"          on storage.objects;
drop policy if exists "Admin delete site-assets"          on storage.objects;
drop policy if exists "Bands can upload proofs"           on storage.objects;
drop policy if exists "Bands can view own proofs"         on storage.objects;
drop policy if exists "Admins can view all proofs"        on storage.objects;
drop policy if exists "Users can upload payment proofs"   on storage.objects;
drop policy if exists "Users can view own payment proofs" on storage.objects;
drop policy if exists "Admins can view all payment proofs" on storage.objects;
drop policy if exists "site-assets: leitura publica"      on storage.objects;
drop policy if exists "site-assets: envio"                on storage.objects;
drop policy if exists "site-assets: atualizacao"          on storage.objects;
drop policy if exists "site-assets: exclusao"             on storage.objects;
drop policy if exists "payment-proofs: envio"             on storage.objects;
drop policy if exists "payment-proofs: leitura"           on storage.objects;
drop policy if exists "payment-proofs: admin exclui"      on storage.objects;

-- site-assets: qualquer um lê; escreve quem é admin OU na própria pasta
--   {uid}/...            (avatar)       events/{uid}/...  (imagens de eventos)
create policy "site-assets: leitura publica" on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-assets');

create policy "site-assets: envio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-assets' and (
      public.has_role((select auth.uid()), 'admin')
      or (storage.foldername(name))[1] = (select auth.uid())::text
      or ((storage.foldername(name))[1] = 'events'
          and (storage.foldername(name))[2] = (select auth.uid())::text)
    )
  );

create policy "site-assets: atualizacao" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-assets' and (
      public.has_role((select auth.uid()), 'admin')
      or (storage.foldername(name))[1] = (select auth.uid())::text
      or ((storage.foldername(name))[1] = 'events'
          and (storage.foldername(name))[2] = (select auth.uid())::text)
    )
  );

create policy "site-assets: exclusao" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-assets' and (
      public.has_role((select auth.uid()), 'admin')
      or (storage.foldername(name))[1] = (select auth.uid())::text
      or ((storage.foldername(name))[1] = 'events'
          and (storage.foldername(name))[2] = (select auth.uid())::text)
    )
  );

-- payment-proofs: envia na própria pasta {uid}/...; lê o dono ou admin
create policy "payment-proofs: envio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs' and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_role((select auth.uid()), 'admin')
    )
  );

create policy "payment-proofs: leitura" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs' and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_role((select auth.uid()), 'admin')
    )
  );

create policy "payment-proofs: admin exclui" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.has_role((select auth.uid()), 'admin'));


-- ============================================================================
-- 9) TEMPO REAL (Realtime): comentários, publicações, curtidas e chat
-- ============================================================================
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['comments', 'posts', 'post_likes', 'messages'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;


-- ============================================================================
-- 10) DADOS INICIAIS
-- ============================================================================
insert into public.site_settings (key, value) values
  ('home_banner_url', ''),   -- banner da home (definido no painel admin)
  ('pix_key', '')            -- chave Pix do site para compra de espaços (painel admin)
on conflict (key) do nothing;


-- ============================================================================
-- 11) VERIFICAÇÃO (rode separadamente, se quiser conferir)
-- ============================================================================
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
-- select u.email, r.role from auth.users u join public.user_roles r on r.user_id = u.id;
