import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Eye, Trash2, ArrowRightLeft, X, Package, AlertTriangle, ShoppingCart } from "lucide-react";
import PrintDocument from "@/components/PrintDocument";
import { useCotizaciones, useCreateCotizacion, useUpdateCotizacion, useDeleteCotizacion, useCotizacion, useCreateCotizacionItem, useDeleteCotizacionItem, useClientes, useConvertirCotizacion, useInventario, useVerificarStock, useGenerarOCFromFaltantes } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  borrador: "bg-secondary text-secondary-foreground", enviada: "bg-info/20 text-info",
  aprobada: "bg-success/20 text-success", rechazada: "bg-destructive/20 text-destructive", convertida: "bg-primary/20 text-primary",
};
const statusLabels: Record<string, string> = { borrador: "Borrador", enviada: "Enviada", aprobada: "Aprobada", rechazada: "Rechazada", convertida: "Convertida" };

const recalcTotals = async (cotizacionId: string, margen: number, updateMut: any) => {
  const { data } = await supabase.from("cotizacion_items").select("subtotal").eq("cotizacion_id", cotizacionId);
  if (data) {
    const subtotal = data.reduce((s, i) => s + Number(i.subtotal), 0);
    const conMargen = subtotal * (1 + margen / 100);
    const iva = conMargen * 0.16;
    await updateMut.mutateAsync({ id: cotizacionId, subtotal, iva, total: conMargen + iva });
  }
};

const Cotizaciones = () => {
  const { data: cotizaciones, isLoading } = useCotizaciones();
  const { data: clientes } = useClientes();
  const { data: inventario } = useInventario();
  const createMut = useCreateCotizacion();
  const updateMut = useUpdateCotizacion();
  const deleteMut = useDeleteCotizacion();
  const convertMut = useConvertirCotizacion();
  const createItemMut = useCreateCotizacionItem();
  const deleteItemMut = useDeleteCotizacionItem();
  const verificarStockMut = useVerificarStock();
  const generarOCMut = useGenerarOCFromFaltantes();

  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detail } = useCotizacion(detailId);

  const [form, setForm] = useState({ titulo: "", cliente_id: "", margen_porcentaje: 30, notas: "" });
  const [itemMode, setItemMode] = useState<"inventario" | "manual">("inventario");
  const [selectedInventarioId, setSelectedInventarioId] = useState("");
  const [itemForm, setItemForm] = useState({ descripcion: "", material: "", cantidad: 1, unidad: "pza", costo_material: 0, tiempo_estimado_hrs: 0, costo_hora_maquina: 0 });
  const [bomCostLoading, setBomCostLoading] = useState(false);

  // Stock verification
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockResults, setStockResults] = useState<any[]>([]);

  const productosVendibles = inventario?.filter(i => (i as any).puede_vender || (i as any).es_fabricable) || [];
  const filtered = filter === "all" ? cotizaciones : cotizaciones?.filter(q => q.status === filter);

  const handleCreate = async () => {
    if (!form.titulo.trim()) return;
    const res = await createMut.mutateAsync({
      titulo: form.titulo, cliente_id: form.cliente_id || undefined,
      margen_porcentaje: form.margen_porcentaje, notas: form.notas || undefined,
    });
    setCreateOpen(false);
    setForm({ titulo: "", cliente_id: "", margen_porcentaje: 30, notas: "" });
    setDetailId(res.id);
  };

  // When selecting a product from inventory, calculate cost from its BOM if fabricable
  const handleSelectProduct = async (invId: string) => {
    const prod = inventario?.find(i => i.id === invId);
    if (!prod) return;
    setSelectedInventarioId(invId);

    let costoMaterial = Number(prod.costo_unitario);
    let tiempoHrs = 0;

    // If fabricable, calculate cost from BOM materials + process hours
    if ((prod as any).es_fabricable) {
      setBomCostLoading(true);
      try {
        const { data: bomItems } = await supabase.from("inventario_bom")
          .select("*, material:inventario!inventario_bom_material_id_fkey(costo_unitario)")
          .eq("producto_id", invId);

        if (bomItems && bomItems.length > 0) {
          costoMaterial = bomItems.reduce((s, item) => {
            const mat = item.material as any;
            return s + Number(item.cantidad) * Number(mat?.costo_unitario || 0);
          }, 0);
        }

        const { data: procesos } = await supabase.from("producto_procesos")
          .select("tiempo_estimado_hrs")
          .eq("producto_id", invId);

        if (procesos && procesos.length > 0) {
          tiempoHrs = procesos.reduce((s, p) => s + Number(p.tiempo_estimado_hrs), 0);
        }
      } catch {}
      setBomCostLoading(false);
    }

    setItemForm({
      descripcion: prod.nombre,
      material: (prod as any).es_fabricable ? `Fabricable (${prod.codigo})` : prod.nombre,
      cantidad: 1,
      unidad: prod.unidad,
      costo_material: costoMaterial,
      tiempo_estimado_hrs: tiempoHrs,
      costo_hora_maquina: 0,
    });
  };

  const handleAddItem = async () => {
    if (!detailId || !itemForm.descripcion.trim()) return;
    const subtotal = (itemForm.costo_material * itemForm.cantidad) + (itemForm.tiempo_estimado_hrs * itemForm.costo_hora_maquina);
    await createItemMut.mutateAsync({
      cotizacion_id: detailId, ...itemForm, subtotal,
      inventario_id: selectedInventarioId || undefined,
    } as any);
    setItemForm({ descripcion: "", material: "", cantidad: 1, unidad: "pza", costo_material: 0, tiempo_estimado_hrs: 0, costo_hora_maquina: 0 });
    setSelectedInventarioId("");
    setTimeout(() => recalcTotals(detailId, detail?.margen_porcentaje || 30, updateMut), 300);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!detailId) return;
    await deleteItemMut.mutateAsync({ id: itemId, cotizacion_id: detailId });
    setTimeout(() => recalcTotals(detailId, detail?.margen_porcentaje || 30, updateMut), 300);
  };

  const handleConvert = async (id: string) => {
    await convertMut.mutateAsync(id);
    setDetailId(null);
  };

  const handleVerificarStockCotizacion = async () => {
    if (!detail?.cotizacion_items) return;
    const results: any[] = [];
    for (const item of detail.cotizacion_items) {
      const invId = (item as any).inventario_id;
      if (!invId) continue;
      const prod = inventario?.find(i => i.id === invId);
      if (!prod || !(prod as any).es_fabricable) continue;
      try {
        const result = await verificarStockMut.mutateAsync(invId);
        results.push({ producto: prod.nombre, productoId: invId, cantidad: Number(item.cantidad), ...result });
      } catch {}
    }
    if (results.length === 0) {
      toast.info("No hay productos fabricables vinculados en esta cotización");
      return;
    }
    setStockResults(results);
    setStockDialogOpen(true);
  };

  const allFaltantes = stockResults.flatMap(r => r.faltantes.map((f: any) => ({ ...f, cantidad_productos: r.cantidad })));
  const faltantesAjustados = allFaltantes.map(f => ({ ...f, faltante: f.faltante * (f.cantidad_productos || 1) }));

  const handleGenerarOCFaltantes = async () => {
    if (!faltantesAjustados.length) return;
    await generarOCMut.mutateAsync({ faltantes: faltantesAjustados });
    setStockDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-muted-foreground">Gestión de cotizaciones y propuestas</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nueva Cotización</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "borrador", "enviada", "aprobada", "rechazada", "convertida"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "all" ? "Todas" : statusLabels[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !filtered?.length ? <div className="p-8 text-center text-muted-foreground">No hay cotizaciones.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Folio","Cliente","Descripción","Estado","Total","Fecha","Acciones"].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered?.map(q => (
                    <tr key={q.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-primary">{q.folio}</td>
                      <td className="py-3 px-4 text-foreground">{(q as any).clientes?.nombre || "—"}</td>
                      <td className="py-3 px-4 text-foreground">{q.titulo}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[q.status]}`}>{statusLabels[q.status]}</span></td>
                      <td className="py-3 px-4 font-mono text-foreground">${Number(q.total).toLocaleString()}</td>
                      <td className="py-3 px-4 text-muted-foreground">{q.fecha}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailId(q.id)}><Eye className="h-4 w-4" /></Button>
                          {q.status === "aprobada" && <Button variant="ghost" size="icon" onClick={() => handleConvert(q.id)} title="Convertir a OP"><ArrowRightLeft className="h-4 w-4 text-success" /></Button>}
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Cotización</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Título / Descripción del trabajo *</Label>
              <p className="text-xs text-muted-foreground">Resumen breve de lo que se va a cotizar</p>
              <Input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="Ej: Fabricación de 50 ejes para bomba hidráulica" />
            </div>
            <div className="space-y-1">
              <Label>Cliente</Label>
              <Select value={form.cliente_id} onValueChange={v => setForm({...form, cliente_id: v})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>{clientes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Margen de utilidad (%)</Label>
              <Input type="number" value={form.margen_porcentaje} onChange={e => setForm({...form, margen_porcentaje: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Condiciones especiales..." />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={createMut.isPending}>Crear Cotización</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Cotización {detail?.folio}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground">Cliente</p><p className="font-semibold">{(detail as any).clientes?.nombre || "—"}</p></div>
                <div><p className="text-muted-foreground">Estado</p>
                  <Select value={detail.status} onValueChange={v => updateMut.mutateAsync({ id: detail.id, status: v })} disabled={detail.status === "convertida"}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{["borrador","enviada","aprobada","rechazada"].map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><p className="text-muted-foreground">Subtotal</p><p className="font-mono font-semibold">${Number(detail.subtotal).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Total (c/IVA)</p><p className="font-mono font-semibold text-primary">${Number(detail.total).toLocaleString()}</p></div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {detail.status === "aprobada" && (
                  <Button onClick={() => handleConvert(detail.id)} className="bg-success hover:bg-success/90 text-success-foreground" disabled={convertMut.isPending}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />{convertMut.isPending ? "Convirtiendo..." : "Convertir a OP + BOM"}
                  </Button>
                )}
                <Button variant="outline" onClick={handleVerificarStockCotizacion} disabled={verificarStockMut.isPending}>
                  <AlertTriangle className="h-4 w-4 mr-2" />Verificar Stock
                </Button>
                <PrintDocument
                  title="Cotización"
                  folio={detail.folio}
                  fecha={detail.fecha}
                  clienteNombre={(detail as any).clientes?.nombre}
                  clienteRFC={(detail as any).clientes?.rfc}
                  clienteDireccion={(detail as any).clientes?.direccion}
                  clienteContacto={(detail as any).clientes?.contacto}
                  vendedor={detail.vendedor || undefined}
                  condiciones={detail.condiciones_pago || undefined}
                  moneda={detail.moneda || "MXN"}
                  notas={detail.notas || undefined}
                  subtotal={detail.subtotal}
                  iva={detail.iva}
                  total={detail.total}
                >
                  <table>
                    <thead><tr>
                      {["#","Descripción","Material","Cant","Unidad","Costo Mat","Hrs","$/Hr","Subtotal"].map(h => <th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {detail.cotizacion_items?.map((item: any, idx: number) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.descripcion}</td>
                          <td>{item.material || "—"}</td>
                          <td style={{textAlign:"right"}}>{Number(item.cantidad)}</td>
                          <td>{item.unidad}</td>
                          <td style={{textAlign:"right"}}>${Number(item.costo_material).toLocaleString("es-MX", {minimumFractionDigits:2})}</td>
                          <td style={{textAlign:"right"}}>{Number(item.tiempo_estimado_hrs)}</td>
                          <td style={{textAlign:"right"}}>${Number(item.costo_hora_maquina).toLocaleString("es-MX", {minimumFractionDigits:2})}</td>
                          <td style={{textAlign:"right",fontWeight:600}}>${Number(item.subtotal).toLocaleString("es-MX", {minimumFractionDigits:2})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </PrintDocument>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Items de la Cotización</h3>
                {detail.cotizacion_items?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        {["Descripción","Material","Cant","Costo Mat","Hrs","$/Hr","Subtotal","Origen",""].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {detail.cotizacion_items.map((item: any) => {
                          const linkedProd = item.inventario_id ? inventario?.find(i => i.id === item.inventario_id) : null;
                          return (
                            <tr key={item.id} className="border-b border-border/50">
                              <td className="py-2 px-3">{item.descripcion}</td>
                              <td className="py-2 px-3 text-muted-foreground">{item.material || "—"}</td>
                              <td className="py-2 px-3 font-mono">{Number(item.cantidad)}</td>
                              <td className="py-2 px-3 font-mono">${Number(item.costo_material).toLocaleString()}</td>
                              <td className="py-2 px-3 font-mono">{Number(item.tiempo_estimado_hrs)}</td>
                              <td className="py-2 px-3 font-mono">${Number(item.costo_hora_maquina).toLocaleString()}</td>
                              <td className="py-2 px-3 font-mono font-semibold">${Number(item.subtotal).toLocaleString()}</td>
                              <td className="py-2 px-3">
                                {linkedProd ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary" title={linkedProd.codigo}>
                                    <Package className="h-3 w-3 inline mr-0.5" />{linkedProd.codigo}
                                    {(linkedProd as any).es_fabricable && " 🏭"}
                                  </span>
                                ) : <span className="text-xs text-muted-foreground">Manual</span>}
                              </td>
                              <td className="py-2 px-3">
                                {detail.status !== "convertida" && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem(item.id)}>
                                    <X className="h-3 w-3 text-destructive" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-muted-foreground text-sm">Sin items aún</p>}

                {detail.status !== "convertida" && (
                  <div className="mt-4 p-4 rounded-lg bg-secondary/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Agregar Item a la Cotización</h4>
                      <div className="flex gap-1">
                        <Button variant={itemMode === "inventario" ? "default" : "outline"} size="sm" onClick={() => setItemMode("inventario")}>
                          <Package className="h-3 w-3 mr-1" />Desde Inventario
                        </Button>
                        <Button variant={itemMode === "manual" ? "default" : "outline"} size="sm" onClick={() => setItemMode("manual")}>
                          Manual
                        </Button>
                      </div>
                    </div>

                    {itemMode === "inventario" && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Seleccionar producto — el costo se calcula automáticamente desde su BOM</Label>
                        <Select value={selectedInventarioId} onValueChange={handleSelectProduct}>
                          <SelectTrigger><SelectValue placeholder="Buscar producto / material..." /></SelectTrigger>
                          <SelectContent>
                            {productosVendibles.length > 0 && (
                              <>
                                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">Productos (fabricables/vendibles)</div>
                                {productosVendibles.map(p => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.codigo} — {p.nombre} {(p as any).es_fabricable ? "🏭 (costo desde BOM)" : `($${Number(p.costo_unitario).toLocaleString()})`}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {inventario?.filter(i => !(i as any).puede_vender && !(i as any).es_fabricable).length ? (
                              <>
                                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase mt-1">Materias Primas / Insumos</div>
                                {inventario.filter(i => !(i as any).puede_vender && !(i as any).es_fabricable).map(m => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.codigo} — {m.nombre} (${Number(m.costo_unitario).toLocaleString()}/{m.unidad})
                                  </SelectItem>
                                ))}
                              </>
                            ) : null}
                          </SelectContent>
                        </Select>
                        {bomCostLoading && <p className="text-xs text-primary animate-pulse">Calculando costo desde BOM...</p>}
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Descripción *</Label>
                        <Input placeholder="Ej: Eje de acero para bomba" value={itemForm.descripcion} onChange={e => setItemForm({...itemForm, descripcion: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Material</Label>
                        <Input placeholder="Ej: Acero 4140" value={itemForm.material} onChange={e => setItemForm({...itemForm, material: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Cantidad</Label>
                        <Input type="number" value={itemForm.cantidad} onChange={e => setItemForm({...itemForm, cantidad: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Costo material por pieza ($)</Label>
                        <Input type="number" value={itemForm.costo_material} onChange={e => setItemForm({...itemForm, costo_material: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Horas estimadas</Label>
                        <Input type="number" value={itemForm.tiempo_estimado_hrs} onChange={e => setItemForm({...itemForm, tiempo_estimado_hrs: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Costo por hora ($)</Label>
                        <Input type="number" value={itemForm.costo_hora_maquina} onChange={e => setItemForm({...itemForm, costo_hora_maquina: Number(e.target.value)})} />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddItem} disabled={createItemMut.isPending} className="w-full">Agregar</Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Subtotal = (Costo material × Cant) + (Hrs × $/Hr)</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Verificación de Stock — {detail?.folio}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {stockResults.map((r, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-sm font-semibold">{r.producto} (×{r.cantidad})</p>
                {r.faltantes.length === 0 ? (
                  <p className="text-xs text-success">✓ Stock completo</p>
                ) : (
                  <div className="text-xs space-y-1">
                    {r.faltantes.map((f: any, fi: number) => (
                      <p key={fi} className="text-destructive">⚠ {f.nombre}: necesita {f.necesario * r.cantidad}, tiene {f.disponible} → falta {f.faltante * r.cantidad} {f.unidad}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {faltantesAjustados.length > 0 && (
              <Button onClick={handleGenerarOCFaltantes} className="w-full" disabled={generarOCMut.isPending}>
                <ShoppingCart className="h-4 w-4 mr-2" />Generar OC con Faltantes
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cotizaciones;
