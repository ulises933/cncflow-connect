
-- Add recurrence fields to mantenimiento
ALTER TABLE public.mantenimiento 
  ADD COLUMN IF NOT EXISTS frecuencia text DEFAULT 'unica',
  ADD COLUMN IF NOT EXISTS proxima_fecha date DEFAULT NULL;

-- frecuencia values: unica, semanal, quincenal, mensual, trimestral, semestral, anual
