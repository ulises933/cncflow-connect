import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Eye, X, ShoppingCart, PackagePlus } from "lucide-react";
import { useBoms, useBom, useCreateBom, useUpdateBom, useCreateBomItem, useDeleteBomItem, useProveedores, useGenerarOCFromBom, useInventario, useCreateInventario } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";

const sc: Record<string, string> = { activo: "bg-success/20 text-success", borrador: "bg-warning/20 text-warning", obsoleto: "bg-secondary text-muted-foreground" };

const BOM = () => {
  const { data: boms, isLoading } = useBoms();
  const { data: proveedores } = useProveedores();
  const { data: inventario } = useInventario();
  const createMut = useCreateBom();
  const updateBomMut = useUpdateBom();
  const createItemMut = useCreateBomItem();
  const deleteItemMut = useDeleteBomItem();
  const generarOCMut = useGenerarOCFromBom();
  const createInvMut = useCreateInventario();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detail } = useBom(detailId);
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [form, setForm] = useState({ producto: "", version: "v1.0" });

  // Item form — now linked to inventory
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [itemForm, setItemForm] = useState({ cantidad: 1, unidad: "pza", costo_unitario: 0 });

  // Create new material inline
  const [newMatOpen, setNewMatOpen] = useState(false);
  const [newMat, setNewMat] = useState({ codigo: "", nombre: "", unidad: "pza", costo_unitario: 0, tipo: "materia_prima" as string });

  const [ocProvId, setOcProvId] = useState("");
  const [ocOpen, setOcOpen] = useState(false);

  const productosFabricables = inventario?.filter(i => (i as any).es_fabricable || (i as any).puede_vender) || [];
  // Materials for BOM = everything in inventory (materia prima, consumible, etc.)
  const materialesDisponibles = inventario || [];

  const handleSelectProducto = (invId: string) => {
    const prod = inventario?.find(i => i.id === invId);
    if (prod) {
      setSelectedProductoId(invId);
      setForm({ ...form, producto: prod.nombre });
    }
  };

  const handleSelectMaterial = (invId: string) => {
    const mat = inventario?.find(i => i.id === invId);
    if (mat) {
      setSelectedMaterialId(invId);
      setItemForm({ ...itemForm, unidad: mat.unidad, costo_unitario: Number(mat.costo_unitario) });
    }
  };

  const handleCreate = async () => {
    if (!form.producto.trim()) return;
    const res = await createMut.mutateAsync(form);
    setCreateOpen(false);
    setForm({ producto: "", version: "v1.0" });
    setSelectedProductoId("");
    setDetailId(res.id);
  };

  const handleAddItem = async () => {
    if (!detailId || !selectedMaterialId) return;
    const mat = inventario?.find(i => i.id === selectedMaterialId);
    if (!mat) return;
    const costo_total = itemForm.cantidad * itemForm.costo_unitario;
    await createItemMut.mutateAsync({
      bom_id: detailId,
      material: mat.nombre,
      descripcion: `${mat.codigo} — ${mat.especificacion || mat.categoria || ""}`.trim(),
      cantidad: itemForm.cantidad,
      unidad: itemForm.unidad,
      costo_unitario: itemForm.costo_unitario,
      costo_total,
    });
    setSelectedMaterialId("");
    setItemForm({ cantidad: 1, unidad: "pza", costo_unitario: 0 });
    const newTotal = (detail?.bom_items?.reduce((s: number, i: any) => s + Number(i.costo_total), 0) || 0) + costo_total;
    await updateBomMut.mutateAsync({ id: detailId, costo_total: newTotal });
  };

  const handleDeleteItem = async (itemId: string, itemCost: number) => {
    if (!detailId) return;
    await deleteItemMut.mutateAsync({ id: itemId, bom_id: detailId });
    const newTotal = Math.max(0, (Number(detail?.costo_total) || 0) - itemCost);
    await updateBomMut.mutateAsync({ id: detailId, costo_total: newTotal });
  };

  const handleGenerarOC = async () => {
    if (!detailId) return;
    await generarOCMut.mutateAsync({ bomId: detailId, proveedorId: ocProvId || undefined });
    setOcOpen(false);
    setOcProvId("");
  };

  const handleCreateMaterial = async () => {
    if (!newMat.codigo.trim() || !newMat.nombre.trim()) return;
    const created = await createInvMut.mutateAsync(newMat);
    setNewMatOpen(false);
    setNewMat({ codigo: "", nombre: "", unidad: "pza", costo_unitario: 0, tipo: "materia_prima" });
    // Auto-select newly created material
    setSelectedMaterialId(created.id);
    setItemForm({ ...itemForm, unidad: created.unidad, costo_unitario: Number(created.costo_unitario) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bill of Materials</h1>
          <p className="text-muted-foreground">Lista de materiales necesarios para fabricar cada producto</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nuevo BOM</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !boms?.length ? <div className="p-8 text-center text-muted-foreground">No hay BOMs.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Folio","Producto","Versión","Cotización","Orden","Costo","Estado",""].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {boms.map((b: any) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => setDetailId(b.id)}>
                      <td className="py-3 px-4 font-mono text-primary">{b.folio}</td>
                      <td className="py-3 px-4 text-foreground">{b.producto}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{b.version}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{b.cotizaciones?.folio || "—"}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{b.ordenes_produccion?.folio || "—"}</td>
                      <td className="py-3 px-4 font-mono text-foreground">${Number(b.costo_total).toLocaleString()}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${sc[b.status]}`}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span></td>
                      <td className="py-3 px-4"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE BOM */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo BOM (Lista de Materiales)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Seleccionar producto del inventario</Label>
              <p className="text-xs text-muted-foreground">Elige un producto fabricable existente o escribe uno nuevo</p>
              <Select value={selectedProductoId} onValueChange={handleSelectProducto}>
                <SelectTrigger><SelectValue placeholder="Buscar producto fabricable..." /></SelectTrigger>
                <SelectContent>
                  {productosFabricables.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo} — {p.nombre} {(p as any).es_fabricable ? "🏭" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Producto o pieza a fabricar *</Label>
              <Input value={form.producto} onChange={e => setForm({...form, producto: e.target.value})} placeholder="Ej: Eje principal bomba hidráulica" />
            </div>
            <div className="space-y-1">
              <Label>Versión del BOM</Label>
              <Input value={form.version} onChange={e => setForm({...form, version: e.target.value})} placeholder="Ej: v1.0, v2.1" />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={createMut.isPending}>Crear BOM</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DETAIL */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>BOM {detail?.folio} — {detail?.producto}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-muted-foreground">Versión</p><p className="font-semibold">{detail.version}</p></div>
                <div><p className="text-muted-foreground">Cotización</p><p className="font-mono">{(detail as any).cotizaciones?.folio || "—"}</p></div>
                <div><p className="text-muted-foreground">Costo Total</p><p className="font-mono font-semibold text-primary">${Number(detail.costo_total).toLocaleString()}</p></div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOcOpen(true)} disabled={!detail.bom_items?.length}>
                  <ShoppingCart className="h-4 w-4 mr-2" />Generar Orden de Compra
                </Button>
              </div>

              <h3 className="font-semibold">Componentes / Materiales</h3>
              {detail.bom_items?.length ? (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["Material","Descripción","Cant","Unidad","Costo Unit.","Total",""].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground text-xs">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {detail.bom_items.map((item: any) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2 px-3 font-semibold">{item.material}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.descripcion || "—"}</td>
                        <td className="py-2 px-3 font-mono">{Number(item.cantidad)}</td>
                        <td className="py-2 px-3">{item.unidad}</td>
                        <td className="py-2 px-3 font-mono">${Number(item.costo_unitario).toLocaleString()}</td>
                        <td className="py-2 px-3 font-mono font-semibold">${Number(item.costo_total).toLocaleString()}</td>
                        <td className="py-2 px-3"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem(item.id, Number(item.costo_total))}><X className="h-3 w-3 text-destructive" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted-foreground text-sm">Sin componentes</p>}

              {/* ADD COMPONENT — Select from inventory */}
              <div className="p-4 rounded-lg bg-secondary/50 space-y-4">
                <h4 className="text-sm font-semibold">Agregar Componente al BOM</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Material del inventario *</Label>
                    <div className="flex gap-2">
                      <Select value={selectedMaterialId} onValueChange={handleSelectMaterial}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar material..." /></SelectTrigger>
                        <SelectContent>
                          {materialesDisponibles.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.codigo} — {m.nombre} ({m.stock} {m.unidad})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" onClick={() => setNewMatOpen(true)} title="Crear nuevo material">
                        <PackagePlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Si el material no existe, créalo con el botón +</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Cantidad necesaria</Label>
                    <Input type="number" placeholder="Ej: 2" value={itemForm.cantidad} onChange={e => setItemForm({...itemForm, cantidad: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Costo unitario ($)</Label>
                    <Input type="number" placeholder="Ej: 180.00" value={itemForm.costo_unitario} onChange={e => setItemForm({...itemForm, costo_unitario: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Costo total = Cantidad × Costo Unitario = <span className="font-semibold">${(itemForm.cantidad * itemForm.costo_unitario).toLocaleString()}</span></p>
                  <Button onClick={handleAddItem} disabled={createItemMut.isPending || !selectedMaterialId}>Agregar</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE NEW MATERIAL INLINE */}
      <Dialog open={newMatOpen} onOpenChange={setNewMatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear Nuevo Material en Inventario</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Este material se agregará al inventario y quedará disponible para seleccionar en el BOM.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Código *</Label>
                <Input value={newMat.codigo} onChange={e => setNewMat({...newMat, codigo: e.target.value})} placeholder="Ej: MP-001" />
              </div>
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input value={newMat.nombre} onChange={e => setNewMat({...newMat, nombre: e.target.value})} placeholder="Ej: Acero 4140 Ø2&quot;" />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={newMat.tipo} onValueChange={v => setNewMat({...newMat, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materia_prima">Materia Prima</SelectItem>
                    <SelectItem value="consumible">Consumible</SelectItem>
                    <SelectItem value="herramienta">Herramienta</SelectItem>
                    <SelectItem value="componente">Componente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Unidad</Label>
                <Select value={newMat.unidad} onValueChange={v => setNewMat({...newMat, unidad: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pza">Pieza</SelectItem>
                    <SelectItem value="kg">Kilogramo</SelectItem>
                    <SelectItem value="m">Metro</SelectItem>
                    <SelectItem value="lt">Litro</SelectItem>
                    <SelectItem value="ft">Pie</SelectItem>
                    <SelectItem value="in">Pulgada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Costo Unitario ($)</Label>
                <Input type="number" value={newMat.costo_unitario} onChange={e => setNewMat({...newMat, costo_unitario: Number(e.target.value)})} placeholder="0" />
              </div>
            </div>
            <Button onClick={handleCreateMaterial} className="w-full" disabled={createInvMut.isPending || !newMat.codigo.trim() || !newMat.nombre.trim()}>
              {createInvMut.isPending ? "Creando..." : "Crear Material y Seleccionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* OC DIALOG */}
      <Dialog open={ocOpen} onOpenChange={setOcOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generar Orden de Compra desde BOM</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Se creará una Orden de Compra con todos los componentes del BOM como items.</p>
            <div className="space-y-1">
              <Label>Proveedor (opcional)</Label>
              <Select value={ocProvId} onValueChange={setOcProvId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proveedor</SelectItem>
                  {proveedores?.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerarOC} className="w-full" disabled={generarOCMut.isPending}>
              {generarOCMut.isPending ? "Generando..." : "Generar OC"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BOM;
