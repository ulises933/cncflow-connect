
-- Tipos de descuento (catálogo)
CREATE TABLE public.rh_tipos_descuento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  porcentaje_default NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_tipos_descuento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_tipos_descuento FOR ALL USING (true) WITH CHECK (true);

-- Tipos de préstamo (catálogo)
CREATE TABLE public.rh_tipos_prestamo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tasa_interes NUMERIC DEFAULT 0,
  plazo_max_quincenas INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_tipos_prestamo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_tipos_prestamo FOR ALL USING (true) WITH CHECK (true);

-- Incapacidades
CREATE TABLE public.rh_incapacidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  dias INTEGER NOT NULL DEFAULT 1,
  tipo TEXT NOT NULL DEFAULT 'enfermedad', -- enfermedad, accidente_trabajo, maternidad
  folio_imss TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_incapacidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_incapacidades FOR ALL USING (true) WITH CHECK (true);

-- Tiempo extra
CREATE TABLE public.rh_tiempo_extra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  horas NUMERIC NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'doble', -- doble, triple
  monto NUMERIC NOT NULL DEFAULT 0,
  autorizado_por TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_tiempo_extra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_tiempo_extra FOR ALL USING (true) WITH CHECK (true);

-- Faltas
CREATE TABLE public.rh_faltas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL DEFAULT 'injustificada', -- justificada, injustificada, permiso
  motivo TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_faltas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_faltas FOR ALL USING (true) WITH CHECK (true);

-- Descuentos
CREATE TABLE public.rh_descuentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  tipo_descuento_id UUID REFERENCES public.rh_tipos_descuento(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto NUMERIC NOT NULL DEFAULT 0,
  descripcion TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_descuentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_descuentos FOR ALL USING (true) WITH CHECK (true);

-- Vacaciones
CREATE TABLE public.rh_vacaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pendiente', -- pendiente, aprobada, rechazada, tomada
  aprobado_por TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_vacaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_vacaciones FOR ALL USING (true) WITH CHECK (true);

-- Préstamos
CREATE TABLE public.rh_prestamos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  tipo_prestamo_id UUID REFERENCES public.rh_tipos_prestamo(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto NUMERIC NOT NULL DEFAULT 0,
  saldo NUMERIC NOT NULL DEFAULT 0,
  plazo_quincenas INTEGER NOT NULL DEFAULT 12,
  abono_quincenal NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'activo', -- activo, liquidado
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_prestamos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_prestamos FOR ALL USING (true) WITH CHECK (true);

-- Abonos (pagos a préstamos)
CREATE TABLE public.rh_abonos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id UUID NOT NULL REFERENCES public.rh_prestamos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_abonos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_abonos FOR ALL USING (true) WITH CHECK (true);

-- Pagos a empleados
CREATE TABLE public.rh_pagos_empleados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  periodo TEXT NOT NULL DEFAULT 'quincenal', -- semanal, quincenal, mensual
  salario_base NUMERIC NOT NULL DEFAULT 0,
  tiempo_extra NUMERIC NOT NULL DEFAULT 0,
  descuentos NUMERIC NOT NULL DEFAULT 0,
  prestamos_descuento NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_pagos_empleados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON public.rh_pagos_empleados FOR ALL USING (true) WITH CHECK (true);
