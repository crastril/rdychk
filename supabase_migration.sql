-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  display_name text,
  avatar_url text
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Policy: Public profiles are viewable by everyone
do $$
begin
  if not exists (select from pg_policies where policyname = 'Public profiles are viewable by everyone.') then
    create policy "Public profiles are viewable by everyone." on profiles for select using (true);
  end if;
end $$;

-- Policy: Users can insert their own profile
do $$
begin
  if not exists (select from pg_policies where policyname = 'Users can insert their own profile.') then
    create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- Policy: Users can update own profile
do $$
begin
  if not exists (select from pg_policies where policyname = 'Users can update own profile.') then
    create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
  end if;
end $$;

-- Trigger removed to prevent auth blocking. 
-- Profile creation is now handled client-side by ProfileModal.
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();

-- Update members table
do $$
begin
    if not exists (select from information_schema.columns where table_name = 'members' and column_name = 'user_id') then
        alter table members add column user_id uuid references auth.users(id);
    end if;
end $$;

-- Clean up existing duplicates before adding constraint
delete from members a using members b
where a.id > b.id
and a.group_id = b.group_id
and a.user_id = b.user_id
and a.user_id is not null;

-- Add unique constraint to prevent future duplicates
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'members_group_id_user_id_key') then
        alter table members add constraint members_group_id_user_id_key unique (group_id, user_id);
    end if;
end $$;
