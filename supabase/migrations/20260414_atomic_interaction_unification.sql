-- Phase 2: Atomic RPC Unification
-- Canonical mutation contract for likes, saves, shares across posts + boltz.

create unique index if not exists post_likes_post_user_unique
on public.post_likes (post_id, user_id);

create unique index if not exists saved_posts_post_user_unique
on public.saved_posts (post_id, user_id);

create unique index if not exists post_saves_post_user_unique
on public.post_saves (post_id, user_id);

create unique index if not exists boltz_likes_boltz_user_unique
on public.boltz_likes (boltz_id, user_id);

create unique index if not exists boltz_saves_boltz_user_unique
on public.boltz_saves (boltz_id, user_id);

create unique index if not exists saved_boltz_boltz_user_unique
on public.saved_boltz (boltz_id, user_id);

create unique index if not exists post_shares_post_user_unique
on public.post_shares (post_id, user_id);

create unique index if not exists boltz_shares_boltz_user_unique
on public.boltz_shares (boltz_id, user_id);

create or replace function public.resolve_post_save_table()
returns text
language plpgsql
as $$
begin
  if to_regclass('public.post_saves') is not null then
    return 'post_saves';
  end if;
  return 'saved_posts';
end;
$$;

create or replace function public.resolve_boltz_save_table()
returns text
language plpgsql
as $$
begin
  if to_regclass('public.boltz_saves') is not null then
    return 'boltz_saves';
  end if;
  return 'saved_boltz';
end;
$$;

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
  v_delta integer := 0;
  v_count integer := 0;
begin
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
  end if;

  update public.posts
  set likes_count = greatest(0, coalesce(likes_count, 0) + v_delta),
      updated_at = now()
  where id = p_post_id;

  select coalesce(likes_count, 0) into v_count
  from public.posts
  where id = p_post_id;

  return jsonb_build_object(
    'target_type', 'post',
    'target_id', p_post_id,
    'interaction', 'like',
    'is_active', v_now_liked,
    'count', coalesce(v_count, 0),
    'delta', v_delta,
    'is_liked', v_now_liked,
    'likes_count', coalesce(v_count, 0)
  );
end;
$$;

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
  v_table text;
  v_exists boolean;
  v_now_saved boolean;
  v_delta integer := 0;
  v_count integer := 0;
begin
  v_table := public.resolve_post_save_table();

  execute format(
    'select exists(select 1 from public.%I where post_id = $1 and user_id = $2)',
    v_table
  ) into v_exists using p_post_id, p_user_id;

  v_now_saved := coalesce(p_should_save, not v_exists);

  if v_now_saved and not v_exists then
    execute format(
      'insert into public.%I (post_id, user_id) values ($1, $2) on conflict do nothing',
      v_table
    ) using p_post_id, p_user_id;
    v_delta := 1;
  elsif (not v_now_saved) and v_exists then
    execute format(
      'delete from public.%I where post_id = $1 and user_id = $2',
      v_table
    ) using p_post_id, p_user_id;
    v_delta := -1;
  end if;

  update public.posts
  set saves_count = greatest(0, coalesce(saves_count, 0) + v_delta),
      updated_at = now()
  where id = p_post_id;

  select coalesce(saves_count, 0) into v_count
  from public.posts
  where id = p_post_id;

  return jsonb_build_object(
    'target_type', 'post',
    'target_id', p_post_id,
    'interaction', 'save',
    'is_active', v_now_saved,
    'count', coalesce(v_count, 0),
    'delta', v_delta,
    'is_saved', v_now_saved,
    'saves_count', coalesce(v_count, 0)
  );
end;
$$;

