-- Focus v2.0: canonical interaction RPCs and uniqueness guarantees.
-- This migration is idempotent and aligned to the advanced post_* schema.

-- Ensure one interaction per (post_id, user_id).
create unique index if not exists post_likes_post_user_unique
on public.post_likes (post_id, user_id);

create unique index if not exists post_saves_post_user_unique
on public.post_saves (post_id, user_id);

-- Canonical analytics row helper.
create or replace function public.ensure_post_analytics_row(p_post_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.post_analytics (post_id)
  values (p_post_id)
  on conflict (post_id) do nothing;
end;
$$;

-- Toggle post like atomically and return truth state.
create or replace function public.toggle_post_like_rpc(
  p_post_id uuid,
  p_user_id uuid,
  p_should_like boolean default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_now_liked boolean;
  v_delta integer;
  v_likes_count integer;
begin
  perform public.ensure_post_analytics_row(p_post_id);

  select exists(
    select 1 from public.post_likes
    where post_id = p_post_id and user_id = p_user_id
  ) into v_exists;

  v_now_liked := coalesce(p_should_like, not v_exists);

  if v_now_liked and not v_exists then
    insert into public.post_likes (post_id, user_id)
    values (p_post_id, p_user_id)
    on conflict (post_id, user_id) do nothing;
    v_delta := 1;
  elsif (not v_now_liked) and v_exists then
    delete from public.post_likes
    where post_id = p_post_id and user_id = p_user_id;
    v_delta := -1;
  else
    v_delta := 0;
  end if;

  if v_delta != 0 then
    update public.post_analytics
    set likes_count = greatest(0, likes_count + v_delta),
        updated_at = now()
    where post_id = p_post_id;
  end if;

  select likes_count
  into v_likes_count
  from public.post_analytics
  where post_id = p_post_id;

  return jsonb_build_object(
    'post_id', p_post_id,
    'is_liked', v_now_liked,
    'likes_count', coalesce(v_likes_count, 0),
    'delta', v_delta
  );
end;
$$;

-- Toggle post save atomically and return truth state.
create or replace function public.toggle_post_save_rpc(
  p_post_id uuid,
  p_user_id uuid,
  p_should_save boolean default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_now_saved boolean;
  v_delta integer;
  v_saves_count integer;
begin
  perform public.ensure_post_analytics_row(p_post_id);

  select exists(
    select 1 from public.post_saves
    where post_id = p_post_id and user_id = p_user_id
  ) into v_exists;

  v_now_saved := coalesce(p_should_save, not v_exists);

  if v_now_saved and not v_exists then
    insert into public.post_saves (post_id, user_id)
    values (p_post_id, p_user_id)
    on conflict (post_id, user_id) do nothing;
    v_delta := 1;
  elsif (not v_now_saved) and v_exists then
    delete from public.post_saves
    where post_id = p_post_id and user_id = p_user_id;
    v_delta := -1;
  else
    v_delta := 0;
  end if;

  if v_delta != 0 then
    update public.post_analytics
    set saves_count = greatest(0, saves_count + v_delta),
        updated_at = now()
    where post_id = p_post_id;
  end if;

  select saves_count
  into v_saves_count
  from public.post_analytics
  where post_id = p_post_id;

  return jsonb_build_object(
    'post_id', p_post_id,
    'is_saved', v_now_saved,
    'saves_count', coalesce(v_saves_count, 0),
    'delta', v_delta
  );
end;
$$;

-- Register share + update analytics atomically.
create or replace function public.register_post_share_rpc(
  p_post_id uuid,
  p_user_id uuid,
  p_share_type text,
  p_recipient_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_shares_count integer;
begin
  perform public.ensure_post_analytics_row(p_post_id);

  insert into public.post_shares (post_id, user_id, share_type, recipient_id)
  values (p_post_id, p_user_id, p_share_type, p_recipient_id);

  update public.post_analytics
  set shares_count = greatest(0, shares_count + 1),
      updated_at = now()
  where post_id = p_post_id;

  select shares_count
  into v_shares_count
  from public.post_analytics
  where post_id = p_post_id;

  return jsonb_build_object(
    'post_id', p_post_id,
    'shares_count', coalesce(v_shares_count, 0)
  );
end;
$$;

-- Backward-compatible share increment RPC signature
-- (supports legacy callers with increment_value argument).
create or replace function public.increment_post_shares(
  post_uuid uuid,
  increment_value integer default 1
)
returns void
language plpgsql
security definer
as $$
begin
  perform public.ensure_post_analytics_row(post_uuid);
  update public.post_analytics
  set shares_count = greatest(0, shares_count + coalesce(increment_value, 1)),
      updated_at = now()
  where post_id = post_uuid;
end;
$$;
