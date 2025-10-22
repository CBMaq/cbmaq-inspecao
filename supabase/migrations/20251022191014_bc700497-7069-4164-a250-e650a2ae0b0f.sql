-- Fix critical RLS security vulnerabilities

-- 1. Drop insecure policies on inspections table
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar inspeções" ON public.inspections;

-- 2. Create secure UPDATE policy for inspections (only owner or supervisor/admin can update)
CREATE POLICY "Usuários podem atualizar suas próprias inspeções"
ON public.inspections
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'supervisor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Drop insecure policies on inspection_items table
DROP POLICY IF EXISTS "Usuários autenticados podem inserir itens" ON public.inspection_items;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar itens" ON public.inspection_items;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar itens" ON public.inspection_items;

-- 4. Create secure policies for inspection_items (only inspection owner can modify)
CREATE POLICY "Usuários podem inserir itens em suas inspeções"
ON public.inspection_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspections 
    WHERE inspections.id = inspection_items.inspection_id 
    AND inspections.created_by = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar itens de suas inspeções"
ON public.inspection_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections 
    WHERE inspections.id = inspection_items.inspection_id 
    AND inspections.created_by = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar itens de suas inspeções"
ON public.inspection_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections 
    WHERE inspections.id = inspection_items.inspection_id 
    AND inspections.created_by = auth.uid()
  )
);

-- 5. Drop insecure policies on inspection_photos table
DROP POLICY IF EXISTS "Usuários autenticados podem inserir fotos" ON public.inspection_photos;
DROP POLICY IF EXISTS "Usuários autenticados podem ver fotos" ON public.inspection_photos;

-- 6. Create secure policies for inspection_photos (only inspection owner can access)
CREATE POLICY "Usuários podem inserir fotos em suas inspeções"
ON public.inspection_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspections 
    WHERE inspections.id = inspection_photos.inspection_id 
    AND inspections.created_by = auth.uid()
  )
);

CREATE POLICY "Usuários podem ver fotos de suas inspeções"
ON public.inspection_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections 
    WHERE inspections.id = inspection_photos.inspection_id 
    AND inspections.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'supervisor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 7. Drop insecure policy on profiles table
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;

-- 8. Create secure policy for profiles (users can only see their own profile, admins can see all)
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'supervisor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);