import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Trash2, Pencil } from "lucide-react";
import { useProveedores, useCreateProveedor, useUpdateProveedor, useDeleteProveedor } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIAS = ["general", "aceros", "herramientas", "refacciones", "servicios", "consumibles", "otro"];

const Proveedores = () => {
  const { data: proveedores, isLoading } = useProveedores();
  const createMut = useCreateProveedor();
  const updateMut = useUpdateProveedor();
  const deleteMut = useDeleteProveedor();

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", contacto: "", email: "", telefono: "", direccion: "", categoria: "general", notas: "" });
  const [filterCat, setFilterCat] = useState("all");

  const filtered = filterCat === "all" ? proveedores : proveedores?.filter((p: any) => p.categoria === filterCat);

  const openNew = () => { setEditId(null); setForm({ nombre: "", contacto: "", email: "", telefono: "", direccion: "", categoria: "general", notas: "" }); setFormOpen(true); };
  const openEdit = (p: any) => { setEditId(p.id); setForm({ nombre: p.nombre, contacto: p.contacto || "", email: p.email || "", telefono: p.telefono || "", direccion: p.direccion || "", categoria: (p as any).categoria || "general", notas: p.notas || "" }); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    if (editId) {
      await updateMut.mutateAsync({ id: editId, ...form });
    } else {
      await createMut.mutateAsync(form as any);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
          <p className="text-muted-foreground">Directorio de proveedores y categorías</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nuevo Proveedor</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={filterCat === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterCat("all")}>Todos</Button>
        {CATEGORIAS.map(c => (
          <Button key={c} variant={filterCat === c ? "default" : "outline"} size="sm" onClick={() => setFilterCat(c)} className="capitalize">{c}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            : !filtered?.length ? <div className="p-8 text-center text-muted-foreground">No hay proveedores.</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["Nombre", "Categoría", "Contacto", "Email", "Teléfono", ""].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered?.map((p: any) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">{p.nombre}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">{p.categoria || "general"}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{p.contacto || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.email || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.telefono || "—"}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Nuevo"} Proveedor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Razón social o nombre comercial" /></div>
            <div className="space-y-1">
              <Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Contacto</Label><Input value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} /></div>
              <div className="space-y-1"><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Dirección</Label><Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
            <div className="space-y-1"><Label>Notas</Label><Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending || updateMut.isPending}>
              {editId ? "Guardar Cambios" : "Crear Proveedor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Proveedores;
