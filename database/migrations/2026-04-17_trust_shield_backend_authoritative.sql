-- Trust Shield: backend-authoritative enforcement, audit, and guardian handshake

-- 1) Profile columns required for trust shield state
alter table if exists public.profiles
    add column if not exists verification_status text default 'PENDING',
    add column if not exists identity_metadata jsonb default '{}'::jsonb;

-- 2) Verification attempt audit trail
create table if not exists public.verification_audit_trail (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    attempted_at timestamptz not null default now(),
    device_id text,
    stage text,
    result text not null check (result in ('SUCCESS', 'FAILURE', 'PENDING')),
    reason text,
    score numeric(5,4),
    metadata jsonb not null default '{}'::jsonb
);

alter table public.verification_audit_trail enable row level security;

drop policy if exists "Users can read own verification audits" on public.verification_audit_trail;
create policy "Users can read own verification audits"
    on public.verification_audit_trail
    for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own verification audits" on public.verification_audit_trail;
create policy "Users can insert own verification audits"
    on public.verification_audit_trail
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- 3) Guardian handshake approvals
create table if not exists public.guardian_approvals (
    id uuid primary key default gen_random_uuid(),
    teen_user_id uuid not null references auth.users(id) on delete cascade,
    handshake_token text not null unique,
    guardian_name text,
    guardian_email text,
    approval_status text not null default 'PENDING' check (approval_status in ('PENDING', 'APPROVED', 'REJECTED')),
    approved_at timestamptz,
    created_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_guardian_approvals_teen on public.guardian_approvals(teen_user_id);
create index if not exists idx_guardian_approvals_token on public.guardian_approvals(handshake_token);

alter table public.guardian_approvals enable row level security;

drop policy if exists "Teen can read own guardian approvals" on public.guardian_approvals;
create policy "Teen can read own guardian approvals"
    on public.guardian_approvals
    for select
    to authenticated
    using (auth.uid() = teen_user_id);

drop policy if exists "Teen can create own guardian approvals" on public.guardian_approvals;
create policy "Teen can create own guardian approvals"
    on public.guardian_approvals
    for insert
    to authenticated
    with check (auth.uid() = teen_user_id);

-- 4) Trigger: approving guardian handshake auto-updates teen profile
create or replace function public.apply_guardian_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.approval_status = 'APPROVED'
       and (old.approval_status is distinct from new.approval_status) then
        update public.profiles
        set
            verification_status = 'VERIFIED_MINOR',
            identity_metadata = coalesce(identity_metadata, '{}'::jsonb) || jsonb_build_object(
                'guardian_approved', true,
                'guardian_approved_at', now(),
                'guardian_handshake_token', new.handshake_token
            ),
            updated_at = now()
        where id = new.teen_user_id;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_apply_guardian_approval on public.guardian_approvals;
create trigger trg_apply_guardian_approval
after update on public.guardian_approvals
for each row
execute function public.apply_guardian_approval();

-- 5) Verification helper used by feed RPCs and policy checks
create or replace function public.is_trust_shield_verified(p_user_id uuid)
returns boolean
language sql
stable
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = p_user_id
          and p.verification_status in ('VERIFIED', 'VERIFIED_MINOR')
    );
$$;

create or replace function public.assert_trust_shield_verified(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_trust_shield_verified(p_user_id) then
        raise exception 'TRUST_SHIELD_REQUIRED'
            using errcode = 'P0001',
                  hint = 'Verification status must be VERIFIED or VERIFIED_MINOR';
    end if;
end;
$$;

grant execute on function public.is_trust_shield_verified(uuid) to authenticated, anon;
grant execute on function public.assert_trust_shield_verified(uuid) to authenticated;

-- 6) Secure feed RPCs. Backend rejects unverified users.
create or replace function public.get_home_feed_secure(
    p_user_id uuid,
    p_limit int default 10,
    p_offset int default 0
)
returns table (
    id uuid,
    user_id uuid,
    caption text,
    media_url text,
    created_at timestamptz,
    likes_count int,
    comments_count int,
    saves_count int,
    shares_count int,
    views_count int,
    username text,
    full_name text,
    avatar_url text,
    is_verified boolean,
    trust_tier int
)
language sql
security definer
set search_path = public
as $$
    select
        p.id,
        p.user_id,
        p.caption,
        p.media_url,
        p.created_at,
        coalesce(p.likes_count, 0) as likes_count,
        coalesce(p.comments_count, 0) as comments_count,
        coalesce(p.saves_count, 0) as saves_count,
        coalesce(p.shares_count, 0) as shares_count,
        coalesce(p.views_count, 0) as views_count,
        pr.username,
        pr.full_name,
        pr.avatar_url,
        pr.is_verified,
        pr.trust_tier
    from public.posts p
    left join public.profiles pr on pr.id = p.user_id
    where public.is_trust_shield_verified(p_user_id)
    order by p.created_at desc
    limit greatest(p_limit, 1)
    offset greatest(p_offset, 0);
$$;

grant execute on function public.get_home_feed_secure(uuid, int, int) to authenticated;

create or replace function public.get_boltz_feed_secure(
    p_user_id uuid,
    p_limit int default 10,
    p_offset int default 0
)
returns table (
    id uuid,
    user_id uuid,
    description text,
    video_url text,
    thumbnail_url text,
    poster_url text,
    preview_image text,
    cover_url text,
    created_at timestamptz,
    likes_count int,
    comments_count int,
    saves_count int,
    shares_count int,
    username text,
    full_name text,
    avatar_url text,
    is_verified boolean
)
language sql
security definer
set search_path = public
as $$
    select
        b.id,
        b.user_id,
        b.description,
        b.video_url,
        b.thumbnail_url,
        b.poster_url,
        b.preview_image,
        b.cover_url,
        b.created_at,
        coalesce(b.likes_count, 0) as likes_count,
        coalesce(b.comments_count, 0) as comments_count,
        coalesce(b.saves_count, 0) as saves_count,
        coalesce(b.shares_count, 0) as shares_count,
        pr.username,
        pr.full_name,
        pr.avatar_url,
        pr.is_verified
    from public.boltz b
    left join public.profiles pr on pr.id = b.user_id
    where public.is_trust_shield_verified(p_user_id)
    order by b.created_at desc
    limit greatest(p_limit, 1)
    offset greatest(p_offset, 0);
$$;

grant execute on function public.get_boltz_feed_secure(uuid, int, int) to authenticated;
