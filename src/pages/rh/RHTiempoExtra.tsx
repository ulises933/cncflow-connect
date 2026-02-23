import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useEmpleados } from "@/hooks/useSupabaseData";
import { useTiempoExtra, useCreateTiempoExtra, useDeleteTiempoExtra } from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleTable from "@/components/rh/SimpleTable";

const RHTiempoExtra = () => {
  const { data: empleados } = useEmpleados();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tiempo Extra</h1>
        <p className="text-muted-foreground">Registro de horas extra del personal</p>
      </div>
      <div className="flex justify-end">
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
                <SelectContent>{(empleados || []).map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
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

export default RHTiempoExtra;
