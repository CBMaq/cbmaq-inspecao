-- Add approval tracking fields to inspections table
ALTER TABLE public.inspections
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approval_observations text;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_approved_by ON public.inspections(approved_by);
CREATE INDEX IF NOT EXISTS idx_inspections_created_by ON public.inspections(created_by);

-- Update RLS policy to allow supervisors/admins to approve inspections
CREATE POLICY "Supervisores podem aprovar inspeções"
ON public.inspections
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('supervisor', 'admin')
  )
);

-- Add comment for clarity
COMMENT ON COLUMN public.inspections.approved_by IS 'ID do supervisor/admin que aprovou ou reprovou a inspeção';
COMMENT ON COLUMN public.inspections.approved_at IS 'Data e hora da aprovação ou reprovação';
COMMENT ON COLUMN public.inspections.approval_observations IS 'Observações do supervisor sobre a aprovação ou reprovação';