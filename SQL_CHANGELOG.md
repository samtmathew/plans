# SQL Changelog

All schema changes, migrations, RLS policies, and storage policies are documented here in chronological order. Run each entry in the Supabase dashboard SQL editor (Database → SQL Editor → New Query).

---

## 2026-04-11 — Initial Schema

**File:** `schema.sql` (run this to bootstrap a fresh project)

Creates all tables, indexes, RLS policies, and the `updated_at` trigger.

### Tables created

```sql
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

CREATE TABLE IF NOT EXISTS plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organiser_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  itinerary       TEXT NOT NULL,
  start_date      DATE,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  join_token      UUID UNIQUE DEFAULT uuid_generate_v4() NOT NULL,
  join_approval   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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
```

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_plan_attendees_plan_id ON plan_attendees(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_attendees_user_id ON plan_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id     ON plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_plans_organiser_id     ON plans(organiser_id);
CREATE INDEX IF NOT EXISTS idx_plans_join_token       ON plans(join_token);
CREATE INDEX IF NOT EXISTS idx_profiles_name          ON profiles USING gin(to_tsvector('english', name));
```

### updated_at trigger

```sql
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
```

### RLS — profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read any profile
CREATE POLICY "profiles: public read"
  ON profiles FOR SELECT USING (true);

-- Only the profile owner can insert/update/delete
CREATE POLICY "profiles: own write"
  ON profiles FOR ALL USING (auth.uid() = id);
```

### RLS helper functions

```sql
-- Returns true if the current user is the organiser of the given plan.
CREATE OR REPLACE FUNCTION public.is_plan_organiser(p_plan_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM plans WHERE id = p_plan_id AND organiser_id = auth.uid()
  );
$$;

-- Returns true if the current user is an approved attendee of the given plan.
CREATE OR REPLACE FUNCTION public.is_approved_plan_attendee(p_plan_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM plan_attendees
    WHERE plan_id = p_plan_id AND user_id = auth.uid() AND status = 'approved'
  );
$$;
```

### RLS — plans

```sql
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Organiser has full access to their own plans
CREATE POLICY "plans: organiser all"
  ON plans FOR ALL USING (organiser_id = auth.uid());

-- Approved attendees can read plans they are part of
CREATE POLICY "plans: attendee read"
  ON plans FOR SELECT USING (public.is_approved_plan_attendee(plans.id));

-- Anyone can read a plan by its join token (for the public join page preview)
CREATE POLICY "plans: join token read"
  ON plans FOR SELECT USING (join_token IS NOT NULL);
```

### RLS — plan_items

```sql
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "plan_items: organiser write"
  ON plan_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE id = plan_items.plan_id AND organiser_id = auth.uid()
    )
  );
```

### RLS — plan_attendees

```sql
ALTER TABLE plan_attendees ENABLE ROW LEVEL SECURITY;

-- Organiser has full access to all attendees on their plans
CREATE POLICY "plan_attendees: organiser all"
  ON plan_attendees FOR ALL
  USING (public.is_plan_organiser(plan_attendees.plan_id));

-- Each attendee can read their own row
CREATE POLICY "plan_attendees: own row read"
  ON plan_attendees FOR SELECT USING (user_id = auth.uid());

-- Approved attendees can read other approved attendees on the same plan
CREATE POLICY "plan_attendees: approved attendees read approved"
  ON plan_attendees FOR SELECT
  USING (
    status = 'approved'
    AND public.is_approved_plan_attendee(plan_attendees.plan_id)
  );
```

---

## 2026-04-11 — Soft delete + media columns

### Plans: soft delete, cover photo, gallery

```sql
ALTER TABLE plans ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS cover_photo    TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS gallery_photos TEXT[] DEFAULT '{}';
```

**Why:** Deleting a plan sets `deleted_at` instead of hard-deleting the row — preserves history for compliance and debugging. Cover photo and gallery support image uploads per plan.

---

## 2026-04-11 — Storage buckets and policies

### Buckets (create via Supabase dashboard: Storage → New bucket)

| Bucket | Public |
|--------|--------|
| `avatars` | yes |
| `profile-photos` | yes |
| `plan-covers` | yes |
| `plan-gallery` | yes |

### Storage policies — plan-covers

```sql
CREATE POLICY "plan-covers: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plan-covers');

CREATE POLICY "plan-covers: auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'plan-covers');

CREATE POLICY "plan-covers: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'plan-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Storage policies — plan-gallery

```sql
CREATE POLICY "plan-gallery: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plan-gallery');

CREATE POLICY "plan-gallery: auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'plan-gallery');

CREATE POLICY "plan-gallery: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'plan-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Path convention:** uploads are stored as `{userId}/{timestamp}-{random}.{ext}` so the owner check (`foldername(name)[1]`) correctly identifies the uploader.

---

## 2026-04-11 — Storage policies for avatars and profile-photos

### Storage policies — avatars

```sql
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
```

**Why:** The `avatars` bucket was missing RLS policies, causing all upload attempts to fail with a 403. The `auth upload` policy allows authenticated users to insert files into the bucket.

### Storage policies — profile-photos

```sql
CREATE POLICY "profile-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "profile-photos: auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "profile-photos: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY "profile-photos: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-photos');
```

**Why:** The `profile-photos` bucket was missing RLS policies, causing all upload attempts to fail with a 403. The `auth upload` policy allows authenticated users to insert files into the bucket.
