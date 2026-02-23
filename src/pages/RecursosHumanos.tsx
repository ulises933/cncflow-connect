import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Eye, X, DollarSign } from "lucide-react";
import { useEmpleados, useCreateEmpleado, useUpdateEmpleado, useDeleteEmpleado, useMaquinas, useRegistrosPorOperador } from "@/hooks/useSupabaseData";
import {
  useTiposDescuento, useCreateTipoDescuento, useDeleteTipoDescuento,
  useTiposPrestamo, useCreateTipoPrestamo, useDeleteTipoPrestamo,
  useIncapacidades, useCreateIncapacidad, useDeleteIncapacidad,
  useTiempoExtra, useCreateTiempoExtra, useDeleteTiempoExtra,
  useFaltas, useCreateFalta, useDeleteFalta,
  useDescuentos, useCreateDescuento, useDeleteDescuento,
  useVacaciones, useCreateVacaciones, useUpdateVacaciones, useDeleteVacaciones,
  usePrestamos, useCreatePrestamo, useDeletePrestamo,
  useAllAbonos, useCreateAbono,
  usePagosEmpleados, useCreatePagoEmpleado, useDeletePagoEmpleado,
  useEstadoCuenta,
} from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";

const deptos = ["producción", "calidad", "mantenimiento", "ingeniería", "almacén", "administración", "ventas"];
const contratos = ["planta", "temporal", "por obra", "honorarios"];

// ============ Sub-components for each tab ============

// Generic table for simple CRUD entities
const SimpleTable = ({ headers, rows, onDelete }: { headers: string[]; rows: any[][]; onDelete?: (id: string) => void }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead><tr className="border-b border-border">
        {headers.map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>)}
        {onDelete && <th className="py-2 px-3 text-xs"></th>}
      </tr></thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} className="border-b border-border/50 hover:bg-secondary/50">
            {row.slice(1).map((cell, ci) => <td key={ci} className="py-2 px-3">{cell}</td>)}
            {onDelete && <td className="py-2 px-3"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(row[0])}><Trash2 className="h-3 w-3 text-destructive" /></Button></td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ============ INCAPACIDADES TAB ============
