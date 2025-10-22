-- Criar tabela de modelos de máquinas
CREATE TABLE public.machine_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  line TEXT NOT NULL, -- Construção, Agrícola, Pavimentação
  image_url TEXT,
  gallery_images TEXT[], -- Array de URLs de imagens
  internal_code TEXT,
  description TEXT,
  technical_sheet_url TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_machine_models_category ON public.machine_models(category);
CREATE INDEX idx_machine_models_line ON public.machine_models(line);
CREATE INDEX idx_machine_models_internal_code ON public.machine_models(internal_code);

-- Habilitar RLS
ALTER TABLE public.machine_models ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - todos podem ver os modelos
CREATE POLICY "Todos podem ver modelos de máquinas"
ON public.machine_models
FOR SELECT
USING (true);

-- Apenas admins podem inserir, atualizar e deletar
CREATE POLICY "Apenas admins podem inserir modelos"
ON public.machine_models
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem atualizar modelos"
ON public.machine_models
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar modelos"
ON public.machine_models
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar coluna model_id na tabela inspections
ALTER TABLE public.inspections
ADD COLUMN model_id UUID REFERENCES public.machine_models(id);

-- Criar índice
CREATE INDEX idx_inspections_model_id ON public.inspections(model_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_machine_models_updated_at
BEFORE UPDATE ON public.machine_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();