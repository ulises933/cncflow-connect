
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'bom','bom_items','calibraciones','clientes','cobros','cotizacion_items','cotizaciones',
    'cuentas_por_cobrar','cuentas_por_pagar','empleados','entregas','especificaciones_gdt',
    'gastos','inspecciones_calidad','instrumentos_medicion','inventario','inventario_bom',
    'mantenimiento','maquinas','ordenes_compra','ordenes_compra_items','ordenes_produccion',
    'pagos_proveedores','procesos_produccion','producto_procesos','proveedores',
    'registros_produccion','reportes_dimensionales','rh_abonos','rh_descuentos','rh_faltas',
    'rh_incapacidades','rh_pagos_empleados','rh_prestamos','rh_tiempo_extra',
    'rh_tipos_descuento','rh_tipos_prestamo','rh_vacaciones'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS public_access ON public.%I', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY "Authenticated users full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END$$;

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_modules(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_modules(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

ALTER PUBLICATION supabase_realtime DROP TABLE public.cobros;
ALTER PUBLICATION supabase_realtime DROP TABLE public.cuentas_por_cobrar;
