-- Create roles catalog table
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage roles" ON public.roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read roles" ON public.roles FOR SELECT TO authenticated USING (true);

-- Seed existing roles
INSERT INTO public.roles (nombre, descripcion) VALUES
  ('admin', 'Administrador del sistema'),
  ('usuario', 'Usuario general'),
  ('operador', 'Operador de máquinas'),
  ('supervisor', 'Supervisor de producción');
