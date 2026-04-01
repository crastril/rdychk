-- Run this once in the Supabase SQL editor.
-- Creates a SECURITY DEFINER function that seeds the demo group,
-- bypassing RLS so no service role key is needed in the API.

CREATE OR REPLACE FUNCTION seed_demo_group()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_admin_id uuid;
  v_fake_ids uuid[];
  v_today    date := CURRENT_DATE;
  v_dates    date[];
BEGIN
  -- 1. Upsert demo group
  INSERT INTO groups (slug, name, type, city, location_voting_enabled, calendar_voting_enabled)
  VALUES ('demo-rdychk', 'Soirée Jeux Vidéo', 'in_person', 'Paris', true, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_group_id;

  -- 2. Wipe existing demo data
  DELETE FROM location_proposal_votes
  WHERE proposal_id IN (SELECT id FROM location_proposals WHERE group_id = v_group_id);
  DELETE FROM location_proposals WHERE group_id = v_group_id;
  DELETE FROM date_votes         WHERE group_id = v_group_id;
  DELETE FROM members            WHERE group_id = v_group_id;

  -- 3. Admin member
  INSERT INTO members (group_id, name, is_ready, role)
  VALUES (v_group_id, 'Toi (Admin)', true, 'admin')
  RETURNING id INTO v_admin_id;

  -- 4. Fake members
  WITH ins AS (
    INSERT INTO members (group_id, name, is_ready, role)
    VALUES
      (v_group_id, 'Mathieu', true,  'member'),
      (v_group_id, 'Camille', false, 'member'),
      (v_group_id, 'Théo',   true,  'member'),
      (v_group_id, 'Sophie', false, 'member')
    RETURNING id
  )
  SELECT array_agg(id) INTO v_fake_ids FROM ins;

  -- 5. Date votes (today+1, today+3, today+5)
  v_dates := ARRAY[v_today + 1, v_today + 3, v_today + 5];

  INSERT INTO date_votes (group_id, member_id, date)
  SELECT v_group_id, m.id, v.d
  FROM unnest(ARRAY[v_admin_id] || v_fake_ids) WITH ORDINALITY AS m(id, i),
       unnest(v_dates)                          WITH ORDINALITY AS v(d,  j)
  WHERE (m.i + v.j) % 2 = 0;

  -- 6. Location proposals
  INSERT INTO location_proposals (group_id, member_id, name, description, link, score)
  VALUES
    (v_group_id, v_fake_ids[1], 'Le Baron Rouge',   'Bar à vins sympa, super ambiance', 'https://maps.google.com', 2),
    (v_group_id, v_fake_ids[2], 'MK2 Bibliothèque', 'Cinéma accessible depuis le métro', 'https://maps.google.com', 1);

  -- 7. Allow anon role to call this function
  -- (included here for reference; runs automatically via SECURITY DEFINER)
  RETURN json_build_object('member_id', v_admin_id, 'slug', 'demo-rdychk');
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION seed_demo_group() TO anon, authenticated;
