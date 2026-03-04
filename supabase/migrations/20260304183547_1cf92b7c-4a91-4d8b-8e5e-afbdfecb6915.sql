
-- Add categoria to proveedores
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'general';

-- Create cuentas_por_pagar table
CREATE SEQUENCE IF NOT EXISTS cxp_seq START 1;

CREATE TABLE public.cuentas_por_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL DEFAULT ('CXP-' || lpad(nextval('cxp_seq')::text, 3, '0')),
  orden_compra_id uuid REFERENCES public.ordenes_compra(id),
  proveedor_id uuid REFERENCES public.proveedores(id),
  monto numeric NOT NULL DEFAULT 0,
  saldo numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendiente',
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cuentas_por_pagar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.cuentas_por_pagar FOR ALL USING (true) WITH CHECK (true);

-- Create pagos_proveedores table
CREATE SEQUENCE IF NOT EXISTS pago_prov_seq START 1;

CREATE TABLE public.pagos_proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL DEFAULT ('PAG-' || lpad(nextval('pago_prov_seq')::text, 3, '0')),
  cuenta_por_pagar_id uuid NOT NULL REFERENCES public.cuentas_por_pagar(id),
  monto numeric NOT NULL DEFAULT 0,
  metodo_pago text NOT NULL DEFAULT 'transferencia',
  referencia text,
  notas text,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pagos_proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.pagos_proveedores FOR ALL USING (true) WITH CHECK (true);

-- Add confirmed status to ordenes_compra if needed
-- OC status: pendiente, ordenado, recibido, parcial -> add "confirmada"
