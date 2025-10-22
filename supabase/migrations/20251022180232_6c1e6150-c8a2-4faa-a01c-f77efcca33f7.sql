-- Remover foreign keys existentes dos campos de técnico
ALTER TABLE public.inspections 
  DROP CONSTRAINT IF EXISTS inspections_entry_technician_id_fkey,
  DROP CONSTRAINT IF EXISTS inspections_exit_technician_id_fkey;

-- Alterar tipo de UUID para TEXT nos campos de ID de técnico
ALTER TABLE public.inspections 
  ALTER COLUMN entry_technician_id TYPE TEXT,
  ALTER COLUMN exit_technician_id TYPE TEXT;