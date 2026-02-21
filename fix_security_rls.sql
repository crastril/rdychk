-- Enable pgcrypto for hashing
create extension if not exists "pgcrypto";

-- Add secret_hash column to members table
alter table members add column if not exists secret_hash text;

-- Function to join a group securely
create or replace function join_group(
  p_group_id uuid,
  p_name text
) returns json language plpgsql security definer as $$
declare
  v_secret text;
  v_member_id uuid;
  v_user_id uuid;
  v_result json;
begin
  -- Get current user ID (if authenticated)
  v_user_id := auth.uid();

  -- Generate a random secret for this session
  v_secret := gen_random_uuid()::text;

  -- Insert member with the hashed secret
  -- If user is authenticated, we link them immediately
  insert into members (group_id, name, user_id, secret_hash)
  values (
    p_group_id,
    p_name,
    v_user_id,
    crypt(v_secret, gen_salt('bf'))
  )
  returning id into v_member_id;

  -- Return the member ID and the PLAIN TEXT secret so the client can store it
  -- We select the inserted row to return standard fields + secret
  select json_build_object(
    'id', m.id,
    'group_id', m.group_id,
    'name', m.name,
    'user_id', m.user_id,
    'role', m.role,
    'is_ready', m.is_ready,
    'joined_at', m.joined_at,
    'secret', v_secret -- Return the secret only once!
  ) into v_result
  from members m
  where m.id = v_member_id;

  return v_result;
end;
$$;

-- Remove insecure policies (covering potential naming variations)
drop policy if exists "Public update members" on members;
drop policy if exists "Anyone can update member status" on members;
drop policy if exists "Public insert members" on members;
drop policy if exists "Anyone can join groups" on members;

-- Create secure update policy
-- Allows update if:
-- 1. User is authenticated and owns the record
-- 2. User provides the correct secret via header 'x-member-secret'
create policy "Members can update own status" on members for update using (
  (auth.uid() = user_id)
  OR
  (
    secret_hash is not null
    and
    secret_hash = crypt(current_setting('request.headers', true)::json->>'x-member-secret', secret_hash)
  )
);

-- Create secure delete policy for guests (leaving group)
create policy "Members can delete own membership" on members for delete using (
  (auth.uid() = user_id)
  OR
  (
    secret_hash is not null
    and
    secret_hash = crypt(current_setting('request.headers', true)::json->>'x-member-secret', secret_hash)
  )
);
