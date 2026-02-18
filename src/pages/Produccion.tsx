import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Eye, Trash2, Search, ChevronRight, ArrowDown, Clock, Wrench, Settings2, Play, CheckCircle2, Pause, AlertTriangle, BarChart3, GripVertical, Pencil, Package } from "lucide-react";
import { useOrdenesProduccion, useCreateOrdenProduccion, useUpdateOrdenProduccion, useDeleteOrdenProduccion, useProcesos, useCreateProceso, useUpdateProceso, useDeleteProceso, useMaquinas, useClientes, useInventario, useRegistrosProduccion } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; cls: string; icon: any; color: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-warning/20 text-warning border-warning/30", icon: Clock, color: "text-warning" },
  en_proceso: { label: "En Proceso", cls: "bg-info/20 text-info border-info/30", icon: Play, color: "text-info" },
  pausado: { label: "Pausado", cls: "bg-secondary text-secondary-foreground border-border", icon: Pause, color: "text-muted-foreground" },
  terminado: { label: "Terminado", cls: "bg-success/20 text-success border-success/30", icon: CheckCircle2, color: "text-success" },
};

const procesoTipos = [
  { value: "maquinado", label: "Maquinado CNC" },
  { value: "torneado", label: "Torneado" },
  { value: "fresado", label: "Fresado" },
  { value: "rectificado", label: "Rectificado" },
  { value: "taladrado", label: "Taladrado / Barrenado" },
  { value: "roscado", label: "Roscado" },
  { value: "soldadura", label: "Soldadura" },
  { value: "tratamiento", label: "Tratamiento Térmico" },
  { value: "recubrimiento", label: "Recubrimiento / Acabado" },
  { value: "ensamble", label: "Ensamble" },
  { value: "inspeccion", label: "Inspección / Calidad" },
  { value: "empaque", label: "Empaque" },
  { value: "pegado", label: "Pegado / Adhesivos" },
  { value: "desbarbado", label: "Desbarbado Manual" },
  { value: "limpieza", label: "Limpieza" },
  { value: "pintura", label: "Pintura / Acabado Manual" },
  { value: "manual", label: "Proceso Manual" },
  { value: "otro", label: "Otro" },
];

const cncTipos = new Set(["maquinado", "torneado", "fresado", "rectificado", "taladrado", "roscado"]);

