
-- SEQUENCES first
CREATE SEQUENCE IF NOT EXISTS cotizacion_seq START 1;
CREATE SEQUENCE IF NOT EXISTS op_seq START 1;
CREATE SEQUENCE IF NOT EXISTS bom_seq START 1;
CREATE SEQUENCE IF NOT EXISTS oc_seq START 1;

-- UPDATE TIMESTAMP FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CLIENTES
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  contacto TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COTIZACIONES
CREATE TABLE public.cotizaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT NOT NULL DEFAULT 'COT-' || LPAD(nextval('cotizacion_seq')::text, 3, '0'),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'borrador',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  margen_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 30,
  iva NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COTIZACION ITEMS
CREATE TABLE public.cotizacion_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  material TEXT,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  unidad TEXT NOT NULL DEFAULT 'pza',
  costo_material NUMERIC(12,2) NOT NULL DEFAULT 0,
  tiempo_estimado_hrs NUMERIC(8,2) NOT NULL DEFAULT 0,
  costo_hora_maquina NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MAQUINAS
CREATE TABLE public.maquinas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'CNC',
  status TEXT NOT NULL DEFAULT 'activa',
  horas_trabajadas NUMERIC(10,2) NOT NULL DEFAULT 0,
  oee_disponibilidad NUMERIC(5,2) NOT NULL DEFAULT 100,
  oee_rendimiento NUMERIC(5,2) NOT NULL DEFAULT 100,
  oee_calidad NUMERIC(5,2) NOT NULL DEFAULT 100,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORDENES DE PRODUCCION
CREATE TABLE public.ordenes_produccion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT NOT NULL DEFAULT 'OP-' || LPAD(nextval('op_seq')::text, 3, '0'),
  cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  producto TEXT NOT NULL,
  cantidad_requerida INTEGER NOT NULL DEFAULT 0,
  cantidad_producida INTEGER NOT NULL DEFAULT 0,
  cantidad_scrap INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente',
  fecha_inicio DATE,
  fecha_entrega DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROCESOS DE PRODUCCION
CREATE TABLE public.procesos_produccion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes_produccion(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'maquinado',
  tiempo_estimado_hrs NUMERIC(8,2) NOT NULL DEFAULT 0,
  maquina_id UUID REFERENCES public.maquinas(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  orden_secuencia INTEGER NOT NULL DEFAULT 1,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BOM
CREATE TABLE public.bom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT NOT NULL DEFAULT 'BOM-' || LPAD(nextval('bom_seq')::text, 3, '0'),
  producto TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
  orden_id UUID REFERENCES public.ordenes_produccion(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'borrador',
  costo_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BOM ITEMS
CREATE TABLE public.bom_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bom_id UUID NOT NULL REFERENCES public.bom(id) ON DELETE CASCADE,
  material TEXT NOT NULL,
  descripcion TEXT,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  unidad TEXT NOT NULL DEFAULT 'pza',
  costo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  costo_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROVEEDORES
CREATE TABLE public.proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  contacto TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORDENES DE COMPRA
CREATE TABLE public.ordenes_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT NOT NULL DEFAULT 'OC-' || LPAD(nextval('oc_seq')::text, 3, '0'),
  proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
  bom_id UUID REFERENCES public.bom(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORDENES DE COMPRA ITEMS
CREATE TABLE public.ordenes_compra_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_compra_id UUID NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  material TEXT NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  unidad TEXT NOT NULL DEFAULT 'pza',
  precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INVENTARIO
CREATE TABLE public.inventario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'materia_prima',
  stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'pza',
  stock_minimo NUMERIC(12,2) NOT NULL DEFAULT 0,
  costo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REGISTROS DE PRODUCCION
CREATE TABLE public.registros_produccion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID REFERENCES public.ordenes_produccion(id) ON DELETE SET NULL,
  proceso_id UUID REFERENCES public.procesos_produccion(id) ON DELETE SET NULL,
  maquina_id UUID REFERENCES public.maquinas(id) ON DELETE SET NULL,
  operador_nombre TEXT NOT NULL,
  turno TEXT NOT NULL DEFAULT 'matutino',
  piezas_producidas INTEGER NOT NULL DEFAULT 0,
  piezas_scrap INTEGER NOT NULL DEFAULT 0,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio TIMESTAMPTZ,
  hora_fin TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'en_proceso',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MANTENIMIENTO
CREATE TABLE public.mantenimiento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maquina_id UUID NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'preventivo',
  descripcion TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'programado',
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  costo NUMERIC(12,2) NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INSPECCIONES DE CALIDAD
CREATE TABLE public.inspecciones_calidad (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID REFERENCES public.ordenes_produccion(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'primera_pieza',
  producto TEXT,
  operador TEXT,
  maquina TEXT,
  turno TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  piezas_fabricadas INTEGER NOT NULL DEFAULT 0,
  piezas_scrap INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  tolerancias JSONB DEFAULT '[]'::jsonb,
  caracteristicas JSONB DEFAULT '[]'::jsonb,
  archivos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EMPLEADOS
CREATE TABLE public.empleados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  puesto TEXT NOT NULL,
  turno TEXT NOT NULL DEFAULT 'matutino',
  maquina_id UUID REFERENCES public.maquinas(id) ON DELETE SET NULL,
  email TEXT,
  telefono TEXT,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GASTOS
CREATE TABLE public.gastos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  proveedor TEXT,
  monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  orden_ref TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TRIGGERS for updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cotizaciones_updated_at BEFORE UPDATE ON public.cotizaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maquinas_updated_at BEFORE UPDATE ON public.maquinas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ordenes_produccion_updated_at BEFORE UPDATE ON public.ordenes_produccion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_procesos_produccion_updated_at BEFORE UPDATE ON public.procesos_produccion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bom_updated_at BEFORE UPDATE ON public.bom FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON public.proveedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ordenes_compra_updated_at BEFORE UPDATE ON public.ordenes_compra FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventario_updated_at BEFORE UPDATE ON public.inventario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mantenimiento_updated_at BEFORE UPDATE ON public.mantenimiento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspecciones_calidad_updated_at BEFORE UPDATE ON public.inspecciones_calidad FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON public.empleados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS + public policies
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procesos_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspecciones_calidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.cotizaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.cotizacion_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.maquinas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.ordenes_produccion FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.procesos_produccion FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.bom FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.bom_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.proveedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.ordenes_compra FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.ordenes_compra_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.inventario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.registros_produccion FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.mantenimiento FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.inspecciones_calidad FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.empleados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON public.gastos FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for quality files
INSERT INTO storage.buckets (id, name, public) VALUES ('quality-files', 'quality-files', true);
CREATE POLICY "quality_files_read" ON storage.objects FOR SELECT USING (bucket_id = 'quality-files');
CREATE POLICY "quality_files_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'quality-files');
CREATE POLICY "quality_files_delete" ON storage.objects FOR DELETE USING (bucket_id = 'quality-files');
