import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useEmpleados } from "@/hooks/useSupabaseData";
import { useFaltas, useCreateFalta, useDeleteFalta } from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleTable from "@/components/rh/SimpleTable";

const RHFaltas = () => {
  const { data: empleados } = useEmpleados();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Faltas</h1>
        <p className="text-muted-foreground">Control de asistencia y faltas del personal</p>
      </div>
      <div className="flex justify-end">
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
                <SelectContent>{(empleados || []).map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
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

export default RHFaltas;
