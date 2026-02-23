import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useEmpleados } from "@/hooks/useSupabaseData";
import { usePrestamos, useCreatePrestamo, useDeletePrestamo, useTiposPrestamo, useAllAbonos, useCreateAbono } from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleTable from "@/components/rh/SimpleTable";

const RHPrestamos = () => {
  const { data: empleados } = useEmpleados();
  const { data, isLoading } = usePrestamos();
  const { data: tipos } = useTiposPrestamo();
  const createMut = useCreatePrestamo();
  const deleteMut = useDeletePrestamo();
  const { data: abonos, isLoading: abonosLoading } = useAllAbonos();
  const createAbono = useCreateAbono();
  const [open, setOpen] = useState(false);
  const [abonoOpen, setAbonoOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", tipo_prestamo_id: "", monto: 0, plazo_quincenas: 12, abono_quincenal: 0, notas: "" });
  const [abonoForm, setAbonoForm] = useState({ prestamo_id: "", monto: 0, notas: "" });

  const activePrestamos = data?.filter(p => p.status === "activo") || [];

  const handleSave = async () => {
    if (!form.empleado_id || !form.monto) return;
    const abono = form.abono_quincenal || (form.monto / form.plazo_quincenas);
    await createMut.mutateAsync({ ...form, abono_quincenal: abono, tipo_prestamo_id: form.tipo_prestamo_id || null });
    setOpen(false);
    setForm({ empleado_id: "", tipo_prestamo_id: "", monto: 0, plazo_quincenas: 12, abono_quincenal: 0, notas: "" });
  };

  const handleAbono = async () => {
    if (!abonoForm.prestamo_id || !abonoForm.monto) return;
    await createAbono.mutateAsync(abonoForm);
    setAbonoOpen(false);
    setAbonoForm({ prestamo_id: "", monto: 0, notas: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Préstamos y Abonos</h1>
        <p className="text-muted-foreground">Gestión de préstamos al personal y sus abonos</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setAbonoOpen(true)}><Plus className="h-3 w-3 mr-1" />Nuevo Abono</Button>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" />Nuevo Préstamo</Button>
      </div>

      <h3 className="font-semibold text-foreground">Préstamos</h3>
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

      <h3 className="font-semibold text-foreground">Abonos</h3>
      <Card><CardContent className="p-0">
        {abonosLoading ? <Skeleton className="h-20 m-4" /> : !abonos?.length ? <p className="p-4 text-muted-foreground text-sm">Sin registros</p> : (
          <SimpleTable
            headers={["Empleado", "Fecha", "Monto", "Notas"]}
            rows={abonos.map(d => [d.id, (d as any).rh_prestamos?.empleados?.nombre || "—", d.fecha, `$${Number(d.monto).toLocaleString()}`, d.notas || "—"])}
          />
        )}
      </CardContent></Card>

      {/* Nuevo Préstamo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Préstamo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Empleado *</Label>
              <Select value={form.empleado_id} onValueChange={v => setForm({ ...form, empleado_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{(empleados || []).map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
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

      {/* Nuevo Abono */}
      <Dialog open={abonoOpen} onOpenChange={setAbonoOpen}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Abono</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Préstamo *</Label>
              <Select value={abonoForm.prestamo_id} onValueChange={v => setAbonoForm({ ...abonoForm, prestamo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar préstamo activo" /></SelectTrigger>
                <SelectContent>{activePrestamos.map(p => <SelectItem key={p.id} value={p.id}>{(p as any).empleados?.nombre} — Saldo: ${Number(p.saldo).toLocaleString()}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Monto ($)</Label><Input type="number" value={abonoForm.monto} onChange={e => setAbonoForm({ ...abonoForm, monto: Number(e.target.value) })} /></div>
            <div><Label>Notas</Label><Input value={abonoForm.notas} onChange={e => setAbonoForm({ ...abonoForm, notas: e.target.value })} /></div>
            <Button onClick={handleAbono} className="w-full" disabled={createAbono.isPending}>Registrar Abono</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RHPrestamos;
