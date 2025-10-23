-- 1. Remover constraint existente e recriar com ON DELETE SET NULL para permitir exclusão de máquinas
ALTER TABLE public.inspections DROP CONSTRAINT IF EXISTS inspections_model_id_fkey;
ALTER TABLE public.inspections 
ADD CONSTRAINT inspections_model_id_fkey 
FOREIGN KEY (model_id) 
REFERENCES public.machine_models(id) 
ON DELETE SET NULL;

-- 2. Atualizar RLS policy para permitir que TODOS os técnicos vejam TODAS as inspeções
DROP POLICY IF EXISTS "Usuários podem ver suas inspeções ou todas se supervisor/adm" ON public.inspections;
CREATE POLICY "Técnicos podem ver todas inspeções" 
ON public.inspections 
FOR SELECT 
USING (true);

-- 3. Adicionar campos para documentos e assinatura do motorista
ALTER TABLE public.inspections 
ADD COLUMN IF NOT EXISTS driver_documents_url text,
ADD COLUMN IF NOT EXISTS driver_signature text,
ADD COLUMN IF NOT EXISTS driver_signature_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS driver_name text;

-- 4. Criar bucket de storage para documentos do motorista
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Criar políticas de storage para documentos do motorista
CREATE POLICY "Usuários autenticados podem ver documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'driver-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem fazer upload de documentos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'driver-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar documentos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'driver-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar documentos"
ON storage.objects FOR DELETE
USING (bucket_id = 'driver-documents' AND auth.role() = 'authenticated');