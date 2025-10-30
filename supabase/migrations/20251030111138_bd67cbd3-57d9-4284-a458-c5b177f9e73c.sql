-- Função para verificar se o usuário tem email do domínio cbmaq.com.br
CREATE OR REPLACE FUNCTION public.is_cbmaq_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND email LIKE '%@cbmaq.com.br'
  )
$$;

-- Atualizar política de SELECT para inspections
DROP POLICY IF EXISTS "Técnicos podem ver todas inspeções" ON public.inspections;

CREATE POLICY "Usuários CBMaq veem tudo, outros apenas suas inspeções"
ON public.inspections
FOR SELECT
USING (
  -- Usuários CBMaq veem tudo
  public.is_cbmaq_user(auth.uid())
  OR
  -- Outros usuários veem apenas suas próprias inspeções
  auth.uid() = created_by
);