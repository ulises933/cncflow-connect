
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
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users full access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Authenticated read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Authenticated insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "Authenticated update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "Authenticated delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)', t);
  END LOOP;
END$$;
