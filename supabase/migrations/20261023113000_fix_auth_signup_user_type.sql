-- Corrige o cadastro no Supabase Auth:
-- 1. Converte explicitamente user_type para public.user_type (ENUM).
-- 2. Usa valores seguros caso os metadados sejam inválidos.
-- 3. Nunca concede admin a partir de metadados enviados pelo usuário.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_username text;
  v_user_type public.user_type;
  v_accepted boolean;
begin
  v_username := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'usuario'
    ),
    100
  );

  begin
    v_user_type := coalesce(
      nullif(trim(new.raw_user_meta_data->>'user_type'), '')::public.user_type,
      'fã'::public.user_type
    );
  exception
    when invalid_text_representation then
      v_user_type := 'fã'::public.user_type;
  end;

  begin
    v_accepted := coalesce(
      nullif(new.raw_user_meta_data->>'accepted_terms', '')::boolean,
      false
    );
  exception
    when invalid_text_representation then
      v_accepted := false;
  end;

  insert into public.profiles (
    id,
    username,
    user_type,
    genre,
    accepted_terms,
    terms_accepted_at
  )
  values (
    new.id,
    v_username,
    v_user_type,
    left(coalesce(new.raw_user_meta_data->>'genre', ''), 100),
    v_accepted,
    case when v_accepted then pg_catalog.now() else null end
  )
  on conflict (id) do update set
    username = excluded.username,
    user_type = excluded.user_type,
    genre = excluded.genre,
    accepted_terms = excluded.accepted_terms,
    terms_accepted_at = excluded.terms_accepted_at;

  -- Todo cadastro recebe apenas o papel comum. Metadados enviados pelo
  -- próprio usuário nunca podem conceder privilégios administrativos.
  insert into public.user_roles (user_id, role)
  values (new.id, 'user'::public.app_role)
  on conflict do nothing;

  return new;
end;
$function$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
