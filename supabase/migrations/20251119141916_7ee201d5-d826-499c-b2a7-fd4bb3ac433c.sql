-- Fix critical security vulnerability in inspection_items table
-- Replace overly permissive SELECT policy with proper access control

-- Drop the insecure policy
DROP POLICY IF EXISTS "Usuários autenticados podem ver itens" ON public.inspection_items;

-- Create properly scoped policy that respects inspection ownership
CREATE POLICY "Usuários podem ver itens de inspeções acessíveis"
ON public.inspection_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM inspections
    WHERE inspections.id = inspection_items.inspection_id
    AND (
      inspections.created_by = auth.uid()
      OR is_cbmaq_user(auth.uid())
    )
  )
);