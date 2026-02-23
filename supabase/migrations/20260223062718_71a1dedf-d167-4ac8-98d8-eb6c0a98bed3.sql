
-- Add new columns to empleados for expanded registration form
ALTER TABLE public.empleados
  ADD COLUMN IF NOT EXISTS apellido_paterno text,
  ADD COLUMN IF NOT EXISTS apellido_materno text,
  ADD COLUMN IF NOT EXISTS enfermedades text,
  ADD COLUMN IF NOT EXISTS alergias text,
  ADD COLUMN IF NOT EXISTS calle text,
  ADD COLUMN IF NOT EXISTS numero_exterior text,
  ADD COLUMN IF NOT EXISTS colonia text,
  ADD COLUMN IF NOT EXISTS codigo_postal text,
  ADD COLUMN IF NOT EXISTS estado_dir text,
  ADD COLUMN IF NOT EXISTS municipio text,
  ADD COLUMN IF NOT EXISTS pais text DEFAULT 'México',
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS numero_empleado text,
  ADD COLUMN IF NOT EXISTS sucursal text,
  ADD COLUMN IF NOT EXISTS tipo_empleado text DEFAULT 'operador',
  ADD COLUMN IF NOT EXISTS sueldo_base_semanal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dias_laborales_semana integer DEFAULT 6,
  ADD COLUMN IF NOT EXISTS aguinaldo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imss_descuento numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS infonavit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fonacot numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retencion_impuestos numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documentos jsonb DEFAULT '{}';

-- Create storage bucket for employee photos and documents
INSERT INTO storage.buckets (id, name, public) VALUES ('empleados', 'empleados', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read empleados bucket" ON storage.objects FOR SELECT USING (bucket_id = 'empleados');
CREATE POLICY "Public insert empleados bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'empleados');
CREATE POLICY "Public update empleados bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'empleados');
CREATE POLICY "Public delete empleados bucket" ON storage.objects FOR DELETE USING (bucket_id = 'empleados');
