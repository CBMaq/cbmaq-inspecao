-- Remove the overly permissive SELECT policy
DROP POLICY IF EXISTS "Usuários autenticados podem ver inspeções" ON public.inspections;

-- Create a new restricted SELECT policy
CREATE POLICY "Usuários podem ver suas inspeções ou todas se supervisor/admin"
  ON public.inspections 
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by 
    OR has_role(auth.uid(), 'supervisor'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );