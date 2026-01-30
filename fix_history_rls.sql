-- Enable RLS on groups if not already (it should be, but just in case)
alter table groups enable row level security;

-- Allow public read access to groups
-- This is necessary for the join in GroupHistoryModal to work
do $$
begin
  if not exists (select from pg_policies where policyname = 'Public groups are viewable by everyone.') then
    create policy "Public groups are viewable by everyone." on groups for select using (true);
  end if;
end $$;

-- Also ensure members allow users to see their own memberships (already 'true' for public read, but good to be sure)
-- The existing policy "Public read members" uses (true), so that covers it.

-- Ensure authenticated users can delete their own membership (Leave Group)
do $$
begin
  if not exists (select from pg_policies where policyname = 'Users can leave groups (delete own membership).') then
    create policy "Users can leave groups (delete own membership)." on members for delete using (auth.uid() = user_id);
  end if;
end $$;
