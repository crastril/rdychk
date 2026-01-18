-- Table des groupes
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_members_group_id ON members(group_id);
CREATE INDEX idx_groups_slug ON groups(slug);

-- Activer le temps réel sur la table members
ALTER PUBLICATION supabase_realtime ADD TABLE members;

-- Activer RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Permettre la lecture publique
CREATE POLICY "Groups are publicly readable" ON groups FOR SELECT USING (true);
CREATE POLICY "Members are publicly readable" ON members FOR SELECT USING (true);

-- Permettre l'insertion publique (pas d'authentification requise)
CREATE POLICY "Anyone can create groups" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can join groups" ON members FOR INSERT WITH CHECK (true);

-- Permettre la mise à jour du statut
CREATE POLICY "Anyone can update member status" ON members FOR UPDATE USING (true);
