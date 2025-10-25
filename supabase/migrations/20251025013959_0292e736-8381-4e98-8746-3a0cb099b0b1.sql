-- Storage policies for secure access to driver documents
-- Allow authenticated users to upload into the private bucket
CREATE POLICY "Upload driver documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-documents');

-- Allow viewing documents when linked to an inspection owned by the user or elevated roles
CREATE POLICY "View driver documents via inspection link"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1
    FROM public.inspections i
    WHERE (
      i.driver_documents_url = storage.objects.name
      OR regexp_replace(i.driver_documents_url, '.*\/driver-documents\/', '') = storage.objects.name
    )
    AND (
      i.created_by = auth.uid()
      OR has_role(auth.uid(), 'supervisor'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Allow deletion by owner (inspection creator) or elevated roles
CREATE POLICY "Delete driver documents via inspection link"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1
    FROM public.inspections i
    WHERE (
      i.driver_documents_url = storage.objects.name
      OR regexp_replace(i.driver_documents_url, '.*\/driver-documents\/', '') = storage.objects.name
    )
    AND (
      i.created_by = auth.uid()
      OR has_role(auth.uid(), 'supervisor'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);