import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, X } from "lucide-react";
import { useEmpleados, useCreateEmpleado, useUpdateEmpleado, useDeleteEmpleado, useMaquinas, useRegistrosPorOperador } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";

const deptos = ["producción", "calidad", "mantenimiento", "ingeniería", "almacén", "administración", "ventas"];
const contratos = ["planta", "temporal", "por obra", "honorarios"];

const RecursosHumanos = () => {
  const { data: empleados, isLoading } = useEmpleados();
  const { data: maquinas } = useMaquinas();
  const createMut = useCreateEmpleado();
  const updateMut = useUpdateEmpleado();
  const deleteMut = useDeleteEmpleado();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailNombre, setDetailNombre] = useState<string | null>(null);
  const { data: registrosOp } = useRegistrosPorOperador(detailNombre);
  const [form, setForm] = useState({
    nombre: "", puesto: "", turno: "matutino", maquina_id: "", email: "", telefono: "",
    curp: "", rfc: "", nss: "", salario_mensual: 0, departamento: "producción", tipo_contrato: "planta",
    fecha_nacimiento: "", direccion: "", contacto_emergencia: "", telefono_emergencia: "",
  });
  const [certInput, setCertInput] = useState("");
  const [certs, setCerts] = useState<string[]>([]);

  const handleOpen = (emp?: any) => {
    if (emp) {
      setEditing(emp);
      setForm({
        nombre: emp.nombre, puesto: emp.puesto, turno: emp.turno, maquina_id: emp.maquina_id || "",
        email: emp.email || "", telefono: emp.telefono || "",
        curp: emp.curp || "", rfc: emp.rfc || "", nss: emp.nss || "",
        salario_mensual: Number(emp.salario_mensual) || 0,
        departamento: emp.departamento || "producción", tipo_contrato: emp.tipo_contrato || "planta",
        fecha_nacimiento: emp.fecha_nacimiento || "", direccion: emp.direccion || "",
        contacto_emergencia: emp.contacto_emergencia || "", telefono_emergencia: emp.telefono_emergencia || "",
      });
      setCerts(Array.isArray(emp.certificaciones) ? emp.certificaciones : []);
    } else {
      setEditing(null);
      setForm({ nombre: "", puesto: "", turno: "matutino", maquina_id: "", email: "", telefono: "", curp: "", rfc: "", nss: "", salario_mensual: 0, departamento: "producción", tipo_contrato: "planta", fecha_nacimiento: "", direccion: "", contacto_emergencia: "", telefono_emergencia: "" });
      setCerts([]);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.puesto.trim()) return;
    const payload = { ...form, maquina_id: form.maquina_id || null, certificaciones: certs, fecha_nacimiento: form.fecha_nacimiento || undefined };
    if (editing) await updateMut.mutateAsync({ id: editing.id, ...payload } as any);
    else await createMut.mutateAsync(payload as any);
    setOpen(false);
  };

  const toggleStatus = async (emp: any) => {
    await updateMut.mutateAsync({ id: emp.id, status: emp.status === "activo" ? "inactivo" : "activo" });
  };

  const totalPiezas = registrosOp?.reduce((s, r) => s + (r.piezas_producidas || 0), 0) || 0;
  const totalScrap = registrosOp?.reduce((s, r) => s + (r.piezas_scrap || 0), 0) || 0;
  const detailEmp = empleados?.find(e => e.nombre === detailNombre);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recursos Humanos</h1>
          <p className="text-muted-foreground">Gestión de personal, nómina y desempeño</p>
        </div>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" />Nuevo Empleado</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !empleados?.length ? <div className="p-8 text-center text-muted-foreground">No hay empleados registrados.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Nombre","Puesto","Depto","Turno","Máquina","Contrato","Estado",""].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {empleados.map((e: any) => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{e.nombre}</td>
                      <td className="py-3 px-4 text-foreground">{e.puesto}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{e.departamento || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{e.turno}</td>
                      <td className="py-3 px-4 text-muted-foreground">{e.maquinas?.nombre || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{e.tipo_contrato || "—"}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleStatus(e)} className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${e.status === "activo" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                          {e.status === "activo" ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailNombre(e.nombre)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpen(e)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
      <Dialog open={!!detailNombre} onOpenChange={() => setDetailNombre(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Expediente — {detailNombre}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {detailEmp && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><p className="text-muted-foreground">CURP</p><p className="font-mono">{(detailEmp as any).curp || "—"}</p></div>
                <div><p className="text-muted-foreground">RFC</p><p className="font-mono">{(detailEmp as any).rfc || "—"}</p></div>
                <div><p className="text-muted-foreground">NSS (IMSS)</p><p className="font-mono">{(detailEmp as any).nss || "—"}</p></div>
                <div><p className="text-muted-foreground">Departamento</p><p className="capitalize">{(detailEmp as any).departamento || "—"}</p></div>
                <div><p className="text-muted-foreground">Contrato</p><p className="capitalize">{(detailEmp as any).tipo_contrato || "—"}</p></div>
                <div><p className="text-muted-foreground">Ingreso</p><p>{detailEmp.fecha_ingreso}</p></div>
                <div><p className="text-muted-foreground">Contacto Emergencia</p><p>{(detailEmp as any).contacto_emergencia || "—"}</p></div>
                <div><p className="text-muted-foreground">Tel. Emergencia</p><p>{(detailEmp as any).telefono_emergencia || "—"}</p></div>
              </div>
            )}
            <h3 className="font-semibold">Métricas de Producción</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Registros</p><p className="text-2xl font-bold text-foreground">{registrosOp?.length || 0}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Piezas Totales</p><p className="text-2xl font-bold text-foreground">{totalPiezas}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Scrap</p><p className="text-2xl font-bold text-destructive">{totalScrap}</p></CardContent></Card>
            </div>
            {registrosOp?.length ? (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Orden","Máquina","Piezas","Scrap","Turno","Fecha"].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground text-xs">{h}</th>)}
                </tr></thead>
                <tbody>
                  {registrosOp.slice(0, 20).map(r => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 px-3 font-mono text-primary">{(r as any).ordenes_produccion?.folio || "—"}</td>
                      <td className="py-2 px-3">{(r as any).maquinas?.nombre || "—"}</td>
                      <td className="py-2 px-3 font-mono">{r.piezas_producidas}</td>
                      <td className="py-2 px-3 font-mono text-destructive">{r.piezas_scrap}</td>
                      <td className="py-2 px-3">{r.turno}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-muted-foreground text-sm">Sin registros de producción</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">DATOS PERSONALES</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nombre completo *</Label>
                <p className="text-xs text-muted-foreground">Nombre y apellidos del trabajador</p>
                <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Juan Carlos Pérez López" />
              </div>
              <div className="space-y-1">
                <Label>Fecha de nacimiento</Label>
                <Input type="date" value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>CURP</Label>
                <p className="text-xs text-muted-foreground">Clave Única de Registro de Población (18 caracteres)</p>
                <Input value={form.curp} onChange={e => setForm({...form, curp: e.target.value.toUpperCase()})} placeholder="PERC850101HNLRRL09" />
              </div>
              <div className="space-y-1">
                <Label>RFC</Label>
                <p className="text-xs text-muted-foreground">Registro Federal de Contribuyentes (13 caracteres)</p>
                <Input value={form.rfc} onChange={e => setForm({...form, rfc: e.target.value.toUpperCase()})} placeholder="PERC8501019X3" />
              </div>
              <div className="space-y-1">
                <Label>NSS (IMSS)</Label>
                <p className="text-xs text-muted-foreground">Número de Seguro Social (11 dígitos)</p>
                <Input value={form.nss} onChange={e => setForm({...form, nss: e.target.value})} placeholder="12345678901" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Dirección</Label>
              <p className="text-xs text-muted-foreground">Domicilio completo del empleado</p>
              <Input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Ej: Av. Industrial 123, Col. Centro, Monterrey, N.L." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="juan.perez@empresa.com" />
              </div>
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="(81) 1234-5678" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Contacto de emergencia</Label>
                <p className="text-xs text-muted-foreground">Nombre de familiar o persona de confianza</p>
                <Input value={form.contacto_emergencia} onChange={e => setForm({...form, contacto_emergencia: e.target.value})} placeholder="Ej: María López (esposa)" />
              </div>
              <div className="space-y-1">
                <Label>Teléfono de emergencia</Label>
                <Input value={form.telefono_emergencia} onChange={e => setForm({...form, telefono_emergencia: e.target.value})} placeholder="(81) 9876-5432" />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground">DATOS LABORALES</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Puesto *</Label>
                <p className="text-xs text-muted-foreground">Cargo o función principal del empleado</p>
                <Input value={form.puesto} onChange={e => setForm({...form, puesto: e.target.value})} placeholder="Ej: Operador CNC, Inspector de Calidad" />
              </div>
              <div className="space-y-1">
                <Label>Departamento</Label>
                <p className="text-xs text-muted-foreground">Área de la empresa donde trabaja</p>
                <Select value={form.departamento} onValueChange={v => setForm({...form, departamento: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{deptos.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Turno</Label>
                <p className="text-xs text-muted-foreground">Horario de trabajo asignado</p>
                <Select value={form.turno} onValueChange={v => setForm({...form, turno: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matutino">Matutino (6:00-14:00)</SelectItem>
                    <SelectItem value="vespertino">Vespertino (14:00-22:00)</SelectItem>
                    <SelectItem value="nocturno">Nocturno (22:00-6:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tipo de contrato</Label>
                <p className="text-xs text-muted-foreground">Relación laboral formal</p>
                <Select value={form.tipo_contrato} onValueChange={v => setForm({...form, tipo_contrato: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{contratos.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Salario mensual ($)</Label>
                <p className="text-xs text-muted-foreground">Sueldo bruto mensual</p>
                <Input type="number" value={form.salario_mensual} onChange={e => setForm({...form, salario_mensual: Number(e.target.value)})} placeholder="Ej: 15,000" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Máquina asignada</Label>
              <p className="text-xs text-muted-foreground">Máquina principal que opera este empleado (si aplica)</p>
              <Select value={form.maquina_id} onValueChange={v => setForm({...form, maquina_id: v})}>
                <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {maquinas?.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Certificaciones</Label>
              <p className="text-xs text-muted-foreground">Certificados, cursos o capacitaciones que ha completado</p>
              <div className="flex gap-2">
                <Input placeholder="Ej: ISO 9001, Programación Fanuc, Seguridad Industrial" value={certInput} onChange={e => setCertInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && certInput.trim()) { setCerts([...certs, certInput.trim()]); setCertInput(""); } }} />
                <Button variant="outline" size="sm" onClick={() => { if (certInput.trim()) { setCerts([...certs, certInput.trim()]); setCertInput(""); } }}>Agregar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {certs.map((c, i) => (
                  <span key={i} className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary flex items-center gap-1">
                    {c}<button onClick={() => setCerts(certs.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createMut.isPending || updateMut.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecursosHumanos;
