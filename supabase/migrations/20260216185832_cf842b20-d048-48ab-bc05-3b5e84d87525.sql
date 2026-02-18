
-- Table for process route templates on products (from inventory)
CREATE TABLE public.producto_procesos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'maquinado',
  tiempo_estimado_hrs NUMERIC NOT NULL DEFAULT 0,
  maquina_id UUID REFERENCES public.maquinas(id) ON DELETE SET NULL,
  orden_secuencia INTEGER NOT NULL DEFAULT 1,
  herramienta TEXT,
  programa_cnc TEXT,
  fixture TEXT,
  rpm INTEGER DEFAULT 0,
  velocidad_corte NUMERIC DEFAULT 0,
  profundidad_corte NUMERIC DEFAULT 0,
  refrigerante TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.producto_procesos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.producto_procesos FOR ALL USING (true) WITH CHECK (true);

-- Add categoria_material to inventario for segmentation
ALTER TABLE public.inventario ADD COLUMN IF NOT EXISTS categoria_material TEXT DEFAULT 'general';

-- Index for fast lookups
CREATE INDEX idx_producto_procesos_producto_id ON public.producto_procesos(producto_id);
