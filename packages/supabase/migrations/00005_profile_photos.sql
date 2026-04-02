-- Profile photos: additional user photos beyond the avatar
CREATE TABLE profile_photos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url  VARCHAR(500) NOT NULL,
  is_public  BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Per-user access grants for private photos (grants access to ALL private photos)
CREATE TABLE photo_access_grants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_to_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, granted_to_id)
);

CREATE INDEX idx_profile_photos_user ON profile_photos (user_id, sort_order);
CREATE INDEX idx_photo_access_owner ON photo_access_grants (owner_id);
CREATE INDEX idx_photo_access_granted ON photo_access_grants (granted_to_id);

-- RLS
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_access_grants ENABLE ROW LEVEL SECURITY;

-- profile_photos: see own + public + private where granted access
CREATE POLICY profile_photos_select ON profile_photos FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM photo_access_grants
      WHERE owner_id = profile_photos.user_id AND granted_to_id = auth.uid()
    )
  );

CREATE POLICY profile_photos_insert ON profile_photos FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profile_photos_update ON profile_photos FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY profile_photos_delete ON profile_photos FOR DELETE
  USING (user_id = auth.uid());

-- photo_access_grants: owner manages, grantee can see
CREATE POLICY photo_access_select ON photo_access_grants FOR SELECT
  USING (owner_id = auth.uid() OR granted_to_id = auth.uid());

CREATE POLICY photo_access_insert ON photo_access_grants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY photo_access_delete ON photo_access_grants FOR DELETE
  USING (owner_id = auth.uid());

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Profile photo upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Profile photo public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Profile photo delete own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
