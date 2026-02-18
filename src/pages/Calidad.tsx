import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Eye, Upload, X, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { useInspecciones, useCreateInspeccion, useUpdateInspeccion, useOrdenesProduccion } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const sc: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", cls: "bg-warning/20 text-warning", icon: <Clock className="h-3 w-3" /> },
  aprobado: { label: "Aprobado", cls: "bg-success/20 text-success", icon: <CheckCircle className="h-3 w-3" /> },
  rechazado: { label: "Rechazado", cls: "bg-destructive/20 text-destructive", icon: <XCircle className="h-3 w-3" /> },
};

type Tolerancia = { nombre: string; nominal: number; min: number; max: number };

const Calidad = () => {
  const { data: inspecciones, isLoading } = useInspecciones();
  const { data: ordenes } = useOrdenesProduccion();
  const createMut = useCreateInspeccion();
  const updateMut = useUpdateInspeccion();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = inspecciones?.find(i => i.id === detailId);
  const [form, setForm] = useState({ orden_id: "", tipo: "primera_pieza", producto: "", operador: "", maquina: "", turno: "matutino", notas: "", piezas_fabricadas: 0, piezas_scrap: 0 });
  const [tolerancias, setTolerancias] = useState<Tolerancia[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<string[]>([]);
  const [newCaract, setNewCaract] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [disposicion, setDisposicion] = useState("");
  const [disposicionNotas, setDisposicionNotas] = useState("");

  const filteredInspecciones = inspecciones?.filter(i => {
    if (filterTipo !== "all" && i.tipo !== filterTipo) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    return true;
  });

  const pendientes = inspecciones?.filter(i => i.status === "pendiente").length || 0;

  const addTolerancia = () => setTolerancias([...tolerancias, { nombre: "", nominal: 0, min: 0, max: 0 }]);
  const removeTolerancia = (i: number) => setTolerancias(tolerancias.filter((_, idx) => idx !== i));
  const updateTolerancia = (i: number, field: keyof Tolerancia, value: string | number) => {
    const updated = [...tolerancias];
    (updated[i] as any)[field] = value;
    setTolerancias(updated);
  };

  const addCaracteristica = () => {
    if (newCaract.trim()) { setCaracteristicas([...caracteristicas, newCaract.trim()]); setNewCaract(""); }
  };

  const handleCreate = async () => {
    await createMut.mutateAsync({
      ...form,
      tolerancias: tolerancias.length ? tolerancias : undefined,
      caracteristicas: caracteristicas.length ? caracteristicas : undefined,
    });
    setCreateOpen(false);
    setForm({ orden_id: "", tipo: "primera_pieza", producto: "", operador: "", maquina: "", turno: "matutino", notas: "", piezas_fabricadas: 0, piezas_scrap: 0 });
    setTolerancias([]);
    setCaracteristicas([]);
  };

  const handleApprove = async (id: string) => {
    await updateMut.mutateAsync({ id, status: "aprobado", disposicion: "aprobado" });
    toast.success("Inspección aprobada ✓");
  };

  const handleReject = (id: string) => {
    setDetailId(id);
    setDisposicion("rechazado");
    setDisposicionNotas("");
  };

  const handleConfirmReject = async () => {
    if (!detailId) return;
    await updateMut.mutateAsync({
      id: detailId,
      status: "rechazado",
      disposicion: disposicion || "rechazado",
      notas: detail?.notas ? `${detail.notas}\n\n[RECHAZO] ${disposicionNotas}` : `[RECHAZO] ${disposicionNotas}`,
    });
    setDisposicion("");
    setDisposicionNotas("");
    toast.error("Inspección rechazada");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, inspId: string) => {
    const files = e.target.files;
    if (!files?.length) return;
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const path = `inspecciones/${inspId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("quality-files").upload(path, file);
      if (error) { toast.error(`Error subiendo ${file.name}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from("quality-files").getPublicUrl(path);
      uploaded.push(publicUrl);
    }
    if (uploaded.length) {
      const current = detail?.archivos || [];
      await updateMut.mutateAsync({ id: inspId, archivos: [...current, ...uploaded] });
      toast.success(`${uploaded.length} archivo(s) subido(s)`);
    }
  };

  const detailTolerancias = detail?.tolerancias as Tolerancia[] | null;
  const detailCaracts = detail?.caracteristicas as string[] | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Control de Calidad</h1>
          <p className="text-muted-foreground">Inspecciones de primera pieza y finales</p>
        </div>
        <div className="flex items-center gap-2">
          {pendientes > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendientes} pendiente{pendientes > 1 ? "s" : ""}
            </Badge>
          )}
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nueva Inspección</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="primera_pieza">Primera Pieza</SelectItem>
            <SelectItem value="final">Final</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending inspections highlight */}
      {inspecciones && inspecciones.filter(i => i.status === "pendiente").length > 0 && filterStatus !== "aprobado" && filterStatus !== "rechazado" && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Inspecciones Pendientes de Revisión
            </h3>
            <div className="space-y-2">
              {inspecciones.filter(i => i.status === "pendiente").map(i => (
                <div key={i.id} className="flex items-center justify-between bg-background rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[10px] ${i.tipo === "primera_pieza" ? "bg-info/10 text-info border-info/30" : "bg-primary/10 text-primary border-primary/30"}`}>
                      {i.tipo === "primera_pieza" ? "1ra Pieza" : "Final"}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{i.producto || "Sin producto"}</p>
                      <p className="text-xs text-muted-foreground">
                        {(i as any).ordenes_produccion?.folio || "—"} • {i.operador || "—"} • {i.maquina || "—"} • {i.fecha}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDetailId(i.id)}>
                      <Eye className="h-3 w-3 mr-1" /> Ver
                    </Button>
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleApprove(i.id)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Aprobar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(i.id)}>
                      <XCircle className="h-3 w-3 mr-1" /> Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !filteredInspecciones?.length ? <div className="p-8 text-center text-muted-foreground">No hay inspecciones que coincidan con los filtros.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Orden","Tipo","Producto","Operador","Piezas","Scrap","Estado","Fecha","Acciones"].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredInspecciones.map(i => (
                    <tr key={i.id} className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${i.status === "pendiente" ? "bg-warning/5" : ""}`}>
                      <td className="py-3 px-4 font-mono text-primary">{(i as any).ordenes_produccion?.folio || "—"}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={`text-[10px] ${i.tipo === "primera_pieza" ? "bg-info/10 text-info border-info/30" : "bg-primary/10 text-primary border-primary/30"}`}>
                          {i.tipo === "primera_pieza" ? "1ra Pieza" : "Final"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-foreground">{i.producto || "—"}</td>
                      <td className="py-3 px-4 text-foreground">{i.operador || "—"}</td>
                      <td className="py-3 px-4 font-mono">{i.piezas_fabricadas}</td>
                      <td className="py-3 px-4 font-mono text-destructive">{i.piezas_scrap}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${sc[i.status]?.cls}`}>
                          {sc[i.status]?.icon}
                          {sc[i.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{i.fecha}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailId(i.id)}><Eye className="h-4 w-4" /></Button>
                          {i.status === "pendiente" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:text-success" onClick={() => handleApprove(i.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleReject(i.id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Inspección</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Orden de Producción</Label>
              <Select value={form.orden_id} onValueChange={v => setForm({...form, orden_id: v})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar orden" /></SelectTrigger>
                <SelectContent>{ordenes?.map(o => <SelectItem key={o.id} value={o.id}>{o.folio} — {o.producto}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipo de inspección</Label>
              <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primera_pieza">Primera Pieza (setup)</SelectItem>
                  <SelectItem value="final">Final de Producción (lote)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Producto</Label>
                <Input value={form.producto} onChange={e => setForm({...form, producto: e.target.value})} placeholder="Ej: Eje principal" />
              </div>
              <div className="space-y-1">
                <Label>Operador</Label>
                <Input value={form.operador} onChange={e => setForm({...form, operador: e.target.value})} placeholder="Nombre" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Máquina</Label>
                <Input value={form.maquina} onChange={e => setForm({...form, maquina: e.target.value})} placeholder="Ej: CNC Haas" />
              </div>
              <div className="space-y-1">
                <Label>Turno</Label>
                <Select value={form.turno} onValueChange={v => setForm({...form, turno: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                    <SelectItem value="nocturno">Nocturno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.tipo === "final" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Piezas fabricadas</Label>
                  <Input type="number" value={form.piezas_fabricadas} onChange={e => setForm({...form, piezas_fabricadas: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <Label>Scrap</Label>
                  <Input type="number" value={form.piezas_scrap} onChange={e => setForm({...form, piezas_scrap: Number(e.target.value)})} />
                </div>
              </div>
            )}

            {form.tipo === "primera_pieza" && (
              <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Tolerancias Dimensionales</h4>
                  <Button variant="outline" size="sm" onClick={addTolerancia}><Plus className="h-3 w-3 mr-1" />Agregar</Button>
                </div>
                {tolerancias.map((t, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-end">
                    <Input placeholder="Dimensión" value={t.nombre} onChange={e => updateTolerancia(i, "nombre", e.target.value)} />
                    <Input type="number" placeholder="Nominal" value={t.nominal} onChange={e => updateTolerancia(i, "nominal", Number(e.target.value))} />
                    <Input type="number" placeholder="Mín" value={t.min} onChange={e => updateTolerancia(i, "min", Number(e.target.value))} />
                    <Input type="number" placeholder="Máx" value={t.max} onChange={e => updateTolerancia(i, "max", Number(e.target.value))} />
                    <Button variant="ghost" size="icon" onClick={() => removeTolerancia(i)}><X className="h-3 w-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
              <h4 className="text-sm font-semibold">Características Críticas</h4>
              <div className="flex gap-2">
                <Input placeholder="Ej: Acabado Ra ≤ 0.8 µm" value={newCaract} onChange={e => setNewCaract(e.target.value)} onKeyDown={e => e.key === "Enter" && addCaracteristica()} />
                <Button variant="outline" size="sm" onClick={addCaracteristica}>Agregar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {caracteristicas.map((c, i) => (
                  <span key={i} className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary flex items-center gap-1">
                    {c}<button onClick={() => setCaracteristicas(caracteristicas.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Observaciones..." />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={createMut.isPending}>Crear Inspección</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail / Review Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => { setDetailId(null); setDisposicion(""); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Inspección — {detail?.tipo === "primera_pieza" ? "Primera Pieza" : "Final"}
              {detail && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[detail.status]?.cls}`}>
                  {sc[detail.status]?.label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground">Orden</p><p className="font-semibold font-mono text-primary">{(detail as any).ordenes_produccion?.folio || "—"}</p></div>
                <div><p className="text-muted-foreground">Producto</p><p className="font-semibold">{detail.producto || "—"}</p></div>
                <div><p className="text-muted-foreground">Operador</p><p className="font-semibold">{detail.operador || "—"}</p></div>
                <div><p className="text-muted-foreground">Máquina</p><p className="font-semibold">{detail.maquina || "—"}</p></div>
                <div><p className="text-muted-foreground">Turno</p><p className="font-semibold">{detail.turno || "—"}</p></div>
                <div><p className="text-muted-foreground">Fecha</p><p className="font-semibold">{detail.fecha}</p></div>
                <div><p className="text-muted-foreground">Piezas</p><p className="font-semibold">{detail.piezas_fabricadas}</p></div>
                <div><p className="text-muted-foreground">Scrap</p><p className="font-semibold text-destructive">{detail.piezas_scrap}</p></div>
              </div>

              {/* Notas */}
              {detail.notas && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm whitespace-pre-wrap">{detail.notas}</p>
                </div>
              )}

              {/* Tolerancias */}
              {detailTolerancias && detailTolerancias.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tolerancias</h3>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      {["Dimensión","Nominal","Mín","Máx"].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground text-xs">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {detailTolerancias.map((t, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 px-3 font-semibold">{t.nombre}</td>
                          <td className="py-2 px-3 font-mono">{t.nominal}</td>
                          <td className="py-2 px-3 font-mono">{t.min}</td>
                          <td className="py-2 px-3 font-mono">{t.max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailCaracts && detailCaracts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Características Críticas</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailCaracts.map((c, i) => (
                      <span key={i} className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              <div>
                <h3 className="font-semibold mb-2">Archivos / Metrología</h3>
                {detail.archivos?.length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {detail.archivos.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate block">Archivo {i + 1}</a>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-sm">Sin archivos</p>}
                <div className="mt-3">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:border-primary transition-colors">
                      <Upload className="h-4 w-4" /><span className="text-sm">Subir archivos</span>
                    </div>
                  </Label>
                  <input id="file-upload" type="file" multiple className="hidden" onChange={e => handleFileUpload(e, detail.id)} />
                </div>
              </div>

              {/* Reject form */}
              {disposicion === "rechazado" && (
                <>
                  <Separator />
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-destructive">Motivo del Rechazo</h3>
                    <Textarea
                      value={disposicionNotas}
                      onChange={e => setDisposicionNotas(e.target.value)}
                      placeholder="Describe por qué se rechaza esta inspección: dimensiones fuera de tolerancia, acabado no conforme, etc."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={handleConfirmReject} disabled={!disposicionNotas.trim()}>
                        <XCircle className="h-4 w-4 mr-2" /> Confirmar Rechazo
                      </Button>
                      <Button variant="outline" onClick={() => setDisposicion("")}>Cancelar</Button>
                    </div>
                  </div>
                </>
              )}

              {/* Approve/Reject actions in detail view */}
              {detail.status === "pendiente" && disposicion !== "rechazado" && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleApprove(detail.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Aprobar Inspección
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleReject(detail.id)}>
                      <XCircle className="h-4 w-4 mr-2" /> Rechazar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calidad;
