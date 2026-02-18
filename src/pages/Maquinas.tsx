import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Cpu, Pencil, Trash2, Eye, UserPlus, User, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMaquinas, useCreateMaquina, useUpdateMaquina, useDeleteMaquina, useRegistrosPorMaquina, useEmpleados, useUpdateEmpleado } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const sc: Record<string, { label: string; cls: string }> = {
  activa: { label: "Activa", cls: "bg-success/20 text-success" },
  mantenimiento: { label: "Mantenimiento", cls: "bg-warning/20 text-warning" },
  inactiva: { label: "Inactiva", cls: "bg-destructive/20 text-destructive" },
};

const Maquinas = () => {
  const { data: maquinas, isLoading } = useMaquinas();
  const { data: empleados } = useEmpleados();
  const createMut = useCreateMaquina();
  const updateMut = useUpdateMaquina();
  const deleteMut = useDeleteMaquina();
  const updateEmpleadoMut = useUpdateEmpleado();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: registrosMaq } = useRegistrosPorMaquina(detailId);
  const [form, setForm] = useState({ nombre: "", tipo: "CNC", status: "activa", notas: "" });
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState("");

  const detailMaq = maquinas?.find(m => m.id === detailId);

  // Get operators assigned to a machine
  const getOperadores = (maquinaId: string) =>
    empleados?.filter(e => (e as any).maquina_id === maquinaId && e.status === "activo") || [];

  // Unassigned operators
  const operadoresSinMaquina = empleados?.filter(e => !(e as any).maquina_id && e.status === "activo") || [];

  const calcOEE = () => {
    if (!registrosMaq?.length) return { disp: 0, rend: 0, cal: 0, oee: 0 };
    const totalPiezas = registrosMaq.reduce((s, r) => s + (r.piezas_producidas || 0), 0);
    const totalScrap = registrosMaq.reduce((s, r) => s + (r.piezas_scrap || 0), 0);
    const cal = totalPiezas > 0 ? ((totalPiezas - totalScrap) / totalPiezas) * 100 : 100;
    const disp = Number(detailMaq?.oee_disponibilidad) || 100;
    const rend = Number(detailMaq?.oee_rendimiento) || 100;
    const oee = (disp * rend * cal) / 10000;
    return { disp, rend, cal: Math.round(cal), oee: Math.round(oee) };
  };

  const handleOpen = (m?: any) => {
    if (m) { setEditing(m); setForm({ nombre: m.nombre, tipo: m.tipo, status: m.status, notas: m.notas || "" }); }
    else { setEditing(null); setForm({ nombre: "", tipo: "CNC", status: "activa", notas: "" }); }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...form });
    else await createMut.mutateAsync(form);
    setOpen(false);
  };

  const handleAssignOperador = async () => {
    if (!assignOpen || !selectedEmpleadoId) return;
    await updateEmpleadoMut.mutateAsync({ id: selectedEmpleadoId, maquina_id: assignOpen });
    toast.success("Operador asignado a la máquina");
    setSelectedEmpleadoId("");
    setAssignOpen(null);
  };

  const handleRemoveOperador = async (empleadoId: string) => {
    await updateEmpleadoMut.mutateAsync({ id: empleadoId, maquina_id: null });
    toast.success("Operador desasignado");
  };

  const oeeData = calcOEE();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Máquinas</h1>
          <p className="text-muted-foreground">Gestión, monitoreo y asignación de operadores</p>
        </div>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Agregar Máquina</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : !maquinas?.length ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No hay máquinas registradas.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maquinas.map(m => {
            const oee = (Number(m.oee_disponibilidad) * Number(m.oee_rendimiento) * Number(m.oee_calidad)) / 10000;
            const ops = getOperadores(m.id);
            return (
              <Card key={m.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><Cpu className="h-5 w-5 text-primary" /></div>
                      <div>
                        <p className="font-semibold text-foreground">{m.nombre}</p>
                        <p className="text-xs text-muted-foreground">{m.tipo}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc[m.status]?.cls || ""}`}>
                      {sc[m.status]?.label || m.status}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">OEE</span>
                      <span className={`font-mono font-semibold ${oee >= 80 ? "text-success" : oee >= 60 ? "text-warning" : "text-destructive"}`}>{oee.toFixed(1)}%</span>
                    </div>
                    <Progress value={oee} className="h-2" />
                  </div>

                  {/* Operadores asignados */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">Operadores asignados</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setAssignOpen(m.id); setSelectedEmpleadoId(""); }}>
                        <UserPlus className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                    {ops.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {ops.map(op => (
                          <span key={op.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            <User className="h-3 w-3" />
                            {op.nombre}
                            <button onClick={(e) => { e.stopPropagation(); handleRemoveOperador(op.id); }} className="ml-0.5 hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Sin operadores</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground">Horas Totales</p><p className="font-semibold text-foreground">{Number(m.horas_trabajadas).toLocaleString()}</p></div>
                    <div className="flex gap-1 justify-end items-end">
                      <Button variant="ghost" size="icon" onClick={() => setDetailId(m.id)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(m)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Operator Dialog */}
      <Dialog open={!!assignOpen} onOpenChange={() => setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Asignar Operador — {maquinas?.find(m => m.id === assignOpen)?.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Already assigned */}
            {assignOpen && getOperadores(assignOpen).length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Operadores actuales</Label>
                <div className="space-y-1">
                  {getOperadores(assignOpen).map(op => (
                    <div key={op.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{op.nombre}</p>
                          <p className="text-xs text-muted-foreground">{op.puesto} — {op.turno}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveOperador(op.id)}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assign new */}
            <div className="space-y-1">
              <Label>Seleccionar operador disponible</Label>
              <p className="text-xs text-muted-foreground">Empleados activos sin máquina asignada</p>
              <Select value={selectedEmpleadoId} onValueChange={setSelectedEmpleadoId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar operador..." /></SelectTrigger>
                <SelectContent>
                  {operadoresSinMaquina.length > 0 ? (
                    operadoresSinMaquina.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre} — {e.puesto} ({e.turno})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                      No hay operadores disponibles sin asignar
                    </div>
                  )}
                  {/* Also show already-assigned operators from other machines */}
                  {empleados?.filter(e => (e as any).maquina_id && (e as any).maquina_id !== assignOpen && e.status === "activo").length ? (
                    <>
                      <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase mt-1">Ya asignados a otra máquina</div>
                      {empleados.filter(e => (e as any).maquina_id && (e as any).maquina_id !== assignOpen && e.status === "activo").map(e => {
                        const maqActual = maquinas?.find(m => m.id === (e as any).maquina_id);
                        return (
                          <SelectItem key={e.id} value={e.id}>
                            {e.nombre} — {e.puesto} (actualmente en {maqActual?.nombre || "otra"})
                          </SelectItem>
                        );
                      })}
                    </>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAssignOperador} className="w-full" disabled={!selectedEmpleadoId || updateEmpleadoMut.isPending}>
              Asignar Operador
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Machine Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle — {detailMaq?.nombre}</DialogTitle></DialogHeader>
          {detailMaq && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">OEE</p><p className="text-xl font-bold text-foreground">{oeeData.oee}%</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Disponibilidad</p><p className="text-xl font-bold text-foreground">{oeeData.disp}%</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Rendimiento</p><p className="text-xl font-bold text-foreground">{oeeData.rend}%</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Calidad</p><p className="text-xl font-bold text-foreground">{oeeData.cal}%</p></CardContent></Card>
              </div>

              {/* Operadores en detalle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Operadores Asignados</h3>
                  <Button variant="outline" size="sm" onClick={() => { setAssignOpen(detailMaq.id); setSelectedEmpleadoId(""); }}>
                    <UserPlus className="h-3.5 w-3.5 mr-1" />Asignar
                  </Button>
                </div>
                {getOperadores(detailMaq.id).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {getOperadores(detailMaq.id).map(op => (
                      <div key={op.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                        <User className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{op.nombre}</p>
                          <p className="text-xs text-muted-foreground">{op.puesto} — Turno {op.turno}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground italic">Sin operadores asignados</p>}
              </div>

              <h3 className="font-semibold">Historial de Producción ({registrosMaq?.length || 0} registros)</h3>
              {registrosMaq?.length ? (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["Orden","Operador","Piezas","Scrap","Turno","Fecha"].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground text-xs">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {registrosMaq.slice(0, 20).map(r => (
                      <tr key={r.id} className="border-b border-border/50">
                        <td className="py-2 px-3 font-mono text-primary">{(r as any).ordenes_produccion?.folio || "—"}</td>
                        <td className="py-2 px-3">{r.operador_nombre}</td>
                        <td className="py-2 px-3 font-mono">{r.piezas_producidas}</td>
                        <td className="py-2 px-3 font-mono text-destructive">{r.piezas_scrap}</td>
                        <td className="py-2 px-3">{r.turno}</td>
                        <td className="py-2 px-3 text-muted-foreground">{r.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted-foreground text-sm">Sin registros</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Máquina" : "Registrar Nueva Máquina"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre / Identificador de la máquina *</Label>
              <p className="text-xs text-muted-foreground">Nombre con el que se identifica en planta (ej: número de activo)</p>
              <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: CNC Haas VF-2 #03, Torno Mazak QT-200" />
            </div>
            <div className="space-y-1">
              <Label>Tipo de máquina</Label>
              <p className="text-xs text-muted-foreground">Categoría: CNC, Torno, Fresadora, Rectificadora, etc.</p>
              <Input value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} placeholder="Ej: CNC Vertical, Torno CNC, Rectificadora" />
            </div>
            <div className="space-y-1">
              <Label>Estado operativo</Label>
              <p className="text-xs text-muted-foreground">Disponibilidad actual de la máquina</p>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa (operando)</SelectItem>
                  <SelectItem value="mantenimiento">En Mantenimiento</SelectItem>
                  <SelectItem value="inactiva">Inactiva / Fuera de servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notas / Observaciones</Label>
              <p className="text-xs text-muted-foreground">Información adicional: marca, modelo, capacidades especiales</p>
              <Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Ej: Haas VF-2, control Fanuc, 3 ejes, husillo 8100 RPM" />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending || updateMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Maquinas;
