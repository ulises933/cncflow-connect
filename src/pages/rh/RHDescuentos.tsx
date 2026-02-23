import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useEmpleados } from "@/hooks/useSupabaseData";
import { useDescuentos, useCreateDescuento, useDeleteDescuento, useTiposDescuento } from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleTable from "@/components/rh/SimpleTable";

const RHDescuentos = () => {
  const { data: empleados } = useEmpleados();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Descuentos</h1>
        <p className="text-muted-foreground">Gestión de descuentos aplicados al personal</p>
      </div>
      <div className="flex justify-end">
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
                <SelectContent>{(empleados || []).map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
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

export default RHDescuentos;
