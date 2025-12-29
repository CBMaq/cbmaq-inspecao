-- Adicionar campo de rótulo/observação inicial e data de prazo para conclusão
ALTER TABLE public.inspections
ADD COLUMN IF NOT EXISTS initial_label text,
ADD COLUMN IF NOT EXISTS deadline_date date;