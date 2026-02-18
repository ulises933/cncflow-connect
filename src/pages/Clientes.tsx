import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";

const emptyForm = { nombre: "", razon_social: "", rfc: "", contacto: "", email: "", telefono: "", direccion: "", ciudad: "", estado: "", codigo_postal: "", pais: "México", industria: "", tipo: "nacional", condiciones_pago: "30 días", limite_credito: 0, moneda: "MXN", sitio_web: "", notas: "" };

const Clientes = () => {
  const { data: clientes, isLoading } = useClientes();
  const createMut = useCreateCliente();
  const updateMut = useUpdateCliente();
  const deleteMut = useDeleteCliente();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = clientes?.find(c => c.id === detailId);

  const handleOpen = (client?: any) => {
    if (client) {
      setEditing(client);
      setForm({
        nombre: client.nombre, razon_social: client.razon_social || "", rfc: client.rfc || "",
        contacto: client.contacto || "", email: client.email || "", telefono: client.telefono || "",
        direccion: client.direccion || "", ciudad: client.ciudad || "", estado: client.estado || "",
        codigo_postal: client.codigo_postal || "", pais: client.pais || "México",
        industria: client.industria || "", tipo: client.tipo || "nacional",
        condiciones_pago: client.condiciones_pago || "30 días",
        limite_credito: Number(client.limite_credito) || 0,
        moneda: client.moneda || "MXN", sitio_web: client.sitio_web || "", notas: client.notas || "",
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...form } as any);
    else await createMut.mutateAsync(form as any);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">CRM de clientes y prospectos</p>
        </div>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Nuevo Cliente</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !clientes?.length ? <div className="p-8 text-center text-muted-foreground">No hay clientes registrados.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Empresa","RFC","Contacto","Email","Teléfono","Tipo","Cond. Pago",""].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{c.nombre}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{(c as any).rfc || "—"}</td>
                      <td className="py-3 px-4 text-foreground">{c.contacto || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{c.email || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{c.telefono || "—"}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${(c as any).tipo === "extranjero" ? "bg-info/20 text-info" : "bg-secondary text-secondary-foreground"}`}>{(c as any).tipo === "extranjero" ? "Extranjero" : "Nacional"}</span></td>
                      <td className="py-3 px-4 text-muted-foreground">{(c as any).condiciones_pago || "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailId(c.id)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{detail?.nombre}</DialogTitle></DialogHeader>
          {detail && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><p className="text-muted-foreground">Razón Social</p><p className="font-semibold">{(detail as any).razon_social || "—"}</p></div>
              <div><p className="text-muted-foreground">RFC</p><p className="font-mono font-semibold">{(detail as any).rfc || "—"}</p></div>
              <div><p className="text-muted-foreground">Contacto</p><p className="font-semibold">{detail.contacto || "—"}</p></div>
              <div><p className="text-muted-foreground">Email</p><p>{detail.email || "—"}</p></div>
              <div><p className="text-muted-foreground">Teléfono</p><p>{detail.telefono || "—"}</p></div>
              <div><p className="text-muted-foreground">Industria</p><p>{(detail as any).industria || "—"}</p></div>
              <div><p className="text-muted-foreground">Dirección</p><p>{detail.direccion || "—"}</p></div>
              <div><p className="text-muted-foreground">Ciudad/Estado</p><p>{(detail as any).ciudad || "—"}, {(detail as any).estado || "—"}</p></div>
              <div><p className="text-muted-foreground">País</p><p>{(detail as any).pais || "México"}</p></div>
              <div><p className="text-muted-foreground">Condiciones de Pago</p><p>{(detail as any).condiciones_pago || "—"}</p></div>
              <div><p className="text-muted-foreground">Límite de Crédito</p><p className="font-mono">${Number((detail as any).limite_credito || 0).toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Moneda</p><p>{(detail as any).moneda || "MXN"}</p></div>
              {(detail as any).sitio_web && <div className="col-span-2"><p className="text-muted-foreground">Sitio Web</p><a href={(detail as any).sitio_web} target="_blank" className="text-primary underline">{(detail as any).sitio_web}</a></div>}
              {detail.notas && <div className="col-span-3"><p className="text-muted-foreground">Notas</p><p>{detail.notas}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nombre comercial / Empresa *</Label>
                <p className="text-xs text-muted-foreground">Nombre con el que se conoce al cliente</p>
                <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Pemex, General Motors" />
              </div>
              <div className="space-y-1">
                <Label>Razón social</Label>
                <p className="text-xs text-muted-foreground">Nombre legal registrado ante el SAT</p>
                <Input value={form.razon_social} onChange={e => setForm({...form, razon_social: e.target.value})} placeholder="Ej: Petróleos Mexicanos S.A. de C.V." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>RFC</Label>
                <p className="text-xs text-muted-foreground">Registro Federal de Contribuyentes para facturación</p>
                <Input value={form.rfc} onChange={e => setForm({...form, rfc: e.target.value.toUpperCase()})} placeholder="XAXX010101000" />
              </div>
              <div className="space-y-1">
                <Label>Tipo de cliente</Label>
                <p className="text-xs text-muted-foreground">Nacional = México · Extranjero = otro país</p>
                <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="nacional">Nacional</SelectItem><SelectItem value="extranjero">Extranjero</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Industria / Sector</Label>
                <p className="text-xs text-muted-foreground">Giro del negocio del cliente</p>
                <Input value={form.industria} onChange={e => setForm({...form, industria: e.target.value})} placeholder="Ej: Automotriz, Aeroespacial, Oil & Gas" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Contacto principal</Label>
                <p className="text-xs text-muted-foreground">Nombre del comprador o responsable</p>
                <Input value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value})} placeholder="Ej: Ing. Roberto Martínez" />
              </div>
              <div className="space-y-1">
                <Label>Email de contacto</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="compras@cliente.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="(81) 1234-5678" />
              </div>
              <div className="space-y-1">
                <Label>Sitio web</Label>
                <Input value={form.sitio_web} onChange={e => setForm({...form, sitio_web: e.target.value})} placeholder="https://www.cliente.com" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Dirección</Label>
              <p className="text-xs text-muted-foreground">Dirección de la planta o oficinas del cliente</p>
              <Input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Av. Industrial 456, Parque Industrial" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Ciudad</Label><Input value={form.ciudad} onChange={e => setForm({...form, ciudad: e.target.value})} placeholder="Monterrey" /></div>
              <div><Label>Estado</Label><Input value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} placeholder="Nuevo León" /></div>
              <div><Label>Código Postal</Label><Input value={form.codigo_postal} onChange={e => setForm({...form, codigo_postal: e.target.value})} placeholder="64000" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Condiciones de pago</Label>
                <p className="text-xs text-muted-foreground">Plazo acordado para recibir el pago</p>
                <Select value={form.condiciones_pago} onValueChange={v => setForm({...form, condiciones_pago: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Contado","15 días","30 días","45 días","60 días","90 días"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Límite de crédito ($)</Label>
                <p className="text-xs text-muted-foreground">Monto máximo de crédito autorizado</p>
                <Input type="number" value={form.limite_credito} onChange={e => setForm({...form, limite_credito: Number(e.target.value)})} placeholder="Ej: 500,000" />
              </div>
              <div className="space-y-1">
                <Label>Moneda</Label>
                <p className="text-xs text-muted-foreground">Divisa para facturación</p>
                <Select value={form.moneda} onValueChange={v => setForm({...form, moneda: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="MXN">MXN (Peso)</SelectItem><SelectItem value="USD">USD (Dólar)</SelectItem><SelectItem value="EUR">EUR (Euro)</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} /></div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending || updateMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clientes;
