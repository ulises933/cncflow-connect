import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useEmpleados } from "@/hooks/useSupabaseData";
import { usePagosEmpleados, useCreatePagoEmpleado, useDeletePagoEmpleado } from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleTable from "@/components/rh/SimpleTable";

const RHPagos = () => {
  const { data: empleados } = useEmpleados();
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
    const emp = (empleados || []).find(e => e.id === empId);
    const salarioQna = emp ? Number(emp.salario_mensual || 0) / 2 : 0;
    setForm({ ...form, empleado_id: empId, salario_base: salarioQna });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pagos a Empleados</h1>
        <p className="text-muted-foreground">Registro de pagos y nómina del personal</p>
      </div>
      <div className="flex justify-end">
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
                <SelectContent>{(empleados || []).map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
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

export default RHPagos;
