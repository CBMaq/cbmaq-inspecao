-- Corrigir política de inspection_items para respeitar acesso à inspeção
DROP POLICY IF EXISTS "Usuários autenticados podem ver itens" ON public.inspection_items;

-- A política existente "Usuários podem ver itens de inspeções acessíveis" já está correta
-- Vamos garantir que existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inspection_items' 
        AND policyname = 'Usuários podem ver itens de inspeções acessíveis'
    ) THEN
        EXECUTE 'CREATE POLICY "Usuários podem ver itens de inspeções acessíveis"
        ON public.inspection_items
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM inspections
            WHERE inspections.id = inspection_items.inspection_id
            AND (inspections.created_by = auth.uid() OR is_cbmaq_user(auth.uid()))
          )
        )';
    END IF;
END $$;