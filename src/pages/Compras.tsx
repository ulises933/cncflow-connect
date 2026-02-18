import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Eye, Trash2, PackageCheck, Package, TruckIcon } from "lucide-react";
import PrintDocument from "@/components/PrintDocument";
import { useOrdenesCompra, useOrdenCompra, useCreateOrdenCompra, useUpdateOrdenCompra, useDeleteOrdenCompra, useCreateOrdenCompraItem, useProveedores, useCreateProveedor, useRecibirOrdenCompra, useRecibirParcialOC } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const sc: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-warning/20 text-warning" },
  ordenado: { label: "Ordenado", cls: "bg-info/20 text-info" },
  recibido: { label: "Recibido", cls: "bg-success/20 text-success" },
  parcial: { label: "Parcial", cls: "bg-primary/20 text-primary" },
};

const Compras = () => {
  const { data: ordenes, isLoading } = useOrdenesCompra();
  const { data: proveedores } = useProveedores();
  const createMut = useCreateOrdenCompra();
  const updateMut = useUpdateOrdenCompra();
  const deleteMut = useDeleteOrdenCompra();
  const createProvMut = useCreateProveedor();
  const createItemMut = useCreateOrdenCompraItem();
  const recibirMut = useRecibirOrdenCompra();
  const recibirParcialMut = useRecibirParcialOC();
  const [createOpen, setCreateOpen] = useState(false);
  const [provOpen, setProvOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [entregaOpen, setEntregaOpen] = useState(false);
  const [entregaCantidades, setEntregaCantidades] = useState<Record<string, number>>({});
  const { data: detail } = useOrdenCompra(detailId);
  const [form, setForm] = useState({ proveedor_id: "", notas: "" });
  const [provForm, setProvForm] = useState({ nombre: "", contacto: "", email: "", telefono: "" });
  const [itemForm, setItemForm] = useState({ material: "", cantidad: 1, unidad: "pza", precio_unitario: 0 });

  const handleCreate = async () => {
    const res = await createMut.mutateAsync({ proveedor_id: form.proveedor_id || undefined, notas: form.notas || undefined });
    setCreateOpen(false);
    setForm({ proveedor_id: "", notas: "" });
    setDetailId(res.id);
  };

  const handleCreateProv = async () => {
    if (!provForm.nombre.trim()) return;
    await createProvMut.mutateAsync(provForm);
    setProvOpen(false);
    setProvForm({ nombre: "", contacto: "", email: "", telefono: "" });
  };

  const handleAddItem = async () => {
    if (!detailId || !itemForm.material.trim()) return;
    const subtotal = itemForm.cantidad * itemForm.precio_unitario;
    await createItemMut.mutateAsync({ orden_compra_id: detailId, ...itemForm, subtotal });
    const newTotal = ((detail as any)?.ordenes_compra_items?.reduce((s: number, i: any) => s + Number(i.subtotal), 0) || 0) + subtotal;
    await updateMut.mutateAsync({ id: detailId, total: newTotal });
    setItemForm({ material: "", cantidad: 1, unidad: "pza", precio_unitario: 0 });
  };

  const handleRecibir = async (id: string) => {
    await recibirMut.mutateAsync(id);
    setDetailId(null);
  };

  const handleOpenEntrega = () => {
    const items = (detail as any)?.ordenes_compra_items || [];
    const init: Record<string, number> = {};
    items.forEach((item: any) => {
      const faltante = Number(item.cantidad) - Number(item.cantidad_recibida || 0);
      init[item.id] = Math.max(0, faltante);
    });
    setEntregaCantidades(init);
    setEntregaOpen(true);
  };

  const handleConfirmEntrega = async () => {
    if (!detailId) return;
    const entregas = Object.entries(entregaCantidades)
      .filter(([_, cant]) => cant > 0)
      .map(([itemId, cantidadRecibida]) => ({ itemId, cantidadRecibida }));
    if (!entregas.length) {
      toast.error("Ingresa al menos una cantidad recibida");
      return;
    }
    await recibirParcialMut.mutateAsync({ ocId: detailId, entregas });
    setEntregaOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compras</h1>
          <p className="text-muted-foreground">Órdenes de compra y proveedores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setProvOpen(true)}><Plus className="h-4 w-4 mr-2" />Proveedor</Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nueva Orden</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !ordenes?.length ? <div className="p-8 text-center text-muted-foreground">No hay órdenes de compra.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["OC","Proveedor","BOM","Estado","Total","Fecha",""].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {ordenes.map((o: any) => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-primary">{o.folio}</td>
                      <td className="py-3 px-4 text-foreground">{o.proveedores?.nombre || "—"}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{o.bom?.folio || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc[o.status]?.cls}`}>{sc[o.status]?.label}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground">${Number(o.total).toLocaleString()}</td>
                      <td className="py-3 px-4 text-muted-foreground">{o.fecha}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailId(o.id)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      {/* OC Detail */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>OC {detail?.folio} — {(detail as any)?.proveedores?.nombre || "Sin proveedor"}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-3 gap-4 text-sm flex-1">
                  <div><p className="text-muted-foreground">Estado</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${sc[detail.status]?.cls}`}>{sc[detail.status]?.label}</span></div>
                  <div><p className="text-muted-foreground">BOM</p><p className="font-mono">{(detail as any)?.bom?.folio || "—"}</p></div>
                  <div><p className="text-muted-foreground">Total</p><p className="font-mono font-semibold text-primary">${Number(detail.total).toLocaleString()}</p></div>
                </div>
                <PrintDocument
                  title="Orden de Compra"
                  folio={detail.folio}
                  fecha={detail.fecha}
                  clienteNombre={(detail as any)?.proveedores?.nombre}
                  clienteContacto={(detail as any)?.proveedores?.contacto}
                  notas={detail.notas || undefined}
                  total={detail.total}
                >
                  <table>
                    <thead><tr>
                      {["#","Material","Cantidad","Unidad","Precio Unit.","Subtotal"].map(h => <th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {(detail as any).ordenes_compra_items?.map((item: any, idx: number) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.material}</td>
                          <td style={{textAlign:"right"}}>{Number(item.cantidad)}</td>
                          <td>{item.unidad}</td>
                          <td style={{textAlign:"right"}}>${Number(item.precio_unitario).toLocaleString("es-MX", {minimumFractionDigits:2})}</td>
                          <td style={{textAlign:"right",fontWeight:600}}>${Number(item.subtotal).toLocaleString("es-MX", {minimumFractionDigits:2})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </PrintDocument>
              </div>

              <h3 className="font-semibold">Items</h3>
              {(detail as any).ordenes_compra_items?.length ? (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["Material","Ordenado","Recibido","Avance","Precio Unit.","Subtotal"].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground text-xs">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(detail as any).ordenes_compra_items.map((item: any) => {
                      const recibido = Number(item.cantidad_recibida || 0);
                      const total = Number(item.cantidad);
                      const pct = total > 0 ? Math.min(100, Math.round((recibido / total) * 100)) : 0;
                      const isComplete = recibido >= total;
                      return (
                        <tr key={item.id} className="border-b border-border/50">
                          <td className="py-2 px-3 font-semibold">{item.material}</td>
                          <td className="py-2 px-3 font-mono">{total} {item.unidad}</td>
                          <td className="py-2 px-3">
                            <span className={`font-mono ${isComplete ? "text-success" : recibido > 0 ? "text-primary" : "text-muted-foreground"}`}>
                              {recibido} {item.unidad}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="h-1.5 w-16" />
                              <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono">${Number(item.precio_unitario).toLocaleString()}</td>
                          <td className="py-2 px-3 font-mono font-semibold">${Number(item.subtotal).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <p className="text-muted-foreground text-sm">Sin items</p>}

              {detail.status !== "recibido" && (
                <>
                  <div className="p-4 rounded-lg bg-secondary/50 space-y-4">
                    <h4 className="text-sm font-semibold">Agregar Item a la Orden de Compra</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Material o insumo a comprar *</Label>
                        <Input placeholder='Ej: Acero 4140 Ø2" x 12"' value={itemForm.material} onChange={e => setItemForm({...itemForm, material: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Cantidad a ordenar</Label>
                        <Input type="number" placeholder="Ej: 50" value={itemForm.cantidad} onChange={e => setItemForm({...itemForm, cantidad: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Unidad de medida</Label>
                        <Input placeholder="Ej: pza, kg, m" value={itemForm.unidad} onChange={e => setItemForm({...itemForm, unidad: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Precio unitario ($)</Label>
                        <Input type="number" placeholder="Ej: 350.00" value={itemForm.precio_unitario} onChange={e => setItemForm({...itemForm, precio_unitario: Number(e.target.value)})} />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddItem} disabled={createItemMut.isPending} className="w-full">Agregar</Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleOpenEntrega} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                      <TruckIcon className="h-4 w-4 mr-2" />Registrar Entrega Parcial
                    </Button>
                    <Button onClick={() => handleRecibir(detail.id)} className="bg-success hover:bg-success/90 text-success-foreground" disabled={recibirMut.isPending}>
                      <PackageCheck className="h-4 w-4 mr-2" />Recibir Todo
                    </Button>
                  </div>
                </>
              )}

              {detail.notas && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{detail.notas}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Entrega Parcial Dialog */}
      <Dialog open={entregaOpen} onOpenChange={setEntregaOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><TruckIcon className="h-5 w-5 text-primary" />Registrar Entrega Parcial</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Ingresa la cantidad que recibes en esta entrega para cada item. Solo se sumará al inventario lo que ingreses aquí.</p>
          <div className="space-y-3 mt-2">
            {(detail as any)?.ordenes_compra_items?.map((item: any) => {
              const recibido = Number(item.cantidad_recibida || 0);
              const total = Number(item.cantidad);
              const faltante = Math.max(0, total - recibido);
              const isComplete = faltante <= 0;
              return (
                <div key={item.id} className={`p-3 rounded-lg border ${isComplete ? "bg-success/5 border-success/30" : "bg-secondary/50 border-border"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{item.material}</p>
                      <p className="text-xs text-muted-foreground">
                        Ordenado: <span className="font-mono">{total}</span> {item.unidad} · 
                        Recibido: <span className="font-mono text-primary">{recibido}</span> · 
                        Faltante: <span className={`font-mono ${faltante > 0 ? "text-warning" : "text-success"}`}>{faltante}</span>
                      </p>
                    </div>
                    {isComplete && <span className="text-xs text-success font-semibold">✓ Completo</span>}
                  </div>
                  {!isComplete && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs shrink-0">Recibir ahora:</Label>
                      <Input
                        type="number"
                        min={0}
                        max={faltante}
                        value={entregaCantidades[item.id] || 0}
                        onChange={e => setEntregaCantidades(prev => ({
                          ...prev,
                          [item.id]: Math.min(Number(e.target.value), faltante),
                        }))}
                        className="w-24 h-8"
                      />
                      <span className="text-xs text-muted-foreground">{item.unidad} (máx: {faltante})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Button onClick={handleConfirmEntrega} className="w-full mt-2" disabled={recibirParcialMut.isPending}>
            <Package className="h-4 w-4 mr-2" />{recibirParcialMut.isPending ? "Registrando..." : "Confirmar Entrega"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Create OC */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Orden de Compra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Proveedor</Label>
              <p className="text-xs text-muted-foreground">Empresa o persona a la que se le compra el material</p>
              <Select value={form.proveedor_id} onValueChange={v => setForm({...form, proveedor_id: v})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                <SelectContent>{proveedores?.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notas u observaciones</Label>
              <p className="text-xs text-muted-foreground">Instrucciones especiales de entrega, urgencia, etc.</p>
              <Input value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Ej: Entregar en almacén 2, urgente" />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={createMut.isPending}>Crear OC</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Provider */}
      <Dialog open={provOpen} onOpenChange={setProvOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Proveedor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre de la empresa *</Label>
              <p className="text-xs text-muted-foreground">Razón social o nombre comercial del proveedor</p>
              <Input value={provForm.nombre} onChange={e => setProvForm({...provForm, nombre: e.target.value})} placeholder="Ej: Aceros Monterrey S.A. de C.V." />
            </div>
            <div className="space-y-1">
              <Label>Persona de contacto</Label>
              <p className="text-xs text-muted-foreground">Nombre del vendedor o representante con el que tratas</p>
              <Input value={provForm.contacto} onChange={e => setProvForm({...provForm, contacto: e.target.value})} placeholder="Ej: Ing. Carlos López" />
            </div>
            <div className="space-y-1">
              <Label>Email de contacto</Label>
              <Input type="email" value={provForm.email} onChange={e => setProvForm({...provForm, email: e.target.value})} placeholder="Ej: ventas@acerosmonterrey.com" />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input value={provForm.telefono} onChange={e => setProvForm({...provForm, telefono: e.target.value})} placeholder="Ej: (81) 1234-5678" />
            </div>
            <Button onClick={handleCreateProv} className="w-full" disabled={createProvMut.isPending}>Crear Proveedor</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compras;
