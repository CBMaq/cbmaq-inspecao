-- Adicionar política RLS para permitir admins deletarem inspeções
CREATE POLICY "Admins podem deletar inspeções"
ON public.inspections
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar coluna de email na tabela profiles para facilitar gestão
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

-- Criar índice para email
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Atualizar trigger para incluir email ao criar novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create profile with email
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  
  -- Assign default 'tecnico' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'tecnico');
  
  RETURN NEW;
END;
$$;