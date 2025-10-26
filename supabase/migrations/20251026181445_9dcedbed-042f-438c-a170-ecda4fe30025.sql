-- Drop existing unrestricted upload policy
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;

-- Create restrictive policy that enforces file types and ownership
CREATE POLICY "Users can upload photos to their inspections"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM inspections WHERE created_by = auth.uid()
  )
  AND lower(substring(name from '\.[^.]+$')) IN ('.jpg', '.jpeg', '.png', '.webp', '.heic')
);