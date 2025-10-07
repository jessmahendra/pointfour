-- Setup Storage Bucket for Review Photos
-- Run this in Supabase Dashboard SQL Editor after running the main migration

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for review-photos bucket

-- Policy: Anyone can view photos (since bucket is public)
CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'review-photos');

-- Policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update their own review photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own review photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: Photos will be organized by user_id folders
-- Path structure: review-photos/{user_id}/{review_id}/{photo_filename}
