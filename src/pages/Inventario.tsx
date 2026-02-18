import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Package, List, AlertTriangle, ShoppingCart, Search, Settings2, Clock, ArrowDown } from "lucide-react";
import { useInventario, useCreateInventario, useUpdateInventario, useDeleteInventario, useInventarioBom, useCreateInventarioBom, useDeleteInventarioBom, useVerificarStock, useGenerarOCFromFaltantes, useProveedores, useMaquinas, useProductoProcesos, useCreateProductoProceso, useUpdateProductoProceso, useDeleteProductoProceso } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const tipoLabels: Record<string, string> = { materia_prima: "Materia Prima", en_proceso: "En Proceso", terminado: "Prod. Terminado", herramienta: "Herramienta", insumo: "Insumo" };
const rutaLabels: Record<string, string> = { comprar: "Comprar", fabricar: "Fabricar", ambas: "Comprar o Fabricar" };
const categoriaMaterialLabels: Record<string, string> = { general: "General", aceros: "Aceros", aluminios: "Aluminios", plasticos: "Plásticos", consumibles: "Consumibles", tornilleria: "Tornillería", electricos: "Eléctricos", herramientas: "Herramientas de corte", otros: "Otros" };

const procesoTipos = [
  { value: "maquinado", label: "Maquinado CNC" }, { value: "torneado", label: "Torneado" },
  { value: "fresado", label: "Fresado" }, { value: "rectificado", label: "Rectificado" },
  { value: "taladrado", label: "Taladrado" }, { value: "roscado", label: "Roscado" },
  { value: "soldadura", label: "Soldadura" }, { value: "tratamiento", label: "Tratamiento Térmico" },
  { value: "recubrimiento", label: "Recubrimiento" }, { value: "ensamble", label: "Ensamble" },
  { value: "inspeccion", label: "Inspección" }, { value: "empaque", label: "Empaque" },
  { value: "pegado", label: "Pegado / Adhesivos" }, { value: "desbarbado", label: "Desbarbado Manual" },
  { value: "limpieza", label: "Limpieza" }, { value: "pintura", label: "Pintura / Acabado Manual" },
  { value: "manual", label: "Proceso Manual" }, { value: "otro", label: "Otro" },
];

const cncTipos = new Set(["maquinado", "torneado", "fresado", "rectificado", "taladrado", "roscado"]);

