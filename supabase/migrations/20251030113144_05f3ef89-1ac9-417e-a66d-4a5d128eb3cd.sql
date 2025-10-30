-- Drop existing storage policies to recreate them with video support
DROP POLICY IF EXISTS "Users can upload inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view inspection photos" ON storage.objects;

-- Create policy for uploading photos and videos
CREATE POLICY "Users can upload inspection media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-photos' AND
  (
    -- Allow image formats
    (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'heic') AND
     (storage.foldername(name))[1] IN (
       SELECT id::text FROM public.inspections
     )) OR
    -- Allow video formats
    (storage.extension(name) IN ('mp4', 'mov', 'avi', 'webm', 'mkv') AND
     (storage.foldername(name))[1] IN (
       SELECT id::text FROM public.inspections
     ))
  )
);

-- Create policy for updating photos and videos
CREATE POLICY "Users can update inspection media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inspection-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.inspections
  )
);

-- Create policy for deleting photos and videos
CREATE POLICY "Users can delete inspection media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.inspections
  )
);

-- Create policy for viewing photos and videos (public access)
CREATE POLICY "Public can view inspection media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'inspection-photos');