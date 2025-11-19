-- Fix security vulnerabilities identified in security scan

-- 1. Add INSERT policy for profiles table
-- Only allow system/triggers to create profiles (users are created via handle_new_user trigger)
CREATE POLICY "Apenas sistema pode criar perfis"
ON public.profiles
FOR INSERT
WITH CHECK (false);

-- 2. Add DELETE policy for profiles table  
-- Only admins can delete profiles
CREATE POLICY "Apenas admins podem deletar perfis"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 3. Add UPDATE policy for inspection_photos table
-- Only the inspection creator or supervisors/admins can update photos
CREATE POLICY "Usuários podem atualizar fotos de suas inspeções"
ON public.inspection_photos
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM inspections i
    WHERE i.id = inspection_photos.inspection_id
    AND i.created_by = auth.uid()
  ))
  OR has_role(auth.uid(), 'supervisor')
  OR has_role(auth.uid(), 'admin')
);

-- 4. Add DELETE policy for inspection_photos table
-- Only admins can delete inspection photos (preserve evidence)
CREATE POLICY "Apenas admins podem deletar fotos"
ON public.inspection_photos
FOR DELETE
USING (has_role(auth.uid(), 'admin'));