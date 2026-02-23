import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============ TIPOS DESCUENTO (Catálogo) ============
export const useTiposDescuento = () =>
  useQuery({
    queryKey: ["rh_tipos_descuento"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_tipos_descuento").select("*").order("nombre");
      if (error) throw error;
      return data;
    },
  });

export const useCreateTipoDescuento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nombre: string; descripcion?: string; porcentaje_default?: number }) => {
      const { data, error } = await supabase.from("rh_tipos_descuento").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_tipos_descuento"] }); toast.success("Tipo de descuento creado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteTipoDescuento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rh_tipos_descuento").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_tipos_descuento"] }); toast.success("Tipo eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ TIPOS PRÉSTAMO (Catálogo) ============
export const useTiposPrestamo = () =>
  useQuery({
    queryKey: ["rh_tipos_prestamo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_tipos_prestamo").select("*").order("nombre");
      if (error) throw error;
      return data;
    },
  });

export const useCreateTipoPrestamo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nombre: string; descripcion?: string; tasa_interes?: number; plazo_max_quincenas?: number }) => {
      const { data, error } = await supabase.from("rh_tipos_prestamo").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_tipos_prestamo"] }); toast.success("Tipo de préstamo creado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteTipoPrestamo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rh_tipos_prestamo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_tipos_prestamo"] }); toast.success("Tipo eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ INCAPACIDADES ============
export const useIncapacidades = () =>
  useQuery({
    queryKey: ["rh_incapacidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_incapacidades").select("*, empleados(nombre)").order("fecha_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateIncapacidad = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("rh_incapacidades").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_incapacidades"] }); toast.success("Incapacidad registrada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteIncapacidad = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rh_incapacidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_incapacidades"] }); toast.success("Incapacidad eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ TIEMPO EXTRA ============
export const useTiempoExtra = () =>
  useQuery({
    queryKey: ["rh_tiempo_extra"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_tiempo_extra").select("*, empleados(nombre)").order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateTiempoExtra = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("rh_tiempo_extra").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_tiempo_extra"] }); toast.success("Tiempo extra registrado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteTiempoExtra = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rh_tiempo_extra").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_tiempo_extra"] }); toast.success("Registro eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ FALTAS ============
export const useFaltas = () =>
  useQuery({
    queryKey: ["rh_faltas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_faltas").select("*, empleados(nombre)").order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateFalta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("rh_faltas").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_faltas"] }); toast.success("Falta registrada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteFalta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rh_faltas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_faltas"] }); toast.success("Falta eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ DESCUENTOS ============
export const useDescuentos = () =>
  useQuery({
    queryKey: ["rh_descuentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_descuentos").select("*, empleados(nombre), rh_tipos_descuento(nombre)").order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateDescuento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("rh_descuentos").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_descuentos"] }); toast.success("Descuento registrado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteDescuento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rh_descuentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_descuentos"] }); toast.success("Descuento eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ VACACIONES ============
export const useVacaciones = () =>
  useQuery({
    queryKey: ["rh_vacaciones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_vacaciones").select("*, empleados(nombre)").order("fecha_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateVacaciones = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("rh_vacaciones").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_vacaciones"] }); toast.success("Vacaciones registradas"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateVacaciones = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("rh_vacaciones").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_vacaciones"] }); toast.success("Vacaciones actualizadas"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteVacaciones = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rh_vacaciones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_vacaciones"] }); toast.success("Vacaciones eliminadas"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ PRÉSTAMOS ============
export const usePrestamos = () =>
  useQuery({
    queryKey: ["rh_prestamos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_prestamos").select("*, empleados(nombre), rh_tipos_prestamo(nombre)").order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreatePrestamo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("rh_prestamos").insert({ ...values, saldo: values.monto }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_prestamos"] }); toast.success("Préstamo registrado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeletePrestamo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("rh_abonos").delete().eq("prestamo_id", id);
      const { error } = await supabase.from("rh_prestamos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_prestamos"] }); toast.success("Préstamo eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ ABONOS ============
export const useAbonos = (prestamoId?: string | null) =>
  useQuery({
    queryKey: ["rh_abonos", prestamoId],
    enabled: !!prestamoId,
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_abonos").select("*").eq("prestamo_id", prestamoId!).order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useAllAbonos = () =>
  useQuery({
    queryKey: ["rh_abonos_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_abonos").select("*, rh_prestamos(empleados(nombre))").order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateAbono = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { prestamo_id: string; monto: number; fecha?: string; notas?: string }) => {
      const { data: abono, error } = await supabase.from("rh_abonos").insert(values).select().single();
      if (error) throw error;
      // Update loan balance
      const { data: prestamo } = await supabase.from("rh_prestamos").select("saldo").eq("id", values.prestamo_id).single();
      if (prestamo) {
        const newSaldo = Math.max(0, Number(prestamo.saldo) - values.monto);
        await supabase.from("rh_prestamos").update({
          saldo: newSaldo,
          status: newSaldo <= 0 ? "liquidado" : "activo",
        }).eq("id", values.prestamo_id);
      }
      return abono;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rh_abonos"] });
      qc.invalidateQueries({ queryKey: ["rh_abonos_all"] });
      qc.invalidateQueries({ queryKey: ["rh_prestamos"] });
      toast.success("Abono registrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ PAGOS A EMPLEADOS ============
export const usePagosEmpleados = () =>
  useQuery({
    queryKey: ["rh_pagos_empleados"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rh_pagos_empleados").select("*, empleados(nombre)").order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreatePagoEmpleado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const total = Number(values.salario_base) + Number(values.tiempo_extra) - Number(values.descuentos) - Number(values.prestamos_descuento);
      const { data, error } = await supabase.from("rh_pagos_empleados").insert({ ...values, total }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_pagos_empleados"] }); toast.success("Pago registrado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeletePagoEmpleado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rh_pagos_empleados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rh_pagos_empleados"] }); toast.success("Pago eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ ESTADO DE CUENTA (computed) ============
export const useEstadoCuenta = (empleadoId?: string | null) =>
  useQuery({
    queryKey: ["rh_estado_cuenta", empleadoId],
    enabled: !!empleadoId,
    queryFn: async () => {
      const [pagos, descuentos, prestamos, tiempoExtra, faltas] = await Promise.all([
        supabase.from("rh_pagos_empleados").select("*").eq("empleado_id", empleadoId!).order("fecha", { ascending: false }),
        supabase.from("rh_descuentos").select("*, rh_tipos_descuento(nombre)").eq("empleado_id", empleadoId!).order("fecha", { ascending: false }),
        supabase.from("rh_prestamos").select("*, rh_tipos_prestamo(nombre)").eq("empleado_id", empleadoId!).order("fecha", { ascending: false }),
        supabase.from("rh_tiempo_extra").select("*").eq("empleado_id", empleadoId!).order("fecha", { ascending: false }),
        supabase.from("rh_faltas").select("*").eq("empleado_id", empleadoId!).order("fecha", { ascending: false }),
      ]);
      return {
        pagos: pagos.data || [],
        descuentos: descuentos.data || [],
        prestamos: prestamos.data || [],
        tiempoExtra: tiempoExtra.data || [],
        faltas: faltas.data || [],
      };
    },
  });
