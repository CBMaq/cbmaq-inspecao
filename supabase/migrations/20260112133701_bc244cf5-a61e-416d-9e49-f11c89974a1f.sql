-- 1. Corrigir política de fotos: Restringir para apenas quem tem acesso à inspeção
DROP POLICY IF EXISTS "Usuários podem ver fotos de inspeções" ON public.inspection_photos;

CREATE POLICY "Usuários podem ver fotos de inspeções acessíveis"
ON public.inspection_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM inspections i
    WHERE i.id = inspection_photos.inspection_id
    AND (i.created_by = auth.uid() OR is_cbmaq_user(auth.uid()))
  )
);

-- 2. Restringir visualização de técnicos apenas para usuários autenticados
DROP POLICY IF EXISTS "Todos podem ver técnicos" ON public.technicians;

CREATE POLICY "Usuários autenticados podem ver técnicos"
ON public.technicians
FOR SELECT
TO authenticated
USING (true);

-- 3. Restringir catálogo de máquinas para usuários autenticados
DROP POLICY IF EXISTS "Todos podem ver modelos de máquinas" ON public.machine_models;

CREATE POLICY "Usuários autenticados podem ver modelos de máquinas"
ON public.machine_models
FOR SELECT
TO authenticated
USING (true);

-- 4. Permitir que admins visualizem todos os roles para gerenciamento
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Usuários podem ver seus próprios roles ou admins veem todos"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'supervisor'::app_role)
);