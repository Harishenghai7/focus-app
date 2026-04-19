-- Identity hydration hardening:
-- 1) Guarantees profiles row on auth signup.
-- 2) Persists OAuth avatar/full_name/username immediately.
-- 3) Prevents empty values from overwriting existing profile data.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_username text;
  safe_username text;
  raw_avatar text;
  raw_full_name text;
begin
  raw_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'preferred_username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'user_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1)
  );

  safe_username := coalesce(raw_username, 'focusly_' || left(new.id::text, 8));
  raw_avatar := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
  );
  raw_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), '')
  );

  insert into public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    updated_at
  )
  values (
    new.id,
    safe_username,
    raw_full_name,
    raw_avatar,
    now()
  )
  on conflict (id) do update
  set
    username = coalesce(nullif(profiles.username, ''), excluded.username),
    full_name = coalesce(nullif(profiles.full_name, ''), excluded.full_name),
    avatar_url = coalesce(nullif(profiles.avatar_url, ''), excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

