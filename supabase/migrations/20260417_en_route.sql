-- Live ETA / "Je suis en route" feature
-- Adds live location sharing for members on jour J.
-- Privacy: fields are only populated when a member explicitly opts in,
-- and wiped by stopEnRoute / arrival / auto-stop after 4h.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS en_route_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_lat          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_lng          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_updated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrived_at           TIMESTAMPTZ;

-- Quick lookup of "who in this group is live right now"
CREATE INDEX IF NOT EXISTS idx_members_en_route
  ON members (group_id)
  WHERE en_route_at IS NOT NULL AND arrived_at IS NULL;

COMMENT ON COLUMN members.en_route_at         IS 'When the member opted into live location sharing (null = not sharing)';
COMMENT ON COLUMN members.current_lat         IS 'Last known latitude while en route';
COMMENT ON COLUMN members.current_lng         IS 'Last known longitude while en route';
COMMENT ON COLUMN members.location_updated_at IS 'Last time current_lat/current_lng were updated';
COMMENT ON COLUMN members.arrived_at          IS 'When the member arrived (distance < 100m from destination) — stops updates';

-- Note: groups.location is a JSONB blob. We add lat/lng inside it client-side
-- when the location is confirmed (no schema change required on the groups table).
