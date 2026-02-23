import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useEmpleados } from "@/hooks/useSupabaseData";
import { useVacaciones, useCreateVacaciones, useUpdateVacaciones, useDeleteVacaciones } from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";

const RHVacaciones = () => {
  const { data: empleados } = useEmpleados();
  const { data, isLoading } = useVacaciones();
  const createMut = useCreateVacaciones();
  const updateMut = useUpdateVacaciones();
  const deleteMut = useDeleteVacaciones();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ empleado_id: "", fecha_inicio: "", fecha_fin: "", dias: 1, notas: "" });

  const handleSave = async () => {
    if (!form.empleado_id) return;
    await createMut.mutateAsync(form);
    setOpen(false);
    setForm({ empleado_id: "", fecha_inicio: "", fecha_fin: "", dias: 1, notas: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vacaciones</h1>
        <p className="text-muted-foreground">Gestión de vacaciones del personal</p>
      </div>
      <div className="flex justify-end">
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
                <SelectContent>{(empleados || []).map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
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

export default RHVacaciones;
