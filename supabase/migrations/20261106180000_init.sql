-- Design asset library: profiles, assets, private storage bucket.
-- Run this entire script in the Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Reserved for a later colleague ACL. The app does not read these columns.
  role text not null default 'member',
  permissions text[] not null default '{}',
  created_at timestamptz not null default now()
);

comment on column public.profiles.role is 'Reserved. Not used for access control yet.';
comment on column public.profiles.permissions is 'Reserved. Not used for access control yet.';

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  intro text not null default '',
  category text not null,
  tags text[] not null default '{}',
  remark text not null default '',
  platform text not null default '',
  version text not null default '',
  updated_at timestamptz not null default now(),
  preview_path text,
  asset_notes text not null default '',
  install_notes text not null default '',
  file_path text,
  mime text,
  original_name text,
  download_count integer not null default 0,
  owner_id uuid not null references auth.users (id) on delete cascade,
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assets_category_idx on public.assets (category);
create index if not exists assets_owner_idx on public.assets (owner_id);
create index if not exists assets_updated_idx on public.assets (updated_at desc);
create index if not exists assets_tags_idx on public.assets using gin (tags);

alter table public.profiles enable row level security;
alter table public.assets enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "authenticated read assets" on public.assets;
create policy "authenticated read assets"
  on public.assets
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated insert own assets" on public.assets;
create policy "authenticated insert own assets"
  on public.assets
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "authenticated update assets" on public.assets;
create policy "authenticated update assets"
  on public.assets
  for update
  to authenticated
  using (true)
  with check (true);

revoke all on public.profiles from anon;
revoke all on public.assets from anon;
grant select on public.profiles to authenticated;
grant select, insert on public.assets to authenticated;
revoke update on public.assets from authenticated;
grant update (
  title,
  description,
  intro,
  category,
  tags,
  remark,
  platform,
  version,
  updated_at,
  preview_path,
  asset_notes,
  install_notes,
  file_path,
  mime,
  original_name,
  files
) on public.assets to authenticated;

create or replace function public.assets_reset_download_count_on_insert()
returns trigger
language plpgsql
as $$
begin
  new.download_count := 0;
  return new;
end;
$$;

drop trigger if exists assets_reset_download_count_on_insert on public.assets;
create trigger assets_reset_download_count_on_insert
  before insert on public.assets
  for each row
  execute function public.assets_reset_download_count_on_insert();

create or replace function public.increment_download_count(asset_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.assets
    set download_count = download_count + 1
    where id = asset_id
    returning download_count into next_count;

  if next_count is null then
    raise exception 'asset not found';
  end if;

  return next_count;
end;
$$;

revoke all on function public.increment_download_count(uuid) from public, anon;
grant execute on function public.increment_download_count(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do update set public = false;

drop policy if exists "authenticated read asset files" on storage.objects;
create policy "authenticated read asset files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'assets');

drop policy if exists "authenticated upload own asset files" on storage.objects;
create policy "authenticated upload own asset files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "authenticated delete own asset files" on storage.objects;
create policy "authenticated delete own asset files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
