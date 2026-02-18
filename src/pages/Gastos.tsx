import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useGastos, useCreateGasto, useUpdateGasto, useDeleteGasto } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";

const cats = ["Material", "Mantenimiento", "Herramienta", "Insumo", "Nómina", "Servicios", "Otro"];
const catColors: Record<string, string> = {
  Material: "bg-info/20 text-info", Mantenimiento: "bg-warning/20 text-warning", Herramienta: "bg-primary/20 text-primary",
  Insumo: "bg-success/20 text-success", Nómina: "bg-accent/20 text-accent-foreground", Servicios: "bg-secondary text-secondary-foreground", Otro: "bg-muted text-muted-foreground",
};

const Gastos = () => {
  const { data: gastos, isLoading } = useGastos();
  const createMut = useCreateGasto();
  const updateMut = useUpdateGasto();
  const deleteMut = useDeleteGasto();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ categoria: "Material", descripcion: "", proveedor: "", monto: 0, orden_ref: "", fecha: new Date().toISOString().split("T")[0] });

  const handleOpen = (g?: any) => {
    if (g) { setEditing(g); setForm({ categoria: g.categoria, descripcion: g.descripcion, proveedor: g.proveedor || "", monto: Number(g.monto), orden_ref: g.orden_ref || "", fecha: g.fecha }); }
    else { setEditing(null); setForm({ categoria: "Material", descripcion: "", proveedor: "", monto: 0, orden_ref: "", fecha: new Date().toISOString().split("T")[0] }); }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.descripcion.trim()) return;
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...form });
    else await createMut.mutateAsync(form);
    setOpen(false);
  };

  const totalGastos = gastos?.reduce((s, g) => s + Number(g.monto), 0) || 0;
  const porCategoria = gastos?.reduce((acc, g) => { acc[g.categoria] = (acc[g.categoria] || 0) + Number(g.monto); return acc; }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gastos y Proveedores</h1>
          <p className="text-muted-foreground">Control de gastos operativos · Total: <span className="font-mono font-semibold text-primary">${totalGastos.toLocaleString()}</span></p>
        </div>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Nuevo Gasto</Button>
      </div>

      {Object.keys(porCategoria).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(porCategoria).map(([cat, monto]) => (
            <Card key={cat}>
              <CardContent className="p-4 text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${catColors[cat] || catColors.Otro}`}>{cat}</span>
                <p className="text-lg font-bold font-mono text-foreground mt-2">${monto.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !gastos?.length ? <div className="p-8 text-center text-muted-foreground">No hay gastos registrados.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Categoría","Descripción","Proveedor","Monto","Orden","Fecha",""].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gastos.map(g => (
                    <tr key={g.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${catColors[g.categoria] || catColors.Otro}`}>{g.categoria}</span></td>
                      <td className="py-3 px-4 text-foreground">{g.descripcion}</td>
                      <td className="py-3 px-4 text-foreground">{g.proveedor || "—"}</td>
                      <td className="py-3 px-4 font-mono text-foreground">${Number(g.monto).toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{g.orden_ref || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{g.fecha}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(g)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Gasto" : "Registrar Nuevo Gasto"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Categoría del gasto</Label>
              <p className="text-xs text-muted-foreground">Clasificación para agrupar y analizar los gastos</p>
              <Select value={form.categoria} onValueChange={v => setForm({...form, categoria: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Descripción del gasto *</Label>
              <p className="text-xs text-muted-foreground">Detalle de qué se compró o pagó</p>
              <Input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Ej: Compra de insertos de carburo para torno" />
            </div>
            <div className="space-y-1">
              <Label>Proveedor o acreedor</Label>
              <p className="text-xs text-muted-foreground">Empresa o persona a la que se le pagó</p>
              <Input value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value})} placeholder="Ej: Sandvik Coromant" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Monto ($)</Label>
                <p className="text-xs text-muted-foreground">Cantidad total pagada con IVA</p>
                <Input type="number" value={form.monto} onChange={e => setForm({...form, monto: Number(e.target.value)})} placeholder="Ej: 4,500.00" />
              </div>
              <div className="space-y-1">
                <Label>Fecha del gasto</Label>
                <p className="text-xs text-muted-foreground">Día en que se realizó la compra</p>
                <Input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Referencia de orden (opcional)</Label>
              <p className="text-xs text-muted-foreground">Folio de la OP u OC relacionada para rastreo de costos</p>
              <Input value={form.orden_ref} onChange={e => setForm({...form, orden_ref: e.target.value})} placeholder="Ej: OP-001, OC-015" />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending || updateMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gastos;
