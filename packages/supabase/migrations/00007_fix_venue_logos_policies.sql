-- Ensure venue-logos bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-logos',
  'venue-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid duplicate errors, then recreate
DROP POLICY IF EXISTS "Venue logo upload" ON storage.objects;
DROP POLICY IF EXISTS "Venue logo update" ON storage.objects;
DROP POLICY IF EXISTS "Venue logo public read" ON storage.objects;
DROP POLICY IF EXISTS "Venue logo delete" ON storage.objects;

CREATE POLICY "Venue logo upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'venue-logos'
    AND EXISTS (
      SELECT 1 FROM public.venues
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Venue logo update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'venue-logos'
    AND EXISTS (
      SELECT 1 FROM public.venues
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Venue logo public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'venue-logos');

CREATE POLICY "Venue logo delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'venue-logos'
    AND EXISTS (
      SELECT 1 FROM public.venues
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );
