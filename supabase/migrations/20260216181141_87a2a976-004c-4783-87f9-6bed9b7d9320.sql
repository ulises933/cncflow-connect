
-- ============================================
-- PROFESSIONAL CNC ERP UPGRADE - MORE DATA FIELDS
-- ============================================

-- === CLIENTES: Add professional CRM fields ===
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS rfc text,
  ADD COLUMN IF NOT EXISTS razon_social text,
  ADD COLUMN IF NOT EXISTS condiciones_pago text DEFAULT '30 días',
  ADD COLUMN IF NOT EXISTS limite_credito numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'MXN',
  ADD COLUMN IF NOT EXISTS industria text,
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'nacional',
  ADD COLUMN IF NOT EXISTS sitio_web text,
  ADD COLUMN IF NOT EXISTS codigo_postal text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS pais text DEFAULT 'México';

-- === COTIZACION ITEMS: Add engineering fields ===
ALTER TABLE public.cotizacion_items
  ADD COLUMN IF NOT EXISTS numero_parte text,
  ADD COLUMN IF NOT EXISTS numero_plano text,
  ADD COLUMN IF NOT EXISTS revision_plano text DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS material_grado text,
  ADD COLUMN IF NOT EXISTS acabado_superficial text,
  ADD COLUMN IF NOT EXISTS tratamiento_termico text,
  ADD COLUMN IF NOT EXISTS recubrimiento text,
  ADD COLUMN IF NOT EXISTS tolerancia_general text,
  ADD COLUMN IF NOT EXISTS peso_unitario numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dimensiones_brutas text,
  ADD COLUMN IF NOT EXISTS requiere_certificado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notas text;

-- === COTIZACIONES: Add commercial fields ===
ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'MXN',
  ADD COLUMN IF NOT EXISTS tipo_cambio numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS condiciones_pago text DEFAULT '30 días',
  ADD COLUMN IF NOT EXISTS vigencia_dias integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS tiempo_entrega_dias integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS vendedor text,
  ADD COLUMN IF NOT EXISTS requiere_anticipo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS porcentaje_anticipo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contacto_cliente text,
  ADD COLUMN IF NOT EXISTS referencia_cliente text;

-- === ORDENES PRODUCCION: Add manufacturing fields ===
ALTER TABLE public.ordenes_produccion
  ADD COLUMN IF NOT EXISTS prioridad text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS numero_plano text,
  ADD COLUMN IF NOT EXISTS revision_plano text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS material_grado text,
  ADD COLUMN IF NOT EXISTS tratamiento_termico text,
  ADD COLUMN IF NOT EXISTS acabado_superficial text,
  ADD COLUMN IF NOT EXISTS peso_unitario numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiempo_estimado_total_hrs numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_estimado numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_real numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requiere_certificado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_serie_inicio text,
  ADD COLUMN IF NOT EXISTS lote text;

-- === MAQUINAS: Add professional machine data ===
ALTER TABLE public.maquinas
  ADD COLUMN IF NOT EXISTS marca text,
  ADD COLUMN IF NOT EXISTS modelo text,
  ADD COLUMN IF NOT EXISTS anio integer,
  ADD COLUMN IF NOT EXISTS numero_serie text,
  ADD COLUMN IF NOT EXISTS potencia_hp numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recorrido_x numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recorrido_y numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recorrido_z numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rpm_max integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precision_mm numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS control text,
  ADD COLUMN IF NOT EXISTS numero_ejes integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS ubicacion text,
  ADD COLUMN IF NOT EXISTS fecha_compra date,
  ADD COLUMN IF NOT EXISTS costo_hora numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_mantenimiento date;

-- === EMPLEADOS: Add HR professional fields ===
ALTER TABLE public.empleados
  ADD COLUMN IF NOT EXISTS curp text,
  ADD COLUMN IF NOT EXISTS rfc text,
  ADD COLUMN IF NOT EXISTS nss text,
  ADD COLUMN IF NOT EXISTS salario_mensual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS departamento text DEFAULT 'producción',
  ADD COLUMN IF NOT EXISTS tipo_contrato text DEFAULT 'planta',
  ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS contacto_emergencia text,
  ADD COLUMN IF NOT EXISTS telefono_emergencia text,
  ADD COLUMN IF NOT EXISTS certificaciones jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS capacitaciones jsonb DEFAULT '[]'::jsonb;

-- === INVENTARIO: Add traceability fields ===
ALTER TABLE public.inventario
  ADD COLUMN IF NOT EXISTS ubicacion text DEFAULT 'Almacén General',
  ADD COLUMN IF NOT EXISTS lote text,
  ADD COLUMN IF NOT EXISTS proveedor_preferido text,
  ADD COLUMN IF NOT EXISTS lead_time_dias integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certificado_material text,
  ADD COLUMN IF NOT EXISTS especificacion text,
  ADD COLUMN IF NOT EXISTS fecha_ultima_entrada date,
  ADD COLUMN IF NOT EXISTS fecha_ultima_salida date;

