import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, X, Upload } from "lucide-react";
import { useEmpleados, useCreateEmpleado, useUpdateEmpleado, useDeleteEmpleado, useMaquinas, useRegistrosPorOperador } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const deptos = ["producción", "calidad", "mantenimiento", "ingeniería", "almacén", "administración", "ventas"];
const contratos = ["planta", "temporal", "por obra", "honorarios"];
const tiposEmpleado = ["operador", "administrativo", "supervisor", "gerente", "técnico", "almacenista", "otro"];
const estadosMx = ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Guanajuato","Guerrero","Hidalgo","Jalisco","Estado de México","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"];

const emptyForm = {
  nombre: "", apellido_paterno: "", apellido_materno: "", puesto: "", turno: "matutino",
  maquina_id: "", email: "", telefono: "", curp: "", rfc: "", nss: "",
  salario_mensual: 0, departamento: "producción", tipo_contrato: "planta",
  fecha_nacimiento: "", enfermedades: "", alergias: "",
  calle: "", numero_exterior: "", colonia: "", codigo_postal: "", estado_dir: "", municipio: "", pais: "México",
  contacto_emergencia: "", telefono_emergencia: "", sucursal: "", numero_empleado: "",
  tipo_empleado: "operador", sueldo_base_semanal: 0, dias_laborales_semana: 6,
  aguinaldo: 0, imss_descuento: 0, infonavit: 0, fonacot: 0, retencion_impuestos: 0,
  direccion: "",
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2">
    <span className="border border-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">!</span>
    {title}
  </div>
);

const RHEmpleados = () => {
  const { data: empleados, isLoading } = useEmpleados();
  const { data: maquinas } = useMaquinas();
  const createMut = useCreateEmpleado();
  const updateMut = useUpdateEmpleado();
  const deleteMut = useDeleteEmpleado();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailNombre, setDetailNombre] = useState<string | null>(null);
  const { data: registrosOp } = useRegistrosPorOperador(detailNombre);
  const [form, setForm] = useState(emptyForm);
  const [certInput, setCertInput] = useState("");
  const [certs, setCerts] = useState<string[]>([]);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  const handleOpen = (emp?: any) => {
    if (emp) {
      setEditing(emp);
      setForm({
        nombre: emp.nombre || "", apellido_paterno: emp.apellido_paterno || "", apellido_materno: emp.apellido_materno || "",
        puesto: emp.puesto, turno: emp.turno, maquina_id: emp.maquina_id || "",
        email: emp.email || "", telefono: emp.telefono || "",
        curp: emp.curp || "", rfc: emp.rfc || "", nss: emp.nss || "",
        salario_mensual: Number(emp.salario_mensual) || 0,
        departamento: emp.departamento || "producción", tipo_contrato: emp.tipo_contrato || "planta",
        fecha_nacimiento: emp.fecha_nacimiento || "", enfermedades: emp.enfermedades || "", alergias: emp.alergias || "",
        calle: emp.calle || "", numero_exterior: emp.numero_exterior || "", colonia: emp.colonia || "",
        codigo_postal: emp.codigo_postal || "", estado_dir: emp.estado_dir || "", municipio: emp.municipio || "",
        pais: emp.pais || "México", contacto_emergencia: emp.contacto_emergencia || "",
        telefono_emergencia: emp.telefono_emergencia || "", sucursal: emp.sucursal || "",
        numero_empleado: emp.numero_empleado || "", tipo_empleado: emp.tipo_empleado || "operador",
        sueldo_base_semanal: Number(emp.sueldo_base_semanal) || 0, dias_laborales_semana: emp.dias_laborales_semana || 6,
        aguinaldo: Number(emp.aguinaldo) || 0, imss_descuento: Number(emp.imss_descuento) || 0,
        infonavit: Number(emp.infonavit) || 0, fonacot: Number(emp.fonacot) || 0,
        retencion_impuestos: Number(emp.retencion_impuestos) || 0, direccion: emp.direccion || "",
      });
      setCerts(Array.isArray(emp.certificaciones) ? emp.certificaciones : []);
      setFotoPreview(emp.foto_url || null);
    } else {
      setEditing(null);
      setForm({ ...emptyForm });
      setCerts([]);
      setFotoPreview(null);
    }
    setFotoFile(null);
    setDocFiles({});
    setOpen(true);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDocChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setDocFiles(prev => ({ ...prev, [key]: file || null }));
  };

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from("empleados").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("empleados").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.puesto.trim()) return;
    setUploading(true);
    try {
      let foto_url = editing?.foto_url || null;
      const empId = editing?.id || crypto.randomUUID();

      if (fotoFile) {
        foto_url = await uploadFile(fotoFile, `fotos/${empId}.${fotoFile.name.split('.').pop()}`);
      }

      const documentos: Record<string, string> = editing?.documentos || {};
      for (const [key, file] of Object.entries(docFiles)) {
        if (file) {
          documentos[key] = await uploadFile(file, `documentos/${empId}/${key}.${file.name.split('.').pop()}`);
        }
      }

      // Build full address from parts
      const direccionParts = [form.calle, form.numero_exterior, form.colonia, form.municipio, form.estado_dir, form.codigo_postal, form.pais].filter(Boolean);
      const direccion = direccionParts.join(", ") || form.direccion;

      const payload: any = {
        ...form,
        maquina_id: form.maquina_id || null,
        certificaciones: certs,
        fecha_nacimiento: form.fecha_nacimiento || undefined,
        foto_url,
        documentos,
        direccion,
      };

      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      setOpen(false);
      toast.success(editing ? "Empleado actualizado" : "Empleado creado");
    } catch (err: any) {
      toast.error("Error: " + (err.message || "No se pudo guardar"));
    } finally {
      setUploading(false);
    }
  };

  const toggleStatus = async (emp: any) => {
    await updateMut.mutateAsync({ id: emp.id, status: emp.status === "activo" ? "inactivo" : "activo" });
  };

  const totalPiezas = registrosOp?.reduce((s, r) => s + (r.piezas_producidas || 0), 0) || 0;
  const totalScrap = registrosOp?.reduce((s, r) => s + (r.piezas_scrap || 0), 0) || 0;
  const detailEmp = empleados?.find(e => e.nombre === detailNombre);

  const docLabels: { key: string; label: string; required?: boolean }[] = [
    { key: "curp_pdf", label: "CURP (PDF)", required: true },
    { key: "ine_pdf", label: "INE (PDF)", required: true },
    { key: "acta_nacimiento", label: "Acta de nacimiento (PDF)", required: true },
    { key: "comprobante_domicilio", label: "Comprobante de domicilio (PDF)", required: true },
    { key: "constancia_fiscal", label: "Constancia de situación fiscal (PDF)", required: true },
    { key: "comprobante_estudios", label: "Comprobante de estudios (PDF)" },
    { key: "carta_recomendacion", label: "Carta de recomendación (PDF)" },
    { key: "carta_antecedentes", label: "Carta de antecedentes no penales (PDF)" },
    { key: "otro_archivo", label: "Otro archivo (PDF)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Empleados</h1>
        <p className="text-muted-foreground">Gestión de personal y expedientes</p>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => handleOpen()}><Plus className="h-3 w-3 mr-1" />Nuevo Empleado</Button>
      </div>

      <Card><CardContent className="p-0">
        {isLoading ? <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : !empleados?.length ? <div className="p-8 text-center text-muted-foreground">No hay empleados registrados.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["No.", "Nombre", "Tipo", "Puesto", "Depto", "Turno", "Contrato", "Estado", ""].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {empleados.map((e: any) => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground">{e.numero_empleado || "—"}</td>
                      <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                        {e.foto_url && <img src={e.foto_url} className="w-8 h-8 rounded-full object-cover" alt="" />}
                        {e.nombre} {e.apellido_paterno || ""} {e.apellido_materno || ""}
                      </td>
                      <td className="py-3 px-4 capitalize text-muted-foreground">{e.tipo_empleado || "—"}</td>
                      <td className="py-3 px-4 text-foreground">{e.puesto}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{e.departamento || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{e.turno}</td>
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
      </CardContent></Card>

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
                  {["Orden", "Máquina", "Piezas", "Scrap", "Turno", "Fecha"].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground text-xs">{h}</th>)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Empleado" : "Agregar Registro"}</DialogTitle></DialogHeader>
          <div className="space-y-6">

            {/* Foto de perfil */}
            <SectionHeader title="Foto de perfil" />
            <div className="flex justify-center">
              <div
                onClick={() => fotoRef.current?.click()}
                className="w-48 h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
              >
                {fotoPreview ? (
                  <img src={fotoPreview} className="w-full h-full object-cover" alt="Foto" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click para seleccionar foto</span>
                  </>
                )}
              </div>
              <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
            </div>

            {/* Información personal */}
            <SectionHeader title="Información personal" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre(s)" /></div>
              <div className="space-y-1"><Label>Apellido paterno *</Label><Input value={form.apellido_paterno} onChange={e => setForm({ ...form, apellido_paterno: e.target.value })} /></div>
              <div className="space-y-1"><Label>Apellido materno *</Label><Input value={form.apellido_materno} onChange={e => setForm({ ...form, apellido_materno: e.target.value })} /></div>
              <div className="space-y-1"><Label>Fecha de nacimiento</Label><Input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} /></div>
              <div className="space-y-1"><Label>Teléfono *</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="10 dígitos" /></div>
              <div className="space-y-1"><Label>Correo *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Enfermedades</Label><Input value={form.enfermedades} onChange={e => setForm({ ...form, enfermedades: e.target.value })} placeholder="Ej: Diabetes, Hipertensión" /></div>
              <div className="space-y-1"><Label>Alergias</Label><Input value={form.alergias} onChange={e => setForm({ ...form, alergias: e.target.value })} placeholder="Ej: Penicilina, Látex" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>CURP</Label><Input value={form.curp} onChange={e => setForm({ ...form, curp: e.target.value.toUpperCase() })} /></div>
              <div className="space-y-1"><Label>RFC</Label><Input value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value.toUpperCase() })} /></div>
              <div className="space-y-1"><Label>NSS (IMSS)</Label><Input value={form.nss} onChange={e => setForm({ ...form, nss: e.target.value })} /></div>
            </div>

            {/* Dirección */}
            <SectionHeader title="Dirección" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Calle *</Label><Input value={form.calle} onChange={e => setForm({ ...form, calle: e.target.value })} /></div>
              <div className="space-y-1"><Label>Número *</Label><Input value={form.numero_exterior} onChange={e => setForm({ ...form, numero_exterior: e.target.value })} /></div>
              <div className="space-y-1"><Label>Colonia *</Label><Input value={form.colonia} onChange={e => setForm({ ...form, colonia: e.target.value })} /></div>
              <div className="space-y-1"><Label>Código postal *</Label><Input value={form.codigo_postal} onChange={e => setForm({ ...form, codigo_postal: e.target.value })} /></div>
              <div className="space-y-1"><Label>Estado *</Label>
                <Select value={form.estado_dir} onValueChange={v => setForm({ ...form, estado_dir: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                  <SelectContent>{estadosMx.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Municipio *</Label><Input value={form.municipio} onChange={e => setForm({ ...form, municipio: e.target.value })} /></div>
              <div className="space-y-1"><Label>País *</Label><Input value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })} /></div>
            </div>

            {/* Documentos */}
            <SectionHeader title="Documentos" />
            <div className="grid grid-cols-2 gap-4">
              {docLabels.map(doc => (
                <div key={doc.key} className="space-y-1">
                  <Label>{doc.label}{doc.required ? " *" : ""}</Label>
                  <Input type="file" accept=".pdf" onChange={e => handleDocChange(doc.key, e)} />
                  {editing?.documentos?.[doc.key] && !docFiles[doc.key] && (
                    <a href={editing.documentos[doc.key]} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Ver archivo actual</a>
                  )}
                </div>
              ))}
            </div>

            {/* Otros datos */}
            <SectionHeader title="Otros datos" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Teléfono de emergencia *</Label><Input value={form.telefono_emergencia} onChange={e => setForm({ ...form, telefono_emergencia: e.target.value })} /></div>
              <div className="space-y-1"><Label>Contacto de emergencia *</Label><Input value={form.contacto_emergencia} onChange={e => setForm({ ...form, contacto_emergencia: e.target.value })} /></div>
              <div className="space-y-1"><Label>Sucursal</Label><Input value={form.sucursal} onChange={e => setForm({ ...form, sucursal: e.target.value })} /></div>
              <div className="space-y-1"><Label>Número de empleado *</Label><Input value={form.numero_empleado} onChange={e => setForm({ ...form, numero_empleado: e.target.value })} /></div>
            </div>

            {/* Datos laborales */}
            <SectionHeader title="Datos laborales" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Tipo de empleado *</Label>
                <Select value={form.tipo_empleado} onValueChange={v => setForm({ ...form, tipo_empleado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tiposEmpleado.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Puesto *</Label><Input value={form.puesto} onChange={e => setForm({ ...form, puesto: e.target.value })} /></div>
              <div className="space-y-1"><Label>Departamento</Label>
                <Select value={form.departamento} onValueChange={v => setForm({ ...form, departamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{deptos.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Turno</Label>
                <Select value={form.turno} onValueChange={v => setForm({ ...form, turno: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                    <SelectItem value="nocturno">Nocturno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Contrato</Label>
                <Select value={form.tipo_contrato} onValueChange={v => setForm({ ...form, tipo_contrato: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{contratos.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Máquina asignada</Label>
                <Select value={form.maquina_id} onValueChange={v => setForm({ ...form, maquina_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {maquinas?.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prestaciones y sueldo */}
            <SectionHeader title="Prestaciones y sueldo" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Sueldo base x semana *</Label><Input type="number" value={form.sueldo_base_semanal} onChange={e => setForm({ ...form, sueldo_base_semanal: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Días laborales x semana *</Label><Input type="number" value={form.dias_laborales_semana} onChange={e => setForm({ ...form, dias_laborales_semana: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Aguinaldo *</Label><Input type="number" value={form.aguinaldo} onChange={e => setForm({ ...form, aguinaldo: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>IMSS *</Label><Input type="number" value={form.imss_descuento} onChange={e => setForm({ ...form, imss_descuento: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>INFONAVIT *</Label><Input type="number" value={form.infonavit} onChange={e => setForm({ ...form, infonavit: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>FONACOT *</Label><Input type="number" value={form.fonacot} onChange={e => setForm({ ...form, fonacot: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Retención de impuestos *</Label><Input type="number" value={form.retencion_impuestos} onChange={e => setForm({ ...form, retencion_impuestos: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Salario mensual ($)</Label><Input type="number" value={form.salario_mensual} onChange={e => setForm({ ...form, salario_mensual: Number(e.target.value) })} /></div>
            </div>

            {/* Certificaciones */}
            <SectionHeader title="Certificaciones" />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Agregar certificación" value={certInput} onChange={e => setCertInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && certInput.trim()) { setCerts([...certs, certInput.trim()]); setCertInput(""); } }} />
                <Button variant="outline" onClick={() => { if (certInput.trim()) { setCerts([...certs, certInput.trim()]); setCertInput(""); } }}>+</Button>
              </div>
              <div className="flex flex-wrap gap-1">{certs.map((c, i) => (
                <span key={i} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
                  {c}<button onClick={() => setCerts(certs.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                </span>
              ))}</div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={uploading || createMut.isPending || updateMut.isPending}>
              {uploading ? "Subiendo archivos..." : editing ? "Guardar Cambios" : "Crear Empleado"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RHEmpleados;
