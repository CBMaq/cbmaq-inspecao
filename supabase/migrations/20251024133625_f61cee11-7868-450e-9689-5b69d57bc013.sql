-- Corrigir categorias das máquinas
UPDATE public.machine_models 
SET category = 'Escavadeira' 
WHERE name IN ('Lovol FR215F', 'Lovol FR36F');