-- === BOM ITEMS: Add sourcing fields ===
ALTER TABLE public.bom_items
  ADD COLUMN IF NOT EXISTS numero_parte text,
  ADD COLUMN IF NOT EXISTS proveedor_preferido text,
  ADD COLUMN IF NOT EXISTS lead_time_dias integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS peso_unitario numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS especificacion text;

-- === PROCESOS PRODUCCION: Add detailed process fields ===
ALTER TABLE public.procesos_produccion
  ADD COLUMN IF NOT EXISTS herramienta text,
  ADD COLUMN IF NOT EXISTS programa_cnc text,
  ADD COLUMN IF NOT EXISTS velocidad_corte numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profundidad_corte numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rpm integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refrigerante text,
  ADD COLUMN IF NOT EXISTS fixture text;

-- === REGISTROS PRODUCCION: Add detailed tracking ===
ALTER TABLE public.registros_produccion
  ADD COLUMN IF NOT EXISTS tiempo_setup_min numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiempo_paro_min numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motivo_paro text,
  ADD COLUMN IF NOT EXISTS programa_cnc text,
  ADD COLUMN IF NOT EXISTS herramienta text;

-- === INSPECCIONES CALIDAD: Add more metrology fields ===
ALTER TABLE public.inspecciones_calidad
  ADD COLUMN IF NOT EXISTS instrumento_medicion text,
  ADD COLUMN IF NOT EXISTS numero_plano text,
  ADD COLUMN IF NOT EXISTS revision_plano text,
  ADD COLUMN IF NOT EXISTS disposicion text DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS lote text,
  ADD COLUMN IF NOT EXISTS numero_certificado text;

-- ============================================
-- NEW MODULE: METROLOGIA
-- ============================================

-- Instruments table
CREATE TABLE IF NOT EXISTS public.instrumentos_medicion (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'calibrador',
  marca text,
  modelo text,
  numero_serie text,
  rango_medicion text,
  resolucion text,
  exactitud text,
  ubicacion text DEFAULT 'Laboratorio',
  status text NOT NULL DEFAULT 'activo',
  fecha_compra date,
  costo numeric DEFAULT 0,
  proveedor text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.instrumentos_medicion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.instrumentos_medicion FOR ALL USING (true) WITH CHECK (true);

-- Calibrations table
CREATE TABLE IF NOT EXISTS public.calibraciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instrumento_id uuid NOT NULL REFERENCES public.instrumentos_medicion(id) ON DELETE CASCADE,
  fecha_calibracion date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date NOT NULL,
  certificado_numero text,
  laboratorio text,
  resultado text NOT NULL DEFAULT 'aprobado',
  desviacion_encontrada text,
  ajuste_realizado boolean DEFAULT false,
  incertidumbre text,
  patron_referencia text,
  calibrado_por text,
  costo numeric DEFAULT 0,
  archivos text[] DEFAULT '{}',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calibraciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.calibraciones FOR ALL USING (true) WITH CHECK (true);

-- Dimensional Reports (reportes dimensionales)
CREATE TABLE IF NOT EXISTS public.reportes_dimensionales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspeccion_id uuid REFERENCES public.inspecciones_calidad(id),
  orden_id uuid REFERENCES public.ordenes_produccion(id),
  numero_plano text,
  revision_plano text,
  producto text,
  operador text,
  instrumento_id uuid REFERENCES public.instrumentos_medicion(id),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  lote text,
  pieza_numero integer DEFAULT 1,
  mediciones jsonb DEFAULT '[]'::jsonb,
  resultado_general text NOT NULL DEFAULT 'pendiente',
  notas text,
  archivos text[] DEFAULT '{}',
  aprobado_por text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reportes_dimensionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.reportes_dimensionales FOR ALL USING (true) WITH CHECK (true);

-- GD&T Standards table
CREATE TABLE IF NOT EXISTS public.especificaciones_gdt (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id uuid REFERENCES public.ordenes_produccion(id),
  numero_plano text NOT NULL,
  revision text DEFAULT 'A',
  caracteristica text NOT NULL,
  tipo_tolerancia text NOT NULL,
  simbolo_gdt text,
  zona_tolerancia numeric,
  datum text,
  valor_nominal numeric,
  tolerancia_superior numeric,
  tolerancia_inferior numeric,
  unidad text DEFAULT 'mm',
  critica boolean DEFAULT false,
  metodo_medicion text,
  instrumento_requerido text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.especificaciones_gdt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.especificaciones_gdt FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_instrumentos_updated_at BEFORE UPDATE ON public.instrumentos_medicion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reportes_dim_updated_at BEFORE UPDATE ON public.reportes_dimensionales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
