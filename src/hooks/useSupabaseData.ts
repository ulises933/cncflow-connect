import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============ CLIENTES ============
export const useClientes = () =>
  useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateCliente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nombre: string; contacto?: string; email?: string; telefono?: string; direccion?: string; notas?: string }) => {
      const { data, error } = await supabase.from("clientes").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clientes"] }); toast.success("Cliente creado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateCliente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; nombre?: string; contacto?: string; email?: string; telefono?: string; direccion?: string; notas?: string }) => {
      const { error } = await supabase.from("clientes").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clientes"] }); toast.success("Cliente actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteCliente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clientes"] }); toast.success("Cliente eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ COTIZACIONES ============
export const useCotizaciones = () =>
  useQuery({
    queryKey: ["cotizaciones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cotizaciones").select("*, clientes(nombre)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCotizacion = (id: string | null) =>
  useQuery({
    queryKey: ["cotizacion", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("cotizaciones").select("*, clientes(nombre), cotizacion_items(*)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

export const useCreateCotizacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { cliente_id?: string; titulo: string; margen_porcentaje?: number; notas?: string }) => {
      const { data, error } = await supabase.from("cotizaciones").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cotizaciones"] }); toast.success("Cotización creada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateCotizacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("cotizaciones").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cotizaciones"] });
      qc.invalidateQueries({ queryKey: ["cotizacion", vars.id] });
      toast.success("Cotización actualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteCotizacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("cotizacion_items").delete().eq("cotizacion_id", id);
      const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cotizaciones"] }); toast.success("Cotización eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ COTIZACION ITEMS ============
export const useCreateCotizacionItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { cotizacion_id: string; descripcion: string; material?: string; cantidad?: number; unidad?: string; costo_material?: number; tiempo_estimado_hrs?: number; costo_hora_maquina?: number; subtotal?: number; inventario_id?: string }) => {
      const { data, error } = await supabase.from("cotizacion_items").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["cotizacion", vars.cotizacion_id] }); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteCotizacionItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cotizacion_id }: { id: string; cotizacion_id: string }) => {
      const { error } = await supabase.from("cotizacion_items").delete().eq("id", id);
      if (error) throw error;
      return cotizacion_id;
    },
    onSuccess: (cotizacion_id) => { qc.invalidateQueries({ queryKey: ["cotizacion", cotizacion_id] }); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ MAQUINAS ============
export const useMaquinas = () =>
  useQuery({
    queryKey: ["maquinas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("maquinas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateMaquina = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nombre: string; tipo?: string; status?: string; notas?: string }) => {
      const { data, error } = await supabase.from("maquinas").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["maquinas"] }); toast.success("Máquina creada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateMaquina = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("maquinas").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["maquinas"] }); toast.success("Máquina actualizada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteMaquina = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maquinas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["maquinas"] }); toast.success("Máquina eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ ORDENES DE PRODUCCION ============
export const useOrdenesProduccion = () =>
  useQuery({
    queryKey: ["ordenes_produccion"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ordenes_produccion").select("*, clientes(nombre), cotizaciones(folio)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateOrdenProduccion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { folio?: string; cotizacion_id?: string; cliente_id?: string; producto: string; cantidad_requerida: number; fecha_inicio?: string; fecha_entrega?: string; notas?: string; tiempo_estimado_total_hrs?: number }) => {
      const { data, error } = await supabase.from("ordenes_produccion").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordenes_produccion"] }); toast.success("Orden de producción creada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateOrdenProduccion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("ordenes_produccion").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordenes_produccion"] }); toast.success("Orden actualizada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteOrdenProduccion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("procesos_produccion").delete().eq("orden_id", id);
      await supabase.from("registros_produccion").delete().eq("orden_id", id);
      const { error } = await supabase.from("ordenes_produccion").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordenes_produccion"] }); toast.success("Orden eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ PROCESOS DE PRODUCCION ============
export const useProcesos = (ordenId?: string) =>
  useQuery({
    queryKey: ["procesos", ordenId],
    enabled: !!ordenId,
    queryFn: async () => {
      const { data, error } = await supabase.from("procesos_produccion").select("*, maquinas(nombre)").eq("orden_id", ordenId!).order("orden_secuencia");
      if (error) throw error;
      return data;
    },
  });

export const useCreateProceso = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { orden_id: string; nombre: string; tipo?: string; tiempo_estimado_hrs?: number; maquina_id?: string | null; orden_secuencia?: number; herramienta?: string; programa_cnc?: string; fixture?: string; rpm?: number; velocidad_corte?: number; profundidad_corte?: number; refrigerante?: string; notas?: string }) => {
      const { data, error } = await supabase.from("procesos_produccion").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["procesos", vars.orden_id] }); toast.success("Proceso agregado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateProceso = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; orden_id?: string; [key: string]: any }) => {
      const { error } = await supabase.from("procesos_produccion").update(values).eq("id", id);
      if (error) throw error;
      return values.orden_id;
    },
    onSuccess: (ordenId) => { if (ordenId) qc.invalidateQueries({ queryKey: ["procesos", ordenId] }); toast.success("Proceso actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteProceso = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orden_id }: { id: string; orden_id: string }) => {
      const { error } = await supabase.from("procesos_produccion").delete().eq("id", id);
      if (error) throw error;
      return orden_id;
    },
    onSuccess: (ordenId) => { qc.invalidateQueries({ queryKey: ["procesos", ordenId] }); toast.success("Proceso eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ BOM ============
export const useBoms = () =>
  useQuery({
    queryKey: ["bom"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bom").select("*, cotizaciones(folio), ordenes_produccion(folio)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useBom = (id: string | null) =>
  useQuery({
    queryKey: ["bom", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("bom").select("*, bom_items(*), cotizaciones(folio), ordenes_produccion(folio)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

export const useCreateBom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { producto: string; version?: string; cotizacion_id?: string; orden_id?: string; status?: string; costo_total?: number }) => {
      const { data, error } = await supabase.from("bom").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bom"] }); toast.success("BOM creado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateBom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("bom").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["bom"] }); qc.invalidateQueries({ queryKey: ["bom", vars.id] }); toast.success("BOM actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useCreateBomItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { bom_id: string; material: string; descripcion?: string; cantidad?: number; unidad?: string; costo_unitario?: number; costo_total?: number }) => {
      const { data, error } = await supabase.from("bom_items").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["bom", vars.bom_id] }); qc.invalidateQueries({ queryKey: ["bom"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteBomItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bom_id }: { id: string; bom_id: string }) => {
      const { error } = await supabase.from("bom_items").delete().eq("id", id);
      if (error) throw error;
      return bom_id;
    },
    onSuccess: (bom_id) => { qc.invalidateQueries({ queryKey: ["bom", bom_id] }); qc.invalidateQueries({ queryKey: ["bom"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ PROVEEDORES ============
export const useProveedores = () =>
  useQuery({
    queryKey: ["proveedores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("proveedores").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateProveedor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nombre: string; contacto?: string; email?: string; telefono?: string; direccion?: string; notas?: string }) => {
      const { data, error } = await supabase.from("proveedores").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proveedores"] }); toast.success("Proveedor creado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ ORDENES DE COMPRA ============
export const useOrdenesCompra = () =>
  useQuery({
    queryKey: ["ordenes_compra"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ordenes_compra").select("*, proveedores(nombre), bom(folio)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useOrdenCompra = (id: string | null) =>
  useQuery({
    queryKey: ["orden_compra", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("ordenes_compra").select("*, proveedores(nombre), bom(folio), ordenes_compra_items(*)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

export const useCreateOrdenCompra = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { proveedor_id?: string; bom_id?: string; total?: number; notas?: string }) => {
      const { data, error } = await supabase.from("ordenes_compra").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordenes_compra"] }); toast.success("Orden de compra creada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateOrdenCompra = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("ordenes_compra").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["ordenes_compra"] }); qc.invalidateQueries({ queryKey: ["orden_compra", vars.id] }); toast.success("Orden de compra actualizada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteOrdenCompra = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("ordenes_compra_items").delete().eq("orden_compra_id", id);
      const { error } = await supabase.from("ordenes_compra").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordenes_compra"] }); toast.success("Orden de compra eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useCreateOrdenCompraItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { orden_compra_id: string; material: string; cantidad?: number; unidad?: string; precio_unitario?: number; subtotal?: number }) => {
      const { data, error } = await supabase.from("ordenes_compra_items").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["ordenes_compra"] }); qc.invalidateQueries({ queryKey: ["orden_compra", vars.orden_compra_id] }); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ INVENTARIO ============
export const useInventario = () =>
  useQuery({
    queryKey: ["inventario"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventario").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateInventario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { codigo: string; nombre: string; tipo?: string; stock?: number; unidad?: string; stock_minimo?: number; costo_unitario?: number; es_fabricable?: boolean; ruta?: string; puede_vender?: boolean; categoria?: string; categoria_material?: string }) => {
      const { data, error } = await supabase.from("inventario").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventario"] }); toast.success("Material creado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateInventario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("inventario").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventario"] }); toast.success("Inventario actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteInventario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventario").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventario"] }); toast.success("Material eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ REGISTROS DE PRODUCCION ============
export const useRegistrosProduccion = () =>
  useQuery({
    queryKey: ["registros_produccion"],
    queryFn: async () => {
      const { data, error } = await supabase.from("registros_produccion").select("*, ordenes_produccion(folio, producto), maquinas(nombre)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useRegistrosPorMaquina = (maquinaId: string | null) =>
  useQuery({
    queryKey: ["registros_maquina", maquinaId],
    enabled: !!maquinaId,
    queryFn: async () => {
      const { data, error } = await supabase.from("registros_produccion").select("*, ordenes_produccion(folio, producto)").eq("maquina_id", maquinaId!).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

export const useRegistrosPorOperador = (nombre: string | null) =>
  useQuery({
    queryKey: ["registros_operador", nombre],
    enabled: !!nombre,
    queryFn: async () => {
      const { data, error } = await supabase.from("registros_produccion").select("*, ordenes_produccion(folio, producto), maquinas(nombre)").eq("operador_nombre", nombre!).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

export const useCreateRegistroProduccion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { orden_id?: string; proceso_id?: string; maquina_id?: string; operador_nombre: string; turno?: string; piezas_producidas?: number; piezas_scrap?: number; hora_inicio?: string; hora_fin?: string; status?: string; notas?: string }) => {
      const { data, error } = await supabase.from("registros_produccion").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["registros_produccion"] }); qc.invalidateQueries({ queryKey: ["ordenes_produccion"] }); toast.success("Registro guardado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateRegistroProduccion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("registros_produccion").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["registros_produccion"] }); toast.success("Registro actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ MANTENIMIENTO ============
export const useMantenimiento = () =>
  useQuery({
    queryKey: ["mantenimiento"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mantenimiento").select("*, maquinas(nombre)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateMantenimiento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { maquina_id: string; tipo?: string; descripcion: string; fecha?: string; costo?: number; notas?: string; frecuencia?: string; proxima_fecha?: string | null }) => {
      const { data, error } = await supabase.from("mantenimiento").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mantenimiento"] }); toast.success("Mantenimiento registrado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateMantenimiento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("mantenimiento").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mantenimiento"] }); qc.invalidateQueries({ queryKey: ["maquinas"] }); toast.success("Mantenimiento actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteMantenimiento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mantenimiento").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mantenimiento"] }); toast.success("Registro eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ INSPECCIONES DE CALIDAD ============
export const useInspecciones = () =>
  useQuery({
    queryKey: ["inspecciones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inspecciones_calidad").select("*, ordenes_produccion(folio, producto)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateInspeccion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { orden_id?: string; tipo?: string; producto?: string; operador?: string; maquina?: string; turno?: string; piezas_fabricadas?: number; piezas_scrap?: number; notas?: string; tolerancias?: any; caracteristicas?: any }) => {
      const { data, error } = await supabase.from("inspecciones_calidad").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inspecciones"] }); toast.success("Inspección creada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateInspeccion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("inspecciones_calidad").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inspecciones"] }); toast.success("Inspección actualizada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ EMPLEADOS ============
export const useEmpleados = () =>
  useQuery({
    queryKey: ["empleados"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empleados").select("*, maquinas(nombre)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateEmpleado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { nombre: string; puesto: string; turno?: string; maquina_id?: string | null; email?: string; telefono?: string }) => {
      const { data, error } = await supabase.from("empleados").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empleados"] }); toast.success("Empleado creado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateEmpleado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("empleados").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empleados"] }); toast.success("Empleado actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteEmpleado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("empleados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empleados"] }); toast.success("Empleado eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ GASTOS ============
export const useGastos = () =>
  useQuery({
    queryKey: ["gastos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gastos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateGasto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { categoria: string; descripcion: string; proveedor?: string; monto: number; orden_ref?: string; fecha?: string }) => {
      const { data, error } = await supabase.from("gastos").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gastos"] }); toast.success("Gasto registrado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateGasto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("gastos").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gastos"] }); toast.success("Gasto actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteGasto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gastos"] }); toast.success("Gasto eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ BUSINESS LOGIC: Convert Cotizacion -> OP + BOM ============
// FIXED: Uses inventario_bom materials instead of adding main product as BOM item.
// Also auto-populates process routes from producto_procesos.
export const useConvertirCotizacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cotizacionId: string) => {
      const { data: cot, error: e1 } = await supabase.from("cotizaciones").select("*, cotizacion_items(*), clientes(nombre)").eq("id", cotizacionId).single();
      if (e1) throw e1;

      // Create OP
      const totalHrs = cot.cotizacion_items?.reduce((s: number, i: any) => s + Number(i.tiempo_estimado_hrs) * Number(i.cantidad), 0) || 0;
      const { data: op, error: e2 } = await supabase.from("ordenes_produccion").insert({
        cotizacion_id: cotizacionId,
        cliente_id: cot.cliente_id,
        producto: cot.titulo,
        cantidad_requerida: cot.cotizacion_items?.reduce((s: number, i: any) => s + Number(i.cantidad), 0) || 0,
        fecha_inicio: new Date().toISOString().split("T")[0],
        tiempo_estimado_total_hrs: totalHrs,
      }).select().single();
      if (e2) throw e2;

      // For each cotización item that references a fabricable inventory product,
      // pull its inventario_bom materials into the BOM (not the product itself)
      let allBomItems: any[] = [];
      let bomCostoTotal = 0;

      for (const item of cot.cotizacion_items || []) {
        const invId = (item as any).inventario_id;
        if (invId) {
          // Get the product's BOM from inventario_bom
          const { data: productBom } = await supabase.from("inventario_bom")
            .select("*, material:inventario!inventario_bom_material_id_fkey(id, nombre, codigo, costo_unitario, unidad)")
            .eq("producto_id", invId);

          if (productBom && productBom.length > 0) {
            for (const pb of productBom) {
              const mat = pb.material as any;
              if (!mat) continue;
              const cant = Number(pb.cantidad) * Number(item.cantidad);
              const costoUnit = Number(mat.costo_unitario);
              const costoTotal = cant * costoUnit;
              bomCostoTotal += costoTotal;
              allBomItems.push({
                material: mat.nombre,
                descripcion: `${mat.codigo} — Para ${item.descripcion}`,
                cantidad: cant,
                unidad: pb.unidad || mat.unidad,
                costo_unitario: costoUnit,
                costo_total: costoTotal,
              });
            }
          } else {
            // Product has no BOM defined, add it as a line item
            const costoTotal = Number(item.costo_material) * Number(item.cantidad);
            bomCostoTotal += costoTotal;
            allBomItems.push({
              material: item.material || item.descripcion,
              descripcion: item.descripcion,
              cantidad: Number(item.cantidad),
              unidad: item.unidad,
              costo_unitario: Number(item.costo_material),
              costo_total: costoTotal,
            });
          }

          // Auto-populate process routes from producto_procesos
          const { data: procTemplates } = await supabase.from("producto_procesos")
            .select("*")
            .eq("producto_id", invId)
            .order("orden_secuencia");

          if (procTemplates && procTemplates.length > 0) {
            const procesos = procTemplates.map((pt: any) => ({
              orden_id: op.id,
              nombre: pt.nombre,
              tipo: pt.tipo,
              tiempo_estimado_hrs: Number(pt.tiempo_estimado_hrs) * Number(item.cantidad),
              maquina_id: pt.maquina_id || null,
              orden_secuencia: pt.orden_secuencia,
              herramienta: pt.herramienta,
              programa_cnc: pt.programa_cnc,
              fixture: pt.fixture,
              rpm: pt.rpm,
              velocidad_corte: pt.velocidad_corte,
              profundidad_corte: pt.profundidad_corte,
              refrigerante: pt.refrigerante,
              notas: pt.notas,
            }));
            await supabase.from("procesos_produccion").insert(procesos);
          }
        } else {
          // Manual item, add directly
          const costoTotal = Number(item.costo_material) * Number(item.cantidad);
          bomCostoTotal += costoTotal;
          allBomItems.push({
            material: item.material || item.descripcion,
            descripcion: item.descripcion,
            cantidad: Number(item.cantidad),
            unidad: item.unidad,
            costo_unitario: Number(item.costo_material),
            costo_total: costoTotal,
          });
        }
      }

      // Create BOM with resolved materials
      const { data: bom, error: e3 } = await supabase.from("bom").insert({
        producto: cot.titulo,
        cotizacion_id: cotizacionId,
        orden_id: op.id,
        status: "activo",
        costo_total: bomCostoTotal,
      }).select().single();
      if (e3) throw e3;

      if (allBomItems.length > 0) {
        const itemsWithBomId = allBomItems.map(i => ({ ...i, bom_id: bom.id }));
        const { error: e4 } = await supabase.from("bom_items").insert(itemsWithBomId);
        if (e4) throw e4;
      }

      // Update OP with total estimated hours from processes
      const { data: createdProcs } = await supabase.from("procesos_produccion").select("tiempo_estimado_hrs").eq("orden_id", op.id);
      if (createdProcs && createdProcs.length > 0) {
        const totalProcHrs = createdProcs.reduce((s, p) => s + Number(p.tiempo_estimado_hrs), 0);
        await supabase.from("ordenes_produccion").update({ tiempo_estimado_total_hrs: totalProcHrs }).eq("id", op.id);
      }

      const { error: e5 } = await supabase.from("cotizaciones").update({ status: "convertida" }).eq("id", cotizacionId);
      if (e5) throw e5;

      return { op, bom };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cotizaciones"] });
      qc.invalidateQueries({ queryKey: ["ordenes_produccion"] });
      qc.invalidateQueries({ queryKey: ["bom"] });
      toast.success("Cotización convertida → OP + BOM generados con materiales del inventario");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ BUSINESS LOGIC: Partial Delivery on OC ============
export const useRecibirParcialOC = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ocId, entregas }: { ocId: string; entregas: { itemId: string; cantidadRecibida: number }[] }) => {
      for (const e of entregas) {
        if (e.cantidadRecibida <= 0) continue;
        // Get current item
        const { data: item, error: eItem } = await supabase.from("ordenes_compra_items").select("*").eq("id", e.itemId).single();
        if (eItem) throw eItem;

        const newRecibida = Number(item.cantidad_recibida || 0) + e.cantidadRecibida;
        await supabase.from("ordenes_compra_items").update({ cantidad_recibida: newRecibida }).eq("id", e.itemId);

        // Update inventory
        const { data: existing } = await supabase.from("inventario").select("*").ilike("nombre", item.material).limit(1);
        if (existing && existing.length > 0) {
          await supabase.from("inventario").update({
            stock: Number(existing[0].stock) + e.cantidadRecibida,
            fecha_ultima_entrada: new Date().toISOString().split("T")[0],
          }).eq("id", existing[0].id);
        } else {
          await supabase.from("inventario").insert({
            codigo: `MAT-${Date.now().toString(36).toUpperCase()}`,
            nombre: item.material,
            stock: e.cantidadRecibida,
            unidad: item.unidad,
            tipo: "materia_prima",
            costo_unitario: Number(item.precio_unitario),
            fecha_ultima_entrada: new Date().toISOString().split("T")[0],
          });
        }
      }

      // Check if all items are fully received
      const { data: allItems } = await supabase.from("ordenes_compra_items").select("cantidad, cantidad_recibida").eq("orden_compra_id", ocId);
      const allComplete = allItems?.every(i => Number(i.cantidad_recibida) >= Number(i.cantidad)) ?? false;
      const anyReceived = allItems?.some(i => Number(i.cantidad_recibida) > 0) ?? false;

      const newStatus = allComplete ? "recibido" : anyReceived ? "parcial" : "ordenado";
      await supabase.from("ordenes_compra").update({ status: newStatus }).eq("id", ocId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordenes_compra"] });
      qc.invalidateQueries({ queryKey: ["orden_compra"] });
      qc.invalidateQueries({ queryKey: ["inventario"] });
      toast.success("Entrega registrada — inventario actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Legacy full receive (kept for compatibility)
export const useRecibirOrdenCompra = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ocId: string) => {
      const { data: items, error: e1 } = await supabase.from("ordenes_compra_items").select("*").eq("orden_compra_id", ocId);
      if (e1) throw e1;

      for (const item of items || []) {
        const remaining = Number(item.cantidad) - Number(item.cantidad_recibida || 0);
        if (remaining <= 0) continue;

        await supabase.from("ordenes_compra_items").update({ cantidad_recibida: Number(item.cantidad) }).eq("id", item.id);

        const { data: existing } = await supabase.from("inventario").select("*").ilike("nombre", item.material).limit(1);
        if (existing && existing.length > 0) {
          await supabase.from("inventario").update({ stock: Number(existing[0].stock) + remaining }).eq("id", existing[0].id);
        } else {
          await supabase.from("inventario").insert({
            codigo: `MAT-${Date.now().toString(36).toUpperCase()}`,
            nombre: item.material, stock: remaining, unidad: item.unidad,
            tipo: "materia_prima", costo_unitario: Number(item.precio_unitario),
          });
        }
      }

      await supabase.from("ordenes_compra").update({ status: "recibido" }).eq("id", ocId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordenes_compra"] });
      qc.invalidateQueries({ queryKey: ["orden_compra"] });
      qc.invalidateQueries({ queryKey: ["inventario"] });
      toast.success("Orden recibida completa — inventario actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ BUSINESS LOGIC: BOM -> Generate OC ============
export const useGenerarOCFromBom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bomId, proveedorId }: { bomId: string; proveedorId?: string }) => {
      const { data: bom, error: e1 } = await supabase.from("bom").select("*, bom_items(*)").eq("id", bomId).single();
      if (e1) throw e1;

      const total = bom.bom_items?.reduce((s: number, i: any) => s + Number(i.costo_total), 0) || 0;

      const { data: oc, error: e2 } = await supabase.from("ordenes_compra").insert({
        bom_id: bomId,
        proveedor_id: proveedorId || null,
        total,
      }).select().single();
      if (e2) throw e2;

      if (bom.bom_items && bom.bom_items.length > 0) {
        const ocItems = bom.bom_items.map((item: any) => ({
          orden_compra_id: oc.id,
          material: item.material,
          cantidad: Number(item.cantidad),
          unidad: item.unidad,
          precio_unitario: Number(item.costo_unitario),
          subtotal: Number(item.costo_total),
        }));
        const { error: e3 } = await supabase.from("ordenes_compra_items").insert(ocItems);
        if (e3) throw e3;
      }

      return oc;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordenes_compra"] });
      toast.success("Orden de Compra generada desde BOM");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ INSTRUMENTOS DE MEDICION ============
export const useInstrumentos = () =>
  useQuery({
    queryKey: ["instrumentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("instrumentos_medicion").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateInstrumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("instrumentos_medicion").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["instrumentos"] }); toast.success("Instrumento creado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateInstrumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("instrumentos_medicion").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["instrumentos"] }); toast.success("Instrumento actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteInstrumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instrumentos_medicion").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["instrumentos"] }); toast.success("Instrumento eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ CALIBRACIONES ============
export const useCalibraciones = (instrumentoId?: string | null) =>
  useQuery({
    queryKey: ["calibraciones", instrumentoId],
    enabled: !!instrumentoId,
    queryFn: async () => {
      const { data, error } = await supabase.from("calibraciones").select("*").eq("instrumento_id", instrumentoId!).order("fecha_calibracion", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateCalibracion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("calibraciones").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["calibraciones", vars.instrumento_id] }); qc.invalidateQueries({ queryKey: ["instrumentos"] }); toast.success("Calibración registrada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ REPORTES DIMENSIONALES ============
export const useReportesDimensionales = () =>
  useQuery({
    queryKey: ["reportes_dimensionales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reportes_dimensionales").select("*, ordenes_produccion(folio, producto), instrumentos_medicion(nombre, codigo)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useCreateReporteDimensional = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("reportes_dimensionales").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reportes_dimensionales"] }); toast.success("Reporte dimensional creado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateReporteDimensional = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("reportes_dimensionales").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reportes_dimensionales"] }); toast.success("Reporte actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ INVENTARIO BOM (Lista de materiales por producto) ============
export const useInventarioBom = (productoId?: string | null) =>
  useQuery({
    queryKey: ["inventario_bom", productoId],
    enabled: !!productoId,
    queryFn: async () => {
      const { data, error } = await supabase.from("inventario_bom").select("*, material:inventario!inventario_bom_material_id_fkey(id, codigo, nombre, unidad, stock, costo_unitario, categoria_material)").eq("producto_id", productoId!).order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const useCreateInventarioBom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { producto_id: string; material_id: string; cantidad?: number; unidad?: string; notas?: string }) => {
      const { data, error } = await supabase.from("inventario_bom").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["inventario_bom", vars.producto_id] }); toast.success("Material agregado a la lista"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteInventarioBom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, producto_id }: { id: string; producto_id: string }) => {
      const { error } = await supabase.from("inventario_bom").delete().eq("id", id);
      if (error) throw error;
      return producto_id;
    },
    onSuccess: (producto_id) => { qc.invalidateQueries({ queryKey: ["inventario_bom", producto_id] }); toast.success("Material removido de la lista"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ PRODUCTO PROCESOS (Process route templates for products) ============
export const useProductoProcesos = (productoId?: string | null) =>
  useQuery({
    queryKey: ["producto_procesos", productoId],
    enabled: !!productoId,
    queryFn: async () => {
      const { data, error } = await supabase.from("producto_procesos").select("*, maquinas(nombre)").eq("producto_id", productoId!).order("orden_secuencia");
      if (error) throw error;
      return data;
    },
  });

export const useCreateProductoProceso = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { producto_id: string; nombre: string; tipo?: string; tiempo_estimado_hrs?: number; maquina_id?: string | null; orden_secuencia?: number; herramienta?: string; programa_cnc?: string; fixture?: string; rpm?: number; velocidad_corte?: number; profundidad_corte?: number; refrigerante?: string; notas?: string }) => {
      const { data, error } = await supabase.from("producto_procesos").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["producto_procesos", vars.producto_id] }); toast.success("Proceso agregado al producto"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateProductoProceso = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, producto_id, ...values }: { id: string; producto_id: string; [key: string]: any }) => {
      const { error } = await supabase.from("producto_procesos").update(values).eq("id", id);
      if (error) throw error;
      return producto_id;
    },
    onSuccess: (producto_id) => { qc.invalidateQueries({ queryKey: ["producto_procesos", producto_id] }); toast.success("Proceso actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteProductoProceso = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, producto_id }: { id: string; producto_id: string }) => {
      const { error } = await supabase.from("producto_procesos").delete().eq("id", id);
      if (error) throw error;
      return producto_id;
    },
    onSuccess: (producto_id) => { qc.invalidateQueries({ queryKey: ["producto_procesos", producto_id] }); toast.success("Proceso eliminado del producto"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ BUSINESS LOGIC: Verificar stock para un producto fabricable ============
export const useVerificarStock = () => {
  return useMutation({
    mutationFn: async (productoId: string) => {
      const { data: bomItems, error: e1 } = await supabase.from("inventario_bom")
        .select("*, material:inventario!inventario_bom_material_id_fkey(id, codigo, nombre, stock, unidad, costo_unitario, proveedor_preferido, categoria_material)")
        .eq("producto_id", productoId);
      if (e1) throw e1;

      const faltantes: Array<{ material_id: string; nombre: string; codigo: string; necesario: number; disponible: number; faltante: number; unidad: string; costo_unitario: number; categoria_material?: string }> = [];
      
      for (const item of bomItems || []) {
        const mat = item.material as any;
        if (!mat) continue;
        const necesario = Number(item.cantidad);
        const disponible = Number(mat.stock);
        if (disponible < necesario) {
          faltantes.push({
            material_id: mat.id,
            nombre: mat.nombre,
            codigo: mat.codigo,
            necesario,
            disponible,
            faltante: necesario - disponible,
            unidad: item.unidad,
            costo_unitario: Number(mat.costo_unitario),
            categoria_material: mat.categoria_material,
          });
        }
      }
      return { bomItems, faltantes };
    },
  });
};

// ============ BUSINESS LOGIC: Generar OC automática desde faltantes ============
export const useGenerarOCFromFaltantes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ faltantes, proveedorId }: { faltantes: Array<{ nombre: string; faltante: number; unidad: string; costo_unitario: number }>; proveedorId?: string }) => {
      const total = faltantes.reduce((s, f) => s + f.faltante * f.costo_unitario, 0);
      const { data: oc, error: e1 } = await supabase.from("ordenes_compra").insert({
        proveedor_id: proveedorId || null,
        total,
        notas: "Generada automáticamente por verificación de stock",
      }).select().single();
      if (e1) throw e1;

      const ocItems = faltantes.map(f => ({
        orden_compra_id: oc.id,
        material: f.nombre,
        cantidad: f.faltante,
        unidad: f.unidad,
        precio_unitario: f.costo_unitario,
        subtotal: f.faltante * f.costo_unitario,
      }));
      const { error: e2 } = await supabase.from("ordenes_compra_items").insert(ocItems);
      if (e2) throw e2;

      return oc;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordenes_compra"] });
      toast.success("Orden de compra generada con materiales faltantes");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ============ BUSINESS LOGIC: Calculate BOM cost from inventario_bom ============
export const useCalcBomCost = () => {
  return useMutation({
    mutationFn: async (productoId: string) => {
      const { data: bomItems, error } = await supabase.from("inventario_bom")
        .select("*, material:inventario!inventario_bom_material_id_fkey(costo_unitario)")
        .eq("producto_id", productoId);
      if (error) throw error;
      const total = (bomItems || []).reduce((s, item) => {
        const mat = item.material as any;
        return s + Number(item.cantidad) * Number(mat?.costo_unitario || 0);
      }, 0);
      return total;
    },
  });
};

// ============ ESPECIFICACIONES GD&T ============
export const useEspecificacionesGDT = (ordenId?: string | null) =>
  useQuery({
    queryKey: ["gdt", ordenId],
    enabled: !!ordenId,
    queryFn: async () => {
      const { data, error } = await supabase.from("especificaciones_gdt").select("*").eq("orden_id", ordenId!).order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const useCreateEspecificacionGDT = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("especificaciones_gdt").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["gdt", vars.orden_id] }); toast.success("Especificación GD&T agregada"); },
    onError: (e: Error) => toast.error(e.message),
  });
};