create or replace function public.toggle_boltz_like_rpc(
  p_boltz_id uuid,
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
  v_delta integer := 0;
  v_count integer := 0;
begin
  select exists(
    select 1 from public.boltz_likes
    where boltz_id = p_boltz_id and user_id = p_user_id
  ) into v_exists;

  v_now_liked := coalesce(p_should_like, not v_exists);

  if v_now_liked and not v_exists then
    insert into public.boltz_likes (boltz_id, user_id)
    values (p_boltz_id, p_user_id)
    on conflict (boltz_id, user_id) do nothing;
    v_delta := 1;
  elsif (not v_now_liked) and v_exists then
    delete from public.boltz_likes
    where boltz_id = p_boltz_id and user_id = p_user_id;
    v_delta := -1;
  end if;

  update public.boltz
  set likes_count = greatest(0, coalesce(likes_count, 0) + v_delta),
      updated_at = now()
  where id = p_boltz_id;

  select coalesce(likes_count, 0) into v_count
  from public.boltz
  where id = p_boltz_id;

  return jsonb_build_object(
    'target_type', 'boltz',
    'target_id', p_boltz_id,
    'interaction', 'like',
    'is_active', v_now_liked,
    'count', coalesce(v_count, 0),
    'delta', v_delta,
    'is_liked', v_now_liked,
    'likes_count', coalesce(v_count, 0)
  );
end;
$$;

create or replace function public.toggle_boltz_save_rpc(
  p_boltz_id uuid,
  p_user_id uuid,
  p_should_save boolean default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_table text;
  v_exists boolean;
  v_now_saved boolean;
  v_delta integer := 0;
  v_count integer := 0;
begin
  v_table := public.resolve_boltz_save_table();

  execute format(
    'select exists(select 1 from public.%I where boltz_id = $1 and user_id = $2)',
    v_table
  ) into v_exists using p_boltz_id, p_user_id;

  v_now_saved := coalesce(p_should_save, not v_exists);

  if v_now_saved and not v_exists then
    execute format(
      'insert into public.%I (boltz_id, user_id) values ($1, $2) on conflict do nothing',
      v_table
    ) using p_boltz_id, p_user_id;
    v_delta := 1;
  elsif (not v_now_saved) and v_exists then
    execute format(
      'delete from public.%I where boltz_id = $1 and user_id = $2',
      v_table
    ) using p_boltz_id, p_user_id;
    v_delta := -1;
  end if;

  update public.boltz
  set saves_count = greatest(0, coalesce(saves_count, 0) + v_delta),
      updated_at = now()
  where id = p_boltz_id;

  select coalesce(saves_count, 0) into v_count
  from public.boltz
  where id = p_boltz_id;

  return jsonb_build_object(
    'target_type', 'boltz',
    'target_id', p_boltz_id,
    'interaction', 'save',
    'is_active', v_now_saved,
    'count', coalesce(v_count, 0),
    'delta', v_delta,
    'is_saved', v_now_saved,
    'saves_count', coalesce(v_count, 0)
  );
end;
$$;

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
  v_inserted integer := 0;
  v_count integer := 0;
begin
  insert into public.post_shares (post_id, user_id, share_type, recipient_id)
  values (p_post_id, p_user_id, coalesce(p_share_type, 'share'), p_recipient_id)
  on conflict (post_id, user_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.posts
    set shares_count = greatest(0, coalesce(shares_count, 0) + 1),
        updated_at = now()
    where id = p_post_id;
  end if;

  select coalesce(shares_count, 0) into v_count
  from public.posts
  where id = p_post_id;

  return jsonb_build_object(
    'target_type', 'post',
    'target_id', p_post_id,
    'interaction', 'share',
    'is_active', true,
    'count', coalesce(v_count, 0),
    'delta', case when v_inserted > 0 then 1 else 0 end,
    'shares_count', coalesce(v_count, 0)
  );
end;
$$;

create or replace function public.register_boltz_share_rpc(
  p_boltz_id uuid,
  p_user_id uuid,
  p_share_type text default 'share',
  p_recipient_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_inserted integer := 0;
  v_count integer := 0;
begin
  insert into public.boltz_shares (boltz_id, user_id, share_type, recipient_id)
  values (p_boltz_id, p_user_id, coalesce(p_share_type, 'share'), p_recipient_id)
  on conflict (boltz_id, user_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.boltz
    set shares_count = greatest(0, coalesce(shares_count, 0) + 1),
        updated_at = now()
    where id = p_boltz_id;
  end if;

  select coalesce(shares_count, 0) into v_count
  from public.boltz
  where id = p_boltz_id;

  return jsonb_build_object(
    'target_type', 'boltz',
    'target_id', p_boltz_id,
    'interaction', 'share',
    'is_active', true,
    'count', coalesce(v_count, 0),
    'delta', case when v_inserted > 0 then 1 else 0 end,
    'shares_count', coalesce(v_count, 0)
  );
end;
$$;

