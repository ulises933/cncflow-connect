
-- Add Odoo-style fields to inventario
ALTER TABLE public.inventario 
  ADD COLUMN IF NOT EXISTS es_fabricable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ruta text NOT NULL DEFAULT 'comprar',
  ADD COLUMN IF NOT EXISTS puede_vender boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'general';

-- Create BOM table for inventory products (links product -> materials)
CREATE TABLE public.inventario_bom (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id uuid NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.inventario(id) ON DELETE RESTRICT,
  cantidad numeric NOT NULL DEFAULT 1,
  unidad text NOT NULL DEFAULT 'pza',
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventario_bom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access" ON public.inventario_bom FOR ALL USING (true) WITH CHECK (true);

-- Add inventario_id reference to cotizacion_items for product linking
ALTER TABLE public.cotizacion_items 
  ADD COLUMN IF NOT EXISTS inventario_id uuid REFERENCES public.inventario(id);
