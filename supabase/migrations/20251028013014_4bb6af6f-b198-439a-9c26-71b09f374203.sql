-- Add process_type column to inspections table
ALTER TABLE public.inspections 
ADD COLUMN process_type text NOT NULL DEFAULT 'entrada_cbmaq' CHECK (process_type IN ('instalacao_entrada_target', 'entrada_cbmaq', 'saida_cbmaq'));

-- Add comment to explain the column
COMMENT ON COLUMN public.inspections.process_type IS 'Tipo de processo: instalacao_entrada_target, entrada_cbmaq, saida_cbmaq';