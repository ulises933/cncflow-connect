
CREATE SEQUENCE IF NOT EXISTS entrega_seq START 1;

CREATE TABLE public.entregas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio text NOT NULL DEFAULT ('ENT-' || lpad(nextval('entrega_seq')::text, 3, '0')),
  orden_id uuid REFERENCES public.ordenes_produccion(id),
  cotizacion_id uuid REFERENCES public.cotizaciones(id),
  cliente_id uuid REFERENCES public.clientes(id),
  producto text NOT NULL,
  cantidad_ordenada integer NOT NULL DEFAULT 0,
  cantidad_entregada integer NOT NULL DEFAULT 0,
  fecha_entrega date NOT NULL DEFAULT CURRENT_DATE,
  recibio text,
  notas text,
  status text NOT NULL DEFAULT 'pendiente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access" ON public.entregas FOR ALL USING (true) WITH CHECK (true);