const Inventario = () => {
  const { data: items, isLoading } = useInventario();
  const { data: proveedores } = useProveedores();
  const { data: maquinas } = useMaquinas();
  const createMut = useCreateInventario();
  const updateMut = useUpdateInventario();
  const deleteMut = useDeleteInventario();
  const verificarStockMut = useVerificarStock();
  const generarOCMut = useGenerarOCFromFaltantes();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterRuta, setFilterRuta] = useState("all");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [bomProductoId, setBomProductoId] = useState<string | null>(null);
  const [stockResult, setStockResult] = useState<any>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("bom");

  const [form, setForm] = useState({
    codigo: "", nombre: "", tipo: "materia_prima", stock: 0, unidad: "pza",
    stock_minimo: 0, costo_unitario: 0, es_fabricable: false, ruta: "comprar",
    puede_vender: false, categoria: "general", categoria_material: "general",
  });

  const bomProducto = items?.find(i => i.id === bomProductoId);
  const { data: bomItems } = useInventarioBom(bomProductoId);
  const createBomMut = useCreateInventarioBom();
  const deleteBomMut = useDeleteInventarioBom();
  const [bomForm, setBomForm] = useState({ material_id: "", cantidad: 1, unidad: "pza", notas: "" });

  // Process routes
  const { data: productoProcesos } = useProductoProcesos(bomProductoId);
  const createProcMut = useCreateProductoProceso();
  const updateProcMut = useUpdateProductoProceso();
  const deleteProcMut = useDeleteProductoProceso();
  const [editingProc, setEditingProc] = useState<any>(null);
  const [procForm, setProcForm] = useState({
    nombre: "", tipo: "maquinado", tiempo_estimado_hrs: 0, maquina_id: "",
    herramienta: "", programa_cnc: "", fixture: "", rpm: 0,
    velocidad_corte: 0, profundidad_corte: 0, refrigerante: "", notas: "",
  });
  const [procOpen, setProcOpen] = useState(false);

  const handleOpenProc = (proc?: any) => {
    if (proc) {
      setEditingProc(proc);
      setProcForm({
        nombre: proc.nombre, tipo: proc.tipo, tiempo_estimado_hrs: Number(proc.tiempo_estimado_hrs),
        maquina_id: proc.maquina_id || "", herramienta: proc.herramienta || "",
        programa_cnc: proc.programa_cnc || "", fixture: proc.fixture || "",
        rpm: Number(proc.rpm) || 0, velocidad_corte: Number(proc.velocidad_corte) || 0,
        profundidad_corte: Number(proc.profundidad_corte) || 0,
        refrigerante: proc.refrigerante || "", notas: proc.notas || "",
      });
    } else {
      setEditingProc(null);
      setProcForm({ nombre: "", tipo: "maquinado", tiempo_estimado_hrs: 0, maquina_id: "", herramienta: "", programa_cnc: "", fixture: "", rpm: 0, velocidad_corte: 0, profundidad_corte: 0, refrigerante: "", notas: "" });
    }
    setProcOpen(true);
  };

  // Filters
  let filtered = items || [];
  if (filterTipo !== "all") filtered = filtered.filter(i => i.tipo === filterTipo);
  if (filterRuta !== "all") {
    if (filterRuta === "fabricable") filtered = filtered.filter(i => (i as any).es_fabricable);
    else if (filterRuta === "vendible") filtered = filtered.filter(i => (i as any).puede_vender);
  }
  if (filterCategoria !== "all") filtered = filtered.filter(i => (i as any).categoria_material === filterCategoria);
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(i => i.nombre.toLowerCase().includes(term) || i.codigo.toLowerCase().includes(term));
  }

  const materialesDisponibles = items?.filter(i => i.id !== bomProductoId) || [];

  const handleOpen = (item?: any) => {
    if (item) {
      setEditing(item);
      setForm({
        codigo: item.codigo, nombre: item.nombre, tipo: item.tipo,
        stock: Number(item.stock), unidad: item.unidad, stock_minimo: Number(item.stock_minimo),
        costo_unitario: Number(item.costo_unitario), es_fabricable: item.es_fabricable || false,
        ruta: item.ruta || "comprar", puede_vender: item.puede_vender || false,
        categoria: item.categoria || "general", categoria_material: item.categoria_material || "general",
      });
    } else {
      setEditing(null);
      setForm({ codigo: "", nombre: "", tipo: "materia_prima", stock: 0, unidad: "pza", stock_minimo: 0, costo_unitario: 0, es_fabricable: false, ruta: "comprar", puede_vender: false, categoria: "general", categoria_material: "general" });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...form });
    else await createMut.mutateAsync(form as any);
    setOpen(false);
  };

  const handleAddBomItem = async () => {
    if (!bomProductoId || !bomForm.material_id) return;
    await createBomMut.mutateAsync({ producto_id: bomProductoId, ...bomForm });
    setBomForm({ material_id: "", cantidad: 1, unidad: "pza", notas: "" });
  };

  const handleVerificarStock = async (productoId: string) => {
    const result = await verificarStockMut.mutateAsync(productoId);
    setStockResult({ ...result, productoId });
    setStockDialogOpen(true);
  };

  const handleGenerarOC = async () => {
    if (!stockResult?.faltantes?.length) return;
    await generarOCMut.mutateAsync({ faltantes: stockResult.faltantes });
    setStockDialogOpen(false);
    setStockResult(null);
  };

  const handleSaveProceso = async () => {
    if (!bomProductoId || !procForm.nombre.trim()) return;
    const data: any = {
      ...procForm,
      maquina_id: procForm.maquina_id && procForm.maquina_id !== "none" ? procForm.maquina_id : null,
      rpm: procForm.rpm || null,
      velocidad_corte: procForm.velocidad_corte || null,
      profundidad_corte: procForm.profundidad_corte || null,
    };
    if (editingProc) {
      await updateProcMut.mutateAsync({ id: editingProc.id, producto_id: bomProductoId, ...data });
    } else {
      const nextSeq = (productoProcesos?.length || 0) + 1;
      await createProcMut.mutateAsync({ producto_id: bomProductoId, orden_secuencia: nextSeq, ...data } as any);
    }
    setProcOpen(false);
  };

  const totalHrsEstimadas = productoProcesos?.reduce((s: number, p: any) => s + Number(p.tiempo_estimado_hrs), 0) || 0;
  const bomCostoTotal = bomItems?.reduce((s: number, bi: any) => {
    const mat = bi.material as any;
    return s + Number(bi.cantidad) * Number(mat?.costo_unitario || 0);
  }, 0) || 0;

  const getStatus = (stock: number, min: number) => {
    if (min === 0) return { label: "OK", cls: "bg-success/20 text-success" };
    if (stock <= 0) return { label: "Agotado", cls: "bg-destructive/20 text-destructive" };
    if (stock < min) return { label: "Crítico", cls: "bg-destructive/20 text-destructive" };
    if (stock < min * 1.5) return { label: "Bajo", cls: "bg-warning/20 text-warning" };
    return { label: "OK", cls: "bg-success/20 text-success" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
          <p className="text-muted-foreground">Productos, materias primas, listas de materiales y rutas de proceso</p>
        </div>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Nuevo Producto / Material</Button>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o código..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        {[{ k: "all", l: "Todos" }, ...Object.entries(tipoLabels).map(([k, l]) => ({ k, l }))].map(f => (
          <Button key={f.k} variant={filterTipo === f.k ? "default" : "outline"} size="sm" onClick={() => setFilterTipo(f.k)}>{f.l}</Button>
        ))}
        <div className="border-l border-border pl-2 flex gap-1">
          <Button variant={filterRuta === "fabricable" ? "default" : "outline"} size="sm" onClick={() => setFilterRuta(filterRuta === "fabricable" ? "all" : "fabricable")}>
            <Package className="h-3 w-3 mr-1" />Fabricables
          </Button>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Cat.</SelectItem>
              {Object.entries(categoriaMaterialLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !filtered?.length ? <div className="p-8 text-center text-muted-foreground">No hay materiales en inventario.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Código","Material / Producto","Tipo","Cat. Material","Ruta","Stock","Costo Unit.","Estado","Configurar",""].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(i => {
                    const st = getStatus(Number(i.stock), Number(i.stock_minimo));
                    const isFab = (i as any).es_fabricable;
                    return (
                      <tr key={i.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-primary">{i.codigo}</td>
                        <td className="py-3 px-4 text-foreground">
                          <div className="flex items-center gap-2">
                            {i.nombre}
                            {isFab && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">FABRICABLE</span>}
                            {(i as any).puede_vender && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success">VENTA</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{tipoLabels[i.tipo] || i.tipo}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{categoriaMaterialLabels[(i as any).categoria_material] || (i as any).categoria_material || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{rutaLabels[(i as any).ruta] || (i as any).ruta}</td>
                        <td className="py-3 px-4 font-mono text-foreground">{Number(i.stock)} {i.unidad}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">${Number(i.costo_unitario).toLocaleString()}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                        <td className="py-3 px-4">
                          {isFab && (
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setBomProductoId(i.id); setDetailTab("bom"); }}>
                                <List className="h-3 w-3 mr-1" />BOM
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setBomProductoId(i.id); setDetailTab("procesos"); }}>
                                <Settings2 className="h-3 w-3 mr-1" />Procesos
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpen(i)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Producto / Material" : "Nuevo Producto / Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Código interno *</Label>
                <p className="text-xs text-muted-foreground">Identificador único (SKU)</p>
                <Input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} placeholder="Ej: MP-AC4140-2" />
              </div>
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <p className="text-xs text-muted-foreground">Nombre descriptivo</p>
                <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Eje de bomba hidráulica" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Tipo / Clasificación</Label>
                <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Categoría de material</Label>
                <p className="text-xs text-muted-foreground">Segmenta por tipo de material/proveedor</p>
                <Select value={form.categoria_material} onValueChange={v => setForm({...form, categoria_material: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categoriaMaterialLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ruta de abastecimiento</Label>
                <Select value={form.ruta} onValueChange={v => setForm({...form, ruta: v, es_fabricable: v === "fabricar" || v === "ambas"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(rutaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>¿Se puede vender?</Label>
                <Select value={form.puede_vender ? "si" : "no"} onValueChange={v => setForm({...form, puede_vender: v === "si"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí — Producto para venta</SelectItem>
                    <SelectItem value="no">No — Solo uso interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Stock actual</Label>
                <Input type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <Label>Unidad</Label>
                <Input value={form.unidad} onChange={e => setForm({...form, unidad: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Stock mínimo</Label>
                <Input type="number" value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <Label>Costo unitario ($)</Label>
                <Input type="number" value={form.costo_unitario} onChange={e => setForm({...form, costo_unitario: Number(e.target.value)})} />
              </div>
            </div>

            {(form.ruta === "fabricar" || form.ruta === "ambas") && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary font-medium">🏭 Este producto es FABRICABLE — podrás asignarle BOM y ruta de procesos después de guardarlo.</p>
              </div>
            )}

            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending || updateMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BOM + PROCESOS DIALOG */}
      <Dialog open={!!bomProductoId} onOpenChange={() => setBomProductoId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuración — {bomProducto?.nombre} ({bomProducto?.codigo})</DialogTitle>
          </DialogHeader>
          {bomProducto && (
            <Tabs value={detailTab} onValueChange={setDetailTab}>
              <TabsList>
                <TabsTrigger value="bom"><List className="h-3 w-3 mr-1" />Lista de Materiales (BOM)</TabsTrigger>
                <TabsTrigger value="procesos"><Settings2 className="h-3 w-3 mr-1" />Ruta de Procesos</TabsTrigger>
              </TabsList>

              {/* BOM TAB */}
              <TabsContent value="bom" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Materiales necesarios para fabricar <strong>{bomProducto.nombre}</strong>. Costo BOM: <span className="font-mono font-bold text-primary">${bomCostoTotal.toLocaleString()}</span>
                  </p>
                </div>

                {bomItems && bomItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        {["Código","Material","Cat.","Cantidad","Unidad","Costo Unit.","Subtotal","Stock",""].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {bomItems.map((bi: any) => {
                          const mat = bi.material;
                          const suficiente = mat && Number(mat.stock) >= Number(bi.cantidad);
                          const subtotal = Number(bi.cantidad) * Number(mat?.costo_unitario || 0);
                          return (
                            <tr key={bi.id} className="border-b border-border/50">
                              <td className="py-2 px-3 font-mono text-primary">{mat?.codigo || "—"}</td>
                              <td className="py-2 px-3">{mat?.nombre || "—"}</td>
                              <td className="py-2 px-3 text-xs text-muted-foreground">{categoriaMaterialLabels[mat?.categoria_material] || "—"}</td>
                              <td className="py-2 px-3 font-mono">{Number(bi.cantidad)}</td>
                              <td className="py-2 px-3 text-muted-foreground">{bi.unidad}</td>
                              <td className="py-2 px-3 font-mono">${Number(mat?.costo_unitario || 0).toLocaleString()}</td>
                              <td className="py-2 px-3 font-mono font-semibold">${subtotal.toLocaleString()}</td>
                              <td className="py-2 px-3">
                                <span className={`font-mono ${suficiente ? "text-success" : "text-destructive font-bold"}`}>
                                  {mat ? Number(mat.stock) : "—"} {suficiente ? "✓" : "⚠"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteBomMut.mutate({ id: bi.id, producto_id: bomProductoId! })}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-muted-foreground italic">Sin materiales. Agrega abajo.</p>}

                <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                  <h4 className="text-sm font-semibold">Agregar Material a la Lista</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Material del inventario *</Label>
                      <Select value={bomForm.material_id} onValueChange={v => {
                        const mat = materialesDisponibles.find(m => m.id === v);
                        setBomForm({...bomForm, material_id: v, unidad: mat?.unidad || "pza"});
                      }}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar material..." /></SelectTrigger>
                        <SelectContent>
                          {materialesDisponibles.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.codigo} — {m.nombre} ({categoriaMaterialLabels[(m as any).categoria_material] || "General"}) — Stock: {Number(m.stock)} {m.unidad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cantidad necesaria</Label>
                      <Input type="number" value={bomForm.cantidad} onChange={e => setBomForm({...bomForm, cantidad: Number(e.target.value)})} />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddBomItem} disabled={createBomMut.isPending} className="w-full">Agregar</Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleVerificarStock(bomProductoId!)}>
                    <AlertTriangle className="h-4 w-4 mr-2" />Verificar Stock
                  </Button>
                </div>
              </TabsContent>

              {/* PROCESOS TAB */}
              <TabsContent value="procesos" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ruta de manufactura para <strong>{bomProducto.nombre}</strong>. Total estimado: <span className="font-mono font-bold text-primary">{totalHrsEstimadas.toFixed(1)}h</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Estos procesos se copiarán automáticamente a la Orden de Producción al convertir una cotización.</p>
                  </div>
                  <Button size="sm" onClick={() => handleOpenProc()}>
                    <Plus className="h-4 w-4 mr-1" />Agregar Proceso
                  </Button>
                </div>

                {productoProcesos?.length ? (
                  <div className="space-y-1">
                    {productoProcesos.map((p: any, i: number) => {
                      const isLast = i === (productoProcesos?.length || 0) - 1;
                      return (
                        <div key={p.id}>
                          <div className="flex gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-primary/10 text-primary border-primary/30">
                                {i + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm">{p.nombre}</p>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{procesoTipos.find(t => t.value === p.tipo)?.label || p.tipo}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Number(p.tiempo_estimado_hrs)}h</span>
                                <span className="flex items-center gap-1"><Settings2 className="h-3 w-3" />{(p as any).maquinas?.nombre || "Sin máquina"}</span>
                                {p.herramienta && <span>🔧 {p.herramienta}</span>}
                                {p.programa_cnc && <span>CNC: {p.programa_cnc}</span>}
                                {Number(p.rpm) > 0 && <span>{p.rpm} RPM</span>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenProc(p)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProcMut.mutate({ id: p.id, producto_id: bomProductoId! })}>
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
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-border rounded-lg">
                    <Settings2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">Sin procesos definidos.</p>
                    <p className="text-xs text-muted-foreground">Define la ruta de manufactura para este producto.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD PROCESS DIALOG */}
      <Dialog open={procOpen} onOpenChange={setProcOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingProc ? "Editar Proceso" : "Agregar Proceso a la Ruta"} — {bomProducto?.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nombre de la operación *</Label>
                <p className="text-xs text-muted-foreground">Ej: Desbaste exterior Ø50</p>
                <Input value={procForm.nombre} onChange={e => setProcForm({...procForm, nombre: e.target.value})} placeholder="Desbaste exterior" />
              </div>
              <div className="space-y-1">
                <Label>Tipo de proceso</Label>
                <Select value={procForm.tipo} onValueChange={v => setProcForm({...procForm, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{procesoTipos.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Máquina / Centro de trabajo</Label>
                <Select value={procForm.maquina_id} onValueChange={v => setProcForm({...procForm, maquina_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin máquina</SelectItem>
                    {maquinas?.filter(m => m.status === "activa").map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.nombre} — {m.tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tiempo estimado (horas por pieza)</Label>
                <Input type="number" step="0.1" value={procForm.tiempo_estimado_hrs} onChange={e => setProcForm({...procForm, tiempo_estimado_hrs: Number(e.target.value)})} />
              </div>
            </div>
            {(cncTipos.has(procForm.tipo) || (procForm.maquina_id && procForm.maquina_id !== "none" && maquinas?.find(m => m.id === procForm.maquina_id)?.tipo?.toLowerCase().includes("cnc"))) && (
            <div className="p-3 rounded-lg bg-secondary/50 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Settings2 className="h-4 w-4" />Parámetros CNC</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Programa CNC</Label>
                  <Input value={procForm.programa_cnc} onChange={e => setProcForm({...procForm, programa_cnc: e.target.value})} placeholder="O1234" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Herramienta</Label>
                  <Input value={procForm.herramienta} onChange={e => setProcForm({...procForm, herramienta: e.target.value})} placeholder="WNMG 080408" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fixture</Label>
                  <Input value={procForm.fixture} onChange={e => setProcForm({...procForm, fixture: e.target.value})} placeholder="Chuck 3 mordazas" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">RPM</Label>
                  <Input type="number" value={procForm.rpm} onChange={e => setProcForm({...procForm, rpm: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vel. Corte (m/min)</Label>
                  <Input type="number" step="0.1" value={procForm.velocidad_corte} onChange={e => setProcForm({...procForm, velocidad_corte: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prof. Corte (mm)</Label>
                  <Input type="number" step="0.1" value={procForm.profundidad_corte} onChange={e => setProcForm({...procForm, profundidad_corte: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Refrigerante</Label>
                  <Input value={procForm.refrigerante} onChange={e => setProcForm({...procForm, refrigerante: e.target.value})} placeholder="Soluble 5%" />
                </div>
              </div>
            </div>
            )}
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={procForm.notas} onChange={e => setProcForm({...procForm, notas: e.target.value})} placeholder="Instrucciones especiales..." />
            </div>
            <Button onClick={handleSaveProceso} className="w-full" disabled={createProcMut.isPending || updateProcMut.isPending}>
              {editingProc ? "Guardar Cambios" : "Agregar Proceso"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STOCK VERIFICATION RESULT DIALOG */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Resultado de Verificación de Stock</DialogTitle></DialogHeader>
          {stockResult && (
            <div className="space-y-4">
              {stockResult.faltantes.length === 0 ? (
                <div className="p-4 rounded-lg bg-success/10 text-success text-center">
                  <p className="font-semibold">✓ Todos los materiales están disponibles</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive">
                    <p className="font-semibold">⚠ Faltan {stockResult.faltantes.length} material(es)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        {["Material","Cat.","Necesario","Disponible","Faltante"].map(h => <th key={h} className="text-left py-2 px-3 text-xs text-muted-foreground">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {stockResult.faltantes.map((f: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/50">
                            <td className="py-2 px-3">{f.nombre}</td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">{categoriaMaterialLabels[f.categoria_material] || "—"}</td>
                            <td className="py-2 px-3 font-mono">{f.necesario}</td>
                            <td className="py-2 px-3 font-mono text-destructive">{f.disponible}</td>
                            <td className="py-2 px-3 font-mono font-bold text-destructive">{f.faltante} {f.unidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button onClick={handleGenerarOC} className="w-full" disabled={generarOCMut.isPending}>
                    <ShoppingCart className="h-4 w-4 mr-2" />Generar Orden de Compra con Faltantes
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventario;
