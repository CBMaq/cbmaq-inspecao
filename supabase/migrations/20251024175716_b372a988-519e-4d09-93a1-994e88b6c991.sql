-- Atualizar perfis existentes com emails da tabela auth.users
UPDATE public.profiles
SET email = au.email
FROM auth.users au
WHERE profiles.id = au.id
AND profiles.email IS NULL;