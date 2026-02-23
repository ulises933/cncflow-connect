import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, ArrowRightLeft, AlertTriangle, ShoppingCart, Package } from "lucide-react";
import PrintDocument from "@/components/PrintDocument";
import { useCotizaciones, useCotizacion, useConvertirCotizacion, useInventario, useVerificarStock, useGenerarOCFromFaltantes, useGenerarOCDirecta, useProveedores } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  venta: "bg-success/20 text-success",
  convertida: "bg-primary/20 text-primary",
};
const statusLabels: Record<string, string> = {
  venta: "Orden de Venta",
  convertida: "Convertida a OP",
};

const Ventas = () => {
  const { data: allCotizaciones, isLoading } = useCotizaciones();
  const { data: inventario } = useInventario();
  const convertMut = useConvertirCotizacion();
  const verificarStockMut = useVerificarStock();
  const generarOCMut = useGenerarOCFromFaltantes();
  const generarOCDirectaMut = useGenerarOCDirecta();
  const { data: proveedores } = useProveedores();

  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detail } = useCotizacion(detailId);
  const [filter, setFilter] = useState("all");

  // Stock verification
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockResults, setStockResults] = useState<any[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<string>("");

  // Only show ventas (confirmed) and convertidas
  const ventas = allCotizaciones?.filter(c => c.status === "venta" || c.status === "convertida") || [];
  const filtered = filter === "all" ? ventas : ventas.filter(v => v.status === filter);

  const handleConvert = async (id: string) => {
    await convertMut.mutateAsync(id);
    setDetailId(null);
  };

  const handleVerificarStock = async () => {
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
      toast.info("No hay productos fabricables vinculados en esta orden");
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

  const handleGenerarOCDirecta = async () => {
    if (!detail?.cotizacion_items) return;
    const provId = selectedProveedor || undefined;
    for (const item of detail.cotizacion_items) {
      const invId = (item as any).inventario_id;
      if (!invId) continue;
      const prod = inventario?.find(i => i.id === invId);
      if (!prod || !(prod as any).es_fabricable) continue;
      await generarOCDirectaMut.mutateAsync({ productoId: invId, cantidad: Number(item.cantidad), proveedorId: provId });
    }
  };

  const totalVentas = ventas.filter(v => v.status === "venta").reduce((s, v) => s + Number(v.total), 0);
  const totalConvertidas = ventas.filter(v => v.status === "convertida").reduce((s, v) => s + Number(v.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Órdenes de Venta</h1>
          <p className="text-muted-foreground">Cotizaciones confirmadas como ventas</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ventas Activas</p>
            <p className="text-2xl font-bold text-foreground">{ventas.filter(v => v.status === "venta").length}</p>
            <p className="text-sm font-mono text-success">${totalVentas.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Convertidas a Producción</p>
            <p className="text-2xl font-bold text-foreground">{ventas.filter(v => v.status === "convertida").length}</p>
            <p className="text-sm font-mono text-primary">${totalConvertidas.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total General</p>
            <p className="text-2xl font-bold text-foreground">{ventas.length}</p>
            <p className="text-sm font-mono text-foreground">${(totalVentas + totalConvertidas).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "venta", "convertida"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "all" ? "Todas" : statusLabels[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            : !filtered.length ? <div className="p-8 text-center text-muted-foreground">No hay órdenes de venta.</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Folio", "Cliente", "Descripción", "Estado", "Total", "Fecha", "Acciones"].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(v => (
                      <tr key={v.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-primary">{v.folio}</td>
                        <td className="py-3 px-4 text-foreground">{(v as any).clientes?.nombre || "—"}</td>
                        <td className="py-3 px-4 text-foreground">{v.titulo}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[v.status]}`}>
                            {statusLabels[v.status]}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-foreground">${Number(v.total).toLocaleString()}</td>
                        <td className="py-3 px-4 text-muted-foreground">{v.fecha}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setDetailId(v.id)}><Eye className="h-4 w-4" /></Button>
                            {v.status === "venta" && (
                              <Button variant="ghost" size="icon" onClick={() => handleConvert(v.id)} title="Convertir a OP + BOM">
                                <ArrowRightLeft className="h-4 w-4 text-success" />
                              </Button>
                            )}
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

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Orden de Venta {detail?.folio}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground">Cliente</p><p className="font-semibold">{(detail as any).clientes?.nombre || "—"}</p></div>
                <div><p className="text-muted-foreground">Estado</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[detail.status]}`}>
                    {statusLabels[detail.status] || detail.status}
                  </span>
                </div>
                <div><p className="text-muted-foreground">Subtotal</p><p className="font-mono font-semibold">${Number(detail.subtotal).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Total (c/IVA)</p><p className="font-mono font-semibold text-primary">${Number(detail.total).toLocaleString()}</p></div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {detail.status === "venta" && (
                  <Button onClick={() => handleConvert(detail.id)} className="bg-success hover:bg-success/90 text-success-foreground" disabled={convertMut.isPending}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />{convertMut.isPending ? "Convirtiendo..." : "Convertir a OP + BOM"}
                  </Button>
                )}
                <Button variant="outline" onClick={handleVerificarStock} disabled={verificarStockMut.isPending}>
                  <AlertTriangle className="h-4 w-4 mr-2" />Verificar Stock
                </Button>
                <div className="flex items-center gap-2">
                  <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleGenerarOCDirecta} disabled={generarOCDirectaMut.isPending}>
                    <ShoppingCart className="h-4 w-4 mr-2" />{generarOCDirectaMut.isPending ? "Generando..." : "Generar OC"}
                  </Button>
                </div>
                <PrintDocument
                  title="Orden de Venta"
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
                      {["#", "Descripción", "Material", "Cant", "Unidad", "Costo Mat", "Hrs", "$/Hr", "Subtotal"].map(h => <th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {detail.cotizacion_items?.map((item: any, idx: number) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.descripcion}</td>
                          <td>{item.material || "—"}</td>
                          <td style={{ textAlign: "right" }}>{Number(item.cantidad)}</td>
                          <td>{item.unidad}</td>
                          <td style={{ textAlign: "right" }}>${Number(item.costo_material).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: "right" }}>{Number(item.tiempo_estimado_hrs)}</td>
                          <td style={{ textAlign: "right" }}>${Number(item.costo_hora_maquina).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>${Number(item.subtotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </PrintDocument>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="font-semibold mb-3">Items de la Orden</h3>
                {detail.cotizacion_items?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        {["Descripción", "Material", "Cant", "Costo Mat", "Hrs", "$/Hr", "Subtotal", "Origen"].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                        ))}
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
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                                    <Package className="h-3 w-3 inline mr-0.5" />{linkedProd.codigo}
                                  </span>
                                ) : <span className="text-xs text-muted-foreground">Manual</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-muted-foreground text-sm">Sin items</p>}
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

export default Ventas;
