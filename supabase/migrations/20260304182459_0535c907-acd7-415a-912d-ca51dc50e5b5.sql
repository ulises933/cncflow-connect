
-- Sequence for cuentas por cobrar
CREATE SEQUENCE IF NOT EXISTS cxc_seq START 1;

-- Cuentas por cobrar
CREATE TABLE public.cuentas_por_cobrar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio text NOT NULL DEFAULT ('CXC-' || lpad((nextval('cxc_seq'))::text, 3, '0')),
  cotizacion_id uuid REFERENCES public.cotizaciones(id),
  cliente_id uuid REFERENCES public.clientes(id),
  monto numeric NOT NULL DEFAULT 0,
  saldo numeric NOT NULL DEFAULT 0,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  status text NOT NULL DEFAULT 'pendiente',
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cuentas_por_cobrar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.cuentas_por_cobrar FOR ALL USING (true) WITH CHECK (true);

-- Sequence for cobros
CREATE SEQUENCE IF NOT EXISTS cobro_seq START 1;

-- Cobros (pagos recibidos)
CREATE TABLE public.cobros (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio text NOT NULL DEFAULT ('COB-' || lpad((nextval('cobro_seq'))::text, 3, '0')),
  cuenta_por_cobrar_id uuid NOT NULL REFERENCES public.cuentas_por_cobrar(id) ON DELETE CASCADE,
  monto numeric NOT NULL DEFAULT 0,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago text NOT NULL DEFAULT 'transferencia',
  referencia text,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.cobros FOR ALL USING (true) WITH CHECK (true);

-- Add entregado column to cotizaciones
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS entregado boolean DEFAULT false;

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cuentas_por_cobrar;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cobros;
