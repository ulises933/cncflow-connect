
-- Add cantidad_recibida to track partial deliveries per item
ALTER TABLE public.ordenes_compra_items 
  ADD COLUMN IF NOT EXISTS cantidad_recibida numeric NOT NULL DEFAULT 0;
