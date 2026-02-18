import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Eye, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useInstrumentos, useCreateInstrumento, useUpdateInstrumento, useDeleteInstrumento, useCalibraciones, useCreateCalibracion, useReportesDimensionales, useCreateReporteDimensional, useUpdateReporteDimensional, useOrdenesProduccion } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";

const tipoInst: Record<string, string> = {
  calibrador: "Calibrador", micrometro: "Micrómetro", indicador_caratula: "Indicador de Carátula",
  comparador: "Comparador Óptico", rugosimetro: "Rugosímetro", durómetro: "Durómetro",
  bloques_patron: "Bloques Patrón", cmm: "CMM", altimetro: "Altímetro", goniómetro: "Goniómetro",
  proyector_perfiles: "Proyector de Perfiles", otro: "Otro",
};

const sc: Record<string, { label: string; cls: string }> = {
  activo: { label: "Activo", cls: "bg-success/20 text-success" },
  calibracion: { label: "En Calibración", cls: "bg-warning/20 text-warning" },
  fuera_servicio: { label: "Fuera de Servicio", cls: "bg-destructive/20 text-destructive" },
};

type Medicion = { caracteristica: string; nominal: number; tolerancia_sup: number; tolerancia_inf: number; valor_medido: number; resultado: string };

const Metrologia = () => {
  const { data: instrumentos, isLoading } = useInstrumentos();
  const { data: reportes, isLoading: loadReportes } = useReportesDimensionales();
  const { data: ordenes } = useOrdenesProduccion();
  const createInstMut = useCreateInstrumento();
  const updateInstMut = useUpdateInstrumento();
  const deleteInstMut = useDeleteInstrumento();
  const createCalMut = useCreateCalibracion();
  const createRepMut = useCreateReporteDimensional();
  const updateRepMut = useUpdateReporteDimensional();

  // Instrument state
  const [instOpen, setInstOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<any>(null);
  const [instForm, setInstForm] = useState({ codigo: "", nombre: "", tipo: "calibrador", marca: "", modelo: "", numero_serie: "", rango_medicion: "", resolucion: "", exactitud: "", ubicacion: "Laboratorio", notas: "" });

  // Calibration state
  const [calInstId, setCalInstId] = useState<string | null>(null);
  const { data: calibraciones } = useCalibraciones(calInstId);
  const [calOpen, setCalOpen] = useState(false);
  const [calForm, setCalForm] = useState({ fecha_vencimiento: "", certificado_numero: "", laboratorio: "", resultado: "aprobado", desviacion_encontrada: "", incertidumbre: "", patron_referencia: "", calibrado_por: "", costo: 0, notas: "" });

  // Dimensional report state
  const [repOpen, setRepOpen] = useState(false);
  const [repDetailId, setRepDetailId] = useState<string | null>(null);
  const [repForm, setRepForm] = useState({ orden_id: "", numero_plano: "", revision_plano: "A", producto: "", operador: "", instrumento_id: "", lote: "", pieza_numero: 1 });
  const [mediciones, setMediciones] = useState<Medicion[]>([]);

  const handleOpenInst = (inst?: any) => {
    if (inst) {
      setEditingInst(inst);
      setInstForm({ codigo: inst.codigo, nombre: inst.nombre, tipo: inst.tipo, marca: inst.marca || "", modelo: inst.modelo || "", numero_serie: inst.numero_serie || "", rango_medicion: inst.rango_medicion || "", resolucion: inst.resolucion || "", exactitud: inst.exactitud || "", ubicacion: inst.ubicacion || "Laboratorio", notas: inst.notas || "" });
    } else {
      setEditingInst(null);
      setInstForm({ codigo: "", nombre: "", tipo: "calibrador", marca: "", modelo: "", numero_serie: "", rango_medicion: "", resolucion: "", exactitud: "", ubicacion: "Laboratorio", notas: "" });
    }
    setInstOpen(true);
  };

  const handleSaveInst = async () => {
    if (!instForm.codigo.trim() || !instForm.nombre.trim()) return;
    if (editingInst) await updateInstMut.mutateAsync({ id: editingInst.id, ...instForm });
    else await createInstMut.mutateAsync(instForm);
    setInstOpen(false);
  };

  const handleSaveCal = async () => {
    if (!calInstId || !calForm.fecha_vencimiento) return;
    await createCalMut.mutateAsync({ instrumento_id: calInstId, ...calForm });
    setCalOpen(false);
    setCalForm({ fecha_vencimiento: "", certificado_numero: "", laboratorio: "", resultado: "aprobado", desviacion_encontrada: "", incertidumbre: "", patron_referencia: "", calibrado_por: "", costo: 0, notas: "" });
  };

  const addMedicion = () => setMediciones([...mediciones, { caracteristica: "", nominal: 0, tolerancia_sup: 0, tolerancia_inf: 0, valor_medido: 0, resultado: "pendiente" }]);
  const updateMedicion = (i: number, field: keyof Medicion, value: any) => {
    const updated = [...mediciones];
    (updated[i] as any)[field] = value;
    // Auto-calculate resultado
    if (field === "valor_medido" || field === "nominal" || field === "tolerancia_sup" || field === "tolerancia_inf") {
      const m = updated[i];
      const nom = Number(m.nominal);
      const sup = nom + Number(m.tolerancia_sup);
      const inf = nom + Number(m.tolerancia_inf);
      const val = Number(m.valor_medido);
      if (val === 0 && nom === 0) m.resultado = "pendiente";
      else if (val >= inf && val <= sup) m.resultado = "ok";
      else m.resultado = "fuera";
    }
    setMediciones(updated);
  };

  const handleCreateReport = async () => {
    if (!repForm.numero_plano.trim()) return;
    const resultado_general = mediciones.length ? (mediciones.every(m => m.resultado === "ok") ? "aprobado" : mediciones.some(m => m.resultado === "fuera") ? "rechazado" : "pendiente") : "pendiente";
    await createRepMut.mutateAsync({ ...repForm, instrumento_id: repForm.instrumento_id || undefined, orden_id: repForm.orden_id || undefined, mediciones, resultado_general });
    setRepOpen(false);
    setRepForm({ orden_id: "", numero_plano: "", revision_plano: "A", producto: "", operador: "", instrumento_id: "", lote: "", pieza_numero: 1 });
    setMediciones([]);
  };

  const detailReport = reportes?.find(r => r.id === repDetailId);
  const detailMediciones = (detailReport?.mediciones as Medicion[]) || [];

  // Check calibration status
  const getCalStatus = (inst: any) => {
    // We'd need latest calibration data - simplified for now
    if (inst.status === "calibracion") return { icon: AlertTriangle, cls: "text-warning" };
    if (inst.status === "fuera_servicio") return { icon: AlertTriangle, cls: "text-destructive" };
    return { icon: CheckCircle, cls: "text-success" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Metrología</h1>
        <p className="text-muted-foreground">Control de instrumentos, calibraciones y reportes dimensionales</p>
      </div>

      <Tabs defaultValue="instrumentos">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instrumentos">Instrumentos ({instrumentos?.length || 0})</TabsTrigger>
          <TabsTrigger value="reportes">Reportes Dimensionales ({reportes?.length || 0})</TabsTrigger>
          <TabsTrigger value="calibraciones">Calibraciones</TabsTrigger>
        </TabsList>

        {/* ===== INSTRUMENTOS ===== */}
        <TabsContent value="instrumentos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenInst()}><Plus className="h-4 w-4 mr-2" />Nuevo Instrumento</Button>
          </div>
          {isLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
          : !instrumentos?.length ? <Card><CardContent className="p-8 text-center text-muted-foreground">No hay instrumentos registrados.</CardContent></Card>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instrumentos.map((inst: any) => {
                const calSt = getCalStatus(inst);
                return (
                  <Card key={inst.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <calSt.icon className={`h-4 w-4 ${calSt.cls}`} />
                            <p className="font-semibold text-foreground">{inst.nombre}</p>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{inst.codigo}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc[inst.status]?.cls}`}>{sc[inst.status]?.label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Tipo:</span> <span className="text-foreground">{tipoInst[inst.tipo] || inst.tipo}</span></div>
                        <div><span className="text-muted-foreground">Marca:</span> <span className="text-foreground">{inst.marca || "—"}</span></div>
                        <div><span className="text-muted-foreground">Modelo:</span> <span className="text-foreground">{inst.modelo || "—"}</span></div>
                        <div><span className="text-muted-foreground">N/S:</span> <span className="text-foreground font-mono">{inst.numero_serie || "—"}</span></div>
                        <div><span className="text-muted-foreground">Rango:</span> <span className="text-foreground">{inst.rango_medicion || "—"}</span></div>
                        <div><span className="text-muted-foreground">Resolución:</span> <span className="text-foreground">{inst.resolucion || "—"}</span></div>
                      </div>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setCalInstId(inst.id)} title="Ver calibraciones"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenInst(inst)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteInstMut.mutate(inst.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== REPORTES DIMENSIONALES ===== */}
        <TabsContent value="reportes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRepOpen(true)}><Plus className="h-4 w-4 mr-2" />Nuevo Reporte</Button>
          </div>
          {loadReportes ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !reportes?.length ? <Card><CardContent className="p-8 text-center text-muted-foreground">No hay reportes dimensionales.</CardContent></Card>
          : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      {["Orden","Plano","Rev","Producto","Pieza #","Lote","Instrumento","Resultado","Fecha",""].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {reportes.map((r: any) => (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-primary">{r.ordenes_produccion?.folio || "—"}</td>
                          <td className="py-3 px-4 font-mono">{r.numero_plano}</td>
                          <td className="py-3 px-4 font-mono text-muted-foreground">{r.revision_plano}</td>
                          <td className="py-3 px-4 text-foreground">{r.producto || "—"}</td>
                          <td className="py-3 px-4 font-mono">{r.pieza_numero}</td>
                          <td className="py-3 px-4 text-muted-foreground">{r.lote || "—"}</td>
                          <td className="py-3 px-4 text-muted-foreground">{r.instrumentos_medicion?.nombre || "—"}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              r.resultado_general === "aprobado" ? "bg-success/20 text-success" :
                              r.resultado_general === "rechazado" ? "bg-destructive/20 text-destructive" :
                              "bg-warning/20 text-warning"
                            }`}>{r.resultado_general === "aprobado" ? "Aprobado" : r.resultado_general === "rechazado" ? "Rechazado" : "Pendiente"}</span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{r.fecha}</td>
                          <td className="py-3 px-4"><Button variant="ghost" size="icon" onClick={() => setRepDetailId(r.id)}><Eye className="h-4 w-4" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== CALIBRACIONES TAB ===== */}
        <TabsContent value="calibraciones" className="space-y-4">
          <p className="text-sm text-muted-foreground">Selecciona un instrumento desde la pestaña "Instrumentos" para ver su historial de calibraciones, o selecciona uno aquí:</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={calInstId || ""} onValueChange={setCalInstId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar instrumento" /></SelectTrigger>
                <SelectContent>{instrumentos?.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.codigo} — {i.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {calInstId && <Button onClick={() => setCalOpen(true)}><Plus className="h-4 w-4 mr-2" />Nueva Calibración</Button>}
          </div>
          {calInstId && calibraciones?.length ? (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["Fecha Cal.","Vencimiento","Certificado","Laboratorio","Resultado","Incertidumbre","Costo",""].map(h => <th key={h} className="text-left py-2 px-4 text-muted-foreground font-medium text-xs">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {calibraciones.map((c: any) => {
                      const vencido = new Date(c.fecha_vencimiento) < new Date();
                      return (
                        <tr key={c.id} className="border-b border-border/50">
                          <td className="py-2 px-4">{c.fecha_calibracion}</td>
                          <td className={`py-2 px-4 ${vencido ? "text-destructive font-semibold" : "text-foreground"}`}>{c.fecha_vencimiento} {vencido && "⚠️"}</td>
                          <td className="py-2 px-4 font-mono">{c.certificado_numero || "—"}</td>
                          <td className="py-2 px-4">{c.laboratorio || "—"}</td>
                          <td className="py-2 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${c.resultado === "aprobado" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>{c.resultado === "aprobado" ? "Aprobado" : "No Conforme"}</span></td>
                          <td className="py-2 px-4 font-mono text-muted-foreground">{c.incertidumbre || "—"}</td>
                          <td className="py-2 px-4 font-mono">${Number(c.costo).toLocaleString()}</td>
                          <td></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : calInstId ? <p className="text-muted-foreground text-sm">Sin calibraciones registradas.</p> : null}
        </TabsContent>
      </Tabs>

      {/* === INSTRUMENT DIALOG === */}
      <Dialog open={instOpen} onOpenChange={setInstOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingInst ? "Editar Instrumento" : "Nuevo Instrumento"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Código interno *</Label>
                <p className="text-xs text-muted-foreground">Identificador único del instrumento en tu sistema</p>
                <Input value={instForm.codigo} onChange={e => setInstForm({...instForm, codigo: e.target.value})} placeholder="Ej: MIC-001, CAL-003, IND-012" />
              </div>
              <div className="space-y-1">
                <Label>Nombre descriptivo *</Label>
                <p className="text-xs text-muted-foreground">Tipo y capacidad del instrumento</p>
                <Input value={instForm.nombre} onChange={e => setInstForm({...instForm, nombre: e.target.value})} placeholder="Ej: Micrómetro Digital 0-25mm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo de instrumento</Label>
                <p className="text-xs text-muted-foreground">Clasificación del equipo de medición</p>
                <Select value={instForm.tipo} onValueChange={v => setInstForm({...instForm, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(tipoInst).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ubicación</Label>
                <p className="text-xs text-muted-foreground">Dónde se guarda el instrumento</p>
                <Input value={instForm.ubicacion} onChange={e => setInstForm({...instForm, ubicacion: e.target.value})} placeholder="Ej: Laboratorio, Piso de producción" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Marca</Label>
                <p className="text-xs text-muted-foreground">Fabricante del instrumento</p>
                <Input value={instForm.marca} onChange={e => setInstForm({...instForm, marca: e.target.value})} placeholder="Ej: Mitutoyo, Starrett" />
              </div>
              <div className="space-y-1">
                <Label>Modelo</Label>
                <Input value={instForm.modelo} onChange={e => setInstForm({...instForm, modelo: e.target.value})} placeholder="Ej: 293-340-30" />
              </div>
              <div className="space-y-1">
                <Label>N° Serie</Label>
                <p className="text-xs text-muted-foreground">Número de serie del fabricante</p>
                <Input value={instForm.numero_serie} onChange={e => setInstForm({...instForm, numero_serie: e.target.value})} placeholder="Ej: S/N 12345678" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Rango de medición</Label>
                <p className="text-xs text-muted-foreground">Capacidad mín-máx del instrumento</p>
                <Input value={instForm.rango_medicion} onChange={e => setInstForm({...instForm, rango_medicion: e.target.value})} placeholder="Ej: 0-25mm, 0-150mm" />
              </div>
              <div className="space-y-1">
                <Label>Resolución</Label>
                <p className="text-xs text-muted-foreground">Mínima lectura que puede detectar</p>
                <Input value={instForm.resolucion} onChange={e => setInstForm({...instForm, resolucion: e.target.value})} placeholder="Ej: 0.001mm" />
              </div>
              <div className="space-y-1">
                <Label>Exactitud</Label>
                <p className="text-xs text-muted-foreground">Margen de error del instrumento</p>
                <Input value={instForm.exactitud} onChange={e => setInstForm({...instForm, exactitud: e.target.value})} placeholder="Ej: ±0.002mm" />
              </div>
            </div>
            <div><Label>Notas</Label><Textarea value={instForm.notas} onChange={e => setInstForm({...instForm, notas: e.target.value})} /></div>
            <Button onClick={handleSaveInst} className="w-full" disabled={createInstMut.isPending || updateInstMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === CALIBRATION DIALOG === */}
      <Dialog open={calOpen} onOpenChange={setCalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Calibración</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Fecha de vencimiento de calibración *</Label>
                <p className="text-xs text-muted-foreground">Hasta cuándo es válida esta calibración</p>
                <Input type="date" value={calForm.fecha_vencimiento} onChange={e => setCalForm({...calForm, fecha_vencimiento: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>N° de certificado</Label>
                <p className="text-xs text-muted-foreground">Número del certificado emitido por el laboratorio</p>
                <Input value={calForm.certificado_numero} onChange={e => setCalForm({...calForm, certificado_numero: e.target.value})} placeholder="Ej: CERT-2026-0145" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Laboratorio de calibración</Label>
                <p className="text-xs text-muted-foreground">Empresa acreditada que realizó la calibración</p>
                <Input value={calForm.laboratorio} onChange={e => setCalForm({...calForm, laboratorio: e.target.value})} placeholder="Ej: CENAM, Lab Central Metrology" />
              </div>
              <div className="space-y-1">
                <Label>Resultado de la calibración</Label>
                <p className="text-xs text-muted-foreground">¿El instrumento cumple con las especificaciones?</p>
                <Select value={calForm.resultado} onValueChange={v => setCalForm({...calForm, resultado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobado">Aprobado (dentro de especificación)</SelectItem>
                    <SelectItem value="no_conforme">No Conforme (fuera de tolerancia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Incertidumbre de medición</Label>
                <p className="text-xs text-muted-foreground">Margen de error reportado por el laboratorio</p>
                <Input value={calForm.incertidumbre} onChange={e => setCalForm({...calForm, incertidumbre: e.target.value})} placeholder="Ej: ±0.001mm" />
              </div>
              <div className="space-y-1">
                <Label>Patrón de referencia utilizado</Label>
                <p className="text-xs text-muted-foreground">Estándar contra el que se comparó</p>
                <Input value={calForm.patron_referencia} onChange={e => setCalForm({...calForm, patron_referencia: e.target.value})} placeholder="Ej: Bloque patrón grado 1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Calibrado por</Label>
                <p className="text-xs text-muted-foreground">Técnico o responsable de la calibración</p>
                <Input value={calForm.calibrado_por} onChange={e => setCalForm({...calForm, calibrado_por: e.target.value})} placeholder="Ej: Ing. Luis Ramírez" />
              </div>
              <div className="space-y-1">
                <Label>Costo de la calibración ($)</Label>
                <Input type="number" value={calForm.costo} onChange={e => setCalForm({...calForm, costo: Number(e.target.value)})} placeholder="Ej: 2,500" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Desviación encontrada</Label>
              <p className="text-xs text-muted-foreground">Si se encontró desviación, describe cuánto y en qué punto</p>
              <Input value={calForm.desviacion_encontrada} onChange={e => setCalForm({...calForm, desviacion_encontrada: e.target.value})} placeholder="Ej: +0.003mm en punto de 25mm" />
            </div>
            <div className="space-y-1">
              <Label>Notas / Observaciones</Label>
              <Textarea value={calForm.notas} onChange={e => setCalForm({...calForm, notas: e.target.value})} placeholder="Ej: Se realizó ajuste, siguiente calibración en 12 meses" />
            </div>
            <Button onClick={handleSaveCal} className="w-full" disabled={createCalMut.isPending}>Registrar Calibración</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === DIMENSIONAL REPORT CREATE === */}
      <Dialog open={repOpen} onOpenChange={setRepOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Reporte Dimensional</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Orden de Producción</Label>
                <Select value={repForm.orden_id} onValueChange={v => setRepForm({...repForm, orden_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{ordenes?.map(o => <SelectItem key={o.id} value={o.id}>{o.folio} — {o.producto}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>N° Plano *</Label><Input value={repForm.numero_plano} onChange={e => setRepForm({...repForm, numero_plano: e.target.value})} placeholder="DWG-001" /></div>
              <div><Label>Revisión</Label><Input value={repForm.revision_plano} onChange={e => setRepForm({...repForm, revision_plano: e.target.value})} /></div>
              <div><Label>Producto</Label><Input value={repForm.producto} onChange={e => setRepForm({...repForm, producto: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><Label>Operador / Inspector</Label><Input value={repForm.operador} onChange={e => setRepForm({...repForm, operador: e.target.value})} /></div>
              <div>
                <Label>Instrumento</Label>
                <Select value={repForm.instrumento_id} onValueChange={v => setRepForm({...repForm, instrumento_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{instrumentos?.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.codigo} — {i.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Lote</Label><Input value={repForm.lote} onChange={e => setRepForm({...repForm, lote: e.target.value})} /></div>
              <div><Label>Pieza #</Label><Input type="number" value={repForm.pieza_numero} onChange={e => setRepForm({...repForm, pieza_numero: Number(e.target.value)})} /></div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Mediciones Dimensionales</h4>
                <Button variant="outline" size="sm" onClick={addMedicion}><Plus className="h-3 w-3 mr-1" />Agregar Medición</Button>
              </div>
              {mediciones.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border">
                      {["Característica","Nominal","Tol +","Tol -","Valor Medido","Resultado",""].map(h => <th key={h} className="text-left py-2 px-2 text-muted-foreground">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {mediciones.map((m, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1 px-2"><Input className="h-8 text-xs" placeholder="Ø Ext, Largo, etc." value={m.caracteristica} onChange={e => updateMedicion(i, "caracteristica", e.target.value)} /></td>
                          <td className="py-1 px-2"><Input className="h-8 text-xs font-mono" type="number" step="0.001" value={m.nominal} onChange={e => updateMedicion(i, "nominal", Number(e.target.value))} /></td>
                          <td className="py-1 px-2"><Input className="h-8 text-xs font-mono" type="number" step="0.001" value={m.tolerancia_sup} onChange={e => updateMedicion(i, "tolerancia_sup", Number(e.target.value))} /></td>
                          <td className="py-1 px-2"><Input className="h-8 text-xs font-mono" type="number" step="0.001" value={m.tolerancia_inf} onChange={e => updateMedicion(i, "tolerancia_inf", Number(e.target.value))} /></td>
                          <td className="py-1 px-2"><Input className="h-8 text-xs font-mono" type="number" step="0.001" value={m.valor_medido} onChange={e => updateMedicion(i, "valor_medido", Number(e.target.value))} /></td>
                          <td className="py-1 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.resultado === "ok" ? "bg-success/20 text-success" : m.resultado === "fuera" ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                              {m.resultado === "ok" ? "✓ OK" : m.resultado === "fuera" ? "✗ FUERA" : "—"}
                            </span>
                          </td>
                          <td className="py-1 px-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMediciones(mediciones.filter((_, idx) => idx !== i))}><X className="h-3 w-3 text-destructive" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <Button onClick={handleCreateReport} className="w-full" disabled={createRepMut.isPending}>Crear Reporte Dimensional</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === DIMENSIONAL REPORT DETAIL === */}
      <Dialog open={!!repDetailId} onOpenChange={() => setRepDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Reporte Dimensional — {detailReport?.numero_plano} Rev. {detailReport?.revision_plano}</DialogTitle></DialogHeader>
          {detailReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground">Producto</p><p className="font-semibold">{detailReport.producto || "—"}</p></div>
                <div><p className="text-muted-foreground">Pieza #</p><p className="font-mono font-semibold">{detailReport.pieza_numero}</p></div>
                <div><p className="text-muted-foreground">Lote</p><p className="font-semibold">{detailReport.lote || "—"}</p></div>
                <div><p className="text-muted-foreground">Resultado</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${detailReport.resultado_general === "aprobado" ? "bg-success/20 text-success" : detailReport.resultado_general === "rechazado" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>
                    {detailReport.resultado_general === "aprobado" ? "APROBADO" : detailReport.resultado_general === "rechazado" ? "RECHAZADO" : "PENDIENTE"}
                  </span>
                </div>
              </div>

              {detailMediciones.length > 0 && (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["Característica","Nominal","Tol +","Tol -","Medido","Resultado"].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground text-xs">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {detailMediciones.map((m, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-3 font-semibold">{m.caracteristica}</td>
                        <td className="py-2 px-3 font-mono">{m.nominal}</td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">+{m.tolerancia_sup}</td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">{m.tolerancia_inf}</td>
                        <td className="py-2 px-3 font-mono font-semibold">{m.valor_medido}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.resultado === "ok" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                            {m.resultado === "ok" ? "✓ OK" : "✗ FUERA"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Metrologia;
