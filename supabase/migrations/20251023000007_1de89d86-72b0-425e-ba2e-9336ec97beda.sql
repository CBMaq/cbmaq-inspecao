-- Criar tabela de técnicos
CREATE TABLE public.technicians (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Todos podem ver técnicos"
ON public.technicians
FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem inserir técnicos"
ON public.technicians
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem atualizar técnicos"
ON public.technicians
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar técnicos"
ON public.technicians
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_technicians_updated_at
BEFORE UPDATE ON public.technicians
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar colunas para armazenar o nome do técnico nas inspeções
ALTER TABLE public.inspections
ADD COLUMN entry_technician_name TEXT,
ADD COLUMN exit_technician_name TEXT;