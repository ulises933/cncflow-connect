import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, Square, Factory, ArrowLeft, Timer, Package, Wrench, AlertTriangle, CheckCircle, ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMaquinas, useEmpleados, useProcesos, useOrdenesProduccion, useCreateRegistroProduccion, useUpdateRegistroProduccion, useUpdateOrdenProduccion, useCreateInspeccion } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MOTIVOS_PARO = [
  "Falta de material",
  "Cambio de herramienta",
  "Falla de máquina",
  "Ajuste de programa",
  "Cambio de pieza/setup",
  "Mantenimiento no programado",
  "Falta de operador",
  "Esperando calidad",
  "Otro",
];

const OperadorView = () => {
  const navigate = useNavigate();
  const { data: maquinas } = useMaquinas();
  const { data: empleados } = useEmpleados();
  const { data: ordenes } = useOrdenesProduccion();
  const createRegMut = useCreateRegistroProduccion();
  const updateRegMut = useUpdateRegistroProduccion();
  const updateOPMut = useUpdateOrdenProduccion();
  const createInspeccionMut = useCreateInspeccion();

  const [maquinaId, setMaquinaId] = useState("");
  const [operadorNombre, setOperadorNombre] = useState("");
  const [turno, setTurno] = useState("matutino");
  const [selectedOrden, setSelectedOrden] = useState("");
  const [selectedProceso, setSelectedProceso] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [piezas, setPiezas] = useState(0);
  const [scrap, setScrap] = useState(0);
  const [registroId, setRegistroId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pause tracking
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [motivoParo, setMotivoParo] = useState("");
  const [motivoDetalle, setMotivoDetalle] = useState("");
  const [pauseStart, setPauseStart] = useState<Date | null>(null);
  const [pauseElapsed, setPauseElapsed] = useState(0);
  const [totalParoMin, setTotalParoMin] = useState(0);
  const [paros, setParos] = useState<{ motivo: string; detalle: string; minutos: number }[]>([]);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: procesos } = useProcesos(selectedOrden || undefined);
  const activeOrdenes = ordenes?.filter(o => o.status === "pendiente" || o.status === "en_proceso") || [];
  const selectedOrdenData = ordenes?.find(o => o.id === selectedOrden);
  const activeProcesos = procesos?.filter(p => p.status !== "terminado") || [];
  const selectedMaquina = maquinas?.find(m => m.id === maquinaId);
  const selectedProcesoData = procesos?.find(p => p.id === selectedProceso);

  // Load BOM items when order is selected
  useEffect(() => {
    if (!selectedOrden) { setBomItems([]); return; }
    const loadBom = async () => {
      const { data: bom } = await supabase.from("bom").select("id").eq("orden_id", selectedOrden).maybeSingle();
      if (bom) {
        const { data: items } = await supabase.from("bom_items").select("*").eq("bom_id", bom.id);
        setBomItems(items || []);
      } else {
        setBomItems([]);
      }
    };
    loadBom();
  }, [selectedOrden]);

  // Production timer
  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // Pause timer
  useEffect(() => {
    if (status === "paused" && pauseStart) {
      pauseTimerRef.current = setInterval(() => {
        setPauseElapsed(Math.floor((Date.now() - pauseStart.getTime()) / 1000));
      }, 1000);
    } else {
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
      setPauseElapsed(0);
    }
    return () => { if (pauseTimerRef.current) clearInterval(pauseTimerRef.current); };
  }, [status, pauseStart]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!maquinaId || !operadorNombre || !selectedOrden) {
      toast.error("Selecciona máquina, operador y orden");
      return;
    }
    const now = new Date();
    setStartTime(now);
    setElapsed(0);
    setTotalParoMin(0);
    setParos([]);

    const reg = await createRegMut.mutateAsync({
      orden_id: selectedOrden,
      proceso_id: selectedProceso || undefined,
      maquina_id: maquinaId,
      operador_nombre: operadorNombre,
      turno,
      hora_inicio: now.toISOString(),
      status: "en_proceso",
    });
    setRegistroId(reg.id);
    setStatus("running");

    if (selectedOrdenData?.status === "pendiente") {
      await updateOPMut.mutateAsync({ id: selectedOrden, status: "en_proceso" });
    }

    await createInspeccionMut.mutateAsync({
      orden_id: selectedOrden,
      tipo: "primera_pieza",
      producto: selectedOrdenData?.producto,
      operador: operadorNombre,
      maquina: selectedMaquina?.nombre,
      turno,
      piezas_fabricadas: 1,
      piezas_scrap: 0,
      notas: `Inspección automática de primera pieza — Orden ${selectedOrdenData?.folio}. Máquina: ${selectedMaquina?.nombre || "N/A"}. Proceso: ${selectedProcesoData?.nombre || "General"}.`,
    });
    toast.success("Producción iniciada — Inspección de primera pieza creada en Calidad");
  };

  const handlePauseClick = () => {
    setMotivoParo("");
    setMotivoDetalle("");
    setPauseDialogOpen(true);
  };

  const handleConfirmPause = async () => {
    if (!motivoParo) { toast.error("Selecciona un motivo de paro"); return; }
    setPauseDialogOpen(false);
    const now = new Date();
    setPauseStart(now);
    if (registroId) {
      await updateRegMut.mutateAsync({ id: registroId, status: "pausado", motivo_paro: motivoParo });
    }
    setStatus("paused");
    toast.info(`Producción pausada: ${motivoParo}`);
  };

  const handleResume = async () => {
    // Calculate pause duration
    const pauseMinutes = pauseStart ? Math.round((Date.now() - pauseStart.getTime()) / 60000) : 0;
    const newTotal = totalParoMin + pauseMinutes;
    setTotalParoMin(newTotal);
    setParos([...paros, { motivo: motivoParo, detalle: motivoDetalle, minutos: pauseMinutes }]);
    setPauseStart(null);

    if (registroId) {
      await updateRegMut.mutateAsync({ id: registroId, status: "en_proceso", tiempo_paro_min: newTotal });
    }
    setStatus("running");
    toast.success(`Producción reanudada (paro: ${pauseMinutes} min)`);
  };

  const handleFinish = async () => {
    if (!registroId) return;

    // If paused, account for final pause time
    let finalParoMin = totalParoMin;
    if (status === "paused" && pauseStart) {
      finalParoMin += Math.round((Date.now() - pauseStart.getTime()) / 60000);
    }

    const parosResumen = paros.length > 0
      ? paros.map(p => `${p.motivo} (${p.minutos} min)${p.detalle ? `: ${p.detalle}` : ""}`).join("; ")
      : "";

    await updateRegMut.mutateAsync({
      id: registroId, status: "terminado", hora_fin: new Date().toISOString(),
      piezas_producidas: piezas, piezas_scrap: scrap,
      tiempo_paro_min: finalParoMin,
      motivo_paro: parosResumen || undefined,
    });

    if (selectedOrden && selectedOrdenData) {
      const newProduced = (selectedOrdenData.cantidad_producida || 0) + piezas;
      const newScrap = (selectedOrdenData.cantidad_scrap || 0) + scrap;
      // Only auto-complete if all pieces are done AND all processes are finished
      const allProcsFinished = !procesos?.length || procesos.every((p: any) => p.status === "terminado");
      const piecesComplete = newProduced >= selectedOrdenData.cantidad_requerida;
      const isComplete = piecesComplete && allProcsFinished;
      await updateOPMut.mutateAsync({
        id: selectedOrden,
        cantidad_producida: newProduced,
        cantidad_scrap: newScrap,
        ...(isComplete ? { status: "terminado" } : {}),
      });
    }

    await createInspeccionMut.mutateAsync({
      orden_id: selectedOrden,
      tipo: "final",
      producto: selectedOrdenData?.producto,
      operador: operadorNombre,
      maquina: selectedMaquina?.nombre,
      turno,
      piezas_fabricadas: piezas,
      piezas_scrap: scrap,
      notas: `Inspección final automática — Orden ${selectedOrdenData?.folio}. Producidas: ${piezas}, Scrap: ${scrap}. Tiempo: ${formatTime(elapsed)}. Paro total: ${finalParoMin} min.${parosResumen ? ` Paros: ${parosResumen}` : ""}`,
    });

    toast.success("Producción finalizada — Inspección final enviada a Calidad");
    setStatus("idle");
    setPiezas(0);
    setScrap(0);
    setRegistroId(null);
    setStartTime(null);
    setElapsed(0);
    setTotalParoMin(0);
    setParos([]);
    setPauseStart(null);
  };

  const piezasRestantes = selectedOrdenData ? selectedOrdenData.cantidad_requerida - (selectedOrdenData.cantidad_producida || 0) : 0;
  const progreso = selectedOrdenData && selectedOrdenData.cantidad_requerida > 0
    ? Math.min(100, Math.round(((selectedOrdenData.cantidad_producida || 0) / selectedOrdenData.cantidad_requerida) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" /><span>Volver</span>
          </button>
          <div className="flex items-center gap-2">
            <Factory className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-foreground">Vista Operador</span>
          </div>
        </div>

        {/* Setup Form - only when idle */}
        {status === "idle" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configuración de Producción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Operador</Label>
                  <Select value={operadorNombre} onValueChange={(val) => {
                    setOperadorNombre(val);
                    const emp = empleados?.find(e => e.nombre === val);
                    if (emp) {
                      if (emp.maquina_id) setMaquinaId(emp.maquina_id);
                      if (emp.turno) setTurno(emp.turno);
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="¿Quién eres?" /></SelectTrigger>
                    <SelectContent>
                      {empleados?.filter(e => e.status === "activo").map(e => {
                        const maq = maquinas?.find(m => m.id === e.maquina_id);
                        return (
                          <SelectItem key={e.id} value={e.nombre}>
                            {e.nombre} — {e.puesto} {maq ? `(${maq.nombre})` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Máquina</Label>
                  <Select value={maquinaId} onValueChange={setMaquinaId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar máquina" /></SelectTrigger>
                    <SelectContent>
                      {maquinas?.filter(m => m.status === "activa").map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Turno</Label>
                  <Select value={turno} onValueChange={setTurno}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matutino">Matutino (6-14h)</SelectItem>
                      <SelectItem value="vespertino">Vespertino (14-22h)</SelectItem>
                      <SelectItem value="nocturno">Nocturno (22-6h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Orden de Producción</Label>
                  <Select value={selectedOrden} onValueChange={v => { setSelectedOrden(v); setSelectedProceso(""); }}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar orden" /></SelectTrigger>
                    <SelectContent>
                      {activeOrdenes.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.folio} — {o.producto}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeProcesos.length > 0 && (
                <div className="space-y-1">
                  <Label>Proceso / Operación</Label>
                  <Select value={selectedProceso} onValueChange={setSelectedProceso}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar proceso" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proceso específico</SelectItem>
                      {activeProcesos.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.orden_secuencia}. {p.nombre} ({p.tipo}) — {p.tiempo_estimado_hrs}h est.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ORDER PREVIEW */}
        {selectedOrdenData && (
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {selectedOrdenData.folio} — {selectedOrdenData.producto}
                </CardTitle>
                <Badge variant={selectedOrdenData.status === "en_proceso" ? "default" : "secondary"}>
                  {selectedOrdenData.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Requeridas</p>
                  <p className="text-2xl font-bold text-foreground">{selectedOrdenData.cantidad_requerida}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Producidas</p>
                  <p className="text-2xl font-bold text-primary">{selectedOrdenData.cantidad_producida || 0}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Faltan</p>
                  <p className="text-2xl font-bold text-warning">{Math.max(0, piezasRestantes)}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Avance</span><span>{progreso}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${progreso}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedOrdenData.material && <div><span className="text-muted-foreground">Material:</span> <span className="font-medium">{selectedOrdenData.material}</span></div>}
                {selectedOrdenData.numero_plano && <div><span className="text-muted-foreground">Plano:</span> <span className="font-medium">{selectedOrdenData.numero_plano} Rev.{selectedOrdenData.revision_plano || "A"}</span></div>}
                {selectedOrdenData.fecha_entrega && <div><span className="text-muted-foreground">Entrega:</span> <span className="font-medium">{selectedOrdenData.fecha_entrega}</span></div>}
                {selectedOrdenData.tiempo_estimado_total_hrs && <div><span className="text-muted-foreground">Tiempo est.:</span> <span className="font-medium">{selectedOrdenData.tiempo_estimado_total_hrs}h</span></div>}
              </div>

              {procesos && procesos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Wrench className="h-3 w-3" /> RUTA DE PROCESOS</p>
                    <div className="space-y-1">
                      {procesos.map((p: any) => (
                        <div key={p.id} className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                          p.id === selectedProceso ? "bg-primary/10 border border-primary/30" :
                          p.status === "terminado" ? "bg-muted/50 line-through text-muted-foreground" : ""
                        }`}>
                          <span className="text-xs font-mono text-muted-foreground w-5">{p.orden_secuencia}.</span>
                          {p.status === "terminado" ? <CheckCircle className="h-3.5 w-3.5 text-success" /> :
                           p.id === selectedProceso ? <Play className="h-3.5 w-3.5 text-primary" /> :
                           <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />}
                          <span className="flex-1">{p.nombre}</span>
                          <Badge variant="outline" className="text-[10px] h-5">{p.tipo}</Badge>
                          <span className="text-xs text-muted-foreground">{p.tiempo_estimado_hrs}h</span>
                          {(p as any).maquinas?.nombre && <span className="text-xs text-muted-foreground">• {(p as any).maquinas.nombre}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {bomItems.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Package className="h-3 w-3" /> MATERIALES (BOM)</p>
                    <div className="space-y-1">
                      {bomItems.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-sm px-2 py-1 bg-muted/30 rounded">
                          <span>{item.material}</span>
                          <span className="text-muted-foreground">{item.cantidad} {item.unidad}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedOrdenData.notas && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2 text-sm bg-warning/10 rounded-lg p-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-muted-foreground">{selectedOrdenData.notas}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timer & Status */}
        {(status === "running" || status === "paused") && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-secondary/50">
                  <Timer className="h-5 w-5 text-primary" />
                  <span className="text-4xl font-mono font-bold text-foreground">{formatTime(elapsed)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className={`px-6 py-2 rounded-full text-sm font-bold ${
                  status === "running" ? "bg-success/20 text-success animate-pulse" : "bg-warning/20 text-warning"
                }`}>
                  {status === "running" ? "● EN PRODUCCIÓN" : "⏸ PAUSADO"}
                </div>
              </div>

              {/* Pause info */}
              {status === "paused" && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-center space-y-1">
                  <p className="text-sm font-semibold text-warning">Motivo: {motivoParo}</p>
                  {motivoDetalle && <p className="text-xs text-muted-foreground">{motivoDetalle}</p>}
                  <p className="text-lg font-mono font-bold text-warning">{formatTime(pauseElapsed)}</p>
                  <p className="text-xs text-muted-foreground">Tiempo de paro actual</p>
                </div>
              )}

              {/* Paro history */}
              {paros.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Paros registrados ({totalParoMin} min total)</p>
                  {paros.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
                      <span>{p.motivo}{p.detalle ? ` — ${p.detalle}` : ""}</span>
                      <span className="font-mono text-warning">{p.minutos} min</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <p>{selectedOrdenData?.folio} — {selectedOrdenData?.producto} | Faltan <strong>{Math.max(0, piezasRestantes)}</strong> pzas</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {selectedOrdenData && (
          <div className="grid grid-cols-3 gap-3">
            {status === "idle" && (
              <Button onClick={handleStart} className="col-span-3 h-16 text-lg bg-success hover:bg-success/90 text-success-foreground" disabled={createRegMut.isPending || !maquinaId || !operadorNombre}>
                <Play className="h-6 w-6 mr-2" /> INICIAR PRODUCCIÓN
              </Button>
            )}
            {status === "running" && (
              <>
                <Button onClick={handlePauseClick} className="col-span-1 h-16 bg-warning hover:bg-warning/90 text-warning-foreground">
                  <Pause className="h-6 w-6" />
                </Button>
                <Button onClick={handleFinish} className="col-span-2 h-16 text-lg bg-destructive hover:bg-destructive/90">
                  <Square className="h-6 w-6 mr-2" /> FINALIZAR
                </Button>
              </>
            )}
            {status === "paused" && (
              <>
                <Button onClick={handleResume} className="col-span-2 h-16 text-lg bg-success hover:bg-success/90 text-success-foreground">
                  <Play className="h-6 w-6 mr-2" /> REANUDAR
                </Button>
                <Button onClick={handleFinish} className="col-span-1 h-16 bg-destructive hover:bg-destructive/90">
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Piece counters */}
        {(status === "running" || status === "paused") && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Piezas OK</p>
                <p className="text-4xl font-bold text-foreground">{piezas}</p>
                <div className="flex gap-2 mt-3 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setPiezas(p => Math.max(0, p - 1))}>-1</Button>
                  <Button size="sm" onClick={() => setPiezas(p => p + 1)} className="bg-success hover:bg-success/90 text-success-foreground">+1</Button>
                  <Button variant="outline" size="sm" onClick={() => setPiezas(p => p + 10)}>+10</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Scrap</p>
                <p className="text-4xl font-bold text-destructive">{scrap}</p>
                <div className="flex gap-2 mt-3 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setScrap(s => Math.max(0, s - 1))}>-1</Button>
                  <Button variant="outline" size="sm" onClick={() => setScrap(s => s + 1)}>+1</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quality notice */}
        {status === "idle" && selectedOrdenData && maquinaId && operadorNombre && (
          <div className="flex items-start gap-2 text-sm bg-primary/5 border border-primary/20 rounded-lg p-3">
            <ClipboardCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Al iniciar se creará automáticamente una <strong>inspección de primera pieza</strong> en Calidad.
              Al finalizar se generará la <strong>inspección final</strong> con el resumen de producción.
            </p>
          </div>
        )}
      </div>

      {/* Pause Reason Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Motivo de Paro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>¿Por qué pausas la producción?</Label>
              <div className="grid grid-cols-2 gap-2">
                {MOTIVOS_PARO.map(m => (
                  <Button
                    key={m}
                    variant={motivoParo === m ? "default" : "outline"}
                    size="sm"
                    className="justify-start text-xs h-auto py-2"
                    onClick={() => setMotivoParo(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Detalle (opcional)</Label>
              <Textarea
                value={motivoDetalle}
                onChange={e => setMotivoDetalle(e.target.value)}
                placeholder="Describe el problema con más detalle..."
                rows={2}
              />
            </div>
            <Button onClick={handleConfirmPause} className="w-full bg-warning hover:bg-warning/90 text-warning-foreground" disabled={!motivoParo}>
              <Pause className="h-4 w-4 mr-2" /> Confirmar Paro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperadorView;
