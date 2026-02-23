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
import { useIncapacidades, useCreateIncapacidad, useDeleteIncapacidad } from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleTable from "@/components/rh/SimpleTable";

const RHIncapacidades = () => {
  const { data: empleados } = useEmpleados();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Incapacidades</h1>
        <p className="text-muted-foreground">Control de incapacidades del personal</p>
      </div>
      <div className="flex justify-end">
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
                <SelectContent>{(empleados || []).map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
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

export default RHIncapacidades;
