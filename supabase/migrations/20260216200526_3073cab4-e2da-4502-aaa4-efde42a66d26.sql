
-- Add production description and quantity fields to procesos_produccion
ALTER TABLE public.procesos_produccion 
  ADD COLUMN IF NOT EXISTS descripcion_produccion text,
  ADD COLUMN IF NOT EXISTS cantidad_requerida integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cantidad_producida integer DEFAULT 0;