const IncapacidadesTab = ({ empleados }: { empleados: any[] }) => {
  const { data, isLoading } = useIncapacidades();
  const createMut = useCreateIncapacidad();
  const deleteMut = useDeleteIncapacidad();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", fecha_inicio: "", fecha_fin: "", dias: 1, tipo: "enfermedad", folio_imss: "", notas: "" });

  const handleSave = async () => {
    if (!form.empleado_id) return;
    await createMut.mutateAsync(form);
    setOpen(false);
    setForm({ empleado_id: "", fecha_inicio: "", fecha_fin: "", dias: 1, tipo: "enfermedad", folio_imss: "", notas: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Incapacidades</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" />Nueva</Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin registros</p> : (
          <SimpleTable
            headers={["Empleado", "Tipo", "Fecha Inicio", "Fecha Fin", "Días", "Folio IMSS"]}
            rows={data.map(d => [d.id, (d as any).empleados?.nombre, d.tipo, d.fecha_inicio, d.fecha_fin || "—", d.dias, d.folio_imss || "—"])}
            onDelete={id => deleteMut.mutate(id)}
          />
        )}
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nueva Incapacidad</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Empleado *</Label>
              <Select value={form.empleado_id} onValueChange={v => setForm({ ...form, empleado_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{empleados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="enfermedad">Enfermedad</SelectItem>
                  <SelectItem value="accidente_trabajo">Accidente de Trabajo</SelectItem>
                  <SelectItem value="maternidad">Maternidad</SelectItem>
                </SelectContent>
              </Select></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Fecha Inicio</Label><Input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} /></div>
              <div><Label>Fecha Fin</Label><Input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} /></div>
              <div><Label>Días</Label><Input type="number" value={form.dias} onChange={e => setForm({ ...form, dias: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Folio IMSS</Label><Input value={form.folio_imss} onChange={e => setForm({ ...form, folio_imss: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ TIEMPO EXTRA TAB ============
const TiempoExtraTab = ({ empleados }: { empleados: any[] }) => {
  const { data, isLoading } = useTiempoExtra();
  const createMut = useCreateTiempoExtra();
  const deleteMut = useDeleteTiempoExtra();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", fecha: "", horas: 0, tipo: "doble", monto: 0, autorizado_por: "", notas: "" });

  const handleSave = async () => {
    if (!form.empleado_id) return;
    await createMut.mutateAsync(form);
    setOpen(false);
    setForm({ empleado_id: "", fecha: "", horas: 0, tipo: "doble", monto: 0, autorizado_por: "", notas: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Tiempo Extra</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" />Nuevo</Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin registros</p> : (
          <SimpleTable
            headers={["Empleado", "Fecha", "Horas", "Tipo", "Monto", "Autorizado por"]}
            rows={data.map(d => [d.id, (d as any).empleados?.nombre, d.fecha, d.horas, d.tipo, `$${Number(d.monto).toLocaleString()}`, d.autorizado_por || "—"])}
            onDelete={id => deleteMut.mutate(id)}
          />
        )}
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Tiempo Extra</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Empleado *</Label>
              <Select value={form.empleado_id} onValueChange={v => setForm({ ...form, empleado_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{empleados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></div>
              <div><Label>Horas</Label><Input type="number" value={form.horas} onChange={e => setForm({ ...form, horas: Number(e.target.value) })} /></div>
              <div><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doble">Doble</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Monto ($)</Label><Input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: Number(e.target.value) })} /></div>
              <div><Label>Autorizado por</Label><Input value={form.autorizado_por} onChange={e => setForm({ ...form, autorizado_por: e.target.value })} /></div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ FALTAS TAB ============
const FaltasTab = ({ empleados }: { empleados: any[] }) => {
  const { data, isLoading } = useFaltas();
  const createMut = useCreateFalta();
  const deleteMut = useDeleteFalta();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", fecha: "", tipo: "injustificada", motivo: "", notas: "" });

  const handleSave = async () => {
    if (!form.empleado_id) return;
    await createMut.mutateAsync(form);
    setOpen(false);
    setForm({ empleado_id: "", fecha: "", tipo: "injustificada", motivo: "", notas: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Faltas</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" />Nueva</Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin registros</p> : (
          <SimpleTable
            headers={["Empleado", "Fecha", "Tipo", "Motivo"]}
            rows={data.map(d => [d.id, (d as any).empleados?.nombre, d.fecha, d.tipo, d.motivo || "—"])}
            onDelete={id => deleteMut.mutate(id)}
          />
        )}
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nueva Falta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Empleado *</Label>
              <Select value={form.empleado_id} onValueChange={v => setForm({ ...form, empleado_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{empleados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="justificada">Justificada</SelectItem>
                  <SelectItem value="injustificada">Injustificada</SelectItem>
                  <SelectItem value="permiso">Permiso</SelectItem>
                </SelectContent>
              </Select></div>
            <div><Label>Motivo</Label><Input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ DESCUENTOS TAB ============
const DescuentosTab = ({ empleados }: { empleados: any[] }) => {
  const { data, isLoading } = useDescuentos();
  const { data: tipos } = useTiposDescuento();
  const createMut = useCreateDescuento();
  const deleteMut = useDeleteDescuento();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", tipo_descuento_id: "", fecha: "", monto: 0, descripcion: "" });

  const handleSave = async () => {
    if (!form.empleado_id) return;
    await createMut.mutateAsync({ ...form, tipo_descuento_id: form.tipo_descuento_id || null });
    setOpen(false);
    setForm({ empleado_id: "", tipo_descuento_id: "", fecha: "", monto: 0, descripcion: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Descuentos</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" />Nuevo</Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin registros</p> : (
          <SimpleTable
            headers={["Empleado", "Tipo", "Fecha", "Monto", "Descripción"]}
            rows={data.map(d => [d.id, (d as any).empleados?.nombre, (d as any).rh_tipos_descuento?.nombre || "—", d.fecha, `$${Number(d.monto).toLocaleString()}`, d.descripcion || "—"])}
            onDelete={id => deleteMut.mutate(id)}
          />
        )}
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Descuento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Empleado *</Label>
              <Select value={form.empleado_id} onValueChange={v => setForm({ ...form, empleado_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{empleados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Tipo de Descuento</Label>
              <Select value={form.tipo_descuento_id} onValueChange={v => setForm({ ...form, tipo_descuento_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>{tipos?.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></div>
              <div><Label>Monto ($)</Label><Input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Descripción</Label><Input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ VACACIONES TAB ============
const VacacionesTab = ({ empleados }: { empleados: any[] }) => {
  const { data, isLoading } = useVacaciones();
  const createMut = useCreateVacaciones();
  const updateMut = useUpdateVacaciones();
  const deleteMut = useDeleteVacaciones();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", fecha_inicio: "", fecha_fin: "", dias: 1, notas: "" });

  const statusColors: Record<string, string> = { pendiente: "bg-secondary text-secondary-foreground", aprobada: "bg-success/20 text-success", rechazada: "bg-destructive/20 text-destructive", tomada: "bg-primary/20 text-primary" };

  const handleSave = async () => {
    if (!form.empleado_id) return;
    await createMut.mutateAsync(form);
    setOpen(false);
    setForm({ empleado_id: "", fecha_inicio: "", fecha_fin: "", dias: 1, notas: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Vacaciones</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" />Nueva</Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin registros</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                {["Empleado", "Inicio", "Fin", "Días", "Estado", ""].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>)}
              </tr></thead>
              <tbody>
                {data.map(v => (
                  <tr key={v.id} className="border-b border-border/50">
                    <td className="py-2 px-3">{(v as any).empleados?.nombre}</td>
                    <td className="py-2 px-3">{v.fecha_inicio}</td>
                    <td className="py-2 px-3">{v.fecha_fin}</td>
                    <td className="py-2 px-3">{v.dias}</td>
                    <td className="py-2 px-3">
                      <Select value={v.status} onValueChange={s => updateMut.mutate({ id: v.id, status: s })}>
                        <SelectTrigger className="h-7 w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["pendiente", "aprobada", "rechazada", "tomada"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-3"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMut.mutate(v.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevas Vacaciones</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Empleado *</Label>
              <Select value={form.empleado_id} onValueChange={v => setForm({ ...form, empleado_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{empleados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Inicio</Label><Input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} /></div>
              <div><Label>Fin</Label><Input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} /></div>
              <div><Label>Días</Label><Input type="number" value={form.dias} onChange={e => setForm({ ...form, dias: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ PRÉSTAMOS TAB ============
const PrestamosTab = ({ empleados }: { empleados: any[] }) => {
  const { data, isLoading } = usePrestamos();
  const { data: tipos } = useTiposPrestamo();
  const createMut = useCreatePrestamo();
  const deleteMut = useDeletePrestamo();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", tipo_prestamo_id: "", monto: 0, plazo_quincenas: 12, abono_quincenal: 0, notas: "" });

  const handleSave = async () => {
    if (!form.empleado_id || !form.monto) return;
    const abono = form.abono_quincenal || (form.monto / form.plazo_quincenas);
    await createMut.mutateAsync({ ...form, abono_quincenal: abono, tipo_prestamo_id: form.tipo_prestamo_id || null });
    setOpen(false);
    setForm({ empleado_id: "", tipo_prestamo_id: "", monto: 0, plazo_quincenas: 12, abono_quincenal: 0, notas: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Préstamos</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" />Nuevo</Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin registros</p> : (
          <SimpleTable
            headers={["Empleado", "Tipo", "Monto", "Saldo", "Abono/Qna", "Plazo", "Estado"]}
            rows={data.map(d => [d.id, (d as any).empleados?.nombre, (d as any).rh_tipos_prestamo?.nombre || "—", `$${Number(d.monto).toLocaleString()}`, `$${Number(d.saldo).toLocaleString()}`, `$${Number(d.abono_quincenal).toLocaleString()}`, `${d.plazo_quincenas} qnas`,
              <span className={`px-2 py-0.5 rounded-full text-xs ${d.status === "activo" ? "bg-success/20 text-success" : "bg-secondary text-secondary-foreground"}`}>{d.status}</span>
            ])}
            onDelete={id => deleteMut.mutate(id)}
          />
        )}
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Préstamo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Empleado *</Label>
              <Select value={form.empleado_id} onValueChange={v => setForm({ ...form, empleado_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{empleados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Tipo de Préstamo</Label>
              <Select value={form.tipo_prestamo_id} onValueChange={v => setForm({ ...form, tipo_prestamo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>{tipos?.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Monto ($)</Label><Input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: Number(e.target.value) })} /></div>
              <div><Label>Plazo (quincenas)</Label><Input type="number" value={form.plazo_quincenas} onChange={e => setForm({ ...form, plazo_quincenas: Number(e.target.value) })} /></div>
              <div><Label>Abono/Qna ($)</Label><Input type="number" value={form.abono_quincenal} onChange={e => setForm({ ...form, abono_quincenal: Number(e.target.value) })} placeholder="Auto" /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ ABONOS TAB ============
const AbonosTab = () => {
  const { data: prestamos } = usePrestamos();
  const { data, isLoading } = useAllAbonos();
  const createMut = useCreateAbono();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ prestamo_id: "", monto: 0, notas: "" });

  const activePrestamos = prestamos?.filter(p => p.status === "activo") || [];

  const handleSave = async () => {
    if (!form.prestamo_id || !form.monto) return;
    await createMut.mutateAsync(form);
    setOpen(false);
    setForm({ prestamo_id: "", monto: 0, notas: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Abonos a Préstamos</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" />Nuevo Abono</Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin registros</p> : (
          <SimpleTable
            headers={["Empleado", "Fecha", "Monto", "Notas"]}
            rows={data.map(d => [d.id, (d as any).rh_prestamos?.empleados?.nombre || "—", d.fecha, `$${Number(d.monto).toLocaleString()}`, d.notas || "—"])}
          />
        )}
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Abono</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Préstamo *</Label>
              <Select value={form.prestamo_id} onValueChange={v => setForm({ ...form, prestamo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar préstamo activo" /></SelectTrigger>
                <SelectContent>{activePrestamos.map(p => <SelectItem key={p.id} value={p.id}>{(p as any).empleados?.nombre} — Saldo: ${Number(p.saldo).toLocaleString()}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Monto ($)</Label><Input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: Number(e.target.value) })} /></div>
            <div><Label>Notas</Label><Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending}>Registrar Abono</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ PAGOS A EMPLEADOS TAB ============
const PagosTab = ({ empleados }: { empleados: any[] }) => {
  const { data, isLoading } = usePagosEmpleados();
  const createMut = useCreatePagoEmpleado();
  const deleteMut = useDeletePagoEmpleado();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", periodo: "quincenal", salario_base: 0, tiempo_extra: 0, descuentos: 0, prestamos_descuento: 0, notas: "" });

  const total = Number(form.salario_base) + Number(form.tiempo_extra) - Number(form.descuentos) - Number(form.prestamos_descuento);

  const handleSave = async () => {
    if (!form.empleado_id) return;
    await createMut.mutateAsync(form);
    setOpen(false);
    setForm({ empleado_id: "", periodo: "quincenal", salario_base: 0, tiempo_extra: 0, descuentos: 0, prestamos_descuento: 0, notas: "" });
  };

  const handleSelectEmpleado = (empId: string) => {
    const emp = empleados.find(e => e.id === empId);
    const salarioQna = emp ? Number(emp.salario_mensual || 0) / 2 : 0;
    setForm({ ...form, empleado_id: empId, salario_base: salarioQna });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Pagos a Empleados</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" />Nuevo Pago</Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin registros</p> : (
          <SimpleTable
            headers={["Empleado", "Fecha", "Periodo", "Base", "T. Extra", "Descuentos", "Préstamos", "Total"]}
            rows={data.map(d => [d.id, (d as any).empleados?.nombre, d.fecha, d.periodo, `$${Number(d.salario_base).toLocaleString()}`, `$${Number(d.tiempo_extra).toLocaleString()}`, `$${Number(d.descuentos).toLocaleString()}`, `$${Number(d.prestamos_descuento).toLocaleString()}`, `$${Number(d.total).toLocaleString()}`])}
            onDelete={id => deleteMut.mutate(id)}
          />
        )}
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Pago</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Empleado *</Label>
              <Select value={form.empleado_id} onValueChange={handleSelectEmpleado}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{empleados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Periodo</Label>
              <Select value={form.periodo} onValueChange={v => setForm({ ...form, periodo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Salario Base ($)</Label><Input type="number" value={form.salario_base} onChange={e => setForm({ ...form, salario_base: Number(e.target.value) })} /></div>
              <div><Label>Tiempo Extra ($)</Label><Input type="number" value={form.tiempo_extra} onChange={e => setForm({ ...form, tiempo_extra: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Descuentos ($)</Label><Input type="number" value={form.descuentos} onChange={e => setForm({ ...form, descuentos: Number(e.target.value) })} /></div>
              <div><Label>Desc. Préstamos ($)</Label><Input type="number" value={form.prestamos_descuento} onChange={e => setForm({ ...form, prestamos_descuento: Number(e.target.value) })} /></div>
            </div>
            <div className="p-3 rounded bg-secondary text-center">
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-xl font-bold text-primary">${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending}>Registrar Pago</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ ESTADO DE CUENTA TAB ============
const EstadoCuentaTab = ({ empleados }: { empleados: any[] }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: cuenta, isLoading } = useEstadoCuenta(selectedId);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Estado de Cuenta</h3>
      <Select value={selectedId || ""} onValueChange={v => setSelectedId(v)}>
        <SelectTrigger><SelectValue placeholder="Seleccionar empleado..." /></SelectTrigger>
        <SelectContent>{empleados.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
      </Select>
      {selectedId && isLoading && <Skeleton className="h-40" />}
      {cuenta && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Pagos</p><p className="text-lg font-bold">{cuenta.pagos.length}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">T. Extra</p><p className="text-lg font-bold">{cuenta.tiempoExtra.length}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Descuentos</p><p className="text-lg font-bold text-destructive">{cuenta.descuentos.length}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Préstamos</p><p className="text-lg font-bold">{cuenta.prestamos.length}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Faltas</p><p className="text-lg font-bold text-destructive">{cuenta.faltas.length}</p></CardContent></Card>
          </div>
          {cuenta.pagos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Últimos Pagos</h4>
              <SimpleTable
                headers={["Fecha", "Periodo", "Base", "T. Extra", "Descuentos", "Total"]}
                rows={cuenta.pagos.slice(0, 10).map((p: any) => [p.id, p.fecha, p.periodo, `$${Number(p.salario_base).toLocaleString()}`, `$${Number(p.tiempo_extra).toLocaleString()}`, `$${Number(p.descuentos).toLocaleString()}`, `$${Number(p.total).toLocaleString()}`])}
              />
            </div>
          )}
          {cuenta.prestamos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Préstamos</h4>
              <SimpleTable
                headers={["Fecha", "Monto", "Saldo", "Estado"]}
                rows={cuenta.prestamos.map((p: any) => [p.id, p.fecha, `$${Number(p.monto).toLocaleString()}`, `$${Number(p.saldo).toLocaleString()}`, p.status])}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============ CATÁLOGOS TABS ============
const TipoDescuentoTab = () => {
  const { data, isLoading } = useTiposDescuento();
  const createMut = useCreateTipoDescuento();
  const deleteMut = useDeleteTipoDescuento();
  const [form, setForm] = useState({ nombre: "", descripcion: "", porcentaje_default: 0 });

  const handleAdd = async () => {
    if (!form.nombre.trim()) return;
    await createMut.mutateAsync(form);
    setForm({ nombre: "", descripcion: "", porcentaje_default: 0 });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Tipos de Descuento</h3>
      <div className="flex gap-2 items-end">
        <div className="flex-1"><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: IMSS, ISR, Fondo Ahorro" /></div>
        <div className="w-32"><Label>% Default</Label><Input type="number" value={form.porcentaje_default} onChange={e => setForm({ ...form, porcentaje_default: Number(e.target.value) })} /></div>
        <Button onClick={handleAdd} disabled={createMut.isPending}><Plus className="h-4 w-4" /></Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin tipos</p> : (
          <SimpleTable
            headers={["Nombre", "Descripción", "% Default"]}
            rows={data.map(d => [d.id, d.nombre, d.descripcion || "—", `${d.porcentaje_default}%`])}
            onDelete={id => deleteMut.mutate(id)}
          />
        )}
      </CardContent></Card>
    </div>
  );
};

const TipoPrestamoTab = () => {
  const { data, isLoading } = useTiposPrestamo();
  const createMut = useCreateTipoPrestamo();
  const deleteMut = useDeleteTipoPrestamo();
  const [form, setForm] = useState({ nombre: "", descripcion: "", tasa_interes: 0, plazo_max_quincenas: 24 });

  const handleAdd = async () => {
    if (!form.nombre.trim()) return;
    await createMut.mutateAsync(form);
    setForm({ nombre: "", descripcion: "", tasa_interes: 0, plazo_max_quincenas: 24 });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Tipos de Préstamo</h3>
      <div className="flex gap-2 items-end">
        <div className="flex-1"><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Personal, Emergencia, Caja Ahorro" /></div>
        <div className="w-24"><Label>Tasa %</Label><Input type="number" value={form.tasa_interes} onChange={e => setForm({ ...form, tasa_interes: Number(e.target.value) })} /></div>
        <div className="w-28"><Label>Plazo máx</Label><Input type="number" value={form.plazo_max_quincenas} onChange={e => setForm({ ...form, plazo_max_quincenas: Number(e.target.value) })} /></div>
        <Button onClick={handleAdd} disabled={createMut.isPending}><Plus className="h-4 w-4" /></Button>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-20 m-4" /> : !data?.length ? <p className="p-4 text-muted-foreground text-sm">Sin tipos</p> : (
          <SimpleTable
            headers={["Nombre", "Descripción", "Tasa %", "Plazo máx (qnas)"]}
            rows={data.map(d => [d.id, d.nombre, d.descripcion || "—", `${d.tasa_interes}%`, d.plazo_max_quincenas])}
            onDelete={id => deleteMut.mutate(id)}
          />
        )}
      </CardContent></Card>
    </div>
  );
};

// ============ EMPLEADOS TAB (original) ============
const EmpleadosTab = () => {
  const { data: empleados, isLoading } = useEmpleados();
  const { data: maquinas } = useMaquinas();
  const createMut = useCreateEmpleado();
  const updateMut = useUpdateEmpleado();
  const deleteMut = useDeleteEmpleado();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailNombre, setDetailNombre] = useState<string | null>(null);
  const { data: registrosOp } = useRegistrosPorOperador(detailNombre);
  const [form, setForm] = useState({
    nombre: "", puesto: "", turno: "matutino", maquina_id: "", email: "", telefono: "",
    curp: "", rfc: "", nss: "", salario_mensual: 0, departamento: "producción", tipo_contrato: "planta",
    fecha_nacimiento: "", direccion: "", contacto_emergencia: "", telefono_emergencia: "",
  });
  const [certInput, setCertInput] = useState("");
  const [certs, setCerts] = useState<string[]>([]);

  const handleOpen = (emp?: any) => {
    if (emp) {
      setEditing(emp);
      setForm({
        nombre: emp.nombre, puesto: emp.puesto, turno: emp.turno, maquina_id: emp.maquina_id || "",
        email: emp.email || "", telefono: emp.telefono || "",
        curp: emp.curp || "", rfc: emp.rfc || "", nss: emp.nss || "",
        salario_mensual: Number(emp.salario_mensual) || 0,
        departamento: emp.departamento || "producción", tipo_contrato: emp.tipo_contrato || "planta",
        fecha_nacimiento: emp.fecha_nacimiento || "", direccion: emp.direccion || "",
        contacto_emergencia: emp.contacto_emergencia || "", telefono_emergencia: emp.telefono_emergencia || "",
      });
      setCerts(Array.isArray(emp.certificaciones) ? emp.certificaciones : []);
    } else {
      setEditing(null);
      setForm({ nombre: "", puesto: "", turno: "matutino", maquina_id: "", email: "", telefono: "", curp: "", rfc: "", nss: "", salario_mensual: 0, departamento: "producción", tipo_contrato: "planta", fecha_nacimiento: "", direccion: "", contacto_emergencia: "", telefono_emergencia: "" });
      setCerts([]);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.puesto.trim()) return;
    const payload = { ...form, maquina_id: form.maquina_id || null, certificaciones: certs, fecha_nacimiento: form.fecha_nacimiento || undefined };
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...payload } as any);
    else await createMut.mutateAsync(payload as any);
    setOpen(false);
  };

  const toggleStatus = async (emp: any) => {
    await updateMut.mutateAsync({ id: emp.id, status: emp.status === "activo" ? "inactivo" : "activo" });
  };

  const totalPiezas = registrosOp?.reduce((s, r) => s + (r.piezas_producidas || 0), 0) || 0;
  const totalScrap = registrosOp?.reduce((s, r) => s + (r.piezas_scrap || 0), 0) || 0;
  const detailEmp = empleados?.find(e => e.nombre === detailNombre);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Empleados</h3>
        <Button size="sm" onClick={() => handleOpen()}><Plus className="h-3 w-3 mr-1" />Nuevo Empleado</Button>
      </div>

      <Card><CardContent className="p-0">
        {isLoading ? <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !empleados?.length ? <div className="p-8 text-center text-muted-foreground">No hay empleados registrados.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Nombre", "Puesto", "Depto", "Turno", "Máquina", "Contrato", "Estado", ""].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {empleados.map((e: any) => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{e.nombre}</td>
                      <td className="py-3 px-4 text-foreground">{e.puesto}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{e.departamento || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{e.turno}</td>
                      <td className="py-3 px-4 text-muted-foreground">{e.maquinas?.nombre || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{e.tipo_contrato || "—"}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleStatus(e)} className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${e.status === "activo" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                          {e.status === "activo" ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailNombre(e.nombre)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(e)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </CardContent></Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailNombre} onOpenChange={() => setDetailNombre(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Expediente — {detailNombre}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {detailEmp && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><p className="text-muted-foreground">CURP</p><p className="font-mono">{(detailEmp as any).curp || "—"}</p></div>
                <div><p className="text-muted-foreground">RFC</p><p className="font-mono">{(detailEmp as any).rfc || "—"}</p></div>
                <div><p className="text-muted-foreground">NSS (IMSS)</p><p className="font-mono">{(detailEmp as any).nss || "—"}</p></div>
                <div><p className="text-muted-foreground">Departamento</p><p className="capitalize">{(detailEmp as any).departamento || "—"}</p></div>
                <div><p className="text-muted-foreground">Contrato</p><p className="capitalize">{(detailEmp as any).tipo_contrato || "—"}</p></div>
                <div><p className="text-muted-foreground">Ingreso</p><p>{detailEmp.fecha_ingreso}</p></div>
              </div>
            )}
            <h3 className="font-semibold">Métricas de Producción</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Registros</p><p className="text-2xl font-bold text-foreground">{registrosOp?.length || 0}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Piezas Totales</p><p className="text-2xl font-bold text-foreground">{totalPiezas}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Scrap</p><p className="text-2xl font-bold text-destructive">{totalScrap}</p></CardContent></Card>
            </div>
            {registrosOp?.length ? (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Orden", "Máquina", "Piezas", "Scrap", "Turno", "Fecha"].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground text-xs">{h}</th>)}
                </tr></thead>
                <tbody>
                  {registrosOp.slice(0, 20).map(r => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 px-3 font-mono text-primary">{(r as any).ordenes_produccion?.folio || "—"}</td>
                      <td className="py-2 px-3">{(r as any).maquinas?.nombre || "—"}</td>
                      <td className="py-2 px-3 font-mono">{r.piezas_producidas}</td>
                      <td className="py-2 px-3 font-mono text-destructive">{r.piezas_scrap}</td>
                      <td className="py-2 px-3">{r.turno}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-muted-foreground text-sm">Sin registros de producción</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">DATOS PERSONALES</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Nombre completo *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Carlos Pérez" /></div>
              <div className="space-y-1"><Label>Fecha de nacimiento</Label><Input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>CURP</Label><Input value={form.curp} onChange={e => setForm({ ...form, curp: e.target.value.toUpperCase() })} /></div>
              <div className="space-y-1"><Label>RFC</Label><Input value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value.toUpperCase() })} /></div>
              <div className="space-y-1"><Label>NSS (IMSS)</Label><Input value={form.nss} onChange={e => setForm({ ...form, nss: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Dirección</Label><Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Contacto emergencia</Label><Input value={form.contacto_emergencia} onChange={e => setForm({ ...form, contacto_emergencia: e.target.value })} /></div>
              <div className="space-y-1"><Label>Tel. emergencia</Label><Input value={form.telefono_emergencia} onChange={e => setForm({ ...form, telefono_emergencia: e.target.value })} /></div>
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground">DATOS LABORALES</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Puesto *</Label><Input value={form.puesto} onChange={e => setForm({ ...form, puesto: e.target.value })} /></div>
              <div className="space-y-1"><Label>Departamento</Label>
                <Select value={form.departamento} onValueChange={v => setForm({ ...form, departamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{deptos.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Turno</Label>
                <Select value={form.turno} onValueChange={v => setForm({ ...form, turno: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                    <SelectItem value="nocturno">Nocturno</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-1"><Label>Contrato</Label>
                <Select value={form.tipo_contrato} onValueChange={v => setForm({ ...form, tipo_contrato: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{contratos.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1"><Label>Salario mensual ($)</Label><Input type="number" value={form.salario_mensual} onChange={e => setForm({ ...form, salario_mensual: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-1"><Label>Máquina asignada</Label>
              <Select value={form.maquina_id} onValueChange={v => setForm({ ...form, maquina_id: v })}>
                <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {maquinas?.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                </SelectContent>
              </Select></div>
            <div className="space-y-2">
              <Label>Certificaciones</Label>
              <div className="flex gap-2">
                <Input placeholder="Agregar certificación" value={certInput} onChange={e => setCertInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && certInput.trim()) { setCerts([...certs, certInput.trim()]); setCertInput(""); } }} />
                <Button variant="outline" onClick={() => { if (certInput.trim()) { setCerts([...certs, certInput.trim()]); setCertInput(""); } }}>+</Button>
              </div>
              <div className="flex flex-wrap gap-1">{certs.map((c, i) => (
                <span key={i} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
                  {c}<button onClick={() => setCerts(certs.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                </span>
              ))}</div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Guardar Cambios" : "Crear Empleado"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ MAIN COMPONENT ============
const RecursosHumanos = () => {
  const { data: empleados } = useEmpleados();
  const emps = empleados || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recursos Humanos</h1>
        <p className="text-muted-foreground">Gestión de personal, nómina, préstamos y más</p>
      </div>

      <Tabs defaultValue="empleados" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
          <TabsTrigger value="incapacidades">Incapacidades</TabsTrigger>
          <TabsTrigger value="tiempo_extra">Tiempo Extra</TabsTrigger>
          <TabsTrigger value="faltas">Faltas</TabsTrigger>
          <TabsTrigger value="descuentos">Descuentos</TabsTrigger>
          <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
          <TabsTrigger value="prestamos">Préstamos</TabsTrigger>
          <TabsTrigger value="abonos">Abonos</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="estado_cuenta">Estado de Cuenta</TabsTrigger>
          <TabsTrigger value="tipo_descuento">Tipo Descuento</TabsTrigger>
          <TabsTrigger value="tipo_prestamo">Tipo Préstamo</TabsTrigger>
        </TabsList>

        <TabsContent value="empleados"><EmpleadosTab /></TabsContent>
        <TabsContent value="incapacidades"><IncapacidadesTab empleados={emps} /></TabsContent>
        <TabsContent value="tiempo_extra"><TiempoExtraTab empleados={emps} /></TabsContent>
        <TabsContent value="faltas"><FaltasTab empleados={emps} /></TabsContent>
        <TabsContent value="descuentos"><DescuentosTab empleados={emps} /></TabsContent>
        <TabsContent value="vacaciones"><VacacionesTab empleados={emps} /></TabsContent>
        <TabsContent value="prestamos"><PrestamosTab empleados={emps} /></TabsContent>
        <TabsContent value="abonos"><AbonosTab /></TabsContent>
        <TabsContent value="pagos"><PagosTab empleados={emps} /></TabsContent>
        <TabsContent value="estado_cuenta"><EstadoCuentaTab empleados={emps} /></TabsContent>
        <TabsContent value="tipo_descuento"><TipoDescuentoTab /></TabsContent>
        <TabsContent value="tipo_prestamo"><TipoPrestamoTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default RecursosHumanos;
