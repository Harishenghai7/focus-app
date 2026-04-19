-- Focus v2 foundations: identity sync, trending view, and session primitives.

create extension if not exists pg_trgm;

alter table if exists public.profiles
  add column if not exists updated_from_oauth_at timestamptz;

create or replace function public.sync_oauth_profile(
  p_user_id uuid,
  p_avatar_url text,
  p_full_name text,
  p_username text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    avatar_url,
    full_name,
    username,
    updated_from_oauth_at,
    updated_at
  )
  values (
    p_user_id,
    nullif(p_avatar_url, ''),
    nullif(p_full_name, ''),
    coalesce(nullif(p_username, ''), 'focusly_' || left(p_user_id::text, 6)),
    now(),
    now()
  )
  on conflict (id) do update
  set
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.profiles.avatar_url),
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    username = case
      when public.profiles.username is null or public.profiles.username like 'user_%' or public.profiles.username like 'focusly_%'
      then coalesce(nullif(excluded.username, ''), public.profiles.username)
      else public.profiles.username
    end,
    updated_from_oauth_at = now(),
    updated_at = now();
end;
$$;

create or replace view public.focus_user_identity_v as
select
  p.id as user_id,
  coalesce(nullif(p.username, ''), 'focusly_' || left(p.id::text, 6)) as username,
  coalesce(nullif(p.full_name, ''), coalesce(nullif(p.username, ''), 'Focusly User')) as full_name,
  coalesce(nullif(p.avatar_url, ''), 'https://api.dicebear.com/7.x/bottts/svg?seed=Focusly') as avatar_url,
  coalesce(p.is_verified, false) as is_verified,
  coalesce(p.trust_tier, 0) as trust_tier
from public.profiles p;

create or replace view public.trending_hashtags_24h_v as
with post_window as (
  select
    p.id,
    p.caption,
    coalesce(p.likes_count, 0) + coalesce(p.comments_count, 0) + coalesce(p.views_count, 0) as engagement
  from public.posts p
  where p.created_at >= now() - interval '24 hours'
),
hashes as (
  select
    lower((regexp_matches(caption, '#([a-zA-Z0-9_]+)', 'g'))[1]) as hashtag,
    engagement
  from post_window
)
select
  hashtag,
  count(*)::int as post_count,
  sum(engagement)::bigint as engagement_score,
  (count(*) * 2 + sum(engagement))::bigint as rank_score
from hashes
group by hashtag
order by rank_score desc, post_count desc;

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text,
  user_agent text,
  ip_address text,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);
