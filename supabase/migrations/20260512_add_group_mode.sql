ALTER TABLE groups ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'planning' CHECK (mode IN ('planning', 'day-of'));
