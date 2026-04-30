alter table if exists public.profiles
  add column if not exists identity_dna_hash text;

alter table if exists public.profiles
  add column if not exists is_verified boolean not null default false;

alter table if exists public.profiles
  add column if not exists trust_tier integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_trust_tier_range'
  ) then
    alter table public.profiles
      add constraint profiles_trust_tier_range check (trust_tier >= 0 and trust_tier <= 5);
  end if;
end $$;

create unique index if not exists idx_profiles_identity_dna_hash_unique
  on public.profiles(identity_dna_hash)
  where identity_dna_hash is not null;
