-- Atualizar política SELECT de inspection_photos para incluir técnicos
DROP POLICY IF EXISTS "Usuários podem ver fotos de suas inspeções" ON public.inspection_photos;

CREATE POLICY "Usuários podem ver fotos de inspeções"
ON public.inspection_photos
FOR SELECT
TO authenticated
USING (
  -- Dono da inspeção pode ver
  (EXISTS (
    SELECT 1 FROM public.inspections
    WHERE inspections.id = inspection_photos.inspection_id
    AND inspections.created_by = auth.uid()
  ))
  -- Técnicos, supervisores e admins podem ver todas
  OR has_role(auth.uid(), 'tecnico')
  OR has_role(auth.uid(), 'supervisor')
  OR has_role(auth.uid(), 'admin')
);