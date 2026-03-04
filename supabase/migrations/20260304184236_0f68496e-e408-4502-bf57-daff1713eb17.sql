
ALTER TABLE public.inventario ADD COLUMN IF NOT EXISTS documentos_tecnicos text[] DEFAULT '{}'::text[];
