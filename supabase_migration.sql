-- Create a table for public profiles if it doesn't exist
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  display_name text,
  avatar_url text
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Policies: Use DROP IF EXISTS to ensure clean creation or check existence
do $$
begin
  -- Public view
  if not exists (select from pg_policies where policyname = 'Public profiles are viewable by everyone.') then
    create policy "Public profiles are viewable by everyone." on profiles for select using (true);
  end if;

  -- User insert
  if not exists (select from pg_policies where policyname = 'Users can insert their own profile.') then
    create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
  end if;

  -- User update
  if not exists (select from pg_policies where policyname = 'Users can update own profile.') then
    create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
  end if;
    create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
  end if;
end $$;

-- Enable RLS on members if not already
alter table members enable row level security;

do $$
begin
  if not exists (select from pg_policies where policyname = 'Users can view own memberships.') then
    create policy "Users can view own memberships." on members for select using (auth.uid() = user_id);
  end if;
end $$;

-- Update members table
do $$
begin
    if not exists (select from information_schema.columns where table_name = 'members' and column_name = 'user_id') then
        alter table members add column user_id uuid references auth.users(id);
    end if;

    if not exists (select from information_schema.columns where table_name = 'members' and column_name = 'timer_end_time') then
        alter table members add column timer_end_time timestamptz;
    end if;

    if not exists (select from information_schema.columns where table_name = 'members' and column_name = 'proposed_time') then
        alter table members add column proposed_time text;
    end if;

    if not exists (select from information_schema.columns where table_name = 'members' and column_name = 'role') then
        alter table members add column role text default 'member';
    end if;

    if not exists (select from information_schema.columns where table_name = 'groups' and column_name = 'created_by') then
        alter table groups add column created_by uuid references auth.users(id);
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
