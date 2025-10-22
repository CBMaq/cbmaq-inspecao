-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('tecnico', 'supervisor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver todos os perfis"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Criar tabela de inspeções
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  horimeter INTEGER NOT NULL,
  freight_responsible TEXT,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada', 'aprovada', 'reprovada')),
  general_observations TEXT,
  has_fault_codes BOOLEAN DEFAULT false,
  fault_codes_description TEXT,
  codes_corrected BOOLEAN DEFAULT false,
  entry_technician_id UUID REFERENCES public.profiles(id),
  exit_technician_id UUID REFERENCES public.profiles(id),
  entry_signature TEXT,
  exit_signature TEXT,
  entry_signature_date TIMESTAMP WITH TIME ZONE,
  exit_signature_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para inspections
CREATE POLICY "Usuários autenticados podem ver inspeções"
  ON public.inspections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar inspeções"
  ON public.inspections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários autenticados podem atualizar inspeções"
  ON public.inspections FOR UPDATE
  TO authenticated
  USING (true);

-- Criar tabela de itens de inspeção
CREATE TABLE public.inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  item_description TEXT NOT NULL,
  entry_status TEXT CHECK (entry_status IN ('A', 'B', 'C')),
  exit_status TEXT CHECK (exit_status IN ('A', 'B', 'C')),
  problem_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para inspection_items
CREATE POLICY "Usuários autenticados podem ver itens"
  ON public.inspection_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir itens"
  ON public.inspection_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar itens"
  ON public.inspection_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar itens"
  ON public.inspection_items FOR DELETE
  TO authenticated
  USING (true);

-- Criar tabela de fotos
CREATE TABLE public.inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
  photo_type TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para inspection_photos
CREATE POLICY "Usuários autenticados podem ver fotos"
  ON public.inspection_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir fotos"
  ON public.inspection_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criar storage bucket para fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true);

-- Políticas de storage
CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'inspection-photos');

CREATE POLICY "Fotos são publicamente acessíveis"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'inspection-photos');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();