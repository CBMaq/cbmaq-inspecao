-- Criar políticas RLS para upload de imagens do catálogo de máquinas

-- Permitir que administradores façam upload de imagens na pasta machines/
CREATE POLICY "Admins can upload machine catalog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-photos' 
  AND (storage.foldername(name))[1] = 'machines'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Permitir que administradores atualizem imagens na pasta machines/
CREATE POLICY "Admins can update machine catalog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inspection-photos' 
  AND (storage.foldername(name))[1] = 'machines'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Permitir que administradores deletem imagens na pasta machines/
CREATE POLICY "Admins can delete machine catalog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-photos' 
  AND (storage.foldername(name))[1] = 'machines'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);