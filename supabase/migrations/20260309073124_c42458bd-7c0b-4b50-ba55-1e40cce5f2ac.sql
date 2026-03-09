
-- Drop all policies that depend on has_role(uuid, app_role)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;

-- Drop old enum function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Change columns from enum to text
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE public.module_permissions ALTER COLUMN role TYPE text USING role::text;

-- Create text-based has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update get_user_modules
CREATE OR REPLACE FUNCTION public.get_user_modules(_user_id uuid)
RETURNS TABLE(module_key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT mp.module_key
  FROM public.module_permissions mp
  INNER JOIN public.user_roles ur ON ur.role = mp.role
  WHERE ur.user_id = _user_id AND mp.can_access = true
$$;

-- Recreate all policies using text-based has_role
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage permissions" ON public.module_permissions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles catalog" ON public.roles FOR ALL USING (has_role(auth.uid(), 'admin'));
