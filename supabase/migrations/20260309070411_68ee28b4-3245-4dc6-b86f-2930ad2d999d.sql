
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'usuario', 'operador', 'supervisor');

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  email text,
  rol text NOT NULL DEFAULT 'usuario',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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

-- RLS for user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Module permissions table
CREATE TABLE public.module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module_key text NOT NULL,
  can_access boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, module_key)
);

ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read permissions" ON public.module_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage permissions" ON public.module_permissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Default permissions for admin (all modules)
INSERT INTO public.module_permissions (role, module_key, can_access) VALUES
  ('admin', 'dashboard', true),
  ('admin', 'clientes', true),
  ('admin', 'cotizaciones', true),
  ('admin', 'ventas', true),
  ('admin', 'entregas', true),
  ('admin', 'cuentas-por-cobrar', true),
  ('admin', 'produccion', true),
  ('admin', 'bom', true),
  ('admin', 'maquinas', true),
  ('admin', 'compras', true),
  ('admin', 'proveedores', true),
  ('admin', 'cuentas-por-pagar', true),
  ('admin', 'inventario', true),
  ('admin', 'calidad', true),
  ('admin', 'metrologia', true),
  ('admin', 'mantenimiento', true),
  ('admin', 'gastos', true),
  ('admin', 'rrhh', true),
  ('admin', 'operador', true),
  ('admin', 'usuarios', true);

-- Default permissions for usuario
INSERT INTO public.module_permissions (role, module_key, can_access) VALUES
  ('usuario', 'dashboard', true),
  ('usuario', 'clientes', true),
  ('usuario', 'cotizaciones', true),
  ('usuario', 'ventas', true),
  ('usuario', 'entregas', true),
  ('usuario', 'cuentas-por-cobrar', true),
  ('usuario', 'produccion', true),
  ('usuario', 'bom', true),
  ('usuario', 'inventario', true),
  ('usuario', 'calidad', true);

-- Default permissions for operador
INSERT INTO public.module_permissions (role, module_key, can_access) VALUES
  ('operador', 'dashboard', true),
  ('operador', 'produccion', true),
  ('operador', 'operador', true),
  ('operador', 'calidad', true);

-- Default permissions for supervisor
INSERT INTO public.module_permissions (role, module_key, can_access) VALUES
  ('supervisor', 'dashboard', true),
  ('supervisor', 'produccion', true),
  ('supervisor', 'bom', true),
  ('supervisor', 'maquinas', true),
  ('supervisor', 'calidad', true),
  ('supervisor', 'metrologia', true),
  ('supervisor', 'mantenimiento', true),
  ('supervisor', 'inventario', true),
  ('supervisor', 'operador', true);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email), NEW.email);
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user modules
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
