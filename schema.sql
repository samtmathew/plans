-- Plans — Supabase Database Schema
-- Run this in the Supabase dashboard SQL editor (Database > SQL Editor > New Query)
-- Version: V1 MVP

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLES
-- ============================================================

-- profiles
-- One record per user. id matches auth.users.id (set by Supabase Auth).
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  bio             TEXT,
  date_of_birth   DATE,
  gender          TEXT,
  instagram       TEXT,
  linkedin        TEXT,
  twitter_x       TEXT,
  avatar_url      TEXT,
  photos          TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- plans
CREATE TABLE IF NOT EXISTS plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organiser_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  itinerary       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  join_token      UUID UNIQUE DEFAULT uuid_generate_v4() NOT NULL,
  join_approval   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- plan_items
CREATE TABLE IF NOT EXISTS plan_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id         UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  price           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  pricing_type    TEXT NOT NULL CHECK (pricing_type IN ('per_head', 'group')),
  description     TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- plan_attendees
CREATE TABLE IF NOT EXISTS plan_attendees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id         UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('organiser', 'attendee')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  invited_by      UUID REFERENCES profiles(id),
  joined_via      TEXT NOT NULL CHECK (joined_via IN ('invite_link', 'organiser_added')),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE (plan_id, user_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

-- Speed up attendee lookups by plan
CREATE INDEX IF NOT EXISTS idx_plan_attendees_plan_id ON plan_attendees(plan_id);

-- Speed up attendee lookups by user (for dashboard query)
CREATE INDEX IF NOT EXISTS idx_plan_attendees_user_id ON plan_attendees(user_id);

-- Speed up items lookup by plan
CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id ON plan_items(plan_id);

-- Speed up plans lookup by organiser (for dashboard query)
CREATE INDEX IF NOT EXISTS idx_plans_organiser_id ON plans(organiser_id);

-- Speed up join token resolution
CREATE INDEX IF NOT EXISTS idx_plans_join_token ON plans(join_token);

-- Speed up profile name search
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles USING gin(to_tsvector('english', name));


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_attendees ENABLE ROW LEVEL SECURITY;


-- ---- profiles ----

-- Anyone logged in can read any profile
CREATE POLICY "profiles: public read"
  ON profiles FOR SELECT
  USING (true);

-- Only the profile owner can insert/update/delete
CREATE POLICY "profiles: own write"
  ON profiles FOR ALL
  USING (auth.uid() = id);


-- ---- plans ----

-- Organiser has full access to their own plans
CREATE POLICY "plans: organiser all"
  ON plans FOR ALL
  USING (organiser_id = auth.uid());

-- Approved attendees can read plans they are part of
CREATE POLICY "plans: attendee read"
  ON plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plan_attendees
      WHERE plan_id = plans.id
        AND user_id = auth.uid()
        AND status = 'approved'
    )
  );

-- Anyone can read a plan by its join token (for the public join page preview)
CREATE POLICY "plans: join token read"
  ON plans FOR SELECT
  USING (join_token IS NOT NULL);


-- ---- plan_items ----

-- Organiser or approved attendee can read items
CREATE POLICY "plan_items: attendee/organiser read"
  ON plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plans p
      LEFT JOIN plan_attendees pa ON pa.plan_id = p.id
      WHERE p.id = plan_items.plan_id
        AND (
          p.organiser_id = auth.uid()
          OR (pa.user_id = auth.uid() AND pa.status = 'approved')
        )
    )
  );

-- Only organiser can write items
CREATE POLICY "plan_items: organiser write"
  ON plan_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE id = plan_items.plan_id
        AND organiser_id = auth.uid()
    )
  );


-- ---- plan_attendees ----

-- Organiser has full access to all attendees on their plans
CREATE POLICY "plan_attendees: organiser all"
  ON plan_attendees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE id = plan_attendees.plan_id
        AND organiser_id = auth.uid()
    )
  );

-- Each attendee can read their own row
CREATE POLICY "plan_attendees: own row read"
  ON plan_attendees FOR SELECT
  USING (user_id = auth.uid());

-- Approved attendees can read other approved attendees on the same plan
CREATE POLICY "plan_attendees: approved attendees read approved"
  ON plan_attendees FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM plan_attendees pa2
      WHERE pa2.plan_id = plan_attendees.plan_id
        AND pa2.user_id = auth.uid()
        AND pa2.status = 'approved'
    )
  );


-- ============================================================
-- STORAGE BUCKETS
-- (Run these separately or via Supabase dashboard Storage section)
-- ============================================================

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES
--   ('avatars', 'avatars', true),
--   ('profile-photos', 'profile-photos', true)
-- ON CONFLICT DO NOTHING;
