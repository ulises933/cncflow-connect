import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Eye, Search, PackageCheck, Truck, Clock, CheckCircle, AlertTriangle, Printer } from "lucide-react";
import { useEntregas, useCreateEntrega, useUpdateEntrega, useOrdenesProduccion, useClientes, useUpdateCotizacion } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PrintDocument from "@/components/PrintDocument";

const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", cls: "bg-warning/20 text-warning", icon: <Clock className="h-3 w-3" /> },
  parcial: { label: "Parcial", cls: "bg-info/20 text-info", icon: <AlertTriangle className="h-3 w-3" /> },
  entregado: { label: "Entregado", cls: "bg-success/20 text-success", icon: <CheckCircle className="h-3 w-3" /> },
};

const Entregas = () => {
  const { data: entregas, isLoading } = useEntregas();
  const { data: ordenes } = useOrdenesProduccion();
  const { data: clientes } = useClientes();
  const createMut = useCreateEntrega();
  const updateMut = useUpdateEntrega();
  const updateCotMut = useUpdateCotizacion();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [printEntrega, setPrintEntrega] = useState<any>(null);

  const [form, setForm] = useState({
    orden_id: "", producto: "", cantidad_ordenada: 0, cantidad_entregada: 0,
    recibio: "", notas: "", cliente_id: "", cotizacion_id: "",
  });

  // Entrega parcial form
  const [entregarOpen, setEntregarOpen] = useState(false);
  const [entregarId, setEntregarId] = useState<string | null>(null);
  const [cantidadEntregar, setCantidadEntregar] = useState(0);
  const [entregaRecibio, setEntregaRecibio] = useState("");
  const [entregaNotas, setEntregaNotas] = useState("");

  const detail = entregas?.find(e => e.id === detailId);

  const filtered = (entregas || []).filter(e => {
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      return e.folio.toLowerCase().includes(t) || e.producto.toLowerCase().includes(t);
    }
    return true;
  });

  const pendientes = entregas?.filter(e => e.status === "pendiente" || e.status === "parcial").length || 0;

  const handleSelectOrden = (ordenId: string) => {
    const orden = ordenes?.find(o => o.id === ordenId);
    if (orden) {
      setForm({
        ...form,
        orden_id: ordenId,
        producto: orden.producto,
        cantidad_ordenada: orden.cantidad_requerida,
        cliente_id: orden.cliente_id || "",
        cotizacion_id: orden.cotizacion_id || "",
      });
    }
  };

  const handleCreate = async () => {
    if (!form.orden_id || !form.producto) return;
    await createMut.mutateAsync({
      orden_id: form.orden_id,
      producto: form.producto,
      cantidad_ordenada: form.cantidad_ordenada,
      cantidad_entregada: 0,
      cliente_id: form.cliente_id || null,
      cotizacion_id: form.cotizacion_id || null,
      recibio: form.recibio || null,
      notas: form.notas || null,
      status: "pendiente",
    } as any);
    setCreateOpen(false);
    setForm({ orden_id: "", producto: "", cantidad_ordenada: 0, cantidad_entregada: 0, recibio: "", notas: "", cliente_id: "", cotizacion_id: "" });
  };

  const handleRegistrarEntrega = async () => {
    if (!entregarId || cantidadEntregar <= 0) return;
    const entrega = entregas?.find(e => e.id === entregarId);
    if (!entrega) return;

    const nuevaCantidad = entrega.cantidad_entregada + cantidadEntregar;
    const nuevoStatus = nuevaCantidad >= entrega.cantidad_ordenada ? "entregado" : "parcial";

    await updateMut.mutateAsync({
      id: entregarId,
      cantidad_entregada: nuevaCantidad,
      status: nuevoStatus,
      recibio: entregaRecibio || entrega.recibio,
      notas: entregaNotas
        ? (entrega.notas ? `${entrega.notas}\n[${new Date().toLocaleDateString()}] ${entregaNotas}` : `[${new Date().toLocaleDateString()}] ${entregaNotas}`)
        : entrega.notas,
    } as any);

    // Mark cotizacion as entregado if fully delivered
    if (nuevoStatus === "entregado" && entrega.cotizacion_id) {
      await updateCotMut.mutateAsync({ id: entrega.cotizacion_id, entregado: true } as any);
    }

    setEntregarOpen(false);
    setEntregarId(null);
    setCantidadEntregar(0);
    setEntregaRecibio("");
    setEntregaNotas("");
  };

  const openEntregarDialog = (entrega: any) => {
    setEntregarId(entrega.id);
    setCantidadEntregar(entrega.cantidad_ordenada - entrega.cantidad_entregada);
    setEntregaRecibio(entrega.recibio || "");
    setEntregaNotas("");
    setEntregarOpen(true);
  };

  const getClienteNombre = (clienteId: string | null) => {
    if (!clienteId) return "—";
    return clientes?.find(c => c.id === clienteId)?.nombre || "—";
  };

  const getOrdenFolio = (ordenId: string | null) => {
    if (!ordenId) return "—";
    return ordenes?.find(o => o.id === ordenId)?.folio || "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entregas</h1>
          <p className="text-muted-foreground">Control de entregas de producto a clientes</p>
        </div>
        <div className="flex items-center gap-2">
          {pendientes > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendientes} pendiente{pendientes > 1 ? "s" : ""}
            </Badge>
          )}
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nueva Entrega</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Entregas", value: entregas?.length || 0, icon: <Truck className="h-5 w-5" />, cls: "text-primary" },
          { label: "Pendientes", value: entregas?.filter(e => e.status === "pendiente").length || 0, icon: <Clock className="h-5 w-5" />, cls: "text-warning" },
          { label: "Parciales", value: entregas?.filter(e => e.status === "parcial").length || 0, icon: <AlertTriangle className="h-5 w-5" />, cls: "text-info" },
          { label: "Entregadas", value: entregas?.filter(e => e.status === "entregado").length || 0, icon: <CheckCircle className="h-5 w-5" />, cls: "text-success" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-secondary ${kpi.cls}`}>{kpi.icon}</div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por folio o producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        {[{ k: "all", l: "Todos" }, { k: "pendiente", l: "Pendiente" }, { k: "parcial", l: "Parcial" }, { k: "entregado", l: "Entregado" }].map(f => (
          <Button key={f.k} variant={filterStatus === f.k ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(f.k)}>{f.l}</Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !filtered?.length ? <div className="p-8 text-center text-muted-foreground">No hay entregas registradas.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Folio","Orden","Producto","Cliente","Ordenado","Entregado","% Avance","Estado","Fecha","Acciones"].map(h =>
                    <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                  )}
                </tr></thead>
                <tbody>
                  {filtered.map(e => {
                    const pct = e.cantidad_ordenada > 0 ? Math.round((e.cantidad_entregada / e.cantidad_ordenada) * 100) : 0;
                    const sc = statusConfig[e.status] || statusConfig.pendiente;
                    return (
                      <tr key={e.id} className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${e.status === "pendiente" ? "bg-warning/5" : ""}`}>
                        <td className="py-3 px-4 font-mono text-primary font-semibold">{e.folio}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{getOrdenFolio(e.orden_id)}</td>
                        <td className="py-3 px-4 text-foreground">{e.producto}</td>
                        <td className="py-3 px-4 text-muted-foreground">{getClienteNombre(e.cliente_id)}</td>
                        <td className="py-3 px-4 font-mono">{e.cantidad_ordenada}</td>
                        <td className="py-3 px-4 font-mono font-semibold">{e.cantidad_entregada}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-success" : pct > 0 ? "bg-info" : "bg-muted-foreground/30"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${sc.cls}`}>
                            {sc.icon}{sc.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{e.fecha_entrega}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailId(e.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {e.status !== "entregado" && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEntregarDialog(e)}>
                                <PackageCheck className="h-3 w-3 mr-1" />Entregar
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPrintEntrega(e)}>
                              <Printer className="h-4 w-4" />
                            </Button>
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Nueva Entrega</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Orden de Producción *</Label>
              <Select value={form.orden_id} onValueChange={handleSelectOrden}>
                <SelectTrigger><SelectValue placeholder="Seleccionar orden" /></SelectTrigger>
                <SelectContent>
                  {ordenes?.filter(o => o.status === "terminada" || o.status === "en_proceso").map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.folio} — {o.producto} ({o.cantidad_requerida} pzas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.orden_id && (
              <>
                <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-1">
                  <p><strong>Producto:</strong> {form.producto}</p>
                  <p><strong>Cantidad ordenada:</strong> {form.cantidad_ordenada} pzas</p>
                  {form.cliente_id && <p><strong>Cliente:</strong> {getClienteNombre(form.cliente_id)}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Recibió</Label>
                  <Input value={form.recibio} onChange={e => setForm({ ...form, recibio: e.target.value })} placeholder="Nombre de quien recibe" />
                </div>
                <div className="space-y-1">
                  <Label>Notas</Label>
                  <Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones..." />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createMut.isPending}>Registrar Entrega</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Registrar Entrega Dialog */}
      <Dialog open={entregarOpen} onOpenChange={setEntregarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Entrega de Producto</DialogTitle></DialogHeader>
          {entregarId && (() => {
            const entrega = entregas?.find(e => e.id === entregarId);
            if (!entrega) return null;
            const restante = entrega.cantidad_ordenada - entrega.cantidad_entregada;
            return (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-1">
                  <p><strong>{entrega.folio}</strong> — {entrega.producto}</p>
                  <p>Ordenado: <span className="font-mono font-bold">{entrega.cantidad_ordenada}</span> | Entregado: <span className="font-mono font-bold text-success">{entrega.cantidad_entregada}</span> | Restante: <span className="font-mono font-bold text-warning">{restante}</span></p>
                </div>
                <div className="space-y-1">
                  <Label>Cantidad a entregar *</Label>
                  <Input type="number" value={cantidadEntregar} onChange={e => setCantidadEntregar(Number(e.target.value))} max={restante} min={1} />
                  <p className="text-xs text-muted-foreground">Máximo: {restante} pzas</p>
                </div>
                <div className="space-y-1">
                  <Label>Recibió</Label>
                  <Input value={entregaRecibio} onChange={e => setEntregaRecibio(e.target.value)} placeholder="Nombre de quien recibe" />
                </div>
                <div className="space-y-1">
                  <Label>Notas</Label>
                  <Textarea value={entregaNotas} onChange={e => setEntregaNotas(e.target.value)} placeholder="Observaciones de esta entrega..." />
                </div>
                <Button onClick={handleRegistrarEntrega} className="w-full" disabled={updateMut.isPending}>
                  <PackageCheck className="h-4 w-4 mr-2" />Confirmar Entrega de {cantidadEntregar} pzas
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalle de Entrega</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Folio</p><p className="font-semibold font-mono text-primary">{detail.folio}</p></div>
                <div><p className="text-muted-foreground">Orden</p><p className="font-semibold font-mono">{getOrdenFolio(detail.orden_id)}</p></div>
                <div><p className="text-muted-foreground">Producto</p><p className="font-semibold">{detail.producto}</p></div>
                <div><p className="text-muted-foreground">Cliente</p><p className="font-semibold">{getClienteNombre(detail.cliente_id)}</p></div>
                <div><p className="text-muted-foreground">Cantidad Ordenada</p><p className="font-semibold font-mono">{detail.cantidad_ordenada}</p></div>
                <div><p className="text-muted-foreground">Cantidad Entregada</p><p className="font-semibold font-mono text-success">{detail.cantidad_entregada}</p></div>
                <div><p className="text-muted-foreground">Recibió</p><p className="font-semibold">{detail.recibio || "—"}</p></div>
                <div><p className="text-muted-foreground">Fecha</p><p className="font-semibold">{detail.fecha_entrega}</p></div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Avance</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${detail.cantidad_entregada >= detail.cantidad_ordenada ? "bg-success" : "bg-info"}`}
                      style={{ width: `${Math.min(Math.round((detail.cantidad_entregada / detail.cantidad_ordenada) * 100), 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-bold">{Math.round((detail.cantidad_entregada / detail.cantidad_ordenada) * 100)}%</span>
                </div>
              </div>
              {detail.notas && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm whitespace-pre-wrap">{detail.notas}</p>
                </div>
              )}
              <div className="flex gap-2">
                {detail.status !== "entregado" && (
                  <Button className="flex-1" onClick={() => { setDetailId(null); openEntregarDialog(detail); }}>
                    <PackageCheck className="h-4 w-4 mr-2" />Registrar Entrega
                  </Button>
                )}
                <Button variant="outline" onClick={() => { setPrintEntrega(detail); }}>
                  <Printer className="h-4 w-4 mr-2" />Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print */}
      {printEntrega && (
        <PrintDocument
          title={`Comprobante de Entrega — ${printEntrega.folio}`}
          onClose={() => setPrintEntrega(null)}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Folio:</strong> {printEntrega.folio}</div>
              <div><strong>Fecha:</strong> {printEntrega.fecha_entrega}</div>
              <div><strong>Orden:</strong> {getOrdenFolio(printEntrega.orden_id)}</div>
              <div><strong>Cliente:</strong> {getClienteNombre(printEntrega.cliente_id)}</div>
            </div>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">Producto</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Ordenado</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Entregado</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{printEntrega.producto}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{printEntrega.cantidad_ordenada}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{printEntrega.cantidad_entregada}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{statusConfig[printEntrega.status]?.label}</td>
                </tr>
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-8 mt-8 pt-4">
              <div className="text-center border-t border-gray-400 pt-2">Entregó</div>
              <div className="text-center border-t border-gray-400 pt-2">Recibió: {printEntrega.recibio || "________________"}</div>
            </div>
            {printEntrega.notas && <div><strong>Notas:</strong> {printEntrega.notas}</div>}
          </div>
        </PrintDocument>
      )}
    </div>
  );
};

export default Entregas;
