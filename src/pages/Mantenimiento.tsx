import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, CalendarDays, List, ChevronLeft, ChevronRight } from "lucide-react";
import { useMantenimiento, useCreateMantenimiento, useUpdateMantenimiento, useDeleteMantenimiento, useMaquinas, useUpdateMaquina } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isSameMonth, addWeeks, addDays } from "date-fns";
import { es } from "date-fns/locale";

const sc: Record<string, { label: string; cls: string }> = {
  programado: { label: "Programado", cls: "bg-info/20 text-info" },
  en_proceso: { label: "En Proceso", cls: "bg-warning/20 text-warning" },
  completado: { label: "Completado", cls: "bg-success/20 text-success" },
};

const frecuencias: Record<string, string> = {
  unica: "Única vez",
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const Mantenimiento = () => {
  const { data: registros, isLoading } = useMantenimiento();
  const { data: maquinas } = useMaquinas();
  const createMut = useCreateMantenimiento();
  const updateMut = useUpdateMantenimiento();
  const deleteMut = useDeleteMantenimiento();
  const updateMaqMut = useUpdateMaquina();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [vista, setVista] = useState<"lista" | "calendario">("calendario");
  const [calMonth, setCalMonth] = useState(new Date());
  const [form, setForm] = useState({ maquina_id: "", tipo: "preventivo", descripcion: "", fecha: new Date().toISOString().split("T")[0], costo: 0, notas: "", frecuencia: "unica" });

  const handleOpen = (m?: any) => {
    if (m) {
      setEditing(m);
      setForm({ maquina_id: m.maquina_id, tipo: m.tipo, descripcion: m.descripcion, fecha: m.fecha, costo: Number(m.costo), notas: m.notas || "", frecuencia: m.frecuencia || "unica" });
    } else {
      setEditing(null);
      setForm({ maquina_id: "", tipo: "preventivo", descripcion: "", fecha: new Date().toISOString().split("T")[0], costo: 0, notas: "", frecuencia: "unica" });
    }
    setOpen(true);
  };

  const calcProximaFecha = (fecha: string, frecuencia: string): string | null => {
    if (frecuencia === "unica") return null;
    const d = new Date(fecha + "T12:00:00");
    const map: Record<string, () => Date> = {
      semanal: () => addWeeks(d, 1),
      quincenal: () => addWeeks(d, 2),
      mensual: () => addMonths(d, 1),
      trimestral: () => addMonths(d, 3),
      semestral: () => addMonths(d, 6),
      anual: () => addMonths(d, 12),
    };
    return map[frecuencia] ? format(map[frecuencia](), "yyyy-MM-dd") : null;
  };

  const handleSave = async () => {
    if (!form.maquina_id || !form.descripcion.trim()) return;
    const proxima = calcProximaFecha(form.fecha, form.frecuencia);
    const payload: any = { ...form, proxima_fecha: proxima };
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...payload });
    else await createMut.mutateAsync(payload);
    setOpen(false);
  };

  const handleStatusChange = async (id: string, status: string, maquinaId: string) => {
    await updateMut.mutateAsync({ id, status });
    if (status === "en_proceso") await updateMaqMut.mutateAsync({ id: maquinaId, status: "mantenimiento" });
    else if (status === "completado") await updateMaqMut.mutateAsync({ id: maquinaId, status: "activa" });
  };

  // Generate recurring occurrences for the calendar view
  const calendarEvents = useMemo(() => {
    if (!registros) return [];
    const events: { date: Date; registro: any }[] = [];
    const monthStart = startOfMonth(calMonth);
    const monthEnd = endOfMonth(calMonth);

    registros.forEach((r: any) => {
      const baseDate = new Date(r.fecha + "T12:00:00");
      const freq = r.frecuencia || "unica";

      if (freq === "unica") {
        if (baseDate >= monthStart && baseDate <= monthEnd) {
          events.push({ date: baseDate, registro: r });
        }
        return;
      }

      // Generate recurring dates within the visible month
      const intervalMap: Record<string, number> = { semanal: 7, quincenal: 14 };
      const monthMap: Record<string, number> = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 };

      let current = new Date(baseDate);
      // Advance to month range
      if (intervalMap[freq]) {
        const days = intervalMap[freq];
        while (current < monthStart) current = addDays(current, days);
        while (current <= monthEnd) {
          events.push({ date: new Date(current), registro: r });
          current = addDays(current, days);
        }
      } else if (monthMap[freq]) {
        const months = monthMap[freq];
        while (current < monthStart) current = addMonths(current, months);
        while (current <= monthEnd) {
          events.push({ date: new Date(current), registro: r });
          current = addMonths(current, months);
        }
      }
    });

    return events;
  }, [registros, calMonth]);

  const calDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const startDow = getDay(startOfMonth(calMonth));
  const today = new Date();

  const renderRow = (m: any) => (
    <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
      <td className="py-3 px-4 text-foreground">{m.maquinas?.nombre || "—"}</td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.tipo === "preventivo" ? "bg-info/20 text-info" : "bg-warning/20 text-warning"}`}>{m.tipo === "preventivo" ? "Preventivo" : "Correctivo"}</span>
      </td>
      <td className="py-3 px-4 text-foreground max-w-[200px] truncate">{m.descripcion}</td>
      <td className="py-3 px-4">
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">{frecuencias[m.frecuencia || "unica"]}</span>
      </td>
      <td className="py-3 px-4">
        <Select value={m.status} onValueChange={v => handleStatusChange(m.id, v, m.maquina_id)}>
          <SelectTrigger className="h-7 w-32">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc[m.status]?.cls}`}>{sc[m.status]?.label}</span>
          </SelectTrigger>
          <SelectContent>{Object.entries(sc).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
        </Select>
      </td>
      <td className="py-3 px-4 text-muted-foreground">{m.fecha}</td>
      <td className="py-3 px-4 text-muted-foreground text-xs">{m.proxima_fecha || "—"}</td>
      <td className="py-3 px-4 font-mono text-foreground">${Number(m.costo).toLocaleString()}</td>
      <td className="py-3 px-4">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleOpen(m)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mantenimiento</h1>
          <p className="text-muted-foreground">Preventivo y correctivo de máquinas</p>
        </div>
        <div className="flex gap-2 items-center">
          <Tabs value={vista} onValueChange={v => setVista(v as any)}>
            <TabsList>
              <TabsTrigger value="lista" className="gap-1"><List className="h-4 w-4" />Lista</TabsTrigger>
              <TabsTrigger value="calendario" className="gap-1"><CalendarDays className="h-4 w-4" />Calendario</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Programar</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : vista === "lista" ? (
        !registros?.length ? <Card><CardContent className="p-8 text-center text-muted-foreground">No hay registros de mantenimiento.</CardContent></Card> : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["Máquina","Tipo","Descripción","Frecuencia","Estado","Fecha","Próxima","Costo",""].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                  </tr></thead>
                  <tbody>{registros.map(renderRow)}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        /* CALENDAR VIEW */
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCalMonth(subMonths(calMonth, 1))}><ChevronLeft className="h-5 w-5" /></Button>
              <h2 className="text-lg font-semibold text-foreground capitalize">
                {format(calMonth, "MMMM yyyy", { locale: es })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCalMonth(addMonths(calMonth, 1))}><ChevronRight className="h-5 w-5" /></Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {/* Empty cells for offset */}
              {Array.from({ length: startDow }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-background min-h-[100px] p-1" />
              ))}

              {calDays.map(day => {
                const dayEvents = calendarEvents.filter(e => isSameDay(e.date, day));
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={day.toISOString()}
                    className={`bg-background min-h-[100px] p-1 transition-colors ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                  >
                    <div className={`text-xs font-medium mb-1 px-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5 overflow-y-auto max-h-[80px]">
                      {dayEvents.map((ev, idx) => {
                        const isRecurring = (ev.registro.frecuencia || "unica") !== "unica";
                        const colorCls = ev.registro.tipo === "preventivo"
                          ? "bg-info/20 text-info border-info/30"
                          : "bg-warning/20 text-warning border-warning/30";
                        return (
                          <button
                            key={`${ev.registro.id}-${idx}`}
                            onClick={() => handleOpen(ev.registro)}
                            className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded border truncate ${colorCls} hover:opacity-80 transition-opacity`}
                          >
                            {isRecurring && "🔄 "}{ev.registro.maquinas?.nombre || "?"}: {ev.registro.descripcion}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-info/20 border border-info/30" /> Preventivo</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/20 border border-warning/30" /> Correctivo</div>
              <div className="flex items-center gap-1">🔄 Recurrente</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Mantenimiento" : "Programar Mantenimiento"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Máquina *</Label>
              <Select value={form.maquina_id} onValueChange={v => setForm({...form, maquina_id: v})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar máquina" /></SelectTrigger>
                <SelectContent>{maquinas?.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.tipo})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventivo">Preventivo</SelectItem>
                    <SelectItem value="correctivo">Correctivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Frecuencia</Label>
                <Select value={form.frecuencia} onValueChange={v => setForm({...form, frecuencia: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(frecuencias).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descripción *</Label>
              <Textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Ej: Cambio de rodamientos del husillo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Fecha</Label>
                <Input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Costo ($)</Label>
                <Input type="number" value={form.costo} onChange={e => setForm({...form, costo: Number(e.target.value)})} />
              </div>
            </div>
            {form.frecuencia !== "unica" && (
              <div className="p-3 rounded-lg bg-info/10 border border-info/20 text-sm">
                <p className="text-info font-medium">🔄 Mantenimiento recurrente: {frecuencias[form.frecuencia]}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Próxima fecha: <span className="font-semibold">{calcProximaFecha(form.fecha, form.frecuencia) || "—"}</span>
                </p>
              </div>
            )}
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Observaciones adicionales" />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending || updateMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mantenimiento;
