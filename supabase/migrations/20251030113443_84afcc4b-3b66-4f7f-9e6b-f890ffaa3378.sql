-- Relax INSERT policy to allow supervisors/admins to attach media to any inspection
DROP POLICY IF EXISTS "Usuários podem inserir fotos em suas inspeções" ON public.inspection_photos;

CREATE POLICY "Usuários e gestores podem inserir fotos/vídeos"
ON public.inspection_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspections i
    WHERE i.id = inspection_photos.inspection_id
      AND (
        i.created_by = auth.uid()
        OR public.has_role(auth.uid(), 'supervisor'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);