const prioridadConfig: Record<string, { label: string; cls: string }> = {
  baja: { label: "Baja", cls: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", cls: "bg-info/15 text-info" },
  alta: { label: "Alta", cls: "bg-warning/15 text-warning" },
  urgente: { label: "Urgente", cls: "bg-destructive/15 text-destructive" },
};

const Produccion = () => {
  const { data: ordenes, isLoading } = useOrdenesProduccion();
  const { data: maquinas } = useMaquinas();
  const { data: clientes } = useClientes();
  const { data: inventario } = useInventario();
  const { data: allRegistros } = useRegistrosProduccion();
  const createMut = useCreateOrdenProduccion();
  const updateMut = useUpdateOrdenProduccion();
  const deleteMut = useDeleteOrdenProduccion();

  // Views & Filters
  const [viewTab, setViewTab] = useState("lista");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPrioridad, setFilterPrioridad] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Create order
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    producto: "", cantidad_requerida: 0, fecha_entrega: "", fecha_inicio: "",
    cliente_id: "", prioridad: "normal", material: "", material_grado: "",
    numero_plano: "", revision_plano: "A", tratamiento_termico: "", acabado_superficial: "",
    notas: "", lote: "", requiere_certificado: false,
  });
  const [selectedInventarioId, setSelectedInventarioId] = useState("");

  // Detail
  const [detailId, setDetailId] = useState<string | null>(null);
  const selectedOrder = ordenes?.find(o => o.id === detailId);
  const { data: procesos } = useProcesos(detailId || undefined);
  const createProcesoMut = useCreateProceso();
  const updateProcesoMut = useUpdateProceso();
  const deleteProcesoMut = useDeleteProceso();

  // Process form
  const [procOpen, setProcOpen] = useState(false);
  const [editingProc, setEditingProc] = useState<any>(null);
  const [procForm, setProcForm] = useState({
    nombre: "", tipo: "maquinado", tiempo_estimado_hrs: 0, maquina_id: "",
    herramienta: "", programa_cnc: "", fixture: "", rpm: 0,
    velocidad_corte: 0, profundidad_corte: 0, refrigerante: "", notas: "",
    descripcion_produccion: "", cantidad_requerida: 0,
  });

  // Registros for detail
  const detailRegistros = useMemo(() =>
    allRegistros?.filter(r => r.orden_id === detailId) || [],
    [allRegistros, detailId]
  );

  // Filtering
  let filtered = ordenes || [];
  if (filterStatus !== "all") filtered = filtered.filter(o => o.status === filterStatus);
  if (filterPrioridad !== "all") filtered = filtered.filter(o => (o.prioridad || "normal") === filterPrioridad);
  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    filtered = filtered.filter(o => o.producto.toLowerCase().includes(t) || o.folio.toLowerCase().includes(t));
  }

  // Stats
  const stats = useMemo(() => {
    if (!ordenes) return { total: 0, pendientes: 0, enProceso: 0, terminadas: 0 };
    return {
      total: ordenes.length,
      pendientes: ordenes.filter(o => o.status === "pendiente").length,
      enProceso: ordenes.filter(o => o.status === "en_proceso").length,
      terminadas: ordenes.filter(o => o.status === "terminado").length,
    };
  }, [ordenes]);

  // Kanban groups
  const kanbanGroups = useMemo(() => ({
    pendiente: filtered.filter(o => o.status === "pendiente"),
    en_proceso: filtered.filter(o => o.status === "en_proceso"),
    pausado: filtered.filter(o => o.status === "pausado"),
    terminado: filtered.filter(o => o.status === "terminado"),
  }), [filtered]);

  const productosInventario = inventario?.filter(i => (i as any).puede_vender || (i as any).es_fabricable) || [];

  const handleSelectProduct = (invId: string) => {
    const prod = inventario?.find(i => i.id === invId);
    if (prod) {
      setSelectedInventarioId(invId);
      setForm(f => ({ ...f, producto: prod.nombre, material: prod.tipo === "materia_prima" ? prod.nombre : "" }));
    }
  };

  const handleCreate = async () => {
    if (!form.producto.trim()) return;
    await createMut.mutateAsync({
      producto: form.producto,
      cantidad_requerida: form.cantidad_requerida,
      fecha_entrega: form.fecha_entrega || undefined,
      fecha_inicio: form.fecha_inicio || undefined,
      cliente_id: form.cliente_id || undefined,
      notas: form.notas || undefined,
    } as any);
    setCreateOpen(false);
    setForm({ producto: "", cantidad_requerida: 0, fecha_entrega: "", fecha_inicio: "", cliente_id: "", prioridad: "normal", material: "", material_grado: "", numero_plano: "", revision_plano: "A", tratamiento_termico: "", acabado_superficial: "", notas: "", lote: "", requiere_certificado: false });
    setSelectedInventarioId("");
  };

  const handleOpenProcForm = (proc?: any) => {
    if (proc) {
      setEditingProc(proc);
      setProcForm({
        nombre: proc.nombre, tipo: proc.tipo, tiempo_estimado_hrs: Number(proc.tiempo_estimado_hrs),
        maquina_id: proc.maquina_id || "", herramienta: proc.herramienta || "",
        programa_cnc: proc.programa_cnc || "", fixture: proc.fixture || "",
        rpm: Number(proc.rpm) || 0, velocidad_corte: Number(proc.velocidad_corte) || 0,
        profundidad_corte: Number(proc.profundidad_corte) || 0,
        refrigerante: proc.refrigerante || "", notas: proc.notas || "",
        descripcion_produccion: proc.descripcion_produccion || "",
        cantidad_requerida: Number(proc.cantidad_requerida) || 0,
      });
    } else {
      setEditingProc(null);
      setProcForm({ nombre: "", tipo: "maquinado", tiempo_estimado_hrs: 0, maquina_id: "", herramienta: "", programa_cnc: "", fixture: "", rpm: 0, velocidad_corte: 0, profundidad_corte: 0, refrigerante: "", notas: "", descripcion_produccion: "", cantidad_requerida: 0 });
    }
    setProcOpen(true);
  };

  const handleSaveProc = async () => {
    if (!detailId || !procForm.nombre.trim()) return;
    const data: any = {
      ...procForm,
      maquina_id: procForm.maquina_id && procForm.maquina_id !== "none" ? procForm.maquina_id : null,
      rpm: procForm.rpm || null,
      velocidad_corte: procForm.velocidad_corte || null,
      profundidad_corte: procForm.profundidad_corte || null,
    };
    if (editingProc) {
      await updateProcesoMut.mutateAsync({ id: editingProc.id, orden_id: detailId, ...data });
    } else {
      const nextSeq = (procesos?.length || 0) + 1;
      await createProcesoMut.mutateAsync({ orden_id: detailId, orden_secuencia: nextSeq, ...data });
    }
    setProcOpen(false);
  };

  const getOrderProgress = (ordenId: string) => {
    if (ordenId !== detailId || !procesos?.length) return 0;
    return Math.round((procesos.filter((p: any) => p.status === "terminado").length / procesos.length) * 100);
  };

  const totalHrsEstimadas = procesos?.reduce((s: number, p: any) => s + Number(p.tiempo_estimado_hrs), 0) || 0;
  const totalHrsReales = detailRegistros.reduce((s, r) => {
    if (r.hora_inicio && r.hora_fin) {
      return s + (new Date(r.hora_fin).getTime() - new Date(r.hora_inicio).getTime()) / 3600000;
    }
    return s;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Producción y Procesos</h1>
          <p className="text-muted-foreground">Gestión completa de órdenes de manufactura, rutas de proceso y centros de trabajo</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nueva Orden de Producción</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Órdenes", value: stats.total, icon: BarChart3, color: "text-foreground" },
          { label: "Pendientes", value: stats.pendientes, icon: Clock, color: "text-warning" },
          { label: "En Proceso", value: stats.enProceso, icon: Play, color: "text-info" },
          { label: "Terminadas", value: stats.terminadas, icon: CheckCircle2, color: "text-success" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Lista / Kanban */}
      <Tabs value={viewTab} onValueChange={setViewTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar orden..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
              <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Prioridad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(prioridadConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LIST VIEW */}
        <TabsContent value="lista">
          <Card>
            <CardContent className="p-0">
              {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              : !filtered?.length ? <div className="p-8 text-center text-muted-foreground">No hay órdenes de producción.</div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      {["Folio","Prioridad","Producto","Cliente","Cant.","Producidas","Estado","Entrega",""].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.map(o => {
                        const prio = prioridadConfig[(o.prioridad || "normal")];
                        const st = statusConfig[o.status];
                        const progress = o.cantidad_requerida > 0 ? Math.min(100, Math.round((o.cantidad_producida / o.cantidad_requerida) * 100)) : 0;
                        return (
                          <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => setDetailId(o.id)}>
                            <td className="py-3 px-4 font-mono text-primary font-semibold">{o.folio}</td>
                            <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${prio?.cls}`}>{prio?.label}</span></td>
                            <td className="py-3 px-4 text-foreground font-medium">{o.producto}</td>
                            <td className="py-3 px-4 text-muted-foreground">{(o as any).clientes?.nombre || "—"}</td>
                            <td className="py-3 px-4 font-mono">{o.cantidad_requerida}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{Math.min(o.cantidad_producida, o.cantidad_requerida)}/{o.cantidad_requerida}</span>
                                <Progress value={progress} className="h-1.5 w-16" />
                              </div>
                            </td>
                            <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${st?.cls}`}>{st?.label}</span></td>
                            <td className="py-3 px-4 text-muted-foreground">{o.fecha_entrega || "—"}</td>
                            <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setDetailId(o.id)}><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KANBAN VIEW */}
        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(kanbanGroups).map(([status, orders]) => {
              const st = statusConfig[status];
              const StIcon = st.icon;
              return (
                <div key={status} className="space-y-3">
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${st.cls} border`}>
                    <StIcon className="h-4 w-4" />
                    <span className="font-semibold text-sm">{st.label}</span>
                    <Badge variant="secondary" className="ml-auto">{orders.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {orders.map(o => {
                      const prio = prioridadConfig[(o.prioridad || "normal")];
                      const progress = o.cantidad_requerida > 0 ? Math.min(100, Math.round((o.cantidad_producida / o.cantidad_requerida) * 100)) : 0;
                      return (
                        <Card key={o.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailId(o.id)}>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-primary font-bold">{o.folio}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${prio?.cls}`}>{prio?.label}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground leading-tight">{o.producto}</p>
                            <p className="text-xs text-muted-foreground">{(o as any).clientes?.nombre || "Sin cliente"}</p>
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="h-1.5 flex-1" />
                              <span className="text-[10px] font-mono text-muted-foreground">{o.cantidad_producida}/{o.cantidad_requerida}</span>
                            </div>
                            {o.fecha_entrega && (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />Entrega: {o.fecha_entrega}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Orden de Producción</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Producto desde inventario (opcional)</Label>
              <p className="text-xs text-muted-foreground">Selecciona un producto existente o escribe uno nuevo manualmente abajo</p>
              <Select value={selectedInventarioId} onValueChange={handleSelectProduct}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto del catálogo..." /></SelectTrigger>
                <SelectContent>
                  {productosInventario.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.codigo} — {p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Producto / Pieza a fabricar *</Label>
                <p className="text-xs text-muted-foreground">Nombre de la pieza a manufacturar</p>
                <Input value={form.producto} onChange={e => setForm({...form, producto: e.target.value})} placeholder="Ej: Flecha de acero Ø50mm x 300mm" />
              </div>
              <div className="space-y-1">
                <Label>Cliente</Label>
                <p className="text-xs text-muted-foreground">Cliente que solicitó este trabajo</p>
                <Select value={form.cliente_id} onValueChange={v => setForm({...form, cliente_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{clientes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Cantidad requerida *</Label>
                <p className="text-xs text-muted-foreground">Total de piezas</p>
                <Input type="number" value={form.cantidad_requerida} onChange={e => setForm({...form, cantidad_requerida: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <Label>Fecha inicio</Label>
                <Input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Fecha entrega</Label>
                <Input type="date" value={form.fecha_entrega} onChange={e => setForm({...form, fecha_entrega: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Prioridad</Label>
                <Select value={form.prioridad} onValueChange={v => setForm({...form, prioridad: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(prioridadConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>No. de Plano</Label>
                <p className="text-xs text-muted-foreground">Referencia del dibujo técnico</p>
                <Input value={form.numero_plano} onChange={e => setForm({...form, numero_plano: e.target.value})} placeholder="Ej: DWG-001" />
              </div>
              <div className="space-y-1">
                <Label>Lote</Label>
                <Input value={form.lote} onChange={e => setForm({...form, lote: e.target.value})} placeholder="Ej: L-2026-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Material</Label>
                <Input value={form.material} onChange={e => setForm({...form, material: e.target.value})} placeholder="Ej: Acero 4140" />
              </div>
              <div className="space-y-1">
                <Label>Grado del material</Label>
                <Input value={form.material_grado} onChange={e => setForm({...form, material_grado: e.target.value})} placeholder="Ej: AISI 4140 QT" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notas / Instrucciones especiales</Label>
              <Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Ej: Requiere certificado de material, tolerancia ±0.01mm en diámetro..." />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={createMut.isPending}>Crear Orden de Producción</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DETAIL DIALOG — Process Pipeline */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-3 flex-wrap">
                  <DialogTitle className="text-xl">{selectedOrder.folio}</DialogTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status]?.cls}`}>
                    {statusConfig[selectedOrder.status]?.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${prioridadConfig[selectedOrder.prioridad || "normal"]?.cls}`}>
                    {prioridadConfig[selectedOrder.prioridad || "normal"]?.label}
                  </span>
                </div>
              </DialogHeader>

              {/* Order summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Producto</p><p className="font-semibold">{selectedOrder.producto}</p></div>
                <div><p className="text-muted-foreground text-xs">Cliente</p><p className="font-semibold">{(selectedOrder as any).clientes?.nombre || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Cantidad</p><p className="font-mono font-semibold">{Math.min(selectedOrder.cantidad_producida, selectedOrder.cantidad_requerida)} / {selectedOrder.cantidad_requerida}</p></div>
                <div><p className="text-muted-foreground text-xs">Scrap</p><p className="font-mono text-destructive">{selectedOrder.cantidad_scrap}</p></div>
                <div><p className="text-muted-foreground text-xs">Entrega</p><p className="font-semibold">{selectedOrder.fecha_entrega || "—"}</p></div>
              </div>

              {/* Production Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Avance de producción</span>
                  <span className="font-mono font-semibold">
                    {selectedOrder.cantidad_requerida > 0 ? Math.min(100, Math.round((selectedOrder.cantidad_producida / selectedOrder.cantidad_requerida) * 100)) : 0}%
                  </span>
                </div>
                <Progress value={selectedOrder.cantidad_requerida > 0 ? Math.min(100, Math.round((selectedOrder.cantidad_producida / selectedOrder.cantidad_requerida) * 100)) : 0} className="h-2" />
              </div>

              {/* Status Control */}
              <div className="flex gap-2 items-center flex-wrap">
                <Label className="text-xs text-muted-foreground">Cambiar estado:</Label>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <Button key={k} variant={selectedOrder.status === k ? "default" : "outline"} size="sm"
                    onClick={() => updateMut.mutate({ id: selectedOrder.id, status: k })}
                    className={selectedOrder.status === k ? "" : ""}
                  >
                    <v.icon className="h-3 w-3 mr-1" />{v.label}
                  </Button>
                ))}
              </div>

              {/* Time summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Hrs Estimadas</p>
                  <p className="text-xl font-mono font-bold text-foreground">{totalHrsEstimadas.toFixed(1)}h</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Hrs Reales</p>
                  <p className="text-xl font-mono font-bold text-foreground">{totalHrsReales.toFixed(1)}h</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Eficiencia</p>
                  <p className={`text-xl font-mono font-bold ${totalHrsReales > 0 && totalHrsEstimadas > 0 ? (totalHrsEstimadas / totalHrsReales >= 1 ? "text-success" : "text-destructive") : "text-muted-foreground"}`}>
                    {totalHrsReales > 0 && totalHrsEstimadas > 0 ? `${Math.min(999, Math.round((totalHrsEstimadas / totalHrsReales) * 100))}%` : "—"}
                  </p>
                </CardContent></Card>
              </div>

              {/* === PROCESS PIPELINE === */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />Ruta de Procesos
                  </h3>
                  <Button size="sm" onClick={() => handleOpenProcForm()}>
                    <Plus className="h-4 w-4 mr-1" />Agregar Proceso
                  </Button>
                </div>

                {procesos?.length ? (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progreso de ruta</span>
                    <span className="font-mono">{procesos.filter((p:any) => p.status === "terminado").length}/{procesos.length} procesos</span>
                  </div>
                ) : null}
                {procesos?.length ? <Progress value={getOrderProgress(detailId!)} className="h-2 mb-4" /> : null}

                {!procesos?.length ? (
                  <div className="p-6 text-center border-2 border-dashed border-border rounded-lg">
                    <Settings2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">Sin procesos definidos aún.</p>
                    <p className="text-xs text-muted-foreground">Define la ruta de manufactura paso a paso.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {procesos.map((p: any, i: number) => {
                      const pst = statusConfig[p.status];
                      const PIcon = pst?.icon || Clock;
                      const isLast = i === procesos.length - 1;
                      return (
                        <div key={p.id}>
                          <div className={`flex gap-3 p-3 rounded-lg border transition-colors ${pst?.cls}`}>
                            {/* Sequence */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                p.status === "terminado" ? "bg-success text-success-foreground border-success" :
                                p.status === "en_proceso" ? "bg-info text-info-foreground border-info animate-pulse" :
                                "bg-secondary text-muted-foreground border-border"
                              }`}>
                                {p.status === "terminado" ? "✓" : i + 1}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm">{p.nombre}</p>
                                <Badge variant="outline" className="text-[10px]">{procesoTipos.find(t => t.value === p.tipo)?.label || p.tipo}</Badge>
                              </div>
                              {p.descripcion_produccion && (
                                <p className="text-xs text-foreground mb-1">
                                  📦 {p.descripcion_produccion}
                                  {Number(p.cantidad_requerida) > 0 && <span className="font-mono ml-1">— {p.cantidad_producida || 0}/{p.cantidad_requerida} pzas</span>}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Number(p.tiempo_estimado_hrs)}h est.</span>
                                <span className="flex items-center gap-1"><Settings2 className="h-3 w-3" />{p.maquinas?.nombre || "Sin máquina"}</span>
                                {p.herramienta && <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{p.herramienta}</span>}
                                {p.programa_cnc && <span>CNC: {p.programa_cnc}</span>}
                                {Number(p.rpm) > 0 && <span>{p.rpm} RPM</span>}
                                {Number(p.velocidad_corte) > 0 && <span>Vc: {p.velocidad_corte} m/min</span>}
                                {p.fixture && <span>Fixture: {p.fixture}</span>}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Select value={p.status} onValueChange={v => updateProcesoMut.mutate({ id: p.id, orden_id: detailId!, status: v })}>
                                <SelectTrigger className="h-7 w-28 text-xs">
                                  <PIcon className="h-3 w-3 mr-1" /><SelectValue />
                                </SelectTrigger>
                                <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenProcForm(p)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProcesoMut.mutate({ id: p.id, orden_id: detailId! })}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {!isLast && (
                            <div className="flex justify-start ml-[22px] py-0.5">
                              <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Registros de producción recientes */}
              {detailRegistros.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Registros de Producción Recientes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border">
                        {["Fecha","Operador","Máquina","Turno","Piezas","Scrap","Estado"].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-muted-foreground">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {detailRegistros.slice(0, 10).map(r => (
                          <tr key={r.id} className="border-b border-border/50">
                            <td className="py-2 px-3">{r.fecha}</td>
                            <td className="py-2 px-3">{r.operador_nombre}</td>
                            <td className="py-2 px-3">{(r as any).maquinas?.nombre || "—"}</td>
                            <td className="py-2 px-3">{r.turno}</td>
                            <td className="py-2 px-3 font-mono">{r.piezas_producidas}</td>
                            <td className="py-2 px-3 font-mono text-destructive">{r.piezas_scrap}</td>
                            <td className="py-2 px-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusConfig[r.status]?.cls || ""}`}>{statusConfig[r.status]?.label || r.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PROCESS FORM DIALOG */}
      <Dialog open={procOpen} onOpenChange={setProcOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingProc ? "Editar Proceso" : "Agregar Proceso a la Ruta"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nombre de la operación *</Label>
                <p className="text-xs text-muted-foreground">Describe la operación (Ej: Desbaste exterior Ø50)</p>
                <Input value={procForm.nombre} onChange={e => setProcForm({...procForm, nombre: e.target.value})} placeholder="Ej: Desbaste exterior, Barrenado Ø12" />
              </div>
              <div className="space-y-1">
                <Label>Tipo de proceso</Label>
                <p className="text-xs text-muted-foreground">Clasificación del tipo de operación</p>
                <Select value={procForm.tipo} onValueChange={v => setProcForm({...procForm, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{procesoTipos.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Package className="h-4 w-4 text-primary" />¿Qué se debe producir en este proceso?</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Descripción de lo que se produce</Label>
                  <p className="text-[10px] text-muted-foreground">Qué pieza o componente exacto sale de este proceso</p>
                  <Input value={procForm.descripcion_produccion} onChange={e => setProcForm({...procForm, descripcion_produccion: e.target.value})} placeholder="Ej: Flecha maquinada Ø50mm, Pieza con desbarbado..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cantidad a producir</Label>
                  <p className="text-[10px] text-muted-foreground">Piezas requeridas</p>
                  <Input type="number" value={procForm.cantidad_requerida} onChange={e => setProcForm({...procForm, cantidad_requerida: Number(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Máquina / Centro de trabajo</Label>
                <p className="text-xs text-muted-foreground">En qué máquina se realizará esta operación</p>
                <Select value={procForm.maquina_id} onValueChange={v => setProcForm({...procForm, maquina_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar máquina" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin máquina asignada</SelectItem>
                    {maquinas?.filter(m => m.status === "activa").map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre} {m.marca ? `(${m.marca})` : ""} — {m.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tiempo estimado (horas)</Label>
                <p className="text-xs text-muted-foreground">Tiempo estimado para completar esta operación</p>
                <Input type="number" step="0.1" value={procForm.tiempo_estimado_hrs} onChange={e => setProcForm({...procForm, tiempo_estimado_hrs: Number(e.target.value)})} />
              </div>
            </div>

            {/* CNC Parameters - only show for CNC-type processes or when a CNC machine is selected */}
            {(cncTipos.has(procForm.tipo) || (procForm.maquina_id && procForm.maquina_id !== "none" && maquinas?.find(m => m.id === procForm.maquina_id)?.tipo?.toLowerCase().includes("cnc"))) && (
            <div className="p-3 rounded-lg bg-secondary/50 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Settings2 className="h-4 w-4" />Parámetros CNC / Maquinado</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Programa CNC</Label>
                  <p className="text-[10px] text-muted-foreground">Nombre del programa (Ej: O1234)</p>
                  <Input value={procForm.programa_cnc} onChange={e => setProcForm({...procForm, programa_cnc: e.target.value})} placeholder="O1234" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Herramienta</Label>
                  <p className="text-[10px] text-muted-foreground">Inserto o herramienta (Ej: WNMG 080408)</p>
                  <Input value={procForm.herramienta} onChange={e => setProcForm({...procForm, herramienta: e.target.value})} placeholder="WNMG 080408" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fixture / Sujeción</Label>
                  <p className="text-[10px] text-muted-foreground">Tipo de sujeción (Ej: Chuck 3 mordazas)</p>
                  <Input value={procForm.fixture} onChange={e => setProcForm({...procForm, fixture: e.target.value})} placeholder="Chuck 3 mordazas" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">RPM</Label>
                  <p className="text-[10px] text-muted-foreground">Revoluciones por minuto del husillo</p>
                  <Input type="number" value={procForm.rpm} onChange={e => setProcForm({...procForm, rpm: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vel. Corte (m/min)</Label>
                  <p className="text-[10px] text-muted-foreground">Velocidad de corte</p>
                  <Input type="number" step="0.1" value={procForm.velocidad_corte} onChange={e => setProcForm({...procForm, velocidad_corte: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prof. Corte (mm)</Label>
                  <p className="text-[10px] text-muted-foreground">Profundidad de pasada</p>
                  <Input type="number" step="0.1" value={procForm.profundidad_corte} onChange={e => setProcForm({...procForm, profundidad_corte: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Refrigerante</Label>
                  <p className="text-[10px] text-muted-foreground">Tipo de coolant</p>
                  <Input value={procForm.refrigerante} onChange={e => setProcForm({...procForm, refrigerante: e.target.value})} placeholder="Soluble 5%" />
                </div>
              </div>
            </div>
            )}

            <div className="space-y-1">
              <Label>Notas / Instrucciones del proceso</Label>
              <p className="text-xs text-muted-foreground">Instrucciones especiales, precauciones, setup notes</p>
              <Textarea value={procForm.notas} onChange={e => setProcForm({...procForm, notas: e.target.value})} placeholder="Ej: Verificar runout antes de iniciar, no exceder 0.3mm/rev de avance..." />
            </div>

            <Button onClick={handleSaveProc} className="w-full" disabled={createProcesoMut.isPending || updateProcesoMut.isPending}>
              {editingProc ? "Guardar Cambios" : "Agregar Proceso a la Ruta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Produccion;